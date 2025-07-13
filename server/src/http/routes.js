const { requireRoomBody } = require('./room-body');
function registerRoutes(app, { service, health, createRoomLimiter, readLimiter, mutationLimiter }) {
 const sendRoom = (res, room, status = 200) => res.status(status).set('ETag', `"${room.revision}"`).json(room);
 app.get('/api/health', (req, res) => res.json({ ok: true, ...service.stats() }));
 app.get('/api/live', (req, res) => res.json({ ok: true }));
 app.get('/api/ready', (req, res) => {
  if (health.ready()) res.json({ ok: true });
  else res.status(503).json({ ok: false, code: 'NOT_READY', message: 'Service is not ready.' });
 });
 app.get('/api/capabilities', (req, res) => res.json(service.capabilities()));
 app.post('/api/rooms', createRoomLimiter, requireRoomBody, (req, res, next) => {
  try { sendRoom(res, service.create(req.body.text, req.body.ttlMinutes), 201); } catch (error) { next(error); }
 });
 app.get('/api/rooms/:roomId', readLimiter, (req, res, next) => {
  try { sendRoom(res, service.read(req.params.roomId)); } catch (error) { next(error); }
 });
 app.put('/api/rooms/:roomId', mutationLimiter, requireRoomBody, (req, res, next) => {
  try { sendRoom(res, service.update(req.params.roomId, req.body.text, req.headers['if-match'])); } catch (error) { next(error); }
 });
 app.delete('/api/rooms/:roomId', mutationLimiter, (req, res, next) => {
  try { service.remove(req.params.roomId); res.status(204).send(); } catch (error) { next(error); }
 });
}
module.exports = { registerRoutes };
