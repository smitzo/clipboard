# Baseline contract and known corrections

The characterization suite captures public behavior before modularization.
The room lifecycle preserves identity, creation time and absolute expiry on
update, excludes ciphertext from responses and supports idempotent deletion.

The initial implementation trimmed trailing whitespace, silently substituted
TTL defaults and returned 500 for absent bodies and disallowed browser origins.
These were defects captured before extraction. The corrections below supersede
that baseline. Deliberate origin denial remains a subsequent security-phase task.

## Implemented corrections

Accepted text is now preserved exactly on create and update, including trailing
spaces, CRLF and Unicode. Whitespace-only text is still invalid. The text limit
and `charCount` count JavaScript UTF-16 code units; they do not count graphemes
or UTF-8 bytes. This deliberately corrects the baseline's trailing trim.

An omitted TTL uses the configured default. An explicit TTL must be a numeric
integer within the configured inclusive minimum and maximum. Null, strings,
fractions and out-of-range values return 400; there is no rounding or clamping.

POST and PUT require a JSON object. Absent/null/array/scalar bodies return 400;
unsupported media types return 415. The parser rejects malformed JSON with 400
and an encoded body larger than 64 KiB with 413 before room mutation.

IDs are case-sensitive ASCII alphanumeric strings of 8–32 characters. Generated
IDs remain 12 characters. Surrounding whitespace is rejected rather than trimmed.
All room methods share the rule after Express percent-decoding; decoded slashes,
Unicode and malformed escapes are invalid. Valid missing IDs return 404 for read
and update; deletion remains idempotent with 204.

Read, update and cleanup expire a room at `now >= expiresAt`. An earlier update
preserves creation and absolute expiry timestamps. Missing and expired reads or
updates receive the same 404 message; cleanup timing never extends access.

Errors retain `message` and add a stable `code`: `INVALID_ROOM_ID`,
`INVALID_TEXT`, `TEXT_TOO_LARGE`, `INVALID_TTL`, `INVALID_REQUEST`,
`INVALID_JSON`, `BODY_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`,
`ROOM_UNAVAILABLE`, `ROUTE_NOT_FOUND` and `INTERNAL_ERROR`.
Unexpected failures return a generic 500 with no exception details. Parser
messages are normalized so malformed JSON cannot echo content in error bodies.

`GET /api/capabilities` exposes only `minTtlMinutes`, `defaultTtlMinutes`,
`maxTtlMinutes` and `maxTextChars`. Health retains its legacy `ok`, `rooms`,
`maxTextChars` and `defaultTtlMinutes` fields and adds lifetime bounds. Neither
endpoint exposes secret values, allowed origins or individual room metadata.

Room metadata adds `revision`, starting at 1 and increasing on each update.
Create/read/update return its quoted strong ETag. PUT optionally accepts
`If-Match` with a matching quoted revision, a list of strong revisions, or `*`
for an existing room. Stale revisions return 412 `REVISION_CONFLICT` without
mutation; malformed/weak preconditions return 400 `INVALID_REVISION`.
Legacy PUT without this header remains unconditional. Deletion stays
idempotent and does not require revision metadata.

Boundary tests use generic fixtures and independent server processes. They test
observable HTTP behavior, not private helper implementation.
