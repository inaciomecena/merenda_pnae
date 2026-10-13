import { test, expect } from '@playwright/test';

const viewports = [
  ['375x812', 375, 812],
  ['390x844', 390, 844],
  ['768x1024', 768, 1024],
  ['1366x768', 1366, 768],
] as const;

for (const [label, width, height] of viewports) {
  test(`login responsivo ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `../../output/e2e/sdd0101-mobile/login-${label}-${test.info().project.name}.png`, fullPage: true });
  });
}
