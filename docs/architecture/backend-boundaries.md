# Backend ownership boundaries

The app factory constructs middleware and routes without opening sockets or
scheduling cleanup. Bootstrap loads configuration and starts a lifecycle owner.
That owner creates one listener and room-cleanup schedule and disposes both once.
Rate-limit counter windows belong to the app and are also disposed at stop.

HTTP routes serialize domain outcomes. The room service owns validation, absolute
expiry and mutations; injected clock/ID sources make boundary checks deterministic.
The repository owns records; AES-GCM adapters own encryption and authenticated
reads; response serialization never exposes internal ciphertext or key material.

The service enforces exact text, explicit lifetimes, inclusive expiry and
optional atomic revision preconditions. The repository owns byte/count admission
and an indexed deadline heap. Cleanup yields between bounded batches; readiness
is withheld until bootstrap owns its resources and is withdrawn on drain.

The architecture remains single-process and ephemeral, with no database.
Current contracts and reliability/security models are linked from the docs
index. Characterization fixtures retain existing routes and keys while explicit
regressions cover the intentional behavior corrections.
