const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRoomService } = require('../src/rooms/service');
const { loadConfig } = require('../src/config');
test('injected time and IDs make expiry deterministic', () => {
 let now = 1000000;
 const service = createRoomService({ config: loadConfig({ CLIPBOARD_SECRET: 'test' }), clock: { now: () => now }, generateId: () => 'ABCDEFGH1234' });
 const room = service.create('fixture', 5); assert.equal(room.roomId, 'ABCDEFGH1234');
 now += 299999; assert.equal(service.read(room.roomId).text, 'fixture');
 now += 2; assert.throws(() => service.read(room.roomId), /not found or has expired/);
});

test('TTL defaults only when omitted and explicit lifetimes require integer bounds', () => {
 const config = loadConfig({ CLIPBOARD_SECRET: 'test' });
 const service = createRoomService({ config });
 for (const value of [null, '60', 'invalid', NaN, Infinity, 0, -1, 4, 1441, 5.1, true]) {
  assert.throws(() => service.create('fixture', value), { status: 400 });
 }
 for (const value of [undefined, 5, 1440]) {
  const room = service.create('fixture', value);
  assert.equal(Date.parse(room.expiresAt) - Date.parse(room.createdAt), (value ?? 60) * 60000);
 }
});
