const { createError } = require('../rooms/errors');
const { createDeadlineIndex } = require('./deadlines');

function createMemoryRepository({ maxRooms = 1000, maxStorageBytes = 64 * 1024 * 1024, cleanupBatchSize = 256 } = {}) {
  const records = new Map();
  const costs = new Map();
  const deadlines = createDeadlineIndex();
  let retainedBytes = 0;
  let disposed = false;
  function set(id, room, now = Date.now()) {
    if (disposed) throw new Error('Repository is disposed.');
    const cost = retainedCost(room);
    if ((!records.has(id) && records.size >= maxRooms) || retainedBytes - (costs.get(id) || 0) + cost > maxStorageBytes) {
      reclaimDue(now, cleanupBatchSize);
    }
    if ((!records.has(id) && records.size >= maxRooms) || retainedBytes - (costs.get(id) || 0) + cost > maxStorageBytes) {
      const error = createError('Room capacity is temporarily exhausted. Try again shortly.', 503, 'CAPACITY_EXCEEDED');
      error.retryAfter = 1;
      throw error;
    }
    retainedBytes += cost - (costs.get(id) || 0);
    records.set(id, room);
    costs.set(id, cost);
    deadlines.set(id, room.expiresAt);
  }
  function remove(id) {
    retainedBytes -= costs.get(id) || 0;
    costs.delete(id);
    deadlines.delete(id);
    return records.delete(id);
  }
  function reclaimDue(now, limit = Infinity) {
    let removed = 0;
    while (removed < limit && deadlines.peek()?.deadline <= now) {
      remove(deadlines.peek().id); removed++;
    }
    return { removed, hasMore: Boolean(deadlines.peek()?.deadline <= now) };
  }
  return {
    get: id => records.get(id), has: id => records.has(id), set, delete: remove,
    entries: () => records.entries(),
    reclaimDue,
    dispose() { disposed = true; records.clear(); costs.clear(); deadlines.clear(); retainedBytes = 0; },
    stats: () => ({ rooms: records.size, retainedBytes, expiryEntries: deadlines.size }),
    get size() { return records.size; },
  };
}

function retainedCost(room) {
  // Two bytes per retained string code unit, plus a fixed record/index reserve.
  return 384 + 2 * ['id', 'encryptedText', 'iv', 'authTag'].reduce((sum, key) => sum + room[key].length, 0);
}
module.exports = { createMemoryRepository, retainedCost };
