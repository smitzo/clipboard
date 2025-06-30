const { requireRoomBody } = require('./room-body');
function registerRoutes(app, { service, createRoomLimiter }) {
 app.get('/api/health', (req, res) => res.json({ ok: true, ...service.stats() }));
 app.post('/api/rooms', createRoomLimiter, requireRoomBody, (req, res, next) => {
  try { res.status(201).json(service.create(req.body.text, req.body.ttlMinutes)); } catch (error) { next(error); }
 });
 app.get('/api/rooms/:roomId', (req, res, next) => {
  try { res.json(service.read(req.params.roomId)); } catch (error) { next(error); }
 });
 app.put('/api/rooms/:roomId', requireRoomBody, (req, res, next) => {
  try { res.json(service.update(req.params.roomId, req.body.text)); } catch (error) { next(error); }
 });
 app.delete('/api/rooms/:roomId', (req, res, next) => {
  try { service.remove(req.params.roomId); res.status(204).send(); } catch (error) { next(error); }
 });
}
module.exports = { registerRoutes };
