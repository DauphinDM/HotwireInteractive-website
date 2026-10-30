import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LANGUAGES, LANGUAGE_CODES } from '../../src/i18n/config.js';
import { t } from '../../src/i18n/index.js';

async function changeLanguage(page, locale) {
  await page.locator('.language-menu summary').click();
  await page.locator(`[data-language-choice="${locale}"]`).click();
  await expect(page.locator('html')).toHaveAttribute('lang', LANGUAGES[locale].html);
}

test('packages and examples are first-level navigation and visible phone shortcuts', async ({ page }) => {
  await page.goto('/');
  for (const path of ['/websites/pricing/', '/websites/examples/']) {
    await expect(page.locator(`.desktop-nav a[href="${path}"]`)).toBeVisible();
    await expect(page.locator(`.hero-actions a[href="${path}"]`)).toBeVisible();
  }
  await page.setViewportSize({ width: 320, height: 812 });
  for (const path of ['/websites/pricing/', '/websites/examples/']) await expect(page.locator(`.header-shortcuts a[href="${path}"]`)).toBeVisible();
});

for (const locale of ['nl', 'fr', 'de']) {
  for (const path of ['/', '/websites/', '/websites/pricing/', '/websites/examples/', '/websites/agreement/', '/privacy/', '/terms/', '/cookies/', '/team/', '/websites/examples/local/', '/websites/examples/shop/', '/websites/examples/booking/']) {
    test(`${locale}${path} has static translations, localized links, and accessible phone/desktop layouts`, async ({ page }) => {
      test.setTimeout(45_000);
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${locale}${path}`);
        await expect(page.locator('html')).toHaveAttribute('lang', LANGUAGES[locale].html);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://hotwireinteractive.co.uk/${locale}${path}`);
        await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(5);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        expect(axe.violations).toEqual([]);
        await expect(page.locator('main h1')).toBeVisible();
        if (path === '/') {
          expect(await page.evaluate(() => document.querySelector('.hero .eyebrow').getBoundingClientRect().top >= document.getElementById('navbar').getBoundingClientRect().bottom)).toBeTruthy();
          await expect(page.locator('#message')).toHaveAttribute('placeholder', t('Tell us what you have in mind…', {}, locale));
          await expect(page.locator('#website-note-title')).toHaveText(t('What should', {}, locale) + t('yours do?', {}, locale));
          await page.screenshot({ path: test.info().outputPath(`${locale}-${width}.png`), fullPage: true });
        }
        await expect(page.locator('.desktop-nav a').nth(1)).toHaveAttribute('href', `/${locale}/websites/pricing/`);
      }
    });
  }
}

test('browser detection is automatic, explicit URLs win, and manual choice persists', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'fr-BE', baseURL: 'http://127.0.0.1:4173' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page).toHaveURL('/fr/');
  await expect(page.locator('h1')).toContainText('Nous concevons');
  expect(await page.evaluate(() => localStorage.getItem('hotwire-language'))).toBeNull();
  await page.goto('/de/websites/?goal=shop#website-quiz');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de-BE');
  await changeLanguage(page, 'nl');
  await expect(page).toHaveURL('/nl/websites/?goal=shop#website-quiz');
  await page.goto('/');
  await expect(page).toHaveURL('/nl/');
  await changeLanguage(page, 'en');
  await expect(page).toHaveURL('/');
  await context.close();
});

test('switching languages preserves private form values and keeps translation requests local', async ({ page }) => {
  const remoteTranslationRequests = [];
  page.on('request', (request) => { if (new URL(request.url()).hostname.includes('translate')) remoteTranslationRequests.push(request.url()); });
  await page.goto('/#contact');
  await page.locator('#name').fill('Private client');
  await page.locator('#email').fill('private@example.com');
  await page.locator('#message').fill('Never translate or store this personal message.');
  await page.locator('#category').selectOption('collaboration');
  await page.locator('[name="consent"]').check();
  await changeLanguage(page, 'fr');
  await expect(page).toHaveURL('/fr/#contact');
  await expect(page.locator('h1')).toContainText('Nous concevons');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', t('Hotwire Interactive | Websites & Independent Projects', {}, 'fr'));
  await expect(page.locator('#name')).toHaveValue('Private client');
  await expect(page.locator('#message')).toHaveValue('Never translate or store this personal message.');
  await expect(page.locator('#category')).toHaveValue('collaboration');
  await expect(page.locator('[name="consent"]')).toBeChecked();
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('private@example.com');
  await page.route('**/api/contact.php', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { csrf: 'test-token', request_id: 'a'.repeat(32) } });
    expect(route.request().postData()).toContain('name="locale"\r\n\r\nfr');
    expect(route.request().postData()).toContain('Never translate or store this personal message.');
    return route.fulfill({ json: { ok: true } });
  });
  await page.locator('#contact-submit').click();
  await expect(page.locator('#contact-submit')).toHaveText(t('Inquiry sent', {}, 'fr'));
  expect(remoteTranslationRequests).toEqual([]);
});

test('quiz progress and requirements survive an in-place language change', async ({ page }) => {
  await page.goto('/websites/#website-quiz');
  await page.locator('#quiz-start').click();
  await page.locator('#quiz-options input[value="shop"]').check();
  await page.locator('#quiz-next').click();
  await page.locator('#quiz-options input[value="focused"]').check();
  await changeLanguage(page, 'de');
  await expect(page.locator('#quiz-step-label')).toHaveText(t('Question {current} of {total}', { current: 2, total: 10 }, 'de'));
  await expect(page.locator('#quiz-options input[value="focused"]')).toBeChecked();
  await page.locator('#quiz-next').click();
  for (const value of ['occasional', 'lean', 'no', 'no', 'no', 'ready', 'normal', 'starter']) {
    await page.locator(`#quiz-options input[value="${value}"]`).check();
    await page.locator('#quiz-next').click();
  }
  await expect(page.locator('#quiz-result-title')).toHaveText(t('An online shop', {}, 'de'));
  await expect(page.locator('#quiz-result-tier')).toContainText('Scale');
  await expect(page.locator('#quiz-budget-warning')).not.toBeEmpty();
  await page.locator('#quiz-contact').click();
  await expect(page).toHaveURL('/de/#contact');
  await expect(page.locator('#contact-quiz-text')).toContainText(t('An online shop', {}, 'de'));
});

test('local-language pages and language links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/fr/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-BE');
  await expect(page.locator('h1')).not.toContainText('We design');
  await page.locator('.language-menu summary').click();
  await page.locator('[data-language-choice="nl"]').click();
  await expect(page).toHaveURL(/\/nl\/$/);
  await page.locator('.header-shortcuts a').first().click();
  await expect(page).toHaveURL(/\/nl\/websites\/pricing\/$/);
  await context.close();
});

test('blocked language storage does not prevent switching or direct localized routes', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.goto('/');
  await changeLanguage(page, 'de');
  await expect(page).toHaveURL('/de/');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de-BE');
});

test('sitemap includes every supported language and alternate links', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  const text = await response.text();
  for (const locale of LANGUAGE_CODES) {
    const prefix = locale === 'en' ? '' : `/${locale}`;
    expect(text).toContain(`https://hotwireinteractive.co.uk${prefix}/websites/pricing/</loc>`);
    expect(text).toContain(`hreflang="${locale}"`);
  }
});

test('a language change preserves private agreement fields and prepared draft content', async ({ page }) => {
  await page.goto('/websites/agreement/');
  const values = { reference: 'PRIVATE-01', provider: 'Private provider', client: 'Private client <b>not markup</b>', scope: 'Private supplied scope', schedule: 'Private schedule', costs: 'Private cost details', terms: 'Private terms for review' };
  for (const [name, value] of Object.entries(values)) await page.locator(`#agreement-${name}`).fill(value);
  await page.locator('#agreement-total').fill('1200.01');
  await page.locator('#agreement-form button[type="submit"]').click();
  await changeLanguage(page, 'fr');
  await expect(page.locator('#agreement-client')).toHaveValue(values.client);
  await expect(page.locator('[data-agreement="client"]')).toHaveText(values.client);
  await expect(page.locator('[data-agreement="client"] b')).toHaveCount(0);
  await expect(page.locator('.draft-warning').first()).toHaveText(t('DRAFT FOR REVIEW — NOT FOR SIGNATURE OR PAYMENT', {}, 'fr'));
  await expect(page.locator('[data-payment="deposit"]')).toContainText('600,01');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('Private client');
});
