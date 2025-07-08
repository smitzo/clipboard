const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { startServer } = require('../src/lifecycle');
test('lifecycle owns one timer and stops idempotently', async () => {
 let scheduled = 0; let cancelled = 0;
 const timer = { unref() {} };
 for (let i = 0; i < 3; i++) {
  const app = createApp(); app.locals.roomService.create('fixture');
  const lifecycle = await startServer({ app, port: 0, host: '127.0.0.1', schedule: () => { scheduled++; return timer; }, cancel: actual => { assert.equal(actual, timer); cancelled++; } });
  const port = lifecycle.server.address().port;
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/health`)).status, 200);
  await Promise.all([lifecycle.stop(), lifecycle.stop()]);
  assert.equal(app.locals.roomService.stats().rooms, 0);
  assert.equal(app.locals.roomService.isReady(), false);
 }
 assert.equal(scheduled, 3); assert.equal(cancelled, 3);
});
