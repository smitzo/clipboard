# Baseline contract and known corrections

The characterization suite captures public behavior before modularization.
The room lifecycle preserves identity, creation time and absolute expiry on
update, excludes ciphertext from responses and supports idempotent deletion.

The initial implementation also trims trailing whitespace, silently substitutes
TTL defaults, and returns 500 for absent bodies and disallowed browser
origins. These are known defects captured to make corrections explicit. They
are not intended contracts (null JSON is already rejected with 400 by the parser): the room/HTTP phases will update both expectations
and this decision record. Expiry equality needs an injected clock before it can
be tested deterministically.

Boundary tests use generic fixtures and independent server processes. They test
observable HTTP behavior, not private helper implementation.
