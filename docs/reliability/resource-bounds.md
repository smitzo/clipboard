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

Scheduled cleanup reclaims at most 256 records per turn by default, then yields
through one owned immediate callback if more are due. Pressured writes use the
same bound and may return retryable capacity failure while additional due work
remains. This bounds synchronous work at O(batch × log n). The scheduler
eventually catches up without one timer per room or overlapping continuations.

Shutdown cancels both interval and queued continuation before closing the
listener. Once requests finish, disposal clears records, costs and the entire
deadline index. Disposal is idempotent; late callbacks do no work and a disposed
service cannot create or update rooms. Disposal releases references and does
not claim immediate erasure of strings from V8 or the host's memory.

## Local sizing evidence

The sizing fixture fills the default store with 20,000-code-unit payloads on
Node 24.3.0/Linux, an Intel i5-1135G7, with explicit GC before snapshots. ASCII
reaches the 1,000-room limit at 53,824,000 accounted bytes: heap used 31.5 MB and
RSS 128.6 MB. Three-byte Unicode reaches the byte limit at 418 rooms and
67,083,984 accounted bytes: heap used 38.0 MB and RSS 171.4 MB. The Unicode
profile follows ASCII in the same process; RSS includes retained V8 pages.

Cleanup completes in four ASCII turns or two Unicode turns; the longest observed
256-record batch is 0.45 ms. Both finish with zero records, bytes and heap nodes.
After explicit GC, heap used returns near 4.4 MB while RSS remains allocated.
These results support the 1,000-room / 64 MiB admission defaults as a local
envelope; they do not establish a production RSS ceiling or request-concurrency
budget. A process needs substantial headroom beyond its retained-byte budget.

The matched 20-sample, concurrency-four HTTP fixture reports p95 create/read/
update/delete of 19.37/4.11/5.84/0.99 ms for 128 code units and
11.26/3.93/5.00/4.27 ms for 20,000. Event-loop p95 is 16.83/13.08 ms. This small
sample is noisy, includes startup/JIT effects and does not establish improvement
over the phase-1 baseline or satisfy final performance gates. Numeric snapshots
and fixture metadata are retained in `scripts/baselines/storage.json`.
