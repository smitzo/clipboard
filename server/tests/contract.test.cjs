const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./support/process.cjs');

test('capabilities expose only client-safe limits and health retains legacy keys', async t => {
 const api = await startApi({ MIN_TTL_MINUTES: '10', DEFAULT_TTL_MINUTES: '30', MAX_TTL_MINUTES: '90', MAX_TEXT_CHARS: '100' });
 t.after(() => api.stop());
 const limits = { minTtlMinutes: 10, defaultTtlMinutes: 30, maxTtlMinutes: 90, maxTextChars: 100 };
 assert.deepEqual((await api.request('/capabilities')).data, limits);
 assert.deepEqual((await api.request('/health')).data, { ok: true, rooms: 0, ...limits });
 for (const ttlMinutes of [10, 90]) assert.equal((await api.request('/rooms', { method: 'POST', body: { text: 'fixture', ttlMinutes } })).status, 201);
 assert.equal((await api.request('/rooms', { method: 'POST', body: { text: 'fixture', ttlMinutes: 9 } })).status, 400);
});
