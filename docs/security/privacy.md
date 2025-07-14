# Text and bearer data lifecycle

Text is held in browser React state while editing, encoded into a JSON request,
and received as plaintext by the API. The service encrypts accepted text before
retaining a room. Reads decrypt into transient response buffers. The repository
retains ciphertext, IV/tag, ID, revision, code-unit count and timestamps; it has
no plaintext field or durable persistence.

Expiry closes access at the exact deadline. A scheduled sweep or pressured
admission later reclaims the encrypted record. Deletion immediately releases
the record and index entry; shutdown releases the entire store. Releasing a
JavaScript reference does not guarantee physical erasure from RAM, swap, crash
dumps or runtime copies. Reusing the encryption secret cannot recover a lost
in-memory repository.

Room links encode bearer IDs in query parameters. Sharing them exposes the
same read/update/delete access as sharing an ID. Browser history, screenshots,
clipboard managers, QR images, extensions and a receiving device are outside
the server's retention control. The API's diagnostic events deliberately omit
IDs, queries and content; upstream access logs and infrastructure must respect
the same boundary. No infrastructure log-retention or deletion guarantee has
been verified locally.

HTTPS termination must protect text and bearer IDs in transit. The local HTTP
listener supplies no TLS itself. CORS and encryption at rest in process memory
do not replace transport protection or make this end-to-end encryption.

Automated checks use generic synthetic payloads and write only sanitized
measurements. Generated browser evidence stays in ignored artifact paths.
Manual device/QR scanning and hosted retention behavior remain unverified.
