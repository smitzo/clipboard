const { createMemoryRepository } = require('../storage/memory');
const { createTextCipher } = require('../security/cipher');
const crypto = require('node:crypto');
function createRoomService({ config, repository = createMemoryRepository(), clock = Date, generateId }) {
const { defaultTtlMinutes: DEFAULT_TTL_MINUTES, maxTtlMinutes: MAX_TTL_MINUTES, maxTextChars: MAX_TEXT_CHARS, allowedOrigins } = config;
const ROOM_ID_LENGTH = 12;
const ROOM_ID_PATTERN = /^[A-Za-z0-9]{8,32}$/;
const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const { encrypt: encryptText, decrypt: decryptRoom } = createTextCipher(config.secret);
const rooms = repository;
const nextId = generateId || generateRoomId;

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeRoomId(roomId) {
  const normalized = String(roomId || '').trim();

  if (!ROOM_ID_PATTERN.test(normalized)) {
    throw createError('Room ID is invalid.', 400);
  }

  return normalized;
}

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
    throw createError('Clipboard text is required.', 400);
  }

  const text = value.trimEnd();

  if (!text.trim()) {
    throw createError('Clipboard text cannot be empty.', 400);
  }

  if (text.length > MAX_TEXT_CHARS) {
    throw createError(`Clipboard text must be ${MAX_TEXT_CHARS} characters or fewer.`, 413);
  }

  return text;
}

function parseTtlMinutes(value) {
  const ttl = Number(value || DEFAULT_TTL_MINUTES);

  if (!Number.isFinite(ttl) || ttl <= 0) {
    return DEFAULT_TTL_MINUTES;
  }

  return Math.min(Math.max(Math.round(ttl), 5), MAX_TTL_MINUTES);
}





function isExpired(room) {
  return clock.now() > room.expiresAt;
}

function getRoomOrThrow(roomId) {
  const room = rooms.get(normalizeRoomId(roomId));

  if (!room || isExpired(room)) {
    if (room) {
      rooms.delete(room.id);
    }

    throw createError('Room was not found or has expired.', 404);
  }

  return room;
}

function roomResponse(room, includeText = false) {
  const response = {
    roomId: room.id,
    charCount: room.charCount,
    createdAt: new Date(room.createdAt).toISOString(),
    updatedAt: new Date(room.updatedAt).toISOString(),
    expiresAt: new Date(room.expiresAt).toISOString(),
  };

  if (includeText) {
    response.text = decryptRoom(room);
  }

  return response;
}

function cleanupExpiredRooms() {
  const now = clock.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now > room.expiresAt) {
      rooms.delete(roomId);
    }
  }
}


function create(textValue, ttlValue) {
 const text = parseText(textValue); const ttlMinutes = parseTtlMinutes(ttlValue);
 const roomId = makeUniqueRoomId(); const now = clock.now();
 const room = { id: roomId, ...encryptText(text), charCount: text.length, createdAt: now, updatedAt: now, expiresAt: now + ttlMinutes * 60000 };
 rooms.set(roomId, room); return roomResponse(room);
}
function read(roomId) { return roomResponse(getRoomOrThrow(roomId), true); }
function update(roomId, value) {
 const room = getRoomOrThrow(roomId); const text = parseText(value);
 Object.assign(room, encryptText(text), { charCount: text.length, updatedAt: clock.now() });
 rooms.set(room.id, room); return roomResponse(room);
}
function remove(roomId) { rooms.delete(normalizeRoomId(roomId)); }
return { create, read, update, remove, cleanupExpiredRooms, stats: () => ({ rooms: rooms.size, maxTextChars: MAX_TEXT_CHARS, defaultTtlMinutes: DEFAULT_TTL_MINUTES }) };
}
module.exports = { createRoomService };
