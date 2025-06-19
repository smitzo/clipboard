import { test, expect } from '@playwright/test';

test('independent devices create, join, update and delete a room', async ({ browser }) => {
  const sender = await browser.newContext();
  const receiver = await browser.newContext();
  try {
    const first = await sender.newPage();
    await first.goto('/');
    await first.getByLabel('Text to share').fill('generic cross-device fixture');
    await first.getByRole('button', { name: 'Create room' }).click();
    await expect(first.getByRole('button', { name: 'Update room' })).toBeVisible();
    const link = first.url();
    const second = await receiver.newPage();
    await second.goto(link);
    await expect(second.getByLabel('Text to share')).toHaveValue('generic cross-device fixture');
    await second.getByLabel('Text to share').fill('updated generic fixture');
    await second.getByRole('button', { name: 'Update room' }).click();
    await expect(second.getByText('Room text updated.', { exact: true })).toBeVisible();
    await first.reload();
    await expect(first.getByLabel('Text to share')).toHaveValue('updated generic fixture');
    await second.getByRole('button', { name: 'Delete room' }).click();
    await expect(second.getByRole('button', { name: 'Create room' })).toBeVisible();
    await first.reload();
    await expect(first.getByRole('alert')).toContainText('not found or has expired');
  } finally { await sender.close(); await receiver.close(); }
});
