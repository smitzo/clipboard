const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRoomService } = require('../src/rooms/service');
const { createMemoryRepository, retainedCost } = require('../src/storage/memory');
const { loadConfig } = require('../src/config');

test('20,000 mixed operations retain live rooms and bounded accounting/index state', () => {
 let now = 0; let seed = 91;
 const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
 const config = loadConfig({ MAX_ROOMS: '64', MAX_STORAGE_BYTES: '65536', CLEANUP_BATCH_SIZE: '8' });
 const repository = createMemoryRepository(config);
 const service = createRoomService({ config, repository, clock: { now: () => now } });
 const expected = new Map();
 for (let i = 0; i < 20000; i++) {
  const operation = random() % 7;
  const ids = [...expected.keys()]; const id = ids[random() % Math.max(1, ids.length)];
  for (const [key, room] of expected) if (room.deadline <= now) expected.delete(key);
  if (operation <= 2) {
   const text = `fixture ${i} α🚲`;
   try { const room = service.create(text, 5); expected.set(room.roomId, { text, deadline: Date.parse(room.expiresAt) }); }
   catch (error) { assert.equal(error.code, 'CAPACITY_EXCEEDED'); }
  } else if (id && expected.has(id)) {
   if (operation === 3) { service.remove(id); expected.delete(id); }
   else if (operation === 4) { const text = `replacement ${i}`; service.update(id, text); expected.get(id).text = text; }
   else assert.equal(service.read(id).text, expected.get(id).text);
  }
  if (operation === 5) now += 10000;
  if (operation === 6) service.cleanupExpiredRooms();
  const usage = repository.stats();
  assert.equal(usage.expiryEntries, usage.rooms);
  assert.ok(usage.rooms <= 64 && usage.retainedBytes <= 65536);
  assert.equal(usage.retainedBytes, [...repository.entries()].reduce((sum, [, room]) => sum + retainedCost(room), 0));
  if (i % 100 === 0) for (const [key, value] of expected) {
   if (value.deadline > now) assert.equal(service.read(key).text, value.text);
  }
 }
 now += 300000;
 while (service.cleanupExpiredRooms().hasMore) { /* Bounded turns eventually catch up. */ }
 assert.deepEqual(repository.stats(), { rooms: 0, retainedBytes: 0, expiryEntries: 0 });
});
