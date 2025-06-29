# Configuration constraints

Runtime limits are validated before the listener or cleanup schedule starts.
Invalid settings fail with a setting name, never its value. Port is an integer
in 0–65535 (0 selects an ephemeral test port); text limits are 1–20,000 UTF-16
code units within the fixed JSON envelope. Lifetime bounds satisfy
1 ≤ minimum ≤ default ≤ maximum ≤ 525,600 minutes. Defaults are 5/60/1,440.

Production requires an explicit encryption secret of at least 32 characters.
Development may use a random per-process secret. Restart always loses rooms;
providing a stable secret does not make the in-memory repository persistent.

Executable configuration and startup regressions live in
`server/tests/config.test.cjs`. Local commands live in the project README.
