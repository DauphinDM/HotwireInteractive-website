import { test, expect } from '@playwright/test';

async function fillDraft(page) {
  await page.goto('/#contact');
  await page.getByLabel('Your name or studio').fill('Zoë & Studio');
  await page.getByLabel('Email address', { exact: true }).fill('zoe@example.com');
  await page.getByLabel('Inquiry type').selectOption('collaboration');
  await page.getByLabel('Your message', { exact: true }).fill('Hello! An idea with 50% more sparks & games. 🎮');
  await page.getByRole('checkbox').check();
}

test('invalid or whitespace-only input cannot create a draft', async ({ page }) => {
  await page.goto('/#contact');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByLabel('Your name or studio')).toBeFocused();
  await expect(page.locator('#draft-preview')).toBeHidden();
  await fillDraft(page);
  await page.getByLabel('Your message', { exact: true }).fill('   ');
  await page.getByRole('button', { name: 'Copy message', exact: true }).click();
  await expect(page.getByLabel('Your message', { exact: true })).toBeFocused();
  expect(await page.getByLabel('Your message', { exact: true }).evaluate((field) => field.validity.valid)).toBeFalsy();
  await expect(page.locator('#draft-preview')).toBeHidden();
  await page.getByLabel('Your message', { exact: true }).fill('A real message');
  expect(await page.getByLabel('Your message', { exact: true }).evaluate((field) => field.validity.valid)).toBeTruthy();
});

test('a server-accepted inquiry keeps fields and prevents duplicate submits', async ({ page }) => {
  let sends = 0;
  await page.route('**/api/contact.php', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { csrf: 'test-token', request_id: 'a'.repeat(32) } });
    sends += 1;
    expect(route.request().postData()).toContain('zoe@example.com');
    return route.fulfill({ json: { ok: true } });
  });
  await fillDraft(page);
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('button', { name: 'Inquiry sent' })).toBeDisabled();
  await expect(page.getByLabel('Your name or studio')).toHaveValue('Zoë & Studio');
  await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('Hello! An idea with 50% more sparks & games. 🎮');
  await expect(page.getByRole('status')).toContainText('accepted by our mail server');
  expect(sends).toBe(1);
  await page.getByLabel('Your message', { exact: true }).fill('A new inquiry');
  await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeEnabled();
});

for (const status of [403, 409, 422, 429, 503]) {
  test(`server error ${status} never claims success or loses the inquiry`, async ({ page }) => {
    await page.route('**/api/contact.php', (route) => route.fulfill(route.request().method() === 'GET'
      ? { json: { csrf: 'test-token', request_id: 'a'.repeat(32) } }
      : { status, json: { ok: false, message: 'Please try again later.' } }));
    await fillDraft(page);
    await page.getByRole('button', { name: 'Send inquiry' }).click();
    await expect(page.getByRole('status')).toHaveText('Please try again later.');
    await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeEnabled();
    await expect(page.getByLabel('Email address', { exact: true })).toHaveValue('zoe@example.com');
  });
}

test('a non-PHP/static server produces a useful failure rather than a false success', async ({ page }) => {
  await page.route('**/api/contact.php', (route) => route.fulfill({ contentType: 'text/html', body: '<html>Not a contact API</html>' }));
  await fillDraft(page);
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('status')).toContainText('could not confirm');
  await expect(page.getByRole('button', { name: 'Send inquiry' })).toBeEnabled();
});

test('the actual Vite preview refuses API requests without exposing PHP source', async ({ request }) => {
  for (const path of ['/api/contact.php', '/api/contact-lib.php']) {
    const response = await request.get(path);
    expect(response.status()).toBe(503);
    expect(response.headers()['content-type']).toContain('application/json');
    const body = await response.text();
    expect(body).not.toContain('<?php');
    expect(JSON.parse(body).message).toContain('needs PHP');
  }
});

test('copying locally does not require permission to send personal data', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text) => { window.copiedDraft = text; },
    } });
  });
  await fillDraft(page);
  await page.getByRole('checkbox').uncheck();
  await page.getByRole('button', { name: 'Copy message', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Message copied');
  expect(await page.evaluate(() => window.copiedDraft)).toContain('zoe@example.com');
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByRole('checkbox')).toBeFocused();
});

test('controls are locked while loading the token and stay locked while sending', async ({ page }) => {
  let releaseToken;
  let releaseSend;
  const tokenReady = new Promise((resolve) => { releaseToken = resolve; });
  const sendReady = new Promise((resolve) => { releaseSend = resolve; });
  await page.route('**/api/contact.php', async (route) => {
    if (route.request().method() === 'GET') {
      await tokenReady;
      return route.fulfill({ json: { csrf: 'test-token', request_id: 'a'.repeat(32) } });
    }
    await sendReady;
    return route.fulfill({ json: { ok: true } });
  });
  await fillDraft(page);
  await page.getByRole('button', { name: 'Send inquiry' }).click();
  await expect(page.getByLabel('Your name or studio')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Copy message', exact: true })).toBeDisabled();
  releaseToken();
  await expect(page.getByRole('button', { name: 'Sending…', exact: true })).toBeDisabled();
  releaseSend();
  await expect(page.getByRole('button', { name: 'Inquiry sent' })).toBeDisabled();
  await expect(page.getByLabel('Your name or studio')).toBeEnabled();
});

test('copy message succeeds without clearing fields', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text) => { window.copiedDraft = text; },
    } });
  });
  await fillDraft(page);
  await page.getByRole('button', { name: 'Copy message', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Message copied.');
  expect(await page.evaluate(() => window.copiedDraft)).toContain('To: contact@hotwireinteractive.co.uk');
  await expect(page.getByLabel('Email address', { exact: true })).toHaveValue('zoe@example.com');
});

test('clipboard denial exposes a selected manual-copy fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new Error('Permission denied'); },
    } });
  });
  await fillDraft(page);
  await page.getByRole('button', { name: 'Copy message', exact: true }).click();
  const draft = page.getByLabel('Copyable email draft');
  await expect(draft).toBeVisible();
  await expect(draft).toBeFocused();
  expect(await draft.evaluate((field) => field.selectionEnd - field.selectionStart)).toBe((await draft.inputValue()).length);
  await expect(page.getByRole('status')).toContainText('Automatic copying is unavailable.');
  await page.getByLabel('Your message', { exact: true }).fill('Updated message');
  await expect(page.locator('#draft-preview')).toBeHidden();
  await expect(page.locator('#contact-status')).toBeEmpty();
});
