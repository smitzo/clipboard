const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const { startServer } = require('../src/lifecycle');

test('readiness reflects initialization, dependency failure and drain while liveness stays simple', async t => {
 let healthy = true;
 const app = createApp({ dependencyReady: () => { if (!healthy) throw new Error('private dependency detail'); return true; } });
 const server = http.createServer(app); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 t.after(() => { app.locals.dispose(); return new Promise(resolve => server.close(resolve)); });
 const origin = `http://127.0.0.1:${server.address().port}/api`;
 assert.equal((await fetch(`${origin}/ready`)).status, 503);
 app.locals.health.markReady(); assert.equal((await fetch(`${origin}/ready`)).status, 200);
 healthy = false;
 const failed = await fetch(`${origin}/ready`); assert.equal(failed.status, 503);
 assert.deepEqual(await failed.json(), { ok: false, code: 'NOT_READY', message: 'Service is not ready.' });
 healthy = true; app.locals.health.beginDrain(); app.locals.health.markReady();
 assert.equal((await fetch(`${origin}/ready`)).status, 503);
 assert.deepEqual(await (await fetch(`${origin}/live`)).json(), { ok: true });
});

test('lifecycle publishes readiness only after startup ownership is established', async t => {
 const app = createApp(); assert.equal(app.locals.health.ready(), false);
 const lifecycle = await startServer({ app, port: 0 }); t.after(() => lifecycle.stop());
 assert.equal(app.locals.health.ready(), true);
 await lifecycle.stop(); assert.equal(app.locals.health.ready(), false);
});
