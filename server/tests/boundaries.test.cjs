const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./support/process.cjs');

test('invalid IDs, empty input, oversized text and absent rooms are bounded', async t => {
  const api = await startApi({ MAX_TEXT_CHARS: '40' }); t.after(() => api.stop());
  assert.equal((await api.request('/rooms/short')).status, 400);
  assert.equal((await api.request('/rooms/ABCDEFGH1234')).status, 404);
  for (const text of ['', '   \n', 12, null]) {
    assert.equal((await api.request('/rooms', { method: 'POST', body: { text } })).status, 400);
  }
  assert.equal((await api.request('/rooms', { method: 'POST', body: { text: 'x'.repeat(41) } })).status, 413);
});

test('baseline quirks are characterized before intentional corrections', async t => {
  const api = await startApi(); t.after(() => api.stop());
  const created = await api.request('/rooms', { method: 'POST', body: { text: 'fixture \n', ttlMinutes: 'invalid' } });
  assert.equal(created.status, 201);
  assert.equal((await api.request(`/rooms/${created.data.roomId}`)).data.text, 'fixture');
  assert.equal(Date.parse(created.data.expiresAt) - Date.parse(created.data.createdAt), 60 * 60000);
  // These are documented defects, not the desired contract. Phase 3 changes them.
  assert.equal((await api.request('/rooms', { method: 'POST' })).status, 500);
  assert.equal((await api.request('/rooms', { method: 'POST', body: null })).status, 400);
  assert.equal((await api.request('/health', { headers: { Origin: 'https://untrusted.invalid' } })).status, 500);
});
