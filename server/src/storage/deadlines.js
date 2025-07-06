// Indexed min-heap: exactly one node per retained room, including replacements.
function createDeadlineIndex() {
  const heap = [];
  const positions = new Map();
  function swap(a, b) {
    [heap[a], heap[b]] = [heap[b], heap[a]];
    positions.set(heap[a].id, a); positions.set(heap[b].id, b);
  }
  function up(index) {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (heap[parent].deadline <= heap[index].deadline) break;
      swap(index, parent); index = parent;
    }
    return index;
  }
  function down(index) {
    while (index * 2 + 1 < heap.length) {
      let child = index * 2 + 1;
      if (child + 1 < heap.length && heap[child + 1].deadline < heap[child].deadline) child++;
      if (heap[index].deadline <= heap[child].deadline) break;
      swap(index, child); index = child;
    }
  }
  function remove(id) {
    const index = positions.get(id);
    if (index === undefined) return;
    const last = heap.pop(); positions.delete(id);
    if (index < heap.length) {
      heap[index] = last; positions.set(last.id, index);
      down(up(index));
    }
  }
  function set(id, deadline) {
    remove(id);
    positions.set(id, heap.length); heap.push({ id, deadline }); up(heap.length - 1);
  }
  return { set, delete: remove, peek: () => heap[0], clear() { heap.length = 0; positions.clear(); }, get size() { return heap.length; } };
}
module.exports = { createDeadlineIndex };
