import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const manifest = JSON.parse(await readFile("archive/manifest.json"));
let pages = 0;
for (const row of manifest) {
  assert(row.success, row.url);
  const original = await readFile("archive/public-source/" + row.path);
  assert.equal(createHash("sha256").update(original).digest("hex"), row.sha256);
  if (row.path.endsWith(".html")) {
    pages++;
    const html = await readFile("dist/" + row.path, "utf8");
    for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)) {
      let path = match[1];
      if (!path.includes("."))
        path = (path === "/" ? "" : path) + "/index.html";
      await readFile("dist" + path);
    }
    assert(html.includes('id="main"'), row.path);
  }
}
assert.equal(pages, 11);
console.log(
  "Verified 17 archive hashes, 11 built pages and their local HTML links/assets.",
);

const fonts = JSON.parse(await readFile("archive/font-manifest.json"));
for (const row of fonts) {
  assert(row.success, row.url);
  assert.equal(
    createHash("sha256")
      .update(await readFile("archive/fonts/" + row.path))
      .digest("hex"),
    row.sha256,
  );
  await readFile("dist/fonts/" + row.path);
}
assert(
  (await readFile("dist/assets/styles.css", "utf8")).startsWith(
    '@import "/fonts/fonts.css";',
  ),
);
console.log(
  `Verified ${fonts.length} font archive hashes and local font output.`,
);
