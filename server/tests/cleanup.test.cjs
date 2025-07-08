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

test('disposal cancels queued work and releases retained rooms and index state', () => {
 const config = loadConfig({ CLEANUP_BATCH_SIZE: '1' });
 const repository = createMemoryRepository(config);
 let now = 0; const service = createRoomService({ config, repository, clock: { now: () => now } });
 service.create('first', 5); service.create('second', 5); now = 300000;
 let callback; let cancelled = 0;
 const runner = createCleanupRunner(service.cleanupExpiredRooms, { defer: fn => { callback = fn; return fn; }, cancel: fn => { assert.equal(fn, callback); cancelled++; } });
 runner.run(); assert.equal(repository.size, 1);
 runner.dispose(); runner.dispose(); service.dispose(); service.dispose(); callback();
 assert.equal(cancelled, 1); assert.equal(service.isReady(), false);
 assert.deepEqual(repository.stats(), { rooms: 0, retainedBytes: 0, expiryEntries: 0 });
 assert.throws(() => service.create('late'), /disposed/);
 assert.deepEqual(service.cleanupExpiredRooms(), { removed: 0, hasMore: false });
});
