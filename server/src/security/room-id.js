const crypto = require('node:crypto');
const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const ROOM_ID_LENGTH = 12;

function createRoomIdGenerator(sample = crypto.randomInt) {
  return () => Array.from({ length: ROOM_ID_LENGTH }, () => ROOM_ID_ALPHABET[sample(0, ROOM_ID_ALPHABET.length)]).join('');
}
module.exports = { createRoomIdGenerator, ROOM_ID_ALPHABET, ROOM_ID_LENGTH };
