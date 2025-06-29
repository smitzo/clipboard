const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./support/process.cjs');

test('create/read/update/delete preserves metadata and absolute expiry', async t => {
  const api = await startApi(); t.after(() => api.stop());
  const created = await api.request('/rooms', { method: 'POST', body: { text: 'fixture α 🚲', ttlMinutes: 15 } });
  assert.equal(created.status, 201);
  assert.match(created.data.roomId, /^[A-Za-z0-9]{12}$/);
  for (const key of ['createdAt', 'updatedAt', 'expiresAt']) assert.ok(Number.isFinite(Date.parse(created.data[key])));
  assert.equal(created.data.charCount, 'fixture α 🚲'.length);
  assert.equal(created.data.text, undefined);
  const route = `/rooms/${created.data.roomId}`;
  const read = await api.request(route);
  assert.equal(read.data.text, 'fixture α 🚲');
  assert.equal(read.data.encryptedText, undefined);
  const updated = await api.request(route, { method: 'PUT', body: { text: 'changed generic fixture' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.createdAt, created.data.createdAt);
  assert.equal(updated.data.expiresAt, created.data.expiresAt);
  assert.ok(Date.parse(updated.data.updatedAt) >= Date.parse(created.data.updatedAt));
  assert.equal((await api.request(route)).data.text, 'changed generic fixture');
  assert.equal((await api.request(route, { method: 'DELETE' })).status, 204);
  assert.equal((await api.request(route)).status, 404);
  assert.equal((await api.request(route, { method: 'DELETE' })).status, 204);
});

test('accepted text retains trailing whitespace, Unicode and code-unit length on create and update', async t => {
  const api = await startApi(); t.after(() => api.stop());
  const text = '  α 🚲\t\n  \r\n';
  const room = await api.request('/rooms', { method: 'POST', body: { text } });
  assert.equal(room.data.charCount, text.length);
  const route = `/rooms/${room.data.roomId}`;
  assert.equal((await api.request(route)).data.text, text);
  const changed = text + '\n';
  const update = await api.request(route, { method: 'PUT', body: { text: changed } });
  assert.equal(update.data.charCount, changed.length);
  assert.equal((await api.request(route)).data.text, changed);
});
