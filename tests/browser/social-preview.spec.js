import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';

const discordAgent = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';
const paths = ['/', '/studio/', '/contact/', '/projects/', '/websites/', '/websites/pricing/', '/websites/examples/', '/websites/agreement/', '/team/', '/team/dauphindm/', '/team/liamvl/', '/privacy/', '/terms/', '/cookies/'];
const prefix = (locale) => locale === 'en' ? '' : '/' + locale;

for (const locale of ['en', 'nl', 'fr', 'de']) {
  test(`${locale} Discord-style crawler receives a static large PNG card without JavaScript`, async ({ request }) => {
    const images = new Set();
    for (const path of paths) {
      const url = prefix(locale) + path;
      const response = await request.get(url, { headers: { 'User-Agent': discordAgent } });
      expect(response.status(), url).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      const { document } = parseHTML(await response.text());
      const content = (attribute, key) => {
        const nodes = document.head.querySelectorAll(`meta[${attribute}="${key}"]`);
        expect(nodes.length, `${url}: ${key}`).toBe(1);
        return nodes[0].getAttribute('content');
      };
      const image = content('property', 'og:image');
      expect(image).toMatch(/^https:\/\/hotwireinteractive\.co\.uk\/social-websites\.png\?v=[a-f0-9]{12}$/);
      expect(content('property', 'og:image:secure_url')).toBe(image);
      expect(content('property', 'og:image:type')).toBe('image/png');
      expect(content('property', 'og:image:width')).toBe('1200');
      expect(content('property', 'og:image:height')).toBe('630');
      expect(content('name', 'twitter:card')).toBe('summary_large_image');
      expect(content('name', 'twitter:image')).toBe(image);
      expect(content('name', 'twitter:image:alt')).toBe(content('property', 'og:image:alt'));
      expect(content('property', 'og:url')).toBe('https://hotwireinteractive.co.uk' + url);
      images.add(image);
    }
    expect(images.size).toBe(1);
    for (const image of images) {
      const url = new URL(image);
      const response = await request.get(url.pathname + url.search, { headers: { 'User-Agent': discordAgent } });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
      const bytes = await response.body();
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(bytes.readUInt32BE(16)).toBe(1200);
      expect(bytes.readUInt32BE(20)).toBe(630);
      expect(bytes.length).toBeLessThan(1024 * 1024);
      expect(url.searchParams.get('v')).toBe(createHash('sha256').update(bytes).digest('hex').slice(0, 12));
    }
  });
}

for (const width of [320, 1440]) {
  test(`new-page footer logos are visible, loaded, and link home in every language at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['en', 'nl', 'fr', 'de']) {
      for (const path of ['/contact/', '/projects/', '/studio/']) {
        await page.goto(prefix(locale) + path);
        const footer = page.locator('.site-footer');
        const brand = footer.locator('.brand');
        await expect(brand).toHaveCount(1);
        await brand.scrollIntoViewIfNeeded();
        await expect(brand).toBeInViewport();
        await expect(brand).toHaveAttribute('href', prefix(locale) + '/');
        await expect(brand.locator('.brand-mark')).toBeVisible();
        await expect.poll(() => brand.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
        await expect(brand.locator('.brand-name')).toHaveText('HOTWIREINTERACTIVE');
        await expect(footer.locator('.footer-nav a')).not.toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (locale === 'en') await footer.screenshot({ path: test.info().outputPath(`${path.slice(1, -1)}-footer-${width}.png`) });
        if (locale === 'en' && path === '/projects/') {
          await brand.click();
          await expect(page).toHaveURL('/');
        }
      }
    }
  });
}
