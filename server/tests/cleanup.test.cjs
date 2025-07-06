const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCleanupRunner } = require('../src/storage/cleanup');
const { createRoomService } = require('../src/rooms/service');
const { createMemoryRepository } = require('../src/storage/memory');
const { loadConfig } = require('../src/config');

test('mass expiry yields after each bounded batch and eventually reclaims all records', () => {
 let now = 0;
 const config = loadConfig({ CLEANUP_BATCH_SIZE: '7' });
 const repository = createMemoryRepository(config);
 const service = createRoomService({ config, repository, clock: { now: () => now } });
 for (let i = 0; i < 100; i++) service.create('fixture', 5);
 now = 300000;
 const deferred = [];
 const runner = createCleanupRunner(service.cleanupExpiredRooms, { defer: fn => { deferred.push(fn); return fn; } });
 runner.run(); assert.equal(repository.size, 93); assert.equal(deferred.length, 1);
 runner.run(); assert.equal(repository.size, 93);
 let turns = 0;
 while (deferred.length) { const before = repository.size; deferred.shift()(); assert.ok(before - repository.size <= 7); turns++; }
 assert.equal(turns, 14); assert.equal(repository.stats().retainedBytes, 0);
 assert.equal(repository.stats().expiryEntries, 0);
 runner.dispose();
});
