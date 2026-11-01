// Numina: the marketing site and the app, on the local Supabase seed.
const NUMINA_SITE = process.env.NUMINA_SITE ?? "http://localhost:4400";
const NUMINA_APP = process.env.NUMINA_APP ?? "http://localhost:5173";

const dismissCookies = async (page) => {
  const reject = page.getByRole("button", { name: "Afvis" });
  await reject.waitFor({ timeout: 8000 }).catch(() => {});
  if (await reject.count()) await reject.first().click();
};

// The seeded local demo company, never a real one.
const numinaLogin = async (page) => {
  await page.goto(NUMINA_APP, { waitUntil: "load", timeout: 120000 });
  await page.getByRole("button", { name: /development user/i }).first().click();
  await page.waitForURL(/\/demo\//, { timeout: 40000 });
};

// The collapsed rail also keeps the sidebar's staff contact out of frame.
const collapseSidebar = async (page) => {
  await hideStaffContact(page);
  await page.mouse.click(366, 34);
  await page.waitForTimeout(600);
};

// The sidebar's contact shows a real colleague; the demo data should not.
const hideStaffContact = (page) =>
  page.addStyleTag({ content: `img[alt*="Mads" i], img[src*="mads" i] { visibility: hidden !important; }` });

export const scenes = {
  // Lines drawn in from the outer ring towards the face, tint, one blink.
  "numina-construction": {
    tail: "#ffffff",
    async run(rec) {
      const { page } = rec;
      await page.goto(`${NUMINA_SITE}/brand`, { waitUntil: "load" });
      await dismissCookies(page);
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content: `body > *:not(.bp) { display: none !important; }
          .bp { position: fixed !important; inset: auto !important; left: 50% !important; top: 50% !important;
            width: 1240px !important; margin: 0 !important; translate: -50% -50% !important; transform: none !important; }
          html, body { background: #fff !important; overflow: hidden !important; }`,
      });
      // A fresh copy at the body's root restarts the CSS draw-in, which already
      // ran during load. The original has to go: the drawing's ids must stay
      // unique or its tint resolves to a gradient in the hidden copy.
      await page.evaluate(() => {
        const old = document.querySelector(".bp");
        const next = old.cloneNode(true);
        old.remove();
        // Heavier than the site's 1px: this plays in a tile, not at full bleed.
        next.querySelector("svg").style.setProperty("--px", String((400 / 1240) * 1.6));
        document.body.appendChild(next);
      });
      await rec.freeze();
      rec.startVideo();
      await rec.wait(rec.options.seconds * 1000);
      await rec.stopVideo();
      await rec.still("numina-construction.png");
    },
    seconds: 8,
    frame: null,
  },

  "numina-construction-cards": {
    width: 1600,
    height: 900,
    video: false,
    async run(rec) {
      const { page } = rec;
      await page.goto(`${NUMINA_SITE}/brand`, { waitUntil: "load" });
      await dismissCookies(page);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        const heading = [...document.querySelectorAll("h2")].find((h) => h.textContent.includes("Konstruktion"));
        const grid = heading.closest("section").querySelector(".grid");
        document.body.replaceChildren(grid);
      });
      await page.addStyleTag({
        content: `html, body { background: #f5f4ec !important; overflow: hidden !important; height: 100%; }
          body { display: flex; align-items: center; justify-content: center; }
          .grid { width: 1400px; margin: 0 !important; }`,
      });
      await page.waitForTimeout(400);
      await rec.freeze();
      await rec.still("numina-construction-cards.png");
    },
  },

  // A selection in the journal, Handlinger, and the command menu takes over.
  "numina-command-menu": {
    width: 1120,
    height: 630,
    frame: { bg: "#ecebe6" },
    async run(rec) {
      const { page } = rec;
      const home = { x: 760, y: 470 };
      await numinaLogin(page);
      await page.goto(`${NUMINA_APP}/demo/accounting`, { waitUntil: "load" });
      await page.getByRole("checkbox").nth(1).waitFor();
      await collapseSidebar(page);
      await page.mouse.click(202, 91); // the journal's Bank tab
      await page.getByRole("checkbox").nth(3).waitFor();
      await page.waitForTimeout(1500);
      await rec.freeze();
      await rec.cursorAt(home.x, home.y);
      rec.startVideo();
      await rec.wait(350);
      const boxes = page.getByRole("checkbox");
      for (const i of [1, 2, 3]) {
        await rec.move(boxes.nth(i), { ms: i === 1 ? 650 : 260 });
        await rec.click();
        await rec.wait(i === 3 ? 420 : 90);
      }
      await rec.move(page.getByRole("button", { name: "Handlinger" }).last(), { ms: 700 });
      await rec.wait(120);
      await rec.click();
      await rec.wait(650);
      const add = page.getByRole("option", { name: /bankbilag/i }).first();
      console.log(`numina-command-menu: bankbilag offered: ${(await add.count()) > 0}`);
      if (await add.count()) await rec.move(add, { ms: 600 });
      await rec.wait(1100);
      await rec.still("numina-command-menu.png");
      await page.keyboard.press("Escape");
      await rec.wait(450);
      for (const i of [3, 2, 1]) {
        await rec.move(boxes.nth(i), { ms: 300 });
        await rec.click();
        await rec.wait(60);
      }
      await rec.move(home, { ms: 600 });
      await rec.wait(250);
      await rec.stopVideo();
    },
  },

  // The + beside the company menu, close up.
  "numina-create-menu": {
    width: 1360,
    height: 765,
    scale: 4,
    clip: { x: 0, y: 0, width: 640, height: 360 },
    frame: null,
    async run(rec) {
      const { page } = rec;
      await numinaLogin(page);
      await page.goto(`${NUMINA_APP}/demo/transactions`, { waitUntil: "load" });
      await page.getByRole("link", { name: "Udgifter" }).waitFor();
      await page.waitForTimeout(1500);
      await rec.freeze();
      const home = { x: 500, y: 240 };
      await rec.cursorAt(home.x, home.y);
      rec.startVideo();
      await rec.wait(300);
      await rec.move({ x: 316, y: 80 }, { ms: 650 });
      await rec.wait(180);
      await rec.click();
      await rec.wait(420);
      for (const name of ["Upload nyt bilag", "Ny faktura", "Nyt tilbud", "Nyt abonnement"]) {
        await rec.move(page.getByRole("menuitem", { name }), { ms: 320, arc: 0.02 });
        await rec.wait(name === "Nyt abonnement" ? 520 : 240);
      }
      await rec.still("numina-create-menu.png");
      // Clicking away rather than Escape: Escape returns focus to the button,
      // whose ring and tooltip would break the loop.
      await rec.move(home, { ms: 500 });
      await rec.click();
      await rec.wait(420);
      await rec.stopVideo();
    },
  },

  // The rebuilt expenses inbox, with the app's own logo tiles and source badges.
  "numina-expenses": {
    width: 1360,
    height: 765,
    video: false,
    frame: { bg: "#ecebe6" },
    async run(rec) {
      const { page } = rec;
      await numinaLogin(page);
      await page.goto(`${NUMINA_APP}/demo/expenses`, { waitUntil: "load" });
      await page.getByRole("link", { name: "Udgifter" }).first().waitFor();
      await collapseSidebar(page);
      await page.waitForTimeout(2500);
      await page.getByText("OfficeHub Copenhagen ApS").first().click().catch(() => {});
      await page.waitForTimeout(2500);
      await rec.freeze();
      await rec.still("numina-expenses.png");
    },
  },
};
