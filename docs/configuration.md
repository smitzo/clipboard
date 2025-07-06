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

Production requires an explicit encryption secret of at least 32 characters.
Development may use a random per-process secret. Restart always loses rooms;
providing a stable secret does not make the in-memory repository persistent.

Executable configuration and startup regressions live in
`server/tests/config.test.cjs`. Local commands live in the project README.
