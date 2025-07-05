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
