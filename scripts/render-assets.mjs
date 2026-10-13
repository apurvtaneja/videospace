// Renders the extension icons and Chrome Web Store images from assets/*.svg.
// Run with `npm run assets` after changing the artwork; the PNGs are committed.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer";

const icon = await readFile("assets/icon.svg", "utf8");
const icon16 = await readFile("assets/icon-16.svg", "utf8");
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif`;

// Small "browser window" and "fullscreen Space" illustrations for the store images.
const windowMock = (w, h, tabs, active) => `
  <div style="width:${w}px;height:${h}px;border-radius:14px;background:#fff;box-shadow:0 20px 50px rgba(30,27,75,.35);overflow:hidden;display:flex;flex-direction:column">
    <div style="height:38px;background:#ECEBF5;display:flex;align-items:center;gap:8px;padding:0 14px">
      <span style="width:12px;height:12px;border-radius:50%;background:#FF5F57"></span>
      <span style="width:12px;height:12px;border-radius:50%;background:#FEBC2E"></span>
      <span style="width:12px;height:12px;border-radius:50%;background:#28C840"></span>
      <div style="display:flex;gap:6px;margin-left:14px">${Array.from({ length: tabs }, (_, i) =>
        `<span style="width:${i === active ? 120 : 90}px;height:24px;border-radius:7px;background:${i === active ? "#fff" : "#DCDAEB"}"></span>`).join("")}</div>
    </div>
    <div style="flex:1;padding:22px;display:flex;gap:18px;background:#FAFAFD">
      <div style="flex:2;border-radius:10px;background:#1F1A3D;display:flex;align-items:center;justify-content:center">
        <div style="width:0;height:0;border-left:34px solid #fff;border-top:21px solid transparent;border-bottom:21px solid transparent;margin-left:8px"></div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:12px">${'<span style="height:14px;border-radius:7px;background:#E4E2F0"></span>'.repeat(6)}</div>
    </div>
  </div>`;

const spaceMock = (w, h) => `
  <div style="width:${w}px;height:${h}px;border-radius:14px;background:#0B0920;box-shadow:0 20px 50px rgba(30,27,75,.45);display:flex;align-items:center;justify-content:center;position:relative">
    <div style="width:0;height:0;border-left:56px solid #fff;border-top:34px solid transparent;border-bottom:34px solid transparent;margin-left:12px"></div>
    <div style="position:absolute;bottom:22px;left:26px;right:26px;height:6px;border-radius:3px;background:#2E2856"><div style="width:38%;height:100%;border-radius:3px;background:#8B5CF6"></div></div>
  </div>`;

const bg = `background:radial-gradient(120% 120% at 0% 0%, #EEF0FF 0%, #E4DEFF 55%, #D6CCFF 100%)`;

const pages = {
  "store/promo-440x280.png": [440, 280, `
    <div style="width:440px;height:280px;${bg};display:flex;align-items:center;gap:22px;padding:0 34px;box-sizing:border-box;font-family:${FONT}">
      <img src="${dataUri(icon)}" width="112" height="112">
      <div>
        <div style="font-size:38px;font-weight:700;color:#1E1B4B;letter-spacing:-.5px">VideoSpace</div>
        <div style="font-size:17px;color:#4338CA;margin-top:6px;line-height:1.35">Fullscreen videos get<br>their own macOS Space</div>
      </div>
    </div>`],
  "store/screenshot-1280x800.png": [1280, 800, `
    <div style="width:1280px;height:800px;${bg};font-family:${FONT};box-sizing:border-box;padding:64px 70px;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;gap:18px">
        <img src="${dataUri(icon)}" width="64" height="64">
        <div style="font-size:44px;font-weight:700;color:#1E1B4B;letter-spacing:-.5px">Fullscreen without losing your tabs</div>
      </div>
      <div style="font-size:22px;color:#4338CA;margin:14px 0 0 82px">The video moves to its own Space. Exit, and the tab slides back exactly where it was.</div>
      <div style="flex:1;display:flex;align-items:center;justify-content:space-between;margin-top:30px">
        <div style="text-align:center">${windowMock(500, 340, 4, 1)}<div style="margin-top:22px;font-size:20px;color:#312E81;font-weight:600">Your window, with all its tabs</div></div>
        <div style="font-size:64px;color:#7C3AED;font-weight:300">→</div>
        <div style="text-align:center">${spaceMock(500, 340)}<div style="margin-top:22px;font-size:20px;color:#312E81;font-weight:600">The video, in its own Space</div></div>
      </div>
    </div>`],
};

await mkdir("icons", { recursive: true });
const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  for (const size of [16, 32, 48, 128]) {
    const svg = size <= 16 ? icon16 : icon;
    await page.setViewport({ width: size, height: size });
    await page.setContent(`<body style="margin:0;background:transparent"><img src="${dataUri(svg)}" width="${size}" height="${size}" style="display:block">`);
    await writeFile(`icons/icon-${size}.png`, await page.screenshot({ omitBackground: true }));
  }
  for (const [file, [width, height, html]] of Object.entries(pages)) {
    await page.setViewport({ width, height });
    await page.setContent(`<body style="margin:0">${html}`);
    // Store screenshots must not have an alpha channel.
    await writeFile(file, await page.screenshot({ type: "png", omitBackground: false }));
  }
} finally {
  await browser.close();
}
console.log("Rendered icons/ and store/ images");
