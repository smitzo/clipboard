const { test } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('./support/process.cjs');

test('invalid IDs, empty input, oversized text and absent rooms are bounded', async t => {
  const api = await startApi({ MAX_TEXT_CHARS: '40' }); t.after(() => api.stop());
  assert.equal((await api.request('/rooms/short')).status, 400);
  assert.equal((await api.request('/rooms/ABCDEFGH1234')).status, 404);
  for (const text of ['', '   \n', 12, null]) {
    assert.equal((await api.request('/rooms', { method: 'POST', body: { text } })).status, 400);
  }
  assert.equal((await api.request('/rooms', { method: 'POST', body: { text: 'x'.repeat(41) } })).status, 413);
});

test('IDs share strict case-sensitive ASCII validation across read, write and delete', async t => {
  const api = await startApi(); t.after(() => api.stop());
  for (const id of ['short', 'x'.repeat(33), '%20ABCDEFGH1234', 'ABCDEFGH1234%20', 'ABCD%2FEFGH', '%E2%98%83ABCDEFGH', '%ZZ']) {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      assert.equal((await api.request(`/rooms/${id}`, { method, ...(method === 'PUT' ? { body: { text: 'fixture' } } : {}) })).status, 400);
    }
  }
  for (const id of ['ABCDEFGH', 'a'.repeat(32)]) {
    assert.equal((await api.request(`/rooms/${id}`)).status, 404);
    assert.equal((await api.request(`/rooms/${id}`, { method: 'DELETE' })).status, 204);
  }
});

test('corrected baseline quirks retain explicit compatibility expectations', async t => {
  const api = await startApi(); t.after(() => api.stop());
  const created = await api.request('/rooms', { method: 'POST', body: { text: 'fixture \n' } });
  assert.equal(created.status, 201);
  assert.equal((await api.request(`/rooms/${created.data.roomId}`)).data.text, 'fixture \n');
  assert.equal(Date.parse(created.data.expiresAt) - Date.parse(created.data.createdAt), 60 * 60000);
  assert.equal((await api.request('/rooms', { method: 'POST' })).status, 400);
  assert.equal((await api.request('/rooms', { method: 'POST', body: null })).status, 400);
  assert.equal((await api.request('/health', { headers: { Origin: 'https://untrusted.invalid' } })).status, 403);
});

test('room writes reject wrong shapes, media types, malformed and oversized JSON', async t => {
  const api = await startApi(); t.after(() => api.stop());
  for (const body of [null, [], 'fixture', 12, false, {}]) {
    assert.equal((await api.request('/rooms', { method: 'POST', body })).status, 400);
    assert.equal((await api.request('/rooms/ABCDEFGH1234', { method: 'PUT', body })).status, 400);
  }
  for (const [body, type, status] of [
    ['fixture', 'text/plain', 415], ['{', 'application/json', 400],
    [JSON.stringify({ text: 'x'.repeat(66000) }), 'application/json', 413],
  ]) {
    const response = await fetch(`${api.origin}/api/rooms`, { method: 'POST', headers: { 'Content-Type': type }, body });
    assert.equal(response.status, status);
    assert.equal(typeof (await response.json()).message, 'string');
  }
});
