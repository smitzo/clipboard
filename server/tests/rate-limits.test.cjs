const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./support/process.cjs');
const { loadConfig } = require('../src/config');

test('untrusted forwarded addresses cannot bypass the socket-IP request budget', async t => {
 const api = await startApi({ RATE_LIMIT_READ: '2' }); t.after(() => api.stop());
 for (const [index, address] of ['192.0.2.1', '192.0.2.2', '192.0.2.3'].entries()) {
  const response = await api.request('/rooms/ABCDEFGH1234', { headers: { 'X-Forwarded-For': address } });
  assert.equal(response.status, index === 2 ? 429 : 404);
 }
 assert.equal((await api.request('/health')).status, 200);
});

test('explicit proxy networks select client keys and create/read/mutation budgets remain independent', async t => {
 const api = await startApi({ TRUST_PROXY: 'loopback', RATE_LIMIT_CREATE: '1', RATE_LIMIT_READ: '1', RATE_LIMIT_MUTATION: '1' }); t.after(() => api.stop());
 const headers = { 'X-Forwarded-For': '192.0.2.1' };
 assert.equal((await api.request('/rooms', { method: 'POST', headers, body: { text: 'fixture' } })).status, 201);
 assert.equal((await api.request('/rooms', { method: 'POST', headers, body: { text: 'fixture' } })).status, 429);
 assert.equal((await api.request('/rooms/ABCDEFGH1234', { headers })).status, 404);
 assert.equal((await api.request('/rooms/ABCDEFGH1234', { headers })).status, 429);
 assert.equal((await api.request('/rooms/ABCDEFGH1234', { method: 'DELETE', headers })).status, 204);
 assert.equal((await api.request('/rooms/ABCDEFGH1234', { method: 'DELETE', headers })).status, 429);
 assert.equal((await api.request('/rooms/ABCDEFGH1234', { headers: { 'X-Forwarded-For': '192.0.2.2' } })).status, 404);
 for (const value of ['true', '1', '*', '0.0.0.0/0', '::/0', 'invalid', '192.0.2.0/33']) assert.throws(() => loadConfig({ TRUST_PROXY: value }));
});
