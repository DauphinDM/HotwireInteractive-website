import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('pricing cards match the estimator ranges and do not promise verified payment', async ({ page }) => {
  await page.goto('/websites/pricing/');
  await expect(page.locator('.tier-card')).toHaveCount(4);
  for (const range of ['€500–€1,200', '€1,200–€3,000', '€3,000–€6,500', '€6,500–€14,000+']) {
    await expect(page.locator('.tier-price').filter({ hasText: range })).toHaveCount(1);
  }
  await expect(page.getByText('A signed service agreement and a cleared 50% deposit.', { exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText('not payment verification');
});

for (const [id, name] of [['local', 'Fieldwork'], ['portfolio', 'Forma'], ['shop', 'Objects'], ['booking', 'Still']]) {
  test(`${name} can be previewed, chosen, and included in an inquiry`, async ({ page }) => {
    await page.goto('/websites/examples/');
    await page.getByRole('link', { name: `Open ${name} demo`, exact: true }).click();
    await expect(page).toHaveURL(`/websites/examples/${id}/`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await page.locator('.demo-banner').getByRole('link', { name: 'Choose this direction' }).click();
    await expect(page).toHaveURL('/#contact');
    await expect(page.locator('#contact-quiz-brief')).toBeVisible();
    await expect(page.locator('#contact-quiz-text')).toContainText(name);
    await expect(page.locator('#name')).toBeFocused();
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  });
}

test('unknown design IDs cannot inject content into the contact brief', async ({ page }) => {
  await page.goto('/?template=%3Cimg%20src=x%20onerror=alert(1)%3E#contact');
  await expect(page).toHaveURL('/#contact');
  await expect(page.locator('#contact-quiz-brief')).toBeHidden();
});

test('shop demo has a local basket but cannot place an order', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => { if (request.method() === 'POST') requests.push(request.url()); });
  await page.goto('/websites/examples/shop/');
  await page.getByRole('button', { name: 'Add vessel to demo basket' }).click();
  await page.getByRole('button', { name: 'Add bowl to demo basket' }).click();
  await expect(page.locator('#demo-cart-status')).toContainText('€62.00');
  await expect(page.locator('#demo-cart-items li')).toHaveCount(2);
  await expect(page.locator('#demo-cart-status')).toContainText('No payment or order');
  await page.getByRole('button', { name: 'Clear demo basket' }).click();
  await expect(page.locator('#demo-cart-items li')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.length + localStorage.length)).toBe(0);
});

test('booking demo previews choices without reserving or submitting anything', async ({ page }) => {
  const posts = [];
  page.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()); });
  await page.goto('/websites/examples/booking/');
  await page.getByRole('radio', { name: 'A little more time · 60 minutes' }).check();
  await page.getByRole('radio', { name: 'Example Thursday, 14:00' }).check();
  await page.getByRole('button', { name: 'Preview this selection' }).click();
  await expect(page.locator('#demo-booking-status')).toContainText('60 minutes — Example Thursday, 14:00');
  await expect(page.locator('#demo-booking-status')).toContainText('no reservation was made');
  expect(posts).toEqual([]);
});

test('agreement draft formats cents safely, stays a draft, prints only the document, and sends nothing', async ({ page }) => {
  const posts = [];
  page.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()); });
  await page.goto('/websites/agreement/');
  const text = {
    reference: 'TEST-001 / review 1', provider: 'Provider for review', client: 'Zoë & <img src=x onerror=alert(1)>',
    scope: 'Five supplied-content pages. Two revision rounds. No checkout.',
    schedule: 'Milestone: approved layout. Dates subject to kickoff.',
    costs: 'Tax status and recurring hosting costs to be confirmed.', terms: 'Terms require review; no automatic refund exclusions.',
  };
  for (const [name, value] of Object.entries(text)) await page.locator(`#agreement-${name}`).fill(value);
  await page.locator('#agreement-total').fill('1200.01');
  await page.getByRole('button', { name: 'Prepare review draft' }).click();
  await expect(page.locator('[data-payment="deposit"]')).toHaveText('€600.01');
  await expect(page.locator('[data-payment="milestone"]')).toHaveText('€300.00');
  await expect(page.locator('[data-payment="final"]')).toHaveText('€300.00');
  await expect(page.locator('[data-agreement="client"]')).toHaveText(text.client);
  await expect(page.locator('#agreement-document img')).toHaveCount(0);
  await expect(page.locator('.draft-warning').first()).toContainText('NOT FOR SIGNATURE OR PAYMENT');
  await expect(page.locator('#document-title')).toBeFocused();
  await page.evaluate(() => { window.print = () => { window.printRequested = true; }; });
  await page.getByRole('button', { name: 'Print / save draft as PDF' }).click();
  expect(await page.evaluate(() => window.printRequested)).toBeTruthy();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#navbar')).toBeHidden();
  await expect(page.locator('#agreement-form')).toBeHidden();
  await expect(page.locator('#agreement-document')).toBeVisible();
  await expect(page.locator('.draft-warning').first()).toBeVisible();
  await page.pdf({ path: test.info().outputPath('agreement-review.pdf'), format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await page.locator('#agreement-scope').fill('Changed scope');
  await expect(page.getByRole('button', { name: 'Print / save draft as PDF' })).toBeDisabled();
  expect(posts).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.length + localStorage.length)).toBe(0);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations).toEqual([]);
});
