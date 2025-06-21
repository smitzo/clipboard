function registerRoutes(app, { rooms, MAX_TEXT_CHARS, DEFAULT_TTL_MINUTES, createRoomLimiter, parseText, parseTtlMinutes, makeUniqueRoomId, encryptText, roomResponse, getRoomOrThrow, normalizeRoomId }) {
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

}
module.exports = { registerRoutes };
