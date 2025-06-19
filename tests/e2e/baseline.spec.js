import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`baseline layout and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByLabel('Text to share')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    const results = await new AxeBuilder({ page }).analyze();
    await mkdir('artifacts/baseline', { recursive: true });
    await page.screenshot({ path: `artifacts/baseline/${width}.png`, fullPage: true });
    await writeFile(`artifacts/baseline/${width}.json`, JSON.stringify({ width, overflow,
      violations: results.violations.map(({ id, impact, nodes }) => ({ id, impact, count: nodes.length })),
    }, null, 2));
    // Findings are evidence, not a false claim that the baseline is accessible.
    expect(results.incomplete).toBeInstanceOf(Array);
  });
}
