# Client ownership boundaries

Runtime API URL resolution is isolated in `client/src/config.js`. Development
defaults to the local API; production defaults to the current origin's `/api`.
Configured URLs must be absolute HTTP(S), without credentials, query or fragment;
trailing slashes normalize before route composition. Secure pages reject HTTP
API targets to prevent mixed-content failures. Local overrides belong in the
project README and environment example.

App still owns room state, requests and editor/join presentation at this boundary.
The following roadmap extraction moves each responsibility behind a tested
adapter/controller or feature contract; those extractions are not yet claimed.
