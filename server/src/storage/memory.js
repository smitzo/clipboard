function createMemoryRepository() {
 const records = new Map();
 return { get: id => records.get(id), has: id => records.has(id), set: (id, room) => records.set(id, room), delete: id => records.delete(id), entries: () => records.entries(), get size() { return records.size; } };
}
module.exports = { createMemoryRepository };
