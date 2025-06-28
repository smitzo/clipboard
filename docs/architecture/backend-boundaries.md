# Backend ownership boundaries

The app factory constructs middleware and routes without opening sockets or
scheduling cleanup. Bootstrap loads configuration and starts a lifecycle owner.
That owner creates one listener and cleanup schedule and disposes both once.

HTTP routes serialize domain outcomes. The room service owns validation, absolute
expiry and mutations; injected clock/ID sources make boundary checks deterministic.
The repository owns records; AES-GCM adapters own encryption and authenticated
reads; response serialization never exposes internal ciphertext or key material.

The baseline remains single-process and ephemeral. These boundaries prepare
capacity, concurrency and failure-policy work without introducing a database or
changing public routes. Characterization tests remain the compatibility oracle.
