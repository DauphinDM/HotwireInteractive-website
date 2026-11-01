import { test, expect } from '@playwright/test';
import { t } from '../../src/i18n/index.js';

const prefix = (locale) => locale === 'en' ? '' : '/' + locale;

for (const locale of ['en', 'nl', 'fr', 'de']) {
  test(`${locale} desktop header has actual pages and puts language before the finder action`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(prefix(locale) + '/');
    const links = await page.locator('.desktop-nav a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
    expect(links).toContain(prefix(locale) + '/studio/');
    expect(links).toContain(prefix(locale) + '/contact/');
    expect(links).toContain(prefix(locale) + '/projects/');
    expect(links.some((href) => href.includes('/#'))).toBe(false);
    const language = await page.locator('.language-menu').boundingBox();
    const action = await page.locator('.header-cta').boundingBox();
    expect(language.x + language.width).toBeLessThanOrEqual(action.x);
    await expect(page.locator('.hero .eyebrow')).toHaveCount(0);
    await expect(page.locator('.hero-wire')).toBeVisible();
    if (locale === 'en') await page.screenshot({ path: test.info().outputPath('homepage-1440.png') });
  });

  test(`${locale} all four package summaries fit together before scrolling at 1280×800`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(prefix(locale) + '/websites/pricing/');
    await page.evaluate(() => document.fonts.ready);
    const boxes = await page.locator('.tier-card').evaluateAll((nodes) => nodes.map((node) => {
      const { top, bottom, left } = node.getBoundingClientRect(); return { top, bottom, left };
    }));
    expect(boxes).toHaveLength(4);
    expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
    for (const box of boxes) { expect(box.top).toBeGreaterThan(0); expect(box.bottom).toBeLessThanOrEqual(800); }
    await page.screenshot({ path: test.info().outputPath(`pricing-${locale}-1280.png`) });
    const first = page.locator('.tier-details').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('.tier-description')).toBeVisible();
    await expect(first.locator('.tier-list')).toHaveCount(2);
    await page.keyboard.press('Enter');
  });

  test(`${locale} projects distinguish own work, unpublished client slots, and fictional studies`, async ({ page }) => {
    await page.goto(prefix(locale) + '/projects/');
    await expect(page.locator('.project-feature')).toContainText(t('Our own website', {}, locale));
    await expect(page.locator('.project-pending')).toContainText(t('Space reserved for client-approved work. No published case study yet.', {}, locale));
    await expect(page.locator('.project-studies')).toContainText(t('Original demonstration designs, not client work or operating businesses. Shop and booking interactions are simulations: no orders, payments, or reservations are made.', {}, locale));
    await expect(page.locator('.study-index a')).toHaveCount(4);
    await expect(page.locator('.desktop-nav a[aria-current="page"]')).toHaveAttribute('href', prefix(locale) + '/projects/');
  });
}

test('phone pricing has a readable overview of every package, without tiny four-column cards', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/websites/pricing/');
  const overview = page.locator('.pricing-quick');
  await expect(overview).toBeVisible();
  await expect(overview.locator('a')).toHaveCount(4);
  for (const name of ['Starter', 'Growth', 'Scale', 'Enterprise']) await expect(overview).toContainText(name);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('dedicated contact sends through the same mocked API and retains its fields on confirmation failure', async ({ page }) => {
  let sends = 0;
  await page.route('**/api/contact.php', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { csrf: 'test-token', request_id: 'a'.repeat(32) } });
    sends++;
    expect(route.request().postData()).toContain('name="locale"\r\n\r\nfr');
    return route.fulfill({ json: { ok: true, confirmation: 'unavailable' } });
  });
  await page.goto('/fr/contact/');
  await page.locator('#name').fill('Private studio');
  await page.locator('#email').fill('private@example.com');
  await page.locator('#message').fill('A private inquiry that must not be translated.');
  await page.locator('[name="consent"]').check();
  await page.locator('#contact-submit').click();
  await expect(page.locator('#contact-status')).toHaveAttribute('data-state', 'success');
  await expect(page.locator('#contact-submit')).toBeDisabled();
  await page.locator('.language-menu summary').click();
  await page.locator('[data-language-choice="nl"]').click();
  await expect(page).toHaveURL('/nl/contact/');
  await expect(page.locator('#message')).toHaveValue('A private inquiry that must not be translated.');
  await expect(page.locator('#email')).toHaveValue('private@example.com');
  await expect(page.locator('#contact-submit')).toBeDisabled();
  expect(sends).toBe(1);
});

test('pricing scope remains available through native disclosures without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/websites/pricing/');
  for (const card of await page.locator('.tier-card').all()) {
    await card.locator('summary').click();
    await expect(card.locator('.tier-description')).toBeVisible();
    await expect(card.getByRole('heading', { name: 'Not included', exact: true })).toBeVisible();
  }
  await context.close();
});
