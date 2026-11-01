// Records the real running apps frame by frame on a virtual clock, so a clip
// comes out at an exact 60 fps however slow the capture is. Timers and rAF run
// on Playwright's fake clock; CSS and WAAPI animations are paused and seeked to
// the same time, so hover, transitions and JS motion stay in step.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
export const OUT = join(here, "..", "out");

const FPS = 60;
const FRAME = 1000 / FPS;

// Runs before any page script, so the real timers are saved before the fake
// clock replaces them.
const bootstrap = () => {
  const realRaf = window.requestAnimationFrame.bind(window);
  const realTimeout = window.setTimeout.bind(window);
  window.__settle = () => new Promise((done) => realRaf(() => realTimeout(done, 0)));

  const started = new WeakMap();
  window.__seek = (now) => {
    // Only rec.scroll moves the document. Anything else that scrolls it (dnd-kit
    // auto-scrolls) would slide the crop, since clips are in document space.
    document.scrollingElement?.scrollTo(0, window.__scrollY ?? 0);
    for (const animation of document.getAnimations()) {
      // Scroll-driven animations follow scroll position, not time.
      if (!(animation.timeline instanceof DocumentTimeline)) continue;
      if (!started.has(animation)) {
        started.set(animation, now);
        animation.pause();
      }
      const local = now - started.get(animation);
      const end = animation.effect?.getComputedTiming().endTime ?? Infinity;
      // finish() rather than seeking past the end: libraries such as Base UI
      // wait on `animation.finished`, which a paused animation never resolves.
      if (local >= end) animation.finish();
      else animation.currentTime = local;
    }
  };

  // A drawn cursor, because headless Chrome never paints one.
  window.__cursor = {
    show() {
      if (document.getElementById("__cursor")) return;
      const node = document.createElement("div");
      node.id = "__cursor";
      node.style.cssText =
        "position:fixed;left:0;top:0;width:26px;height:26px;pointer-events:none;z-index:2147483647;transform-origin:5px 3px;filter:drop-shadow(0 1px 2px rgb(0 0 0 / .35))";
      node.innerHTML = `<svg data-arrow viewBox="0 0 26 26" width="26" height="26"><path d="M5 2.5v17.2l4.5-4.2 2.9 6.8 3.2-1.4-2.9-6.7h6.2z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><svg data-hand viewBox="0 0 26 26" width="26" height="26" style="display:none;position:absolute;left:0;top:0"><path d="M8.6 12.6V5a1.7 1.7 0 0 1 3.4 0v5.6l.1-1.1a1.6 1.6 0 0 1 3.2.2v1.2a1.5 1.5 0 0 1 3 .2v1a1.5 1.5 0 0 1 3 .3v4.3c0 3.4-2.5 6-5.9 6h-2.2c-2 0-3.4-.8-4.5-2.4L4.9 15.700a1.700 1.700 0 0 1 2.700-2z" fill="#fff" stroke="#111" stroke-width="1.400" stroke-linejoin="round"/></svg>`;
      document.documentElement.appendChild(node);
    },
    move(x, y, scale) {
      const node = document.getElementById("__cursor");
      if (!node) return;
      const under = document.elementFromPoint(x, y);
      const hand = under && getComputedStyle(under).cursor === "pointer";
      node.querySelector("[data-arrow]").style.display = hand ? "none" : "";
      node.querySelector("[data-hand]").style.display = hand ? "" : "none";
      const offset = hand ? [-10, -2] : [-5, -2.5];
      node.style.transform = `translate(${x + offset[0]}px,${y + offset[1]}px) scale(${scale})`;
    },
  };
};

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class Recorder {
  constructor(page, cdp, { clip, scale, name }) {
    Object.assign(this, { page, cdp, clip, scale, name });
    this.outDir = OUT;
    mkdirSync(OUT, { recursive: true });
    this.now = 0;
    this.frames = 0;
    this.pointer = null;
    this.scrollY = 0;
    this.ffmpeg = null;
  }

  // Everything before this runs on the real clock: load, data, login.
  async freeze() {
    const start = await this.page.evaluate(() => Date.now());
    await this.page.clock.pauseAt(start + 1000);
    await this.tick(0);
  }

  async tick(ms) {
    if (ms > 0) await this.page.clock.runFor(ms);
    this.now += ms;
    await this.page.evaluate(async (now) => {
      await window.__settle();
      window.__seek(now);
      await window.__settle();
      window.__seek(now);
    }, this.now);
  }

  async capture() {
    const { x, y, width, height } = this.clip;
    const { data } = await this.cdp.send("Page.captureScreenshot", {
      format: "png",
      clip: { x, y: y + this.scrollY, width, height, scale: this.scale },
      optimizeForSpeed: true,
    });
    return Buffer.from(data, "base64");
  }

  startVideo() {
    const file = join(OUT, `${this.name}.master.mp4`);
    // Near-lossless master; web encodes are derived from it in encode.mjs.
    this.ffmpeg = spawn(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
        "-c:v", "libx264", "-preset", "medium", "-crf", "12", "-pix_fmt", "yuv420p", "-r", String(FPS),
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-an", file],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    this.closed = new Promise((done) => this.ffmpeg.on("close", done));
  }

  async stopVideo() {
    this.ffmpeg.stdin.end();
    const code = await this.closed;
    if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
    this.ffmpeg = null;
    console.log(`${this.name}: ${this.frames} frames, ${(this.frames / FPS).toFixed(2)}s`);
  }

  async frame() {
    const whole = Math.round((this.frames + 1) * FRAME) - Math.round(this.frames * FRAME);
    await this.tick(whole);
    if (this.ffmpeg) {
      const png = await this.capture();
      if (!this.ffmpeg.stdin.write(png)) await new Promise((r) => this.ffmpeg.stdin.once("drain", r));
    }
    this.frames++;
  }

  async wait(ms) {
    for (let i = 0; i < Math.round(ms / FRAME); i++) await this.frame();
  }

  async cursorAt(x, y) {
    await this.page.evaluate(() => window.__cursor.show());
    this.pointer = { x, y, scale: 1 };
    await this.page.mouse.move(x, y);
    await this.page.evaluate(([a, b, s]) => window.__cursor.move(a, b, s), [x, y, 1]);
  }

  async center(target, { dx = 0, dy = 0 } = {}) {
    if (!target.boundingBox) return { x: target.x + dx, y: target.y + dy };
    const box = await target.boundingBox();
    if (!box) throw new Error(`${this.name}: target not visible`);
    return { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy };
  }

  async move(target, { ms = 700, dx, dy, arc = 0.06 } = {}) {
    const to = await this.center(target, { dx, dy });
    const from = this.pointer;
    const steps = Math.max(1, Math.round(ms / FRAME));
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    for (let i = 1; i <= steps; i++) {
      const t = easeInOut(i / steps);
      // A slight bow, because a hand never travels on a ruled line.
      const bow = Math.sin(t * Math.PI) * distance * arc;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t - bow;
      await this.page.mouse.move(x, y);
      await this.page.evaluate(([a, b, s]) => window.__cursor.move(a, b, s), [x, y, 1]);
      await this.frame();
    }
    this.pointer = { ...to, scale: 1 };
  }

  async scroll(y, { ms = 1200 } = {}) {
    const from = this.scrollY;
    const steps = Math.max(1, Math.round(ms / FRAME));
    for (let i = 1; i <= steps; i++) {
      this.scrollY = from + (y - from) * easeInOut(i / steps);
      await this.page.evaluate((top) => (window.__scrollY = top), this.scrollY);
      await this.frame();
    }
  }

  async press(scale = 0.86, ms = 90) {
    const { x, y } = this.pointer;
    await this.page.evaluate(([a, b, s]) => window.__cursor.move(a, b, s), [x, y, scale]);
    await this.wait(ms);
  }

  async release(ms = 90) {
    const { x, y } = this.pointer;
    await this.page.evaluate(([a, b, s]) => window.__cursor.move(a, b, s), [x, y, 1]);
    await this.wait(ms);
  }

  async click() {
    await this.press();
    await this.page.mouse.down();
    await this.wait(50);
    await this.page.mouse.up();
    await this.release();
  }

  async still(file) {
    await this.tick(0);
    const png = await this.capture();
    writeFileSync(join(OUT, file), png);
    console.log(`${this.name}: still ${file}`);
  }
}

export async function open({ name, width = 1600, height = 900, scale = 2, clip, colorScheme = "light", storageState, video = true }) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    colorScheme,
    storageState,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(bootstrap);
  await context.clock.install();
  const page = await context.newPage();
  page.on("pageerror", (error) => console.error(`${name}: ${error.message}`));
  const cdp = await context.newCDPSession(page);
  const rec = new Recorder(page, cdp, { clip: clip ?? { x: 0, y: 0, width, height }, scale, name });
  rec.browser = browser;
  rec.video = video;
  return rec;
}
