const { notFound, errorHandler } = require('./http/errors');
const { createRoomService } = require('./rooms/service');
const { registerRoutes } = require('./http/routes');
const { loadConfig } = require('./config');
const { noStore } = require('./http/cache');
const { requestDiagnostics } = require('./http/diagnostics');
const { createHealthState } = require('./http/health');
const { createError } = require('./rooms/errors');
const cors = require('cors');
const express = require('express');
const { createRatePolicies } = require('./http/rate-limits');
const helmet = require('helmet');


function createApp({ config = loadConfig(), repository, logger = () => {}, dependencyReady } = {}) {
const app = express();
const { allowedOrigins } = config;
const service = createRoomService({ config, repository });
const health = createHealthState(dependencyReady || service.isReady);
const policies = createRatePolicies(config);

app.disable('x-powered-by');
app.disable('etag');
app.set('trust proxy', config.trustProxy);
app.use(requestDiagnostics(logger));
app.use(noStore);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'If-Match', 'X-Request-ID'],
    exposedHeaders: ['ETag', 'Retry-After', 'X-Request-ID'],
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(createError('Origin is not allowed.', 403, 'ORIGIN_DENIED'));
    },
  })
);
app.use('/api/rooms', (req, res, next) => {
  if (!health.ready()) return next(createError('Service is draining or unavailable.', 503, 'SERVICE_UNAVAILABLE'));
  next();
});
app.use('/api/rooms', policies.global);
app.use(express.json({ limit: '64kb' }));
registerRoutes(app, { service, health, createRoomLimiter: policies.create, readLimiter: policies.read, mutationLimiter: policies.mutation });

app.use(notFound);
app.use(errorHandler);

app.locals.cleanupExpiredRooms = service.cleanupExpiredRooms;
app.locals.roomService = service;
app.locals.health = health;
app.locals.config = config;
app.locals.dispose = () => { policies.dispose(); service.dispose(); };
return app;
}
module.exports = { createApp };
