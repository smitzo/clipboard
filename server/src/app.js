const { notFound, errorHandler } = require('./http/errors');
const { createRoomService } = require('./rooms/service');
const { registerRoutes } = require('./http/routes');
const { loadConfig } = require('./config');
const { noStore } = require('./http/cache');
const { createError } = require('./rooms/errors');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');


function createApp({ config = loadConfig(), repository } = {}) {
const app = express();
const { allowedOrigins } = config;
const service = createRoomService({ config, repository });

app.disable('x-powered-by');
app.disable('etag');
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
app.use(express.json({ limit: '64kb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

const createRoomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

registerRoutes(app, { service, createRoomLimiter });

app.use(notFound);
app.use(errorHandler);

app.locals.cleanupExpiredRooms = service.cleanupExpiredRooms;
app.locals.roomService = service;
app.locals.dispose = service.dispose;
return app;
}
module.exports = { createApp };
