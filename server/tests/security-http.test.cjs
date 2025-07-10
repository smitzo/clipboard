const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./support/process.cjs');

test('room success, failure and capability responses prohibit caches including conditional reads', async t => {
 const api = await startApi(); t.after(() => api.stop());
 const created = await api.request('/rooms', { method: 'POST', body: { text: 'fixture' } });
 const route = `/rooms/${created.data.roomId}`;
 const responses = [created, await api.request(route), await api.request('/rooms/ABCDEFGH1234'),
  await api.request('/rooms/short'), await api.request('/capabilities'),
  await api.request(route, { headers: { 'If-None-Match': '"1"' } }),
  await api.request(route, { method: 'PUT', headers: { 'If-Match': '"2"' }, body: { text: 'stale' } }),
  await api.request(route, { method: 'DELETE' })];
 for (const response of responses) assert.equal(response.headers.get('cache-control'), 'no-store');
 assert.equal(responses[5].status, 200); assert.equal(responses[5].data.text, 'fixture');
 assert.equal(responses[6].status, 412);
});
