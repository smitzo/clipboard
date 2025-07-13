# Configuration constraints

Runtime limits are validated before the listener or cleanup schedule starts.
Invalid settings fail with a setting name, never its value. Port is an integer
in 0–65535 (0 selects an ephemeral test port); text limits are 1–20,000 UTF-16
code units within the fixed JSON envelope. Lifetime bounds satisfy
1 ≤ minimum ≤ default ≤ maximum ≤ 525,600 minutes. Defaults are 5/60/1,440.

Room count defaults to 1,000 (range 1–1,000,000); accounted storage defaults to
64 MiB (range 1 byte–1 GiB). The lower limit may intentionally admit no record.
These bound retained admission, not total RSS; see the
[resource model](reliability/resource-bounds.md).

Cleanup batch size defaults to 256 with an allowed range of 1–4,096. It bounds
both scheduled turns and reclamation during pressured admission.

ID allocation attempts default to 8 (range 1–64). A pathological colliding
source terminates with an internal failure; it cannot replace a live room or
hold the request in an unbounded generation loop.

Client URL and the comma-separated origin set must contain exact HTTP(S)
origins: scheme, host and optional port, with no path, trailing slash, credentials
or wildcard. Invalid origin policy fails startup rather than broadening access.

Proxy trust defaults to false. Explicit IP/CIDR sets or `loopback` are accepted;
boolean true, hop counts and /0 ranges are rejected. Per-IP room budgets default
to 120 total, 30 creates, 90 reads and 60 mutations in 900,000 ms. Limits must be
integers 1–1,000,000 and windows 1,000–3,600,000 ms. These counters are process
local; multiple instances do not share a global abuse budget.

Shutdown drain defaults to 5,000 ms (range 10–60,000). Incoming request timeout
defaults to 20,000 ms (100–120,000); headers use at most 15,000 ms. Node checks
incoming deadlines at intervals up to 1,000 ms. These bound network receipt and
shutdown waiting, not interruption of synchronous JavaScript or crypto work.

Production requires an explicit encryption secret of at least 32 characters.
Development may use a random per-process secret. Restart always loses rooms;
providing a stable secret does not make the in-memory repository persistent.

Executable configuration and startup regressions live in
`server/tests/config.test.cjs`. Local commands live in the project README.
