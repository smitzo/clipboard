# Room API contract

All paths are relative to `/api`. Room IDs act as bearer access: anyone who has
one can read, update or delete that room. CORS does not authenticate clients.

| Method and path | Success | Contract |
| --- | --- | --- |
| GET `/health` | 200 | `ok`, aggregate room count and safe limits |
| GET `/capabilities` | 200 | Minimum/default/maximum TTL and maximum text length |
| POST `/rooms` | 201 | Create from `{text, ttlMinutes?}`; metadata and ETag |
| GET `/rooms/:roomId` | 200 | Metadata, exact text and ETag |
| PUT `/rooms/:roomId` | 200 | Replace from `{text}`; optional `If-Match`; metadata and ETag |
| DELETE `/rooms/:roomId` | 204 | Idempotent deletion for a valid ID |

Metadata contains `roomId`, `revision`, `charCount`, `createdAt`, `updatedAt`
and `expiresAt`. Timestamps are ISO UTC. Text length uses UTF-16 code units.
Update preserves creation and expiry; expiry is inclusive at its deadline.
Encryption fields and text are excluded from create/update responses.

## Compatibility decisions

Existing paths, metadata keys and human-readable error `message` remain.
Revision, ETag, error `code`, capabilities and lifetime bounds are additive.
Existing unconditional PUT clients retain last-writer-wins behavior. Conditional
PUT requires a strong matching revision and returns 412 on conflict; clients
must retain their draft and decide whether to reload or reapply.

Intentional corrections preserve trailing whitespace, reject explicit invalid
TTLs, reject malformed request shapes with 4xx, reject padded IDs and expire
exactly at the deadline. Clients relying on rounding, clamping or automatic
string-to-number TTL conversion must send a numeric integer instead.

[Detailed boundary decisions](baseline-contract.md) distinguish the original
behavior from corrections. Generic invalid examples in
`server/tests/fixtures/invalid-room-inputs.json` execute against the real API in
`contract.test.cjs`; lifecycle and boundary tests cover successful legacy use,
exact text, ETags, parser limits and idempotent deletion. These are local HTTP
and injected-clock checks; they do not establish hosted or proxy behavior.

Parser/media failures use 400 `INVALID_JSON`, 413 `BODY_TOO_LARGE` or 415
`UNSUPPORTED_MEDIA_TYPE`. Text-limit 413 remains `TEXT_TOO_LARGE`. Rate failures
return JSON 429 `RATE_LIMITED` with `Retry-After`; capacity failures use retryable
503 `CAPACITY_EXCEEDED`. Security, CORS (for allowed origins) and no-store
headers remain present on these failures. The aggregate room budget runs before
body parsing so malformed bodies still consume request budget.
