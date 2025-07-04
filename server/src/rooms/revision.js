const { createError } = require('./errors');

function assertRevision(ifMatch, revision) {
  if (ifMatch === undefined || ifMatch === '*') return;
  if (typeof ifMatch !== 'string' || !/^(?:"[1-9][0-9]*")(?:\s*,\s*"[1-9][0-9]*")*$/.test(ifMatch)) {
    throw createError('If-Match must contain a strong room revision ETag.', 400, 'INVALID_REVISION');
  }
  if (!ifMatch.split(',').map(value => value.trim()).includes(`"${revision}"`)) {
    throw createError('Room changed. Reload before saving again.', 412, 'REVISION_CONFLICT');
  }
}
module.exports = { assertRevision };
