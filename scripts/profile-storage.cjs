const { performance } = require('node:perf_hooks');
const { setImmediate: yieldTurn } = require('node:timers/promises');
const { createRoomService } = require('../server/src/rooms/service');
const { createMemoryRepository } = require('../server/src/storage/memory');
const { loadConfig } = require('../server/src/config');

async function profile(glyph) {
  global.gc?.();
  const baseline = process.memoryUsage();
  let now = 0;
  const config = loadConfig({});
  const repository = createMemoryRepository(config);
  const service = createRoomService({ config, repository, clock: { now: () => now } });
  let rejected = false;
  while (!rejected) {
    try { service.create(glyph.repeat(20000), 5); }
    catch (error) { if (error.code !== 'CAPACITY_EXCEEDED') throw error; rejected = true; }
  }
  global.gc?.();
  const full = process.memoryUsage();
  const usage = repository.stats();
  now = 300000;
  const batches = [];
  let result;
  do {
    const start = performance.now(); result = service.cleanupExpiredRooms();
    batches.push({ removed: result.removed, durationMs: performance.now() - start });
    await yieldTurn();
  } while (result.hasMore);
  service.dispose(); global.gc?.();
  const released = process.memoryUsage();
  return { payload: glyph === 'x' ? 'ASCII' : 'three-byte Unicode', codeUnits: 20000,
    baseline, full, released, usage, batches, after: repository.stats() };
}

(async () => {
  const report = { runtime: process.version, platform: process.platform,
    cpu: require('node:os').cpus()[0]?.model, gcExposed: Boolean(global.gc),
    profiles: [await profile('x'), await profile('界')] };
  const fs = require('node:fs'); fs.mkdirSync('artifacts/performance', { recursive: true });
  fs.writeFileSync('artifacts/performance/storage.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
