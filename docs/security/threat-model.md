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
