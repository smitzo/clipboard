# Retained storage model

The repository accounts for encrypted records, never plaintext. Each room costs
384 bytes of fixed record/index reserve plus two bytes per retained code unit of
ID, base64 ciphertext, IV and authentication tag. Replacing a record subtracts
its prior recorded cost; deletion is idempotent and releases the same charge.
Unicode UTF-8 expansion is charged through its base64 ciphertext representation.

This is a conservative admission model for retained strings and record metadata,
not a bound on process RSS. V8, native crypto, HTTP buffers, transient plaintext,
concurrent requests and garbage collection have separate costs. Memory sizing
must compare this model with measured heap/RSS under the relevant workload.

Admission defaults to 1,000 rooms and 64 MiB accounted retained bytes. The
phase-1 fixture peaked near 79 MiB RSS at only 20 maximum ASCII rooms; it cannot
establish an RSS ceiling. These independent admission limits constrain growth
while preserving every existing live room: full admission returns retryable
503 `CAPACITY_EXCEEDED` with `Retry-After: 1`. The hint permits a later deliberate
retry and does not promise space after one second. No live-room eviction occurs.

Replacement builds a candidate encrypted record before admission. The repository
checks its delta against the old recorded cost and only then changes either
record or accounting. A rejected growing save preserves ciphertext, revision,
timestamps and expiry. A shrinking save releases the difference even at the
room-count limit; an exactly fitting byte charge is accepted.

Expiry uses an indexed binary min-heap with exactly one node per retained room.
Insertion/replacement/deletion cost O(log n); inspecting the next deadline costs
O(1), and reclaiming k due records costs O(k log n). Replacement removes the
old index node, so neither repeated saves nor deletion leave stale heap entries.
Cleanup does not scan live records and there is no timer per room.

Pressured writes reclaim due heap entries before deciding admission. This makes
expired capacity reusable between scheduled sweeps. Expiry access checks remain
authoritative: delayed reclamation never makes an expired room readable.
