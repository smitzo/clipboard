function serializeRoom(room, includeText = false, decryptRoom) {
  const response = {
    roomId: room.id,
    revision: room.revision,
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
module.exports = { serializeRoom };
