import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function pickerReady(page) {
  await page.goto('/#contact');
  const select = page.getByRole('combobox', { name: 'Inquiry type', exact: true });
  await expect(select).toBeVisible();
  return select;
}

for (const width of [320, 1440]) {
  test(`native CSS picker opens, fits, selects, and restores keyboard focus at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const select = await pickerReady(page);
    const supported = await page.evaluate(() => CSS.supports('appearance', 'base-select') && CSS.supports('selector(select::picker(select))'));
    test.skip(!supported, 'This browser uses the standard native-select fallback.');
    await expect(select).toHaveCSS('appearance', 'base-select');
    expect(await select.evaluate((node) => getComputedStyle(node, '::picker(select)').appearance)).toBe('base-select');

    await select.focus();
    await select.press('Space');
    await expect(select).toHaveJSProperty('value', 'website');
    await expect.poll(() => select.evaluate((node) => node.matches(':open'))).toBeTruthy();
    const bounds = await select.locator('option').evaluateAll((options) => options.map((option) => {
      const { left, right, top, bottom } = option.getBoundingClientRect();
      return { left, right, top, bottom };
    }));
    for (const boundsOfOption of bounds) {
      expect(boundsOfOption.left).toBeGreaterThanOrEqual(0);
      expect(boundsOfOption.right).toBeLessThanOrEqual(width);
      expect(boundsOfOption.top).toBeGreaterThanOrEqual(0);
      expect(boundsOfOption.bottom).toBeLessThanOrEqual(900);
    }
    const axe = await new AxeBuilder({ page }).include('#contact').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(axe.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`native-picker-${width}.png`) });
    // The open native picker focuses an option. Do not refocus the select itself.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(select).toHaveValue('studio');
    await expect(select).toBeFocused();
    expect(await select.evaluate((node) => new FormData(node.form).get('category'))).toBe('studio');

    await select.click();
    await expect.poll(() => select.evaluate((node) => node.matches(':open'))).toBeTruthy();
    await page.keyboard.press('Escape');
    await expect(select).toBeFocused();
    await expect(select).toHaveValue('studio');
    await expect.poll(() => select.evaluate((node) => node.matches(':open'))).toBeFalsy();
  });
}

test('without the enhancement block, the original native select still works and submits its value', async ({ page }) => {
  const select = await pickerReady(page);
  // This is the same CSS path an unsupported browser takes: no @supports block.
  await page.evaluate(() => {
    function removeEnhancement(container) {
      for (let index = container.cssRules.length - 1; index >= 0; index--) {
        const rule = container.cssRules[index];
        if (rule.type === CSSRule.SUPPORTS_RULE && rule.conditionText.includes('base-select')) {
          container.deleteRule(index);
        } else if (rule.cssRules) removeEnhancement(rule);
      }
    }
    for (const sheet of document.styleSheets) {
      try { removeEnhancement(sheet); } catch { /* Cross-origin font CSS is irrelevant. */ }
    }
  });
  await expect(select).not.toHaveCSS('appearance', 'base-select');
  await select.focus();
  await select.press('End');
  await expect(select).toHaveValue('other');
  await select.press('Home');
  await expect(select).toHaveValue('website');
  await select.press('ArrowDown');
  await expect(select).toHaveValue('studio');
  expect(await select.evaluate((node) => new FormData(node.form).get('category'))).toBe('studio');
  await select.selectOption('collaboration');
  await expect(select).toHaveValue('collaboration');
});

test('native picker remains usable in forced colors without adding animations', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const select = await pickerReady(page);
  await select.selectOption('press');
  await expect(select).toHaveValue('press');
  await expect(select).toHaveCSS('forced-color-adjust', 'auto');
  await select.click();
  if (await page.evaluate(() => CSS.supports('appearance', 'base-select'))) {
    await expect.poll(() => select.evaluate((node) => node.matches(':open'))).toBeTruthy();
    expect(await select.evaluate((node) => getComputedStyle(node, '::picker(select)').boxShadow)).toBe('none');
  }
  await page.keyboard.press('Escape');
  await expect(select).toBeFocused();
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
});
