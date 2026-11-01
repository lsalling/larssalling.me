// node playground/check.mjs <scene>
// What to look at before trusting a clip: its numbers, how cleanly it loops, and
// a contact sheet of the whole thing at out/<scene>.sheet.png.
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { OUT } from "./lib/recorder.mjs";

const name = process.argv[2];
const file = name && [join(OUT, "..", "..", "public", "work", `${name}.mp4`), join(OUT, `${name}.master.mp4`)].find(existsSync);
if (!file) {
  console.error("usage: node playground/check.mjs <scene>, after record.mjs");
  process.exit(1);
}
const output = (command, args) => {
  const { stdout, stderr } = spawnSync(command, args);
  return `${stdout}${stderr}`;
};
const [width, height, rate, duration] = output("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate,duration", "-of", "csv=p=0", file]).trim().split(",");
console.log(`${width}x${height} @ ${rate} fps, ${Number(duration).toFixed(2)}s, ${(statSync(file).size / 1024).toFixed(0)} KB`);

const first = join(OUT, ".first.png");
const last = join(OUT, ".last.png");
output("ffmpeg", ["-y", "-v", "error", "-i", file, "-frames:v", "1", first]);
output("ffmpeg", ["-y", "-v", "error", "-sseof", "-0.06", "-i", file, "-frames:v", "1", last]);
const ssim = output("ffmpeg", ["-i", first, "-i", last, "-lavfi", "ssim", "-f", "null", "-"]).match(/All:([0-9.]+)/)?.[1];
console.log(`loop: first and last frame SSIM ${ssim} (above 0.99 loops cleanly; a clip that fades out won't)`);

const sheet = join(OUT, `${name}.sheet.png`);
output("ffmpeg", ["-y", "-v", "error", "-i", file, "-vf", `fps=9/${duration},scale=640:-1,tile=3x3`, "-frames:v", "1", sheet]);
console.log(`sheet: ${sheet}`);
