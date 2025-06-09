# Clipboard

Clipboard is a secure online clipboard for moving text between devices. A user pastes text, creates a temporary room, and shares the generated room ID or QR code with another device. The receiving device joins the room, reads the text, copies it, updates it, or deletes the room when finished.

## Features

- Create private clipboard rooms with unguessable IDs.
- Join rooms by room ID or by scanning a QR code.
- Copy shared text, room IDs, and room links from the browser.
- Update existing room text while the room is active.
- Delete a room manually after use.
- Auto-expire rooms after a selected time.
- Responsive, simple React UI built for desktop and mobile use.
- Express API with security headers, CORS allow-listing, rate limits, payload limits, and encrypted in-memory room storage.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS 4, lucide-react, qrcode
- Backend: Node.js, Express 5, Helmet, express-rate-limit, CORS
- Storage: encrypted in-memory storage with automatic expiry

## How It Works

1. The user pastes text into the create-room panel.
2. The backend generates a random room ID and encrypts the text with AES-256-GCM before storing it in memory.
3. The frontend displays the room ID, share link, and QR code.
4. Another device opens the link or enters the room ID.
5. The backend decrypts and returns the text only for that specific room ID.
6. The room expires automatically, or the user can delete it manually.

Rooms are intentionally temporary. Restarting the backend clears active rooms because no database is used.

## Security Design

This project keeps the security model simple and practical:

- Room IDs are random and hard to guess.
- There is no public room listing endpoint.
- Clipboard text is encrypted in server memory using AES-256-GCM.
- A room has an expiry time and expired rooms are removed automatically.
- Requests are rate-limited to reduce brute-force and spam attempts.
- JSON body size is limited to prevent oversized payload abuse.
- CORS is restricted to configured frontend origins.
- Helmet adds standard HTTP security headers.
- Server errors are normalized so internal details are not leaked.

Important note: this is secure enough for a portfolio/demo temporary clipboard, but it is not a replacement for a full secret manager. Do not use it for long-term credential storage.

## Project Structure

```text
clipboard/
  client/          React + Vite frontend
  server/          Express API
  Readme.md        Project documentation
```

## Requirements

- Node.js 18.19 or newer
- npm

Node 20 is recommended.

## Backend Setup

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:5000` by default.

### Backend Environment Variables

Create `server/.env` from `server/.env.example`.

```env
PORT=5000
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
CLIPBOARD_SECRET=replace-with-a-long-random-secret
DEFAULT_TTL_MINUTES=60
MAX_TTL_MINUTES=1440
MAX_TEXT_CHARS=20000
```

- `PORT`: backend port.
- `CLIENT_URL`: frontend URL used as the default allowed origin.
- `CORS_ORIGIN`: comma-separated allowed browser origins.
- `CLIPBOARD_SECRET`: encryption secret used to derive the AES key.
- `DEFAULT_TTL_MINUTES`: default room lifetime.
- `MAX_TTL_MINUTES`: maximum allowed room lifetime.
- `MAX_TEXT_CHARS`: maximum text length per room.

Use a real secret in production. If `CLIPBOARD_SECRET` is missing, the server creates a random secret on startup, which means existing rooms cannot be decrypted after restart.

## Frontend Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

### Frontend Environment Variables

Create `client/.env` from `client/.env.example`.

```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns server status and basic limits.

### Create Room

```http
POST /api/rooms
Content-Type: application/json
```

```json
{
  "text": "Text to share",
  "ttlMinutes": 60
}
```

Returns:

```json
{
  "roomId": "A1b2C3d4E5f6",
  "charCount": 13,
  "createdAt": "2026-05-27T10:00:00.000Z",
  "updatedAt": "2026-05-27T10:00:00.000Z",
  "expiresAt": "2026-05-27T11:00:00.000Z"
}
```

### Read Room

```http
GET /api/rooms/:roomId
```

Returns room metadata plus decrypted text.

### Update Room

```http
PUT /api/rooms/:roomId
Content-Type: application/json
```

```json
{
  "text": "Updated text"
}
```

Updates the encrypted room text while keeping the same room ID and expiry.

### Delete Room

```http
DELETE /api/rooms/:roomId
```

Deletes the room immediately.

## Scripts

### Server

```bash
npm run dev      # start API with node --watch
npm start        # start API
npm test         # syntax check server.js
```

### Client

```bash
npm run dev      # start Vite dev server
npm run build    # production build
npm run lint     # eslint
npm run preview  # preview production build
```

## Deployment Notes

1. Deploy the backend on a Node.js host.
2. Set a strong `CLIPBOARD_SECRET`.
3. Set `CORS_ORIGIN` to the deployed frontend URL.
4. Deploy the frontend as a static Vite app.
5. Set `VITE_API_URL` to the deployed API URL ending in `/api`.
6. Use HTTPS in production so room IDs and clipboard text are protected in transit.

Because storage is in-memory, rooms disappear when the backend restarts. For persistent or multi-instance deployments, add Redis or a database and keep the same expiry and encryption approach.

## Verification

The current implementation was checked with:

```bash
cd server && npm test
cd server && npm audit --omit=dev
cd client && npm run lint
cd client && npm run build
```

Run the commands with Node 18.19+ or Node 20.
