function noStore(req, res, next) {
  res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache', Expires: '0' });
  // Revision ETags are mutation preconditions, not permission to reuse room data.
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  next();
}
module.exports = { noStore };
