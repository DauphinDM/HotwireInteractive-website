import { test, expect } from '@playwright/test';

test('page entry and quiz transitions animate when motion is allowed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.motionCalls = 0;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) { window.motionCalls++; return animate.apply(this, args); };
  });
  await page.goto('/websites/');
  await expect.poll(() => page.evaluate(() => window.motionCalls)).toBeGreaterThan(0);
  const before = await page.evaluate(() => window.motionCalls);
  await page.getByRole('link', { name: 'Which one fits me?', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.motionCalls)).toBeGreaterThan(before);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
});

test('reduced-motion pages never start entry animations', async ({ page }) => {
  await page.addInitScript(() => { window.motionCalls = 0; Element.prototype.animate = () => { window.motionCalls++; }; });
  await page.goto('/websites/');
  await page.getByRole('link', { name: 'Which one fits me?', exact: true }).click();
  expect(await page.evaluate(() => window.motionCalls)).toBe(0);
  await expect(page.locator('#quiz-question')).toBeFocused();
});

test('keyboard focus cancels an entrance instead of remaining inside invisible content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const isContact = this.matches('.contact-card');
      const animation = animate.call(this, frames, isContact ? { ...options, duration: 10000 } : options);
      if (isContact) window.contactEntrance = animation;
      return animation;
    };
  });
  await page.goto('/#contact');
  await expect.poll(() => page.evaluate(() => window.contactEntrance?.playState)).toBe('running');
  const name = page.getByLabel('Your name or studio');
  await name.focus();
  await expect.poll(() => page.evaluate(() => window.contactEntrance.playState)).toBe('idle');
  await expect(name).toBeFocused();
});
