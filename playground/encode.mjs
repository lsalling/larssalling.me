// node playground/encode.mjs [scene]
// Turns out/*.master.mp4 and out/*.png into the web assets in public/work.
// A scene with `frame` sits as a rounded window on a flat tile; the rest are
// already a full-bleed tile.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { OUT } from "./lib/recorder.mjs";
import { loadScenes } from "./lib/scenes.mjs";

const PUBLIC = join(OUT, "..", "..", "public", "work");
mkdirSync(PUBLIC, { recursive: true });
const scenes = await loadScenes();
const only = process.argv[2];
if (only && !scenes[only]) throw new Error(`unknown scene ${only}`);
const TILE = { width: 1920, height: 1080 };
const WINDOW = { width: 1632, height: 918, radius: 20 };

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: ["ignore", "inherit", "inherit"] });
  if (result.status !== 0) throw new Error(`${command} failed`);
};
const seconds = (file) =>
  spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).stdout.toString().trim();
const size = (file) => `${(statSync(file).size / 1024).toFixed(0)} KB`;

async function plates(bg) {
  const plate = join(OUT, `.plate-${bg.slice(1)}.png`);
  const mask = join(OUT, ".mask.png");
  if (existsSync(plate) && existsSync(mask)) return { plate, mask };
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: TILE });
  const box = `position:absolute;left:${(TILE.width - WINDOW.width) / 2}px;top:${(TILE.height - WINDOW.height) / 2}px;width:${WINDOW.width}px;height:${WINDOW.height}px;border-radius:${WINDOW.radius}px`;
  await page.setContent(`<body style="margin:0;background:${bg}"><div style="${box};box-shadow:0 1px 2px rgb(0 0 0 / .06),0 18px 50px -12px rgb(0 0 0 / .18),0 0 0 1px rgb(0 0 0 / .06)"></div>`);
  await page.screenshot({ path: plate });
  await page.setContent(`<body style="margin:0;background:#000"><div style="${box};background:#fff"></div>`);
  await page.screenshot({ path: mask });
  await browser.close();
  return { plate, mask };
}

const framed = (frame) => ({
  inputs: async () => {
    const { plate, mask } = await plates(frame.bg);
    return ["-loop", "1", "-i", plate, "-loop", "1", "-i", mask];
  },
  // The window keeps its 16:9; the mask rounds it before it lands on the plate.
  // The plate and mask loop forever, so the encode must be given a duration.
  graph: `[0:v]scale=${WINDOW.width}:${WINDOW.height}:flags=lanczos,format=rgba,pad=${TILE.width}:${TILE.height}:${(TILE.width - WINDOW.width) / 2}:${(TILE.height - WINDOW.height) / 2}[w];[w][2:v]alphamerge[a];[1:v][a]overlay=shortest=1,format=yuv420p[out]`,
});

for (const [name, scene] of Object.entries(scenes)) {
  if (only && name !== only) continue;
  const master = join(OUT, `${name}.master.mp4`);
  if (existsSync(master) && scene.video !== false) {
    const out = join(PUBLIC, `${name}.mp4`);
    let inputs = ["-i", master];
    let graph = `[0:v]scale=${TILE.width}:${TILE.height}:flags=lanczos,format=yuv420p[out]`;
    if (scene.frame) {
      const f = framed(scene.frame);
      inputs = [...inputs, ...(await f.inputs())];
      graph = f.graph;
    }
    if (scene.tail) {
      graph = `[0:v]scale=${TILE.width}:${TILE.height}:flags=lanczos,fade=t=out:st=${scene.seconds - 0.45}:d=0.4:c=${scene.tail},format=yuv420p[out]`;
    }
    run("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", graph, "-map", "[out]", "-t", seconds(master), "-c:v", "libx264", "-profile:v", "high", "-preset", "medium", "-crf", "20", "-r", "60", "-g", "60", "-movflags", "+faststart", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-an", out]);
    console.log(`${name}.mp4 ${size(out)}`);
  }
  // A scene's stills are <scene>.png and <scene>--<anything>.png.
  for (const file of readdirSync(OUT).filter((f) => f === `${name}.png` || (f.startsWith(`${name}--`) && f.endsWith(".png")))) {
    const png = join(OUT, file);
    const base = file.replace(/\.png$/, "");
    const flat = join(OUT, `.${base}.flat.png`);
    if (scene.frame) {
      const f = framed(scene.frame);
      run("ffmpeg", ["-y", "-loglevel", "error", "-i", png, ...(await f.inputs()), "-filter_complex", f.graph.replace(",format=yuv420p[out]", "[out]"), "-map", "[out]", "-frames:v", "1", flat]);
    }
    const out = join(PUBLIC, `${base}.webp`);
    run("cwebp", ["-quiet", "-q", "90", "-resize", "2000", "0", scene.frame ? flat : png, "-o", out]);
    console.log(`${base}.webp ${size(out)}`);
  }
}
