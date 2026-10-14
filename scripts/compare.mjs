import { chromium } from "playwright";
import { PNG } from "pngjs";
import fs from "node:fs";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
let results = [];
fs.mkdirSync("validation", { recursive: true });
for (const route of ["/", "/network", "/technology", "/solutions/tokenization"])
  for (const width of [390, 768, 1440]) {
    let captures = [];
    let texts = [];
    for (const origin of [
      process.env.REFERENCE_ORIGIN || "http://127.0.0.1:3002",
      "http://127.0.0.1:3000",
    ]) {
      const p = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      if (origin.includes("127.0.0.1:3002")) {
        await p.route("https://fonts.googleapis.com/**", (r) =>
          r.fulfill({
            path: "archive/fonts/fonts.css",
            contentType: "text/css",
          }),
        );
        await p.route("https://fonts.gstatic.com/**", (r) =>
          r.fulfill({
            path:
              "archive/fonts/" + new URL(r.request().url()).pathname.slice(1),
            contentType: "font/woff2",
          }),
        );
      }
      await p.goto(`${origin}${route}`);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(600);
      await p.addStyleTag({
        content:
          "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}",
      });
      await p.evaluate(() => {
        document
          .querySelectorAll(".reveal")
          .forEach((x) => x.classList.add("visible"));
        document
          .querySelectorAll("canvas")
          .forEach((x) => (x.style.visibility = "hidden"));
      });
      texts.push(await p.locator("#app").innerText());
      captures.push(
        PNG.sync.read(
          await p.screenshot({ fullPage: true, animations: "disabled" }),
        ),
      );
      await p.close();
    }
    const [a, b] = captures;
    let different = 0;
    if (a.width === b.width && a.height === b.height) {
      for (let i = 0; i < a.data.length; i += 4)
        if (
          a.data[i] !== b.data[i] ||
          a.data[i + 1] !== b.data[i + 1] ||
          a.data[i + 2] !== b.data[i + 2]
        )
          different++;
    } else different = -1;
    results.push({
      route,
      width,
      textIdentical: texts[0] === texts[1],
      dimensions: [a.width, a.height, b.width, b.height],
      differentPixels: different,
    });
  }
await browser.close();
fs.writeFileSync(
  "validation/comparison-results.json",
  JSON.stringify({referenceOrigin:process.env.REFERENCE_ORIGIN||"http://127.0.0.1:3002",conditions:"Fonts loaded; CSS motion disabled; Canvas hidden; reveal elements visible",results}, null, 2),
);
console.log(JSON.stringify(results));
if (results.some((x) => !x.textIdentical || x.differentPixels !== 0))
  process.exit(1);
