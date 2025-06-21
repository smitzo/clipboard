const { createApp } = require('./src/app');
require('dotenv').config();
const app = createApp();
const port = Number(process.env.PORT || 5000);
const timer = setInterval(app.locals.cleanupExpiredRooms, 5 * 60 * 1000);
timer.unref();
app.listen(port, () => console.log(`Clipboard API running on http://localhost:${port}`));
