import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('measure maximum-text input-to-paint baseline', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByLabel('Text to share');
  await editor.fill('x'.repeat(19960));
  await page.evaluate(() => {
    window.__clipboardTimings = [];
    document.querySelector('textarea').addEventListener('input', () => {
      const start = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => window.__clipboardTimings.push(performance.now() - start)));
    });
  });
  await editor.focus();
  for (let index = 0; index < 20; index++) { await page.keyboard.insertText('y'); await page.waitForTimeout(40); }
  const timings = await page.evaluate(() => window.__clipboardTimings.sort((a, b) => a - b));
  expect(timings.length).toBe(20);
  const report = { fixture: '19960 code units plus 20 insertions', mode: 'development UI; two-animation-frame proxy, not field INP', samples: timings.length,
    p50Ms: timings[10], p95Ms: timings[18], browser: await page.evaluate(() => navigator.userAgent) };
  await mkdir('artifacts/performance', { recursive: true });
  await writeFile('artifacts/performance/browser.json', JSON.stringify(report, null, 2));
});
