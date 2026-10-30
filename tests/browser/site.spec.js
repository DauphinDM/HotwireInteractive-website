import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const demos = ['local', 'portfolio', 'shop', 'booking'].map((id) => `/websites/examples/${id}/`);
const pages = ['/', '/websites/', '/websites/pricing/', '/websites/examples/', '/websites/agreement/', ...demos, '/team/', '/team/dauphindm/', '/team/liamvl/', '/privacy/', '/terms/', '/cookies/', '/404.html'];
const publicPages = pages.filter((path) => path !== '/404.html' && !demos.includes(path));

async function ready(page, path) {
  const response = await page.goto(path);
  expect(response.ok()).toBeTruthy();
  await page.evaluate(() => document.fonts.ready);
}

for (const path of pages) {
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    test(`${path} fits at ${width}px`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await ready(page, path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        return [...document.querySelectorAll('h1, h2, h3, p, nav, input, textarea, .team-card, .brand, .menu-toggle')]
          .filter((node) => node.getClientRects().length)
          .filter((node) => !node.closest('[aria-hidden="true"]'))
          .filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.left < -1 || rect.right > viewport + 1 ||
              (!node.matches('input, textarea') && node.scrollWidth > node.clientWidth + 1);
          })
          .map((node) => ({ tag: node.tagName, text: node.textContent.slice(0, 80) }));
      });
      expect(overflow).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      expect(errors).toEqual([]);
      if (width === 375 || width === 1440) {
        await page.screenshot({ path: testInfo.outputPath(`page-${width}.png`), fullPage: true });
      }
    });
  }

  test(`${path} meets automated WCAG AA checks`, async ({ page }) => {
    await ready(page, path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test(`${path} uses a sequential heading outline`, async ({ page }) => {
    await ready(page, path);
    const levels = await page.locator('h1:visible, h2:visible, h3:visible, h4:visible').evaluateAll((nodes) =>
      nodes.map((node) => Number(node.tagName.slice(1))));
    expect(levels[0]).toBe(1);
    levels.slice(1).forEach((level, index) => expect(level).toBeLessThanOrEqual(levels[index] + 1));
  });

  test(`${path} remains readable and navigable without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4173${path}`);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS('opacity', '1');
    if (path !== '/404.html') {
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Team' }).click();
      await expect(page).toHaveURL(/\/team\/$/);
    }
    if (path === '/') {
      await page.goto('http://127.0.0.1:4173/#contact');
      await expect(page.getByRole('link', { name: 'open the secure contact form' })).toHaveAttribute('href', '/api/contact.php');
      await expect(page.getByRole('link', { name: 'email the studio directly' })).toHaveAttribute('href', 'mailto:contact@hotwireinteractive.co.uk');
    }
    await context.close();
  });
}

for (const path of [...publicPages, ...demos]) {
  test(`${path} has keyboard-operable mobile navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await ready(page, path);
    // Wait for the navigation module to initialize so the mobile menu is hidden by default.
    await page.waitForFunction(() => document.documentElement.classList.contains('site-ready'));
    const toggle = page.getByRole('button', { name: /^(Open|Close) navigation$/ });
    const menu = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(menu).toBeHidden();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(menu.getByRole('link', { name: 'Websites', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    const header = await page.locator('#navbar').boundingBox();
    await page.mouse.click(12, header.y + header.height + 24);
    await expect(menu).toBeHidden();
    await toggle.click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  if (!demos.includes(path)) test(`${path} has a matching canonical URL and unique metadata`, async ({ page }) => {
    await ready(page, path);
    const canonical = `https://hotwireinteractive.co.uk${path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const socialURL = new URL(await page.locator('meta[property="og:image"]').getAttribute('content'));
    const image = await page.request.get(socialURL.pathname);
    expect(image.ok()).toBeTruthy();
    expect(image.headers()['content-type']).toContain('image/png');
    const bytes = await image.body();
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
  });
}

test('skip link moves keyboard focus past navigation', async ({ page }) => {
  await ready(page, '/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('mobile contact link lands below the fixed header and closes the menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page, '/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Contact' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden();
  await expect(page).toHaveURL(/#contact$/);
  const bounds = await page.evaluate(() => ({
    header: document.getElementById('navbar').getBoundingClientRect().bottom,
    contact: document.getElementById('contact').getBoundingClientRect().top,
  }));
  expect(bounds.contact).toBeGreaterThanOrEqual(bounds.header);
});

test('all internal links and bundled resources resolve', async ({ page, request }) => {
  test.setTimeout(90_000);
  const urls = new Set();
  for (const path of pages) {
    await ready(page, path);
    const links = await page.locator('a[href], img[src], script[src], link[rel="stylesheet"]').evaluateAll((nodes) =>
      nodes.map((node) => node.href || node.src).filter((url) => url.startsWith(location.origin) && !url.includes('/api/')));
    links.forEach((url) => urls.add(url));
  }
  for (const url of urls) {
    const response = await request.get(url);
    expect(response.ok(), url).toBeTruthy();
    const fragment = new URL(url).hash.slice(1);
    if (fragment) {
      await page.goto(url);
      expect(await page.evaluate((id) => Boolean(document.getElementById(id)), fragment), url).toBeTruthy();
    }
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of publicPages) expect(sitemap).toContain(`https://hotwireinteractive.co.uk${path}</loc>`);
  expect(sitemap).not.toContain('team.html');
});

test('profile phone numbers use telephone links', async ({ page }) => {
  await ready(page, '/team/dauphindm/');
  await expect(page.getByRole('link', { name: '+32 480 65 98 10', exact: true })).toHaveAttribute('href', 'tel:+32480659810');
  await ready(page, '/team/liamvl/');
  await expect(page.getByRole('link', { name: '+32 493 81 35 23', exact: true })).toHaveAttribute('href', 'tel:+32493813523');
});

test('missing URLs are not silently served as the homepage', async ({ request, page }) => {
  expect((await request.get('/this-page-does-not-exist')).status()).toBe(404);
  await ready(page, '/404.html');
  await page.getByRole('link', { name: 'Back to the studio' }).click();
  await expect(page).toHaveURL('/');
});

test('website services and the quiz are available from the homepage', async ({ page }) => {
  await ready(page, '/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('websites');
  await page.getByRole('link', { name: 'Explore website services' }).click();
  await expect(page).toHaveURL(/websites\/$/);
  await expect(page.locator('.service-row')).toHaveCount(4);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForFunction(() => document.documentElement.classList.contains('site-ready'));
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Websites', exact: true })).toBeVisible();
});

test('reduced motion keeps content readable and navigation usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page, '/websites/');
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole('heading', { name: 'Yes, we can build your website.' })).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.getByRole('link', { name: 'Which one fits me?', exact: true }).click();
  await expect(page.locator('#quiz-question')).toBeFocused();
  const bounds = await page.evaluate(() => ({
    header: document.getElementById('navbar').getBoundingClientRect().bottom,
    question: document.getElementById('quiz-question').getBoundingClientRect().top,
  }));
  expect(bounds.question).toBeGreaterThanOrEqual(bounds.header);
});

for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  test(`website services have real gutters and aligned content at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await ready(page, '/websites/');
    const layout = await page.evaluate(() => {
      const rect = (selector) => {
        const { left, right, width } = document.querySelector(selector).getBoundingClientRect();
        return { left, right, width };
      };
      return { surface: rect('.services-section'), services: rect('.services-content'), intro: rect('.page-intro .page-shell'), quiz: rect('#website-quiz') };
    });
    expect(layout.surface.left).toBe(0);
    expect(layout.surface.width).toBe(width);
    expect(layout.services.left).toBeGreaterThanOrEqual(24);
    expect(width - layout.services.right).toBeGreaterThanOrEqual(24);
    expect(layout.services.left).toBeCloseTo(layout.intro.left, 0);
    expect(layout.services.right).toBeCloseTo(layout.quiz.right, 0);
  });
}
