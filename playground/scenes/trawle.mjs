// Trawle: signed out, against the local Compose database.
const TRAWLE = process.env.TRAWLE ?? "http://localhost:3000";

// Tracking is signed-out and lives in this browser's localStorage, so nothing
// here reaches a server. Saving through the row keeps the app's own snapshot.
const seedTracker = async (page, count, plan) => {
  await page.goto(TRAWLE, { waitUntil: "load" });
  const save = page.locator('[aria-label="Save job"]');
  await save.first().waitFor();
  const total = Math.min(await save.count(), count);
  for (let i = 0; i < total; i++) await save.first().click({ force: true });
  await page.waitForFunction((n) => Object.keys(JSON.parse(localStorage.getItem("trawle.tracked") ?? "{}")).length >= n, total);
  await page.evaluate(plan);
};

const assignBoard = () => {
  const store = JSON.parse(localStorage.getItem("trawle.tracked"));
  const seen = new Set();
  const rows = Object.values(store).sort((a, b) => {
    const fresh = (row) => (seen.has(row.data.job.company.name) ? 1 : (seen.add(row.data.job.company.name), 0));
    return fresh(a) - fresh(b);
  });
  const stages = ["saved", "applied", "applied", "interviewing", "saved", "applied", "rejected", "interviewing", "saved", "offer", "applied", "rejected"];
  const seenTwice = new Map();
  rows.forEach((row, i) => {
    seenTwice.set(row.data.job.company.name, (seenTwice.get(row.data.job.company.name) ?? 0) + 1);
    row.data.status = stages[i] ?? "saved";
  });
  localStorage.setItem("trawle.tracked", JSON.stringify(store));
  localStorage.setItem("trawle.tracker-layout", JSON.stringify("board"));
};

// Sample numbers for the flow card: one hunt, drawn through the real builder.
const assignFlow = () => {
  const store = JSON.parse(localStorage.getItem("trawle.tracked"));
  const base = Object.values(store);
  const out = {};
  const paths = [
    [18, ["applied"]],
    [21, ["applied", "rejected"]],
    [7, ["applied", "interviewing"]],
    [6, ["applied", "interviewing", "rejected"]],
    [2, ["applied", "interviewing", "offer"]],
  ];
  let n = 0;
  for (const [count, path] of paths) {
    for (let i = 0; i < count; i++, n++) {
      const row = structuredClone(base[n % base.length]);
      const id = `sample-${n}`;
      row.data.jobId = id;
      row.data.job.id = id;
      row.data.status = path.at(-1);
      row.data.statusAt = "2026-10-20T10:00:00.000Z";
      row.data.history = path.map((status, at) => ({ status, at: `2026-0${6 + at}-12T10:00:00.000Z` }));
      out[`s:${id}`] = row;
    }
  }
  localStorage.setItem("trawle.tracked", JSON.stringify(out));
};

export const scenes = {
  // Drag a card between stages, then take it back with the toast's own Undo.
  "trawle-board": {
    width: 1240,
    height: 698,
    frame: { bg: "#e9eeec" },
    async run(rec) {
      const { page } = rec;
      await seedTracker(page, 14, assignBoard);
      await page.goto(`${TRAWLE}/tracker`, { waitUntil: "load" });
      await page.getByRole("button", { name: /^board$/i }).click().catch(() => {});
      await page.getByRole("region", { name: /Applied applications/i }).or(page.getByLabel("Applied applications")).first().waitFor();
      await page.waitForTimeout(1200);
      await page.getByRole("button", { name: /collapse|sidebar/i }).first().click().catch(() => {});
      await page.waitForTimeout(600);
      await rec.freeze();
      await rec.cursorAt(760, 640);
      rec.startVideo();
      await rec.wait(350);
      const card = page.getByLabel("Applied applications").locator("[aria-describedby='tracker-board-help']").first();
      const column = page.getByLabel("Interviewing applications");
      await rec.move(card, { ms: 700 });
      await rec.wait(160);
      await rec.press();
      await page.mouse.down();
      await rec.wait(120);
      const to = await rec.center(column, { dy: -70 });
      await rec.move(to, { ms: 900, arc: 0.04 });
      await rec.wait(260);
      await rec.still("trawle-board.png");
      await page.mouse.up();
      await rec.release();
      await rec.wait(1100);
      const undo = page.getByRole("button", { name: "Undo" }).first();
      await rec.move(undo, { ms: 650 });
      await rec.wait(180);
      await rec.click();
      await rec.wait(600);
      // Toast dismissed by hand, so the last frame matches the first.
      await rec.move(page.getByText("Changes undone").locator("..").locator("button").last(), { ms: 350, arc: 0.02 });
      await rec.click();
      await rec.wait(250);
      await rec.move({ x: 760, y: 640 }, { ms: 500 });
      await rec.wait(450);
      await rec.stopVideo();
    },
  },

  // Logo turns into a checkbox on hover; picking rows raises the selection bar.
  "trawle-selection": {
    width: 1360,
    height: 640,
    scale: 3,
    clip: { x: 248, y: 190, width: 800, height: 450 },
    frame: null,
    async run(rec) {
      const { page } = rec;
      const home = { x: 640, y: 560 };
      await page.goto(TRAWLE, { waitUntil: "load" });
      const boxes = page.getByRole("checkbox", { name: /^Select / });
      await boxes.first().waitFor({ state: "attached" });
      await page.waitForTimeout(1200);
      await rec.freeze();
      await rec.cursorAt(home.x, home.y);
      rec.startVideo();
      await rec.wait(300);
      for (const i of [0, 1, 2]) {
        await rec.move(boxes.nth(i), { ms: i === 0 ? 650 : 330 });
        await rec.wait(i === 0 ? 220 : 80);
        await rec.click();
        await rec.wait(i === 2 ? 700 : 120);
      }
      await rec.still("trawle-selection.png");
      await rec.wait(500);
      for (const i of [2, 1, 0]) {
        await rec.move(boxes.nth(i), { ms: 260 });
        await rec.click();
        await rec.wait(60);
      }
      await rec.move(home, { ms: 550 });
      await rec.wait(450);
      await rec.stopVideo();
    },
  },

  // The snapshot card, then down to the jobs beside the rail's breakdowns and back.
  // 1280 wide because the rail drops under the jobs below Tailwind's xl.
  "trawle-company": {
    width: 1280,
    height: 720,
    frame: { bg: "#e9eeec" },
    async run(rec) {
      const { page } = rec;
      const home = { x: 1246, y: 400 };
      await page.goto(TRAWLE, { waitUntil: "load" });
      await page.getByRole("button", { name: "Collapse sidebar" }).click();
      await page.waitForTimeout(400);
      await page.goto(`${TRAWLE}/companies/render`, { waitUntil: "load" });
      await page.getByRole("heading", { name: "Hiring for" }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      // __seek pins the document's scroll, so the body scrolls instead.
      await page.addStyleTag({ content: "html{scrollbar-width:none}" });
      await rec.freeze();
      await rec.cursorAt(home.x, home.y);
      await rec.still("trawle-company.png");
      rec.startVideo();
      await rec.wait(1100);
      await rec.scroll(572, { ms: 1300 });
      await rec.wait(350);
      const rows = page.getByRole("heading", { name: "Hiring for" }).locator("..").getByRole("link");
      await rec.move(rows.nth(0), { ms: 650, dx: 40 });
      await rec.wait(450);
      await rec.still("trawle-company--rail.png");
      await rec.move(rows.nth(3), { ms: 450, dx: 40, arc: 0.02 });
      await rec.wait(450);
      await rec.move(home, { ms: 500 });
      await rec.wait(250);
      await rec.scroll(0);
      await rec.wait(500);
      await rec.stopVideo();
    },
  },

  // The tracker's share image, read off the same SVG the dialog downloads.
  "trawle-flow": {
    width: 1600,
    height: 900,
    video: false,
    async run(rec) {
      const { page } = rec;
      await seedTracker(page, 6, assignFlow);
      await page.goto(`${TRAWLE}/tracker`, { waitUntil: "load" });
      await page.getByRole("button", { name: "Flow diagram" }).click();
      await page.locator("svg.insight-card").first().waitFor();
      await page.waitForTimeout(600);
      await page.evaluate(() => {
        const source = document.querySelector("svg.insight-card");
        const stage = document.createElement("div");
        stage.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:#e9eeec;display:flex;align-items:center;justify-content:center;gap:36px";
        for (const theme of ["light", "dark"]) {
          const card = source.cloneNode(true);
          card.setAttribute("data-theme", theme);
          // Clip-path ids would collide between copies otherwise.
          card.style.cssText = "height:800px;width:auto;border-radius:18px;box-shadow:0 18px 50px -12px rgb(0 0 0 / .2)";
          stage.appendChild(card);
        }
        document.body.appendChild(stage);
      });
      await page.waitForTimeout(300);
      await rec.freeze();
      await rec.still("trawle-flow.png");
    },
  },
};
