# Baseline contract and known corrections

The characterization suite captures public behavior before modularization.
The room lifecycle preserves identity, creation time and absolute expiry on
update, excludes ciphertext from responses and supports idempotent deletion.

The initial implementation trimmed trailing whitespace and silently substituted
TTL defaults, and returns 500 for absent bodies and disallowed browser
origins. These are known defects captured to make corrections explicit. They
are not intended contracts (null JSON is already rejected with 400 by the parser): the room/HTTP phases will update both expectations
and this decision record. Expiry equality needs an injected clock before it can
be tested deterministically.

## Implemented corrections

Accepted text is now preserved exactly on create and update, including trailing
spaces, CRLF and Unicode. Whitespace-only text is still invalid. The text limit
and `charCount` count JavaScript UTF-16 code units; they do not count graphemes
or UTF-8 bytes. This deliberately corrects the baseline's trailing trim.

An omitted TTL uses the configured default. An explicit TTL must be a numeric
integer within the configured inclusive minimum and maximum. Null, strings,
fractions and out-of-range values return 400; there is no rounding or clamping.

Boundary tests use generic fixtures and independent server processes. They test
observable HTTP behavior, not private helper implementation.
