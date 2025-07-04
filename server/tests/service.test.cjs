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

test('read, update and cleanup agree at the exact absolute expiry deadline', () => {
 const { createMemoryRepository } = require('../src/storage/memory');
 for (const delta of [-1, 0, 1]) {
  let now = 1000000;
  const repository = createMemoryRepository();
  const service = createRoomService({ config: loadConfig({}), repository, clock: { now: () => now } });
  const first = service.create('first', 5); const second = service.create('second', 5);
  now += 100;
  const updated = service.update(first.roomId, 'changed');
  assert.equal(updated.expiresAt, first.expiresAt);
  now = Date.parse(first.expiresAt) + delta;
  if (delta < 0) {
   assert.equal(service.read(first.roomId).text, 'changed');
   assert.equal(service.update(second.roomId, 'live').expiresAt, second.expiresAt);
   service.cleanupExpiredRooms(); assert.equal(repository.size, 2);
  } else {
   assert.throws(() => service.read(first.roomId), { status: 404 });
   assert.throws(() => service.update(second.roomId, 'late'), { status: 404 });
   assert.equal(repository.size, 0);
  }
  const third = service.create('cleanup', 5);
  now = Date.parse(third.expiresAt);
  service.cleanupExpiredRooms(); assert.equal(repository.size, 0);
 }
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
