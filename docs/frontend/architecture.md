# Client ownership boundaries

Runtime API URL resolution is isolated in `client/src/config.js`. Development
defaults to the local API; production defaults to the current origin's `/api`.
Configured URLs must be absolute HTTP(S), without credentials, query or fragment;
trailing slashes normalize before route composition. Secure pages reject HTTP
API targets to prevent mixed-content failures. Local overrides belong in the
project README and environment example.

`client/src/api.js` owns fetch construction, JSON/error decoding and response
validation. Room methods validate IDs, timestamps, counts, optional legacy
revision metadata and read text fidelity while allowing compatible extra fields.
Deletion accepts an empty 204. Non-JSON failures produce a generic error without
echoing the response body; structured errors retain status, code and retry hints.

Pure room-location helpers own case-sensitive IDs and HTTP(S) query links.
Duplicate room parameters, invalid encodings and unsupported path-only links are
rejected. Navigation updates preserve unrelated query/fragment state; generated
share links include only the room parameter so unrelated URL data is not shared.

Room metadata, pending operation and draft/active/deleted phases now transition
through a reducer. A failed mutation retains the prior room and draft. App still
owns request orchestration and editor/join presentation at this boundary.
Editable text is independent from the confirmed snapshot held with room metadata.
Dirty state compares those exact strings. Creating a room no longer trims the
editor, matching the corrected server fidelity contract; edits become confirmed
only after a successful save. No browser persistence is introduced.

`features/editor/ClipboardEditor.jsx` owns editor, expiry and mutation controls.
Its explicit props contain editable text, metadata, dirty/pending state and
callbacks. It performs no fetch, URL mutation or browser sharing operation.

`features/join/JoinRoom.jsx` owns the labelled join input and native form. Manual,
query-link and automatic joins share parsing and orchestration; the panel owns
no room state or independent request path.

Browser sharing is behind injectable clipboard, QR and download adapters. QR
payloads contain the current share link, downloads use generated PNG data URLs,
and unsupported/denied operations reject without an uncontrolled promise error.

`useFeedback` owns copy results, notices and their timers. Later copies invalidate
earlier completions, replacement notices reset their lifetime, and unmount
cancels timers and invalidates in-flight feedback. One live presentation renders
these results; the adapters do not create independent notifications.
The following roadmap extraction moves each responsibility behind a tested
adapter/controller or feature contract; those extractions are not yet claimed.
