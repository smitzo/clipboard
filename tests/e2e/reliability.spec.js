import { test, expect } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:15080/api';

test('two contexts resolve conflicts, protect dirty switches and reconcile back/forward', async ({ browser, request }) => {
  const firstRoom = await (await request.post(`${apiUrl}/rooms`, { data: { text: 'initial generic fixture' } })).json();
  const secondRoom = await (await request.post(`${apiUrl}/rooms`, { data: { text: 'second room fixture' } })).json();
  const first = await browser.newContext(); const second = await browser.newContext();
  try {
    const a = await first.newPage(); const b = await second.newPage();
    const url = `http://127.0.0.1:15173/?room=${firstRoom.roomId}`;
    await a.goto(url); await b.goto(url);
    await expect(a.getByLabel('Text to share')).toHaveValue('initial generic fixture');
    await expect(b.getByLabel('Text to share')).toHaveValue('initial generic fixture');
    await a.getByLabel('Text to share').fill('local draft fixture');
    await b.getByLabel('Text to share').fill('remote saved fixture');
    await b.getByRole('button', { name: 'Update room', exact: true }).click();
    await expect(b.getByRole('status')).toContainText('Room text updated');
    await a.getByRole('button', { name: 'Update room', exact: true }).click();
    await expect(a.getByText('Someone saved a newer revision. Your draft is unchanged.')).toBeVisible();
    await expect(a.getByLabel('Text to share')).toHaveValue('local draft fixture');
    await a.getByRole('button', { name: 'Keep draft with latest revision' }).click();
    await expect(a.getByText('Someone saved a newer revision. Your draft is unchanged.')).not.toBeVisible();
    await a.getByRole('button', { name: 'Update room', exact: true }).click();
    await expect.poll(async () => (await (await request.get(`${apiUrl}/rooms/${firstRoom.roomId}`)).json()).text).toBe('local draft fixture');
    await a.getByLabel('Text to share').fill('unsaved switching fixture');
    await a.getByLabel('Room ID or link').fill(secondRoom.roomId);
    await a.getByRole('button', { name: 'Join', exact: true }).click();
    await a.getByRole('button', { name: 'Stay here' }).click();
    await expect(a.getByLabel('Text to share')).toHaveValue('unsaved switching fixture');
    await a.getByRole('button', { name: 'Join', exact: true }).click();
    await a.getByRole('button', { name: 'Discard and join' }).click();
    await expect(a.getByLabel('Text to share')).toHaveValue('second room fixture');
    await a.evaluate(id => {
      window.history.pushState(null, '', `?room=${id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, firstRoom.roomId);
    await expect(a.getByLabel('Text to share')).toHaveValue('local draft fixture');
    await a.goBack(); await expect(a.getByLabel('Text to share')).toHaveValue('second room fixture');
    await a.goForward(); await expect(a.getByLabel('Text to share')).toHaveValue('local draft fixture');
  } finally { await first.close(); await second.close(); }
});

test('a failed read exposes deliberate recovery without replaying a mutation', async ({ page, request }) => {
  const room = await (await request.post(`${apiUrl}/rooms`, { data: { text: 'recovered generic fixture' } })).json();
  let reads = 0;
  await page.route(`${apiUrl}/rooms/${room.roomId}`, route => {
    reads++;
    return reads === 1 ? route.abort('failed') : route.continue();
  });
  await page.goto(`/?room=${room.roomId}`);
  await expect(page.getByRole('button', { name: 'Retry join' })).toBeEnabled();
  expect(reads).toBe(1);
  await page.getByRole('button', { name: 'Retry join' }).click();
  await expect(page.getByLabel('Text to share')).toHaveValue('recovered generic fixture');
  expect(reads).toBe(2);
});
