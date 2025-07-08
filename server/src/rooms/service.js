const { createError } = require('./errors');
const { serializeRoom } = require('./serialize');
const { createMemoryRepository } = require('../storage/memory');
const { createTextCipher } = require('../security/cipher');
const { normalizeRoomId } = require('./id');
const { assertRevision } = require('./revision');
const { createRoomIdGenerator } = require('../security/room-id');
function createRoomService({ config, repository = createMemoryRepository(config), clock = Date, generateId }) {
const { defaultTtlMinutes: DEFAULT_TTL_MINUTES, maxTtlMinutes: MAX_TTL_MINUTES, maxTextChars: MAX_TEXT_CHARS, allowedOrigins } = config;
const { encrypt: encryptText, decrypt: decryptRoom } = createTextCipher(config.secret);
const rooms = repository;
const nextId = generateId || createRoomIdGenerator();
const roomResponse = (room, includeText = false) => serializeRoom(room, includeText, decryptRoom);
let disposed = false;
function assertActive() { if (disposed) throw new Error('Room service is disposed.'); }



function makeUniqueRoomId() {
  for (let attempt = 0; attempt < config.maxIdAttempts; attempt++) {
    const roomId = normalizeRoomId(nextId());
    if (!rooms.has(roomId)) return roomId;
  }
  throw createError('Unable to allocate a room ID.', 500, 'ID_GENERATION_FAILED');
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
  if (disposed) return { removed: 0, hasMore: false };
  return rooms.reclaimDue(clock.now(), config.cleanupBatchSize);
}


function create(textValue, ttlValue) {
 assertActive();
 const text = parseText(textValue); const ttlMinutes = parseTtlMinutes(ttlValue);
 const roomId = makeUniqueRoomId(); const now = clock.now();
 const room = { id: roomId, ...encryptText(text), revision: 1, charCount: text.length, createdAt: now, updatedAt: now, expiresAt: now + ttlMinutes * 60000 };
 rooms.set(roomId, room, now); return roomResponse(room);
}
function read(roomId) { assertActive(); return roomResponse(getRoomOrThrow(roomId), true); }
function update(roomId, value, ifMatch) {
 assertActive();
 const room = getRoomOrThrow(roomId); const text = parseText(value);
 assertRevision(ifMatch, room.revision);
 const replacement = { ...room, ...encryptText(text), revision: room.revision + 1, charCount: text.length, updatedAt: clock.now() };
 rooms.set(room.id, replacement, clock.now()); return roomResponse(replacement);
}
function remove(roomId) { assertActive(); rooms.delete(normalizeRoomId(roomId)); }
const capabilities = () => ({ minTtlMinutes: config.minTtlMinutes, defaultTtlMinutes: DEFAULT_TTL_MINUTES, maxTtlMinutes: MAX_TTL_MINUTES, maxTextChars: MAX_TEXT_CHARS });
return { create, read, update, remove, cleanupExpiredRooms, capabilities, isReady: () => !disposed, dispose() { disposed = true; rooms.dispose(); }, stats: () => ({ rooms: rooms.size, ...capabilities() }) };
}
module.exports = { createRoomService };
