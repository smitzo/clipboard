const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { createMemoryRepository } = require('../src/storage/memory');
const { startServer } = require('../src/lifecycle');

test('corrupted retained ciphertext produces only a generic HTTP failure', async t => {
 const repository = createMemoryRepository(); const app = createApp({ repository });
 const room = app.locals.roomService.create('private generic fixture');
 repository.get(room.roomId).authTag = Buffer.alloc(16).toString('base64');
 const lifecycle = await startServer({ app, port: 0, host: '127.0.0.1' }); t.after(() => lifecycle.stop());
 const response = await fetch(`http://127.0.0.1:${lifecycle.server.address().port}/api/rooms/${room.roomId}`);
 assert.equal(response.status, 500);
 assert.deepEqual(await response.json(), { code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
});
