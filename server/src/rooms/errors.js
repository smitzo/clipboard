function createError(message, status = 400, code = 'INVALID_REQUEST') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}
module.exports = { createError };
