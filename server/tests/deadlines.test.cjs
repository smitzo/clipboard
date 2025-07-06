const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDeadlineIndex } = require('../src/storage/deadlines');

test('indexed deadlines maintain minimum ordering and never retain replaced or deleted nodes', () => {
 const index = createDeadlineIndex(); const expected = new Map();
 let seed = 41;
 const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
 for (let step = 0; step < 10000; step++) {
  const id = `fixture${random() % 100}`;
  if (random() % 3 === 0) { index.delete(id); expected.delete(id); }
  else { const deadline = random() % 1000; index.set(id, deadline); expected.set(id, deadline); }
  assert.equal(index.size, expected.size);
  assert.equal(index.peek()?.deadline, expected.size ? Math.min(...expected.values()) : undefined);
 }
 while (expected.size) {
  const next = index.peek(); assert.equal(next.deadline, Math.min(...expected.values()));
  index.delete(next.id); expected.delete(next.id);
 }
 assert.equal(index.peek(), undefined); assert.equal(index.size, 0);
});
