# Clipboard technical documentation

Clipboard is an account-free, temporary text-sharing application built with
React and Express. This directory contains system design, engineering decisions,
contracts and measured tradeoffs. Local commands belong in the [project README](../Readme.md).

| Document | Purpose | Status |
| --- | --- | --- |
| [System design](system-design.md) | Original architecture review and proposed design | Historical baseline with links to implemented contracts |
| [Refactor roadmap](roadmap.md) | 140 ordered commits, dependencies and engineering gates | Implementation in progress; root ledger records verified boundaries |
| [Configuration constraints](configuration.md) | Validated ranges, lifetime relationships and fail-fast behavior | Implemented limits |
| [Backend boundaries](architecture/backend-boundaries.md) | App, service, repository and lifecycle ownership | Implemented extraction |
| [Room API contract](api/README.md) | Corrected room semantics and legacy compatibility | Local HTTP and deterministic clock evidence |
| [Resource bounds](reliability/resource-bounds.md) | Admission accounting, indexed expiry and cleanup ownership | Implemented; local sizing evidence |

Local OpenSpec artifacts live in `openspec/changes/refactor-clipboard/` and are
intentionally ignored by Git. The complete roadmap and reusable technical docs
remain tracked so a fresh clone retains the plan. Do not force-add OpenSpec.

## Documentation system to build

These paths are planned deliverables, not links to existing documents. Update
docs alongside implementation; phase 13 consolidates and checks the full set.

| Area | Planned paths | Required content |
| --- | --- | --- |
| Constraints | `architecture/invariants.md`, `configuration.md` | Runtime assumptions, configuration model, invariants and failure semantics |
| Architecture | `architecture/overview.md`, `architecture/data-flow.md`, `architecture/room-lifecycle.md` | Context/container/component diagrams, request sequences, state transitions and failure handling |
| Decisions | `adr/README.md`, numbered ADR files | Context, decision, alternatives, consequences and verification |
| API | `api/openapi.yaml`, `api/README.md` | Routes, schemas, errors, limits, revision preconditions and executable examples |
| Security | `security/threat-model.md`, `security/privacy.md` | Bearer access, server-side encryption, expiry and leakage controls |
| Frontend | `frontend/architecture.md`, `frontend/design-system.md`, `frontend/accessibility.md` | State ownership, component contracts, tokens and accessible interactions |
| Quality | `testing.md`, `performance.md` | Test layers, deterministic fixtures, measured baselines and budgets |
| Reliability | `reliability/failure-model.md`, `reliability/resource-bounds.md` | Overload, shutdown, process isolation, data loss, resource budgets and recovery semantics |
| Architectural quality | `architecture/fitness-functions.md` | Traceability between invariants, contracts, tests and measurements |

## Maintenance rules

- Label proposed behavior and unverified deployment assumptions explicitly.
- Keep this directory focused on engineering. Hosting-provider tutorials,
  deployment recipes, setup walkthroughs and generic process checklists do not
  belong here.
- Keep examples generic; never include clipboard contents, active bearer links,
  room IDs, secrets, credentials or private machine paths in evidence.
- Change affected documentation in the same commit as implementation.
- Keep one authoritative explanation per topic and link to it from this index.
- Prefer Mermaid diagrams and a machine-readable OpenAPI contract to a separate
  documentation-site dependency.
- Record benchmark tools, runtime, fixture sizes and hardware class. A build
  passing does not establish browser responsiveness or API latency.

Planning baseline: 2026-10-28. Implementation was authorized after the planning
handoff. The root engineering log records verified progress and actual commits.
