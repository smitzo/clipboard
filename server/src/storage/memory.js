const { createError } = require('../rooms/errors');

function createMemoryRepository({ maxRooms = 1000, maxStorageBytes = 64 * 1024 * 1024 } = {}) {
  const records = new Map();
  const costs = new Map();
  let retainedBytes = 0;
  function set(id, room) {
    const cost = retainedCost(room);
    if ((!records.has(id) && records.size >= maxRooms) || retainedBytes - (costs.get(id) || 0) + cost > maxStorageBytes) {
      const error = createError('Room capacity is temporarily exhausted. Try again shortly.', 503, 'CAPACITY_EXCEEDED');
      error.retryAfter = 1;
      throw error;
    }
    retainedBytes += cost - (costs.get(id) || 0);
    records.set(id, room);
    costs.set(id, cost);
  }
  function remove(id) {
    retainedBytes -= costs.get(id) || 0;
    costs.delete(id);
    return records.delete(id);
  }
  return {
    get: id => records.get(id), has: id => records.has(id), set, delete: remove,
    entries: () => records.entries(),
    stats: () => ({ rooms: records.size, retainedBytes }),
    get size() { return records.size; },
  };
}

function retainedCost(room) {
  // Two bytes per retained string code unit, plus a fixed record/index reserve.
  return 384 + 2 * ['id', 'encryptedText', 'iv', 'authTag'].reduce((sum, key) => sum + room[key].length, 0);
}
module.exports = { createMemoryRepository, retainedCost };
