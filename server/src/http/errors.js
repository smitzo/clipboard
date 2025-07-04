function notFound(req, res) { res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: 'Route not found.' }); }
function errorHandler(error, req, res, next) {
 if (res.headersSent) return next(error);
 const parser = {
  'entity.parse.failed': [400, 'INVALID_JSON', 'Request body must be valid JSON.'],
  'entity.too.large': [413, 'BODY_TOO_LARGE', 'Request body is too large.'],
  'charset.unsupported': [415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported JSON character encoding.'],
  'encoding.unsupported': [415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported request encoding.'],
 }[error.type];
 const pathError = error instanceof URIError && error.status === 400 ? [400, 'INVALID_ROOM_ID', 'Room ID is invalid.'] : null;
 const [status, code, message] = parser || pathError || (typeof error.code === 'string' && error.status >= 400 && error.status < 500
  ? [error.status, error.code, error.message]
  : [500, 'INTERNAL_ERROR', 'Something went wrong.']);
 res.locals.errorCode = code;
 res.status(status).json({ code, message });
}
module.exports = { notFound, errorHandler };
