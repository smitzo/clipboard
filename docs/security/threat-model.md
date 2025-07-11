# Bearer-room security boundaries

Room IDs are bearer credentials: knowledge of an ID grants read, update and
delete access. There is no account, ownership check or listing endpoint.
Generated IDs use 12 independent cryptographic `randomInt` samples from the
ambiguity-reduced alphabet; bounded sampling avoids the original byte-modulo
bias. Collision retries are finite and never replace an existing room.

Transport, storage encryption, abuse limits and diagnostics have distinct trust
boundaries. The server receives and decrypts plaintext. AES-GCM is server-side
encryption and does not protect content from the process or its operator.
Further implemented controls are recorded here as the security phase proceeds.

Production requires an explicit secret of at least 32 characters; development
may generate one per process, but an explicitly blank secret is invalid.
The length rule does not establish entropy: operators must provide a random
secret. AES-256-GCM derives its key with SHA-256 and uses fresh 12-byte IVs and
16-byte authentication tags. Invalid base64, IV/tag lengths or authentication
failures are rejected and produce only a generic HTTP 500. Plaintext and crypto
exception details are excluded from failure responses. JavaScript strings cannot
promise secure memory erasure, and restarting still loses every room.

All API responses, including failures and capability metadata, set `no-store`.
Room ETags serve optional PUT preconditions; conditional GET validators are
ignored to prevent 304 reuse of sensitive content. Intermediaries must preserve
these headers and exclude room responses from caches. This is a required
boundary assumption, not verified proxy/CDN behavior.

Origins must be explicit HTTP(S) origins without paths, credentials, wildcards
or opaque `null`. Denied origins receive 403 `ORIGIN_DENIED` before room work;
allowed preflights include JSON and revision headers, and expose ETag/retry
headers to the browser. Requests without Origin remain supported for nonbrowser
clients. Any client can omit or spoof Origin: CORS is a browser policy, not an
authorization or anti-abuse boundary.

Rate policies apply to room traffic: 120 total, 30 creates, 90 reads and 60
mutations per client per 15-minute window by default. Aggregate and route budgets
both apply; health does not consume room capacity. Socket IP is the default key.
Forwarded headers only influence keys when their immediate proxy chain matches
explicit trusted IP/CIDR ranges (or loopback). Broad trust booleans, hop counts
and world-wide CIDRs are invalid. A trusted proxy must overwrite untrusted
forwarding headers; configuration alone cannot prove network topology.
Limiter windows and counters belong to the app and are disposed on shutdown.

Diagnostics contain only a server-generated UUID, method, route template, status,
elapsed milliseconds and stable error code. Unknown paths use `unmatched`.
Incoming request IDs are ignored. Bodies, IPs, raw paths, query strings, room
IDs and secrets are excluded; aborted responses are classified as 499. Logger
failures cannot block response completion. Bootstrap writes JSON events to its
output stream without retaining a history in the app. Collection/retention of
that stream is an external responsibility and has no verified retention policy.
