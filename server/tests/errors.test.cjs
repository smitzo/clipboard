const { test } = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('../src/http/errors');
const { createRoomService } = require('../src/rooms/service');
const { loadConfig } = require('../src/config');

test('unexpected failures and parser snippets cannot expose private input', () => {
 const res = { locals: {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; } };
 errorHandler(new Error('private fixture'), {}, res, () => {});
 assert.deepEqual(res.body, { code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
 errorHandler(Object.assign(new Error('private snippet'), { type: 'entity.parse.failed' }), {}, res, () => {});
 assert.deepEqual(res.body, { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' });
});

test('missing and expired rooms share stable error classification', () => {
 let now = 0;
 const service = createRoomService({ config: loadConfig({}), clock: { now: () => now } });
 const room = service.create('fixture', 5);
 now = Date.parse(room.expiresAt);
 for (const id of [room.roomId, 'ABCDEFGH1234']) {
  assert.throws(() => service.read(id), { status: 404, code: 'ROOM_UNAVAILABLE' });
 }
 assert.throws(() => service.create('fixture', '5'), { code: 'INVALID_TTL' });
});
