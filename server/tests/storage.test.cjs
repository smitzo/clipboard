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
 service.remove(second.roomId); assert.deepEqual(repository.stats(), { rooms: 0, retainedBytes: 0 });
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
