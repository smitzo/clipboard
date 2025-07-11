const { createError } = require('../rooms/errors');

function requireRoomBody(req, res, next) {
  if (req.headers['content-type'] && !req.is('application/json')) {
    return next(createError('Room requests require application/json.', 415, 'UNSUPPORTED_MEDIA_TYPE'));
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(createError('A JSON object body is required.', 400));
  }
  if (typeof req.body.text !== 'string') {
    return next(createError('Clipboard text is required.', 400));
  }
  next();
}
module.exports = { requireRoomBody };
