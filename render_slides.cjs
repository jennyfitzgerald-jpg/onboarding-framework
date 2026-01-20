const fs = require("fs");
const path = require("path");

async function main() {
  const { chromium } = require("playwright");

  const root = process.cwd();
  const slidesDir = path.join(root, "output", "html_slides");
  const outDir = path.join(slidesDir, "_renders");

  if (!fs.existsSync(slidesDir)) {
    throw new Error(`Slides directory not found: ${slidesDir}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const slideFiles = fs
    .readdirSync(slidesDir)
    .filter((f) => /^slide_\d+_.*\.html$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (slideFiles.length === 0) {
    throw new Error(`No slide_*.html files found in ${slidesDir}`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  for (const f of slideFiles) {
    const absHtml = path.join(slidesDir, f);
    const fileUrl = `file:///${absHtml.replace(/\\/g, "/")}`;
    const pngName = f.replace(/\.html$/i, ".png");
    const outPng = path.join(outDir, pngName);

    await page.goto(fileUrl, { waitUntil: "load" });
    // Hide navigation overlay so screenshots reflect slide design only.
    await page.addStyleTag({
      content: ".nav-overlay{display:none !important;}",
    });
    // Ensure web fonts (if any) are ready before capture.
    await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
    const slide = page.locator(".slide");
    await slide.waitFor({ state: "visible", timeout: 5000 });
    await slide.screenshot({ path: outPng });
  }

  await browser.close();

  // Simple manifest for convenience
  const manifest = slideFiles.map((f) => ({
    html: f,
    png: path.join("_renders", f.replace(/\.html$/i, ".png")),
  }));
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  // eslint-disable-next-line no-console
  console.log(`Rendered ${slideFiles.length} slides to ${outDir}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
