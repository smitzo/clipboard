const crypto = require('crypto');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const DEFAULT_TTL_MINUTES = Number(process.env.DEFAULT_TTL_MINUTES || 60);
const MAX_TTL_MINUTES = Number(process.env.MAX_TTL_MINUTES || 24 * 60);
const MAX_TEXT_CHARS = Number(process.env.MAX_TEXT_CHARS || 20000);
const ROOM_ID_LENGTH = 12;
const ROOM_ID_PATTERN = /^[A-Za-z0-9]{8,32}$/;
const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

const clipboardSecret = process.env.CLIPBOARD_SECRET || crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.createHash('sha256').update(clipboardSecret).digest();
const rooms = new Map();

const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || CLIENT_URL)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '64kb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

const createRoomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

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
  let roomId = generateRoomId();

  while (rooms.has(roomId)) {
    roomId = generateRoomId();
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

function encryptText(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return {
    encryptedText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

function decryptRoom(room) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    Buffer.from(room.iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(room.authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(room.encryptedText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function isExpired(room) {
  return Date.now() > room.expiresAt;
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
  const now = Date.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now > room.expiresAt) {
      rooms.delete(roomId);
    }
  }
}

const cleanupTimer = setInterval(cleanupExpiredRooms, 5 * 60 * 1000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    rooms: rooms.size,
    maxTextChars: MAX_TEXT_CHARS,
    defaultTtlMinutes: DEFAULT_TTL_MINUTES,
  });
});

app.post('/api/rooms', createRoomLimiter, (req, res, next) => {
  try {
    const text = parseText(req.body.text);
    const ttlMinutes = parseTtlMinutes(req.body.ttlMinutes);
    const roomId = makeUniqueRoomId();
    const now = Date.now();
    const encrypted = encryptText(text);
    const room = {
      id: roomId,
      ...encrypted,
      charCount: text.length,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + ttlMinutes * 60 * 1000,
    };

    rooms.set(roomId, room);

    res.status(201).json(roomResponse(room));
  } catch (error) {
    next(error);
  }
});

app.get('/api/rooms/:roomId', (req, res, next) => {
  try {
    const room = getRoomOrThrow(req.params.roomId);

    res.json(roomResponse(room, true));
  } catch (error) {
    next(error);
  }
});

app.put('/api/rooms/:roomId', (req, res, next) => {
  try {
    const room = getRoomOrThrow(req.params.roomId);
    const text = parseText(req.body.text);
    const encrypted = encryptText(text);

    Object.assign(room, encrypted, {
      charCount: text.length,
      updatedAt: Date.now(),
    });

    rooms.set(room.id, room);

    res.json(roomResponse(room));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/rooms/:roomId', (req, res, next) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);

    rooms.delete(roomId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;
  const message = status >= 500 ? 'Something went wrong.' : error.message;

  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`Clipboard API running on http://localhost:${PORT}`);
});
