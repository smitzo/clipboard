const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
test('app construction has no listener or scheduler and isolates stores', () => {
  const first = createApp(); const second = createApp();
  assert.notEqual(first, second);
  assert.equal(typeof first.locals.cleanupExpiredRooms, 'function');
  assert.equal(first.locals.server, undefined);
});
