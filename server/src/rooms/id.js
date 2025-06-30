const { createError } = require('./errors');
const ROOM_ID_PATTERN = /^[A-Za-z0-9]{8,32}$/;

function normalizeRoomId(value) {
  if (typeof value !== 'string' || !ROOM_ID_PATTERN.test(value)) {
    throw createError('Room ID is invalid.', 400);
  }
  return value;
}
module.exports = { normalizeRoomId, ROOM_ID_PATTERN };
