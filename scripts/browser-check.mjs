import { chromium } from "playwright";
import fs from "node:fs";
fs.mkdirSync("validation", { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await b.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  const outbound = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:3000")) outbound.push(r.url());
  });
  page.on("requestfailed", (r) =>
    failedRequests.push({ url: r.url(), error: r.failure()?.errorText }),
  );
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const routes = [
    "/",
    "/network",
    "/technology",
    "/solutions",
    "/solutions/stablecoins",
    "/solutions/tokenized-deposits",
    "/solutions/tokenization",
    "/solutions/settlement",
    "/research",
    "/developers",
    "/company",
  ];
  const results = [];
  for (const route of routes) {
    const r = await page.goto("http://127.0.0.1:3000" + route);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    if (r.status() !== 200) throw Error(route);
    await page.locator('.site-header [data-language="ko"]').click();
    if ((await page.locator("html").getAttribute("lang")) !== "ko")
      throw Error("Korean " + route);
    await page.locator('.site-header [data-language="en"]').click();
    if ((await page.locator("html").getAttribute("lang")) !== "en")
      throw Error("English " + route);
    if ((await page.locator("h1").count()) !== 1) throw Error("h1 " + route);
    if (
      await page
        .locator("img")
        .evaluateAll((xs) =>
          xs.some((x) => !x.complete || x.naturalWidth === 0),
        )
    )
      throw Error("image " + route);
    results.push({
      route,
      status: r.status(),
      languages: "en/ko",
      title: await page.title(),
    });
  }
  await page.goto("http://127.0.0.1:3000/");
  for (const selector of [
    "[data-capability]",
    "[data-settlement]",
    "[data-view]",
    "[data-node]",
    "[data-life-product]",
    "[data-policy]",
    "[data-life-event]",
  ]) {
    const items = page.locator(selector);
    for (let i = 0; i < (await items.count()); i++) {
      await items.nth(i).click();
      const state =
        (await items.nth(i).getAttribute("aria-selected")) ||
        (await items.nth(i).getAttribute("aria-pressed"));
      if (state !== "true") throw Error(selector + " state");
    }
    results.push({ interaction: selector, count: await items.count() });
  }

  const ensure = (value, label) => {
    if (!value) throw Error(label);
  };
  await page.locator('[data-settlement="pvp"]').click();
  ensure(
    (await page.locator('[data-leg="right"]').innerText()).includes("KRW"),
    "PvP content",
  );
  await page.locator('[data-policy="eligible"]').click();
  ensure(
    (await page.locator("[data-policy-result]").innerText()) === "ALLOW",
    "policy allow content",
  );
  await page.locator("[data-policy]").last().click();
  ensure(
    (await page.locator("[data-policy-result]").innerText()) === "RESTRICT",
    "policy restrict content",
  );
  await page.locator("[data-capability]").first().focus();
  await page.keyboard.press("ArrowRight");
  ensure(
    (await page
      .locator("[data-capability]")
      .nth(1)
      .getAttribute("aria-selected")) === "true",
    "keyboard capability selection",
  );
  await page.locator('.site-header [data-language="ko"]').click();
  await page.reload();
  ensure(
    (await page.locator("html").getAttribute("lang")) === "ko",
    "language persistence",
  );
  await page.locator('.site-header [data-language="en"]').click();
  await page.locator('.desktop-nav a[href="/network"]').click();
  ensure(new URL(page.url()).pathname .replace(/\/$/,'') === "/network", "navigation link");
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("[data-motion]").click();
  ensure(
    (await page.locator("[data-motion]").getAttribute("aria-pressed")) ===
      "true",
    "pause motion",
  );
  results.push({
    behavior:
      "PvP and policy output, keyboard tabs, language persistence, navigation and motion control",
    passed: true,
  });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://127.0.0.1:3000/");
    await page.waitForTimeout(400);
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("overflow " + width);
    if (width < 1000) {
      await page.locator(".menu-toggle").click();
      if ((await page.locator("#mobile-menu").getAttribute("hidden")) !== null)
        throw Error("menu");
      await page.keyboard.press("Escape");
    }
    await page.screenshot({
      path: "validation/openentry-" + width + ".png",
      fullPage: true,
    });
    results.push({ viewport: width, overflow: false });
  }
  await b.close();
  fs.writeFileSync(
    "validation/browser-results.json",
    JSON.stringify({ results, errors, failedRequests, outbound }, null, 2),
  );
  if (failedRequests.some((r) => r.error !== "net::ERR_ABORTED"))
    throw Error("Resource failures: " + JSON.stringify(failedRequests));
  if (outbound.length)
    throw Error(
      "Unexpected outbound resource requests: " + JSON.stringify(outbound),
    );
  if (errors.length) throw Error(JSON.stringify(errors));
  console.log(
    JSON.stringify({ results, errors, failedRequests, outbound }, null, 2),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
