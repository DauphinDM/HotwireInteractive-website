import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Run only when changing the editable social artwork, not on ordinary builds.
const svg = await readFile(new URL('../public/social-websites.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  // Social scrapers receive a self-contained PNG, never an SVG/font dependency.
  await page.route('**/*', (route) => route.abort());
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.locator('svg text').evaluateAll((nodes) => nodes.filter((node) => {
    const { x, y, width, height } = node.getBBox();
    return x < 0 || y < 0 || x + width > 1200 || y + height > 630;
  }).map((node) => node.textContent));
  if (overflow.length) throw new Error(`Social artwork text exceeds the canvas: ${overflow.join('; ')}`);
  await page.screenshot({ path: fileURLToPath(new URL('../public/social-websites.png', import.meta.url)) });
  console.log('Rendered public/social-websites.png (1200 × 630).');
} finally {
  await browser.close();
}
