import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
await cp("src/pages", "dist", { recursive: true });
await cp("public", "dist", { recursive: true });
await cp("src/site.js", "dist/assets/site.js");
await cp("src/styles.css", "dist/assets/styles.css");
console.log("Built 11 captured pages and local assets into dist/");

await cp("archive/fonts", "dist/fonts", { recursive: true });
await cp("archive/font-licenses", "dist/fonts/licenses", { recursive: true });
const fonts = await readFile("archive/fonts/fonts.css", "utf8");
await writeFile(
  "dist/fonts/fonts.css",
  fonts.replaceAll("https://fonts.gstatic.com/", "/fonts/"),
);
