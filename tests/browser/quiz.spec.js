import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function start(page) {
  await page.goto('/websites/#website-quiz');
  await page.getByRole('button', { name: 'Start the website quiz' }).click();
}

async function choose(page, value) {
  await page.locator(`#quiz-options input[value="${value}"]`).check();
  await page.locator('#quiz-next').click();
}

async function complete(page, { goal = 'leads', size = 'focused', updates = 'occasional', priority = 'lean' } = {}) {
  for (const value of [goal, size, updates, priority]) await choose(page, value);
}

test('requires an answer and preserves choices when moving back', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Next question' }).click();
  await expect(page.getByRole('alert')).toHaveText('Choose one answer to continue.');
  await expect(page.locator('#quiz-step-label')).toHaveText('Question 1 of 4');
  await choose(page, 'portfolio');
  await expect(page.locator('#quiz-question')).toBeFocused();
  await choose(page, 'growing');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('#quiz-options input[value="growing"]')).toBeChecked();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Show my work', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeHidden();
});

for (const [goal, size, title] of [
  ['leads', 'focused', 'A focused landing page'], ['leads', 'several', 'A business website'],
  ['portfolio', 'several', 'A portfolio website'], ['shop', 'focused', 'An online shop'],
  ['bookings', 'focused', 'A booking website'], ['publishing', 'growing', 'A content-led website'],
  ['app', 'several', 'A custom web application'],
]) {
  test(`recommends ${title} without requiring contact details`, async ({ page }) => {
    await start(page);
    await complete(page, { goal, size });
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.locator('#quiz-result-title')).toBeFocused();
    await expect(page.locator('#quiz-result-structure li')).toHaveCount(size === 'growing' ? 4 : 3);
  });
}

test('revising answers updates the result and retaking clears old choices', async ({ page }) => {
  await start(page);
  await complete(page);
  await page.getByRole('button', { name: 'Change my answers' }).click();
  await expect(page.locator('#quiz-options input[value="leads"]')).toBeChecked();
  await choose(page, 'shop');
  for (let step = 0; step < 3; step++) await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-result-title')).toHaveText('An online shop');
  await page.getByRole('button', { name: 'Take it again' }).click();
  await expect(page.locator('#quiz-options input:checked')).toHaveCount(0);
  await expect(page.locator('#quiz-step-label')).toHaveText('Question 1 of 4');
  await expect(page.locator('#quiz-result')).toBeHidden();
});

test('the homepage goal shortcut selects the matching quiz answer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Take bookings', exact: true }).click();
  await expect(page).toHaveURL(/websites\/\?goal=bookings#website-quiz$/);
  await expect(page.getByRole('radio', { name: 'Take appointments or reservations' })).toBeChecked();
  await expect(page.locator('#quiz-question')).toBeFocused();
});

test('keyboard users can choose an answer and advance without automatic navigation', async ({ page }) => {
  await start(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: 'Show my work', exact: true })).toBeChecked();
  await expect(page.locator('#quiz-step-label')).toHaveText('Question 1 of 4');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Next question' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#quiz-step-label')).toHaveText('Question 2 of 4');
});

test('discussing a recommendation transfers the brief once and supports copying and removal', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text) => { window.copiedDraft = text; },
    } });
  });
  await start(page);
  await complete(page, { goal: 'shop' });
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  await page.getByRole('link', { name: 'Discuss this website' }).click();
  await expect(page).toHaveURL('/#contact');
  await expect(page.locator('#contact-quiz-brief')).toBeVisible();
  await expect(page.locator('#contact-quiz-text')).toContainText('An online shop');
  expect(await page.evaluate(() => sessionStorage.getItem('hotwire-website-brief'))).toBeNull();
  await page.getByLabel('Your name or studio').fill('My studio');
  await page.getByLabel('Email address', { exact: true }).fill('hello@example.com');
  await expect(page.getByLabel('Your message', { exact: false })).not.toHaveAttribute('required', '');
  await page.getByRole('checkbox').check();
  await page.getByLabel('Your message (optional)', { exact: true }).fill('Please keep my domain.');
  await page.getByRole('button', { name: 'Copy message', exact: true }).click();
  expect(await page.evaluate(() => window.copiedDraft)).toContain('An online shop');
  await page.getByRole('button', { name: 'Remove recommendation' }).click();
  await expect(page.locator('#contact-quiz-brief')).toBeHidden();
  await expect(page.locator('#message')).toHaveValue('Please keep my domain.');
  await page.getByRole('button', { name: 'Copy message', exact: true }).click();
  expect(await page.evaluate(() => window.copiedDraft)).not.toContain('Website quiz brief:');
});

test('the services quiz button starts immediately and retains progress on reuse', async ({ page }) => {
  await page.goto('/websites/');
  await page.getByRole('link', { name: 'Which one fits me?', exact: true }).click();
  await expect(page.locator('#quiz-step-label')).toHaveText('Question 1 of 4');
  await expect(page.locator('#quiz-question')).toBeFocused();
  await choose(page, 'shop');
  await page.getByRole('link', { name: 'Which one fits me?', exact: true }).click();
  await expect(page.locator('#quiz-step-label')).toHaveText('Question 2 of 4');
});

test('blocked storage keeps the recommendation visible with a copy fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
  });
  await start(page);
  await complete(page);
  await page.getByRole('link', { name: 'Discuss this website' }).click();
  await expect(page).toHaveURL(/\/websites\/#website-quiz$/);
  await expect(page.locator('#quiz-copy-status')).toContainText('Copy the selected brief');
  await expect(page.getByLabel('Your website description')).toBeFocused();
});

test('invalid and expired transfers are discarded without attaching a brief', async ({ page }) => {
  await page.goto('/');
  for (const raw of ['not json', JSON.stringify({ answers: {}, createdAt: Date.now() }), JSON.stringify({
    answers: { goal: 'shop', size: 'focused', updates: 'regular', priority: 'lean' }, createdAt: Date.now() - 11 * 60 * 1000,
  })]) {
    await page.evaluate((value) => sessionStorage.setItem('hotwire-website-brief', value), raw);
    await page.goto('/?website-brief=1#contact');
    await expect(page).toHaveURL('/#contact');
    await expect(page.locator('#contact-quiz-brief')).toBeHidden();
    expect(await page.evaluate(() => sessionStorage.getItem('hotwire-website-brief'))).toBeNull();
  }
});

test('an invalid goal query leaves the ordinary quiz welcome available', async ({ page }) => {
  await page.goto('/websites/?goal=invalid#website-quiz');
  await expect(page.getByRole('button', { name: 'Start the website quiz' })).toBeVisible();
  await expect(page.locator('#website-quiz-form')).toBeHidden();
});

test('copying a recommendation has a manual fallback if clipboard permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new Error('Permission denied'); },
    } });
  });
  await start(page);
  await complete(page);
  await page.getByRole('button', { name: 'Copy recommendation' }).click();
  const brief = page.getByLabel('Your website description');
  await expect(brief).toBeVisible();
  await expect(brief).toBeFocused();
  expect(await brief.evaluate((input) => input.selectionEnd - input.selectionStart)).toBe((await brief.inputValue()).length);
  await expect(page.locator('#quiz-copy-status')).toContainText('copy it manually');
});

test('quiz fallback works when scripts are unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/websites/#website-quiz');
  await expect(page.locator('#quiz-fallback')).toBeVisible();
  await page.getByRole('link', { name: 'Which one fits me?', exact: true }).click();
  await expect(page).toHaveURL(/\/websites\/#website-quiz$/);
  await page.getByRole('link', { name: 'tell us what you need' }).click();
  await expect(page).toHaveURL(/#contact$/);
  await context.close();
});

test('all quiz states fit on a narrow phone and pass automated accessibility checks', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await start(page);
  for (const value of ['shop', 'growing', 'team', 'growth']) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const result = await new AxeBuilder({ page }).include('#website-quiz').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations).toEqual([]);
    await choose(page, value);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const result = await new AxeBuilder({ page }).include('#website-quiz').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.locator('#website-finder').screenshot({ path: testInfo.outputPath('quiz-result-mobile.png') });
});
