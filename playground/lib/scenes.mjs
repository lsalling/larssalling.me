// Every scenes/<project>.mjs exports `scenes`; one file per product, so its
// logins and seeding stay beside its clips.
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "scenes");

export async function loadScenes() {
  const all = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mjs"))) {
    Object.assign(all, (await import(pathToFileURL(join(dir, file)))).scenes);
  }
  return all;
}
