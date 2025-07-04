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

test('optional strong ETags reject stale updates atomically and legacy clients still save', async t => {
 const api = await startApi(); t.after(() => api.stop());
 const initial = await api.request('/rooms', { method: 'POST', body: { text: 'initial' } });
 assert.equal(initial.headers.get('etag'), '"1"');
 const route = `/rooms/${initial.data.roomId}`;
 const update = await api.request(route, { method: 'PUT', headers: { 'If-Match': '"1"' }, body: { text: 'new' } });
 assert.equal(update.data.revision, 2); assert.equal(update.headers.get('etag'), '"2"');
 const stale = await api.request(route, { method: 'PUT', headers: { 'If-Match': '"1"' }, body: { text: 'lost' } });
 assert.equal(stale.status, 412); assert.equal(stale.data.code, 'REVISION_CONFLICT');
 assert.equal((await api.request(route)).data.text, 'new');
 assert.equal((await api.request(route)).data.expiresAt, initial.data.expiresAt);
 assert.equal((await api.request(route, { method: 'PUT', headers: { 'If-Match': 'W/"2"' }, body: { text: 'invalid' } })).status, 400);
 assert.equal((await api.request(route, { method: 'PUT', headers: { 'If-Match': '"1", "2"' }, body: { text: 'list' } })).status, 200);
 const legacy = await api.request(route, { method: 'PUT', body: { text: 'legacy' } });
 assert.equal(legacy.status, 200); assert.equal(legacy.data.revision, 4);
 assert.equal((await api.request(route, { method: 'PUT', headers: { 'If-Match': '*' }, body: { text: 'exists' } })).status, 200);
});
