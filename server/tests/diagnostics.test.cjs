const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config');
const { startServer } = require('../src/lifecycle');

test('diagnostics expose only generated IDs, route templates, status, duration and stable codes', async t => {
 const events = []; const secret = 'private-secret-fixture';
 const app = createApp({ config: loadConfig({ CLIPBOARD_SECRET: secret }), logger: event => events.push(event) });
 const lifecycle = await startServer({ app, port: 0, host: '127.0.0.1' }); t.after(() => lifecycle.stop());
 const origin = `http://127.0.0.1:${lifecycle.server.address().port}`;
 const response = await fetch(`${origin}/api/rooms?private=query`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'injected-request-marker' }, body: JSON.stringify({ text: 'private-content-marker' }) });
 const room = await response.json();
 await (await fetch(`${origin}/api/rooms/${room.roomId}?private=query`)).text();
 await (await fetch(`${origin}/private-raw-path?private=query`)).text();
 await (await fetch(`${origin}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{private-parser-marker' })).text();
 await new Promise(resolve => setImmediate(resolve));
 assert.equal(events.length, 4);
 for (const event of events) {
  assert.deepEqual(Object.keys(event).sort(), ['requestId', 'method', 'route', 'status', 'durationMs', 'code'].sort());
  assert.match(event.requestId, /^[a-f0-9-]{36}$/); assert.ok(event.durationMs >= 0);
 }
 assert.equal(events[1].route, '/api/rooms/:roomId'); assert.equal(events[2].route, 'unmatched');
 assert.equal(events[3].code, 'INVALID_JSON');
 assert.equal(response.headers.get('x-request-id'), events[0].requestId);
 const output = JSON.stringify(events);
 for (const forbidden of [room.roomId, secret, 'private-content-marker', 'private-parser-marker', 'private-raw-path', 'private=query', 'injected-request-marker']) assert.ok(!output.includes(forbidden));
});
