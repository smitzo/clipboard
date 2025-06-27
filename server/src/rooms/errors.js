function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}
module.exports = { createError };
