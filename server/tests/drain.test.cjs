const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const { once } = require('node:events');
const { createApp } = require('../src/app');
const { startServer } = require('../src/lifecycle');

test('in-flight work completes while draining refuses new room work', async () => {
 const app = createApp();
 let release; let started;
 const entered = new Promise(resolve => { started = resolve; });
 const original = app.locals.cleanupExpiredRooms;
 // A controlled dependency pauses the request before normal app handling.
 const proxy = (req, res) => { started(); release = () => app(req, res); };
 proxy.locals = app.locals;
 const lifecycle = await startServer({ app: proxy, port: 0, host: '127.0.0.1', drainTimeoutMs: 1000 });
 const response = new Promise((resolve, reject) => {
  http.get(`http://127.0.0.1:${lifecycle.server.address().port}/api/rooms/ABCDEFGH1234`, res => {
   let data = ''; res.on('data', chunk => { data += chunk; }); res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
  }).on('error', reject);
 });
 await entered;
 const stopping = lifecycle.stop(); assert.equal(app.locals.health.ready(), false);
 assert.equal(app.locals.roomService.isReady(), true);
 release(); const result = await response;
 assert.equal(result.status, 503); assert.equal(result.data.code, 'SERVICE_UNAVAILABLE');
 await stopping; assert.equal(app.locals.roomService.isReady(), false);
 assert.deepEqual(original(), { removed: 0, hasMore: false });
});

test('already accepted responses finish before disposal', async () => {
 const app = createApp(); let finish; let started;
 const entered = new Promise(resolve => { started = resolve; });
 const proxy = (req, res) => { started(); finish = () => res.end('completed'); }; proxy.locals = app.locals;
 const lifecycle = await startServer({ app: proxy, port: 0, host: '127.0.0.1', drainTimeoutMs: 1000 });
 const response = fetch(`http://127.0.0.1:${lifecycle.server.address().port}`);
 await entered; const stopping = lifecycle.stop();
 assert.equal(app.locals.roomService.isReady(), true); finish();
 assert.equal(await (await response).text(), 'completed'); await stopping;
 assert.equal(app.locals.roomService.isReady(), false);
});

test('shutdown deadline destroys incomplete sockets and startup failures dispose dependencies', async () => {
 const app = createApp(); const lifecycle = await startServer({ app, port: 0, host: '127.0.0.1', drainTimeoutMs: 30 });
 const socket = net.connect(lifecycle.server.address().port, '127.0.0.1'); await once(socket, 'connect');
 socket.resume();
 const requested = once(lifecycle.server, 'request');
 socket.write('POST /api/rooms HTTP/1.1\r\nHost: fixture\r\nContent-Length: 100\r\nContent-Type: application/json\r\n\r\n{');
 await requested;
 const closed = once(socket, 'close');
 const start = performance.now(); await lifecycle.stop(); await closed;
 assert.ok(performance.now() - start >= 15); assert.ok(performance.now() - start < 1000);
 assert.equal(app.locals.roomService.isReady(), false);
 const conflict = createApp();
 const held = await startServer({ app: createApp(), port: 0, host: '127.0.0.1' });
 try { await assert.rejects(startServer({ app: conflict, port: held.server.address().port, host: '127.0.0.1' }), { code: 'EADDRINUSE' }); }
 finally { await held.stop(); }
 assert.equal(conflict.locals.roomService.isReady(), false);
});
