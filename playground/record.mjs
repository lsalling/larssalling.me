// node playground/record.mjs <scene|all> [--seconds n]
import { open } from "./lib/recorder.mjs";
import { loadScenes } from "./lib/scenes.mjs";

const scenes = await loadScenes();
const name = process.argv[2];
const names = name === "all" ? Object.keys(scenes) : [name];
if (!names.every((n) => scenes[n])) {
  console.error(`usage: node playground/record.mjs <${Object.keys(scenes).join("|")}|all>`);
  process.exit(1);
}
const flag = process.argv.indexOf("--seconds");

let failed = false;
for (const scene of names) {
  const options = { ...scenes[scene], name: scene };
  if (flag !== -1) options.seconds = Number(process.argv[flag + 1]);
  const rec = await open(options);
  rec.options = options;
  const started = performance.now();
  try {
    await options.run(rec);
    console.log(`${scene}: captured in ${((performance.now() - started) / 1000).toFixed(0)}s`);
  } catch (error) {
    failed = true;
    console.error(`${scene}: ${error.stack}`);
    await rec.capture().then((png) => import("node:fs").then((fs) => fs.writeFileSync(`/tmp/${scene}-failed.png`, png))).catch(() => {});
    rec.ffmpeg?.stdin.end();
  }
  await rec.browser.close();
}
process.exit(failed ? 1 : 0);
