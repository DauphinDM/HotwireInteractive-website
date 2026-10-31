import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const rendered = spawnSync(process.env.PHP_BINARY || 'php', ['tests/render-mail-previews.php'], { encoding: 'utf8' });
if (rendered.error) throw new Error('PHP 8.2+ is required. Set PHP_BINARY or add php to PATH.', { cause: rendered.error });
assert.equal(rendered.status, 0, rendered.stderr);
const messages = JSON.parse(rendered.stdout);
const output = resolve('test-results/emails');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
let checks = 0;
try {
  for (const [name, message] of Object.entries(messages)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', (route) => { requests.push(route.request().url()); return route.abort(); });
    for (const width of [320, 600, 900]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.setContent(message.html, { waitUntil: 'load' });
      assert.ok(await page.locator('html').evaluate((el) => el.scrollWidth <= window.innerWidth), `${name}: horizontal overflow at ${width}px`);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('script, img, iframe, form').count(), 0);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(accessibility.violations.map(({ id }) => id), [], `${name}: accessibility at ${width}px`);
      if (name !== 'studio-stress') await page.screenshot({ path: resolve(output, `${name}-${width}.png`), fullPage: true });
      checks++;
    }
    // Basic inline-only fallback, approximating clients that discard style blocks.
    await page.locator('style').evaluateAll((styles) => styles.forEach((style) => style.remove()));
    await page.setViewportSize({ width: 320, height: 1000 });
    assert.ok(await page.locator('html').evaluate((el) => el.scrollWidth <= window.innerWidth), `${name}: inline-only layout must remain readable`);
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, [], 'Email must not fetch images, fonts, tracking, or scripts');
    await context.close();
  }
  console.log(`PASS: ${checks} email layout/accessibility checks, inline-only fallbacks, and no external requests. Screenshots: ${output}. Browser checks do not prove Outlook/Gmail rendering.`);
} finally { await browser.close(); }
