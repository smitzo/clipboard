# Process failure and shutdown semantics

Readiness requires initialized dependencies and a listener with owned cleanup.
Beginning drain makes readiness unavailable and rejects new room work with
503 `SERVICE_UNAVAILABLE`. Existing accepted responses may complete. The
listener stops accepting connections, idle keep-alive connections close, and a
five-second default deadline destroys remaining sockets. Only then are limiter
windows, encrypted records and expiry resources disposed.

Network receipt has a separate bounded request/header timeout. Neither timeout
can preempt a blocked JavaScript thread. Process termination by the host can
also interrupt a response before a client observes mutation success. Clients
must treat interrupted mutations as uncertain and avoid automatic replay.

Listener or scheduler startup failure disposes initialized dependencies without
announcing readiness. Stop is idempotent, including simultaneous signal handlers.
Restart clears all rooms irrespective of secret configuration: code rollback
cannot recover the old process's in-memory data. There is no durable backup,
cross-instance replication or promise of secure memory erasure.
