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
