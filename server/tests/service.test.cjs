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
