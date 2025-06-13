const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./support/process.cjs');

test('independent API processes expose health and own isolated stores', async t => {
  const first = await startApi(); t.after(() => first.stop());
  const second = await startApi(); t.after(() => second.stop());
  assert.notEqual(first.origin, second.origin);
  const created = await first.request('/rooms', { method: 'POST', body: { text: 'generic fixture' } });
  assert.equal(created.status, 201);
  assert.equal((await second.request(`/rooms/${created.data.roomId}`)).status, 404);
  await first.stop();
  await assert.rejects(fetch(`${first.origin}/api/health`));
  assert.equal((await second.request('/health')).status, 200);
});
