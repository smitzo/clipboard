const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMemoryRepository, retainedCost } = require('../src/storage/memory');
const { createRoomService } = require('../src/rooms/service');
const { loadConfig } = require('../src/config');

test('retained encrypted bytes track Unicode replacement and repeated deletion', () => {
 const repository = createMemoryRepository();
 const service = createRoomService({ config: loadConfig({}), repository });
 const first = service.create('🚲α\n'); const second = service.create('fixture');
 function invariant() {
  assert.equal(repository.stats().retainedBytes, [...repository.entries()].reduce((sum, [, room]) => sum + retainedCost(room), 0));
  assert.equal(repository.stats().rooms, repository.size);
 }
 invariant();
 for (const text of ['🚲'.repeat(100), 'tiny', 'α'.repeat(1000)]) {
  service.update(first.roomId, text); invariant();
 }
 const stored = repository.get(first.roomId);
 assert.equal(stored.text, undefined);
 assert.ok(Buffer.from(stored.encryptedText, 'base64').length > stored.charCount);
 service.remove(first.roomId); invariant(); service.remove(first.roomId); invariant();
 service.remove(second.roomId); assert.deepEqual(repository.stats(), { rooms: 0, retainedBytes: 0, expiryEntries: 0 });
});

test('admission reclaims only due records before rejecting a pressured create or update', () => {
 let now = 0;
 const repository = createMemoryRepository({ maxRooms: 2, maxStorageBytes: 1260 });
 const service = createRoomService({ config: loadConfig({}), repository, clock: { now: () => now } });
 const expired = service.create('expires', 5); const live = service.create('live', 10);
 now = Date.parse(expired.expiresAt);
 service.update(live.roomId, 'x'.repeat(100));
 assert.equal(repository.has(expired.roomId), false);
 assert.equal(service.read(live.roomId).text.length, 100);
 const replacement = service.create('new');
 assert.equal(repository.size, 2);
 assert.throws(() => service.create('rejected'), { code: 'CAPACITY_EXCEEDED' });
 assert.equal(service.read(replacement.roomId).text, 'new');
 assert.equal(service.read(live.roomId).revision, 2);
});

test('failed growing replacement preserves ciphertext, revision and accounting at exact capacity', () => {
 const repository = createMemoryRepository({ maxRooms: 1, maxStorageBytes: 600 });
 const service = createRoomService({ config: loadConfig({}), repository });
 const room = service.create('x'.repeat(40));
 const before = { ...repository.get(room.roomId) }; const usage = repository.stats();
 assert.throws(() => service.update(room.roomId, 'y'.repeat(100)), { code: 'CAPACITY_EXCEEDED' });
 assert.deepEqual(repository.get(room.roomId), before);
 assert.deepEqual(repository.stats(), usage);
 assert.equal(service.read(room.roomId).text, 'x'.repeat(40));
 const smaller = service.update(room.roomId, 'tiny', '"1"');
 assert.equal(smaller.revision, 2); assert.equal(smaller.expiresAt, room.expiresAt);
 assert.ok(repository.stats().retainedBytes < usage.retainedBytes);
 const exact = createMemoryRepository({ maxStorageBytes: repository.stats().retainedBytes });
 exact.set(room.roomId, repository.get(room.roomId));
 assert.equal(exact.size, 1);
});

test('count and byte admission reject creation without evicting live rooms', () => {
 for (const env of [{ MAX_ROOMS: '1' }, { MAX_STORAGE_BYTES: '600' }]) {
  const service = createRoomService({ config: loadConfig(env) });
  const first = service.create('fixture');
  assert.throws(() => service.create('second'), { status: 503, code: 'CAPACITY_EXCEEDED', retryAfter: 1 });
  assert.equal(service.read(first.roomId).text, 'fixture');
  service.remove(first.roomId); assert.ok(service.create('replacement'));
 }
});
