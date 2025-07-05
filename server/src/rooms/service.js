const { createError } = require('./errors');
const { serializeRoom } = require('./serialize');
const { createMemoryRepository } = require('../storage/memory');
const { createTextCipher } = require('../security/cipher');
const { normalizeRoomId } = require('./id');
const { assertRevision } = require('./revision');
const crypto = require('node:crypto');
function createRoomService({ config, repository = createMemoryRepository(config), clock = Date, generateId }) {
const { defaultTtlMinutes: DEFAULT_TTL_MINUTES, maxTtlMinutes: MAX_TTL_MINUTES, maxTextChars: MAX_TEXT_CHARS, allowedOrigins } = config;
const ROOM_ID_LENGTH = 12;
const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const { encrypt: encryptText, decrypt: decryptRoom } = createTextCipher(config.secret);
const rooms = repository;
const nextId = generateId || generateRoomId;
const roomResponse = (room, includeText = false) => serializeRoom(room, includeText, decryptRoom);



function generateRoomId() {
  let roomId = '';
  const randomBytes = crypto.randomBytes(ROOM_ID_LENGTH);

  for (const byte of randomBytes) {
    roomId += ROOM_ID_ALPHABET[byte % ROOM_ID_ALPHABET.length];
  }

  return roomId;
}

function makeUniqueRoomId() {
  let roomId = nextId();

  while (rooms.has(roomId)) {
    roomId = nextId();
  }

  return roomId;
}

function parseText(value) {
  if (typeof value !== 'string') {
    throw createError('Clipboard text is required.', 400, 'INVALID_TEXT');
  }

  const text = value;

  if (!text.trim()) {
    throw createError('Clipboard text cannot be empty.', 400, 'INVALID_TEXT');
  }

  if (text.length > MAX_TEXT_CHARS) {
    throw createError(`Clipboard text must be ${MAX_TEXT_CHARS} characters or fewer.`, 413, 'TEXT_TOO_LARGE');
  }

  return text;
}

function parseTtlMinutes(value) {
  if (value === undefined) return DEFAULT_TTL_MINUTES;
  if (!Number.isInteger(value) || value < config.minTtlMinutes || value > MAX_TTL_MINUTES) {
    throw createError(`Lifetime must be an integer from ${config.minTtlMinutes} to ${MAX_TTL_MINUTES} minutes.`, 400, 'INVALID_TTL');
  }
  return value;
}





function isExpired(room) {
  return clock.now() >= room.expiresAt;
}

function getRoomOrThrow(roomId) {
  const room = rooms.get(normalizeRoomId(roomId));

  if (!room || isExpired(room)) {
    if (room) {
      rooms.delete(room.id);
    }

    throw createError('Room was not found or has expired.', 404, 'ROOM_UNAVAILABLE');
  }

  return room;
}



function cleanupExpiredRooms() {
  const now = clock.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now >= room.expiresAt) {
      rooms.delete(roomId);
    }
  }
}


function create(textValue, ttlValue) {
 const text = parseText(textValue); const ttlMinutes = parseTtlMinutes(ttlValue);
 const roomId = makeUniqueRoomId(); const now = clock.now();
 const room = { id: roomId, ...encryptText(text), revision: 1, charCount: text.length, createdAt: now, updatedAt: now, expiresAt: now + ttlMinutes * 60000 };
 rooms.set(roomId, room); return roomResponse(room);
}
function read(roomId) { return roomResponse(getRoomOrThrow(roomId), true); }
function update(roomId, value, ifMatch) {
 const room = getRoomOrThrow(roomId); const text = parseText(value);
 assertRevision(ifMatch, room.revision);
 Object.assign(room, encryptText(text), { revision: room.revision + 1, charCount: text.length, updatedAt: clock.now() });
 rooms.set(room.id, room); return roomResponse(room);
}
function remove(roomId) { rooms.delete(normalizeRoomId(roomId)); }
const capabilities = () => ({ minTtlMinutes: config.minTtlMinutes, defaultTtlMinutes: DEFAULT_TTL_MINUTES, maxTtlMinutes: MAX_TTL_MINUTES, maxTextChars: MAX_TEXT_CHARS });
return { create, read, update, remove, cleanupExpiredRooms, capabilities, stats: () => ({ rooms: rooms.size, ...capabilities() }) };
}
module.exports = { createRoomService };
