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

test('origin policy allows exact configured origins and deliberate preflight without treating CORS as auth', async t => {
 const api = await startApi(); t.after(() => api.stop());
 const origin = 'http://localhost:5173';
 for (const route of ['/health', '/capabilities', '/rooms/ABCDEFGH1234']) {
  const allowed = await api.request(route, { headers: { Origin: origin } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
  for (const deniedOrigin of ['https://untrusted.invalid', 'null', 'http://localhost:5173.attacker.invalid']) {
   const denied = await api.request(route, { headers: { Origin: deniedOrigin } });
   assert.equal(denied.status, 403); assert.equal(denied.data.code, 'ORIGIN_DENIED');
   assert.equal(denied.headers.get('access-control-allow-origin'), null);
  }
 }
 const preflight = await api.request('/rooms/ABCDEFGH1234', { method: 'OPTIONS', headers: {
  Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type,if-match',
 } });
 assert.equal(preflight.status, 204);
 assert.match(preflight.headers.get('access-control-allow-headers'), /If-Match/i);
 assert.equal((await api.request('/health')).status, 200);
 const { loadConfig } = require('../src/config');
 for (const value of ['*', 'null', '', 'https://example.invalid/path', 'https://user:password@example.invalid']) {
  assert.throws(() => loadConfig({ CORS_ORIGIN: value }), /Invalid configuration: CORS_ORIGIN/);
 }
});
