const { createRoomService } = require('./rooms/service');
const { registerRoutes } = require('./http/routes');
const { loadConfig } = require('./config');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');


function createApp({ config = loadConfig() } = {}) {
const app = express();
const { allowedOrigins } = config;
const service = createRoomService({ config });

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
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

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;
  const message = status >= 500 ? 'Something went wrong.' : error.message;

  res.status(status).json({ message });
});


app.locals.cleanupExpiredRooms = service.cleanupExpiredRooms;
app.locals.roomService = service;
return app;
}
module.exports = { createApp };
