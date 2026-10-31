import { test, expect } from '@playwright/test';

const pages = ['/', '/websites/', '/team/', '/team/dauphindm/', '/team/liamvl/', '/privacy/', '/terms/', '/cookies/', '/404.html'];

for (const path of pages) {
  test(`${path} provides all three legal links`, async ({ page }) => {
    await page.goto(path);
    const legal = page.getByRole('navigation', { name: 'Legal navigation' });
    await expect(legal.getByRole('link', { name: 'Privacy', exact: true })).toHaveAttribute('href', '/privacy/');
    await expect(legal.getByRole('link', { name: 'Terms of Use', exact: true })).toHaveAttribute('href', '/terms/');
    await expect(legal.getByRole('link', { name: 'Cookies & Storage', exact: true })).toHaveAttribute('href', '/cookies/');
  });
}

for (const path of ['/privacy/', '/terms/', '/cookies/']) {
  test(`${path} has working contents links and an updated date`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('time')).toHaveAttribute('datetime', path === '/privacy/' ? '2026-10-31' : '2026-10-30');
    if (path === '/privacy/') {
      await expect(page.locator('main')).toContainText('transactional confirmation');
      await expect(page.locator('main')).toContainText('keyed hashes');
      await expect(page.locator('main')).toContainText('24 hours');
    }
    const toc = page.getByRole('navigation', { name: 'On this page' });
    const anchors = await toc.locator('a').evaluateAll((links) => links.map((link) => link.hash));
    for (const hash of anchors) {
      await toc.locator(`a[href="${hash}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
      await expect(page.locator(hash).getByRole('heading', { level: 2 })).toBeVisible();
    }
    await expect(page.getByRole('navigation', { name: 'Legal navigation' }).locator('[aria-current="page"]')).toHaveAttribute('href', path);
  });
}

test('the contact notice is available before consent or sending', async ({ page }) => {
  await page.goto('/#contact');
  const notice = page.locator('#contact-privacy');
  await expect(notice.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute('href', '/privacy/');
  await expect(notice.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms/');
  await expect(page.getByRole('checkbox')).toHaveAttribute('aria-describedby', 'contact-privacy');
  await notice.getByRole('link', { name: 'Privacy notice' }).click();
  await expect(page).toHaveURL('/privacy/');
});

test('the storage notice names the actual cookie and quiz transfer', async ({ page }) => {
  await page.goto('/cookies/');
  await expect(page.locator('main')).toContainText('hotwire_contact');
  await expect(page.locator('main')).toContainText('hotwire-website-brief');
  await expect(page.locator('main')).toContainText('ten minutes');
  await expect(page.locator('main')).toContainText('does not include advertising or analytics cookies');
});
