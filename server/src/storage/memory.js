function createMemoryRepository() {
  const records = new Map();
  const costs = new Map();
  let retainedBytes = 0;
  function set(id, room) {
    const cost = retainedCost(room);
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
