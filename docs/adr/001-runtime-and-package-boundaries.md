# ADR 001: Runtime and package boundaries

Status: accepted, 2026-10-28.

## Context

The API declared Node 18 while the browser tooling and forthcoming test tooling
had independent runtime assumptions. Inconsistent environments make reproducible
checks and shutdown/timer behavior difficult to compare.

## Decision

Support Node 22.12+ and Node 24 within their major lines, with Node 24 as the
development default. Require npm 10 or 11. Use engine-strict so unsupported
environments fail early. Keep the two package lockfiles and add root orchestration
without changing dependency ownership.

The upstream [Node release schedule](https://github.com/nodejs/Release) documents
supported release lines. Engine constraints express this project's tested scope,
not a claim that an old installed patch is current or secure. Use maintained
patch releases within the supported major line.

## Alternatives and consequences

Keeping Node 18 would retain an obsolete baseline. Moving everything to a new
workspace lockfile would combine a tooling migration with behavior changes.
Supporting every Node major would expand the verification matrix without benefit.
Revisit the supported majors when their support windows or dependency needs change.

Package ownership remains explicit: API dependencies in server, rendering/test
dependencies in client, and cross-package verification tools at root.
