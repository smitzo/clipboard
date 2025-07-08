const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRoomIdGenerator, ROOM_ID_ALPHABET, ROOM_ID_LENGTH } = require('../src/security/room-id');

test('ID sampling uses exclusive alphabet bounds without byte modulo mapping', () => {
 let index = 0;
 const generate = createRoomIdGenerator((min, max) => {
  assert.equal(min, 0); assert.equal(max, ROOM_ID_ALPHABET.length);
  return index++ % max;
 });
 assert.equal(generate(), ROOM_ID_ALPHABET.slice(0, ROOM_ID_LENGTH));
 const cryptoGenerate = createRoomIdGenerator();
 for (let i = 0; i < 100; i++) {
  const id = cryptoGenerate(); assert.equal(id.length, 12);
  assert.ok([...id].every(char => ROOM_ID_ALPHABET.includes(char)));
 }
});
