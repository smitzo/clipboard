# Clipboard refactor roadmap

Status: **implementation authorized**, 2026-10-28. Actual verified progress and
commit SHAs are recorded in the root `ENGINEERING_LOG.md`. The user's requested range is 120–150; the proposed target
is **140 meaningful commits: 14 phases × 10 commits**. Planning/setup changes are
outside this count. Resume the ordered boundaries below; completed work requires verification evidence.

## Delivery rules

1. Each numbered row is one intended focused commit with its relevant tests and
   docs. Titles are proposed messages, not claims of completed work.
2. Keep every commit working. Validate the changed behavior before committing;
   phase gates add integrated checks. Do not defer all tests to the final phase.
3. Never create empty commits, split formatting into padding, make artificial
   add/remove cycles, or separate a fix from its necessary regression coverage.
4. Keep the JavaScript stack and existing temporary-room product. Accounts,
   uploads, history, live collaboration, persistent storage, and unrelated
   features do not belong in this refactor.
5. Preserve routes and existing response keys. Record intentional corrections
   from [system design](system-design.md) with compatibility tests/migration notes.
6. Update the affected tracked docs with behavior changes. OpenSpec tasks/evidence
   remain local and ignored; this roadmap remains available in a fresh clone.
7. During implementation, record each completed ID, actual SHA, validation
   command/result and material limitations in a delivery ledger. Mark the matching
   local OpenSpec task complete only after verification. Hosted checks are separate.
8. If investigation changes a boundary, revise this plan before proceeding and
   retain a meaningful total in the requested range. Commit count is a delivery
   target, not permission to manufacture changes.
9. Stage only task-related files. Local commit authority follows the workspace
   workflow once this plan is accepted for implementation. Push/deploy is separate.

## Phase map and dependencies

The default is sequential delivery. A later extraction may be moved earlier
only if its dependency and verification remain explicit in the updated ledger.

| Phase | Commits | Focus | Entry dependency | Exit gate |
| --- | --- | --- | --- | --- |
| 1 | 001–010 | Tooling, behavioral and performance baselines | Planning handoff | Repeatable existing behavior and measurements |
| 2 | 011–020 | API structure and process lifecycle | Phase 1 | Testable app with unchanged public routes |
| 3 | 021–030 | Room rules and API contract | Phase 2 | Documented corrections and lifecycle regressions |
| 4 | 031–040 | Bounded storage and expiry | Phase 3 | Capacity/expiry correctness under stress |
| 5 | 041–050 | Security, privacy and server resilience | Phase 4 | Abuse/error/shutdown coverage without data leakage |
| 6 | 051–060 | Client architecture and boundaries | Phases 3 and 5 | Core journeys preserved after extraction |
| 7 | 061–070 | Async state and draft reliability | Phase 6 | Deterministic race and recovery checks |
| 8 | 071–080 | Visual direction and UI foundations | Phase 7 | Shared tokens and reviewed responsive shell |
| 9 | 081–090 | Editor and create/update experience | Phase 8 | Clear draft/save/dirty behavior |
| 10 | 091–100 | Join and share experience | Phases 7–9 | Reliable ID/link/QR/copy journeys |
| 11 | 101–110 | Expiry, mobile and accessibility | Phases 9–10 | Viewport/keyboard/accessibility matrix |
| 12 | 111–120 | Measured optimization | Phases 1 and 11 | Production bundle/API/interaction/memory budgets |
| 13 | 121–130 | Complete technical documentation | Phases 2–12 docs | Runnable docs and accurate contracts/diagrams |
| 14 | 131–140 | CI, reliability verification and final review | Phases 12–13 | Clean-clone verification and evidence handoff |

## 1. Tooling and trustworthy baselines

Keep existing behavior intact while making it observable. Baseline tests may
describe current quirks; phase 3 deliberately updates those expectations.

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 001 | `chore(tooling): define the supported runtime contract` | Check official runtime/tool support; align engines/version files and document the tested matrix. Verify clean installs and existing commands on the selected runtime. |
| 002 | `chore(tooling): add root development and check commands` | Orchestrate existing client/server packages without a lockfile migration. Verify start, check and teardown from the repository root. |
| 003 | `test(api): add isolated HTTP lifecycle fixtures` | Replace syntax-only confidence with a Node test runner and ephemeral-port process fixtures; prove API readiness, teardown and port isolation. |
| 004 | `test(rooms): characterize room sharing contracts` | Exercise create/read/update/delete through HTTP, including metadata and unchanged update expiry; use generic test content. |
| 005 | `test(api): capture current boundary and error behavior` | Characterize absent rooms, ID validation, text limits, current trimming/TTL coercion and body failures without treating defects as desired contracts. |
| 006 | `test(client): add browser-behavior component fixtures` | Configure component tests with controlled fetch/clipboard/URL/time adapters; verify create/join actions through rendered UI. |
| 007 | `test(e2e): cover cross-device clipboard journeys` | Add real local API/browser fixtures and independent contexts for create, query-link join, update and delete; prove isolation and teardown. |
| 008 | `test(ui): capture responsive and accessibility baselines` | Capture desktop/mobile states, focus order and automated accessibility findings; document manual checks and known gaps without claiming they passed. |
| 009 | `perf(baseline): add API and storage benchmark fixtures` | Measure route p50/p95, memory and event-loop behavior under fixed payloads/concurrency; retain commands/environment and sanitized results. |
| 010 | `perf(baseline): record browser and bundle measurements` | Record production eager/deferred bytes, maximum-text typing traces and network counts; establish repeatable comparison fixtures and phase-1 evidence. |

Gate: existing lint/build, API regression tests, core browser journeys and
reproducible baseline runs. Known defects remain listed with reproduction steps.

## 2. API boundaries and process ownership

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 011 | `refactor(server): extract an injectable Express app` | `createApp` returns an app without listening or scheduling; import tests and HTTP regressions prove side-effect-free construction. |
| 012 | `refactor(server): isolate environment configuration` | Move defaults/environment parsing into a config module with explicit inputs; verify existing valid configuration produces equivalent behavior. |
| 013 | `refactor(server): separate room routing from bootstrap` | Move room route registration behind an injected service boundary while retaining paths/statuses and error propagation. |
| 014 | `refactor(server): extract the room lifecycle service` | Give create/read/update/delete one domain owner; prove routes delegate without changing metadata, expiry or idempotent deletion. |
| 015 | `refactor(server): isolate authenticated text encryption` | Extract key derivation/AES-GCM adapters; verify Unicode round trips, distinct IVs and authentication failure without plaintext logging. |
| 016 | `refactor(server): introduce the in-memory repository` | Replace direct Map access with repository operations; retain existing behavior and test replacement/deletion consistency. |
| 017 | `refactor(server): inject time and room ID generation` | Inject clock/ID sources for deterministic expiry and collision fixtures; production continues using crypto and wall-clock adapters. |
| 018 | `refactor(server): centralize response serialization` | Share metadata/text response construction; assert public keys, timestamps and absence of internal ciphertext/key material. |
| 019 | `refactor(server): normalize HTTP error ownership` | Separate domain errors, route-not-found, parser and unexpected-error handling; verify one response and headers-sent propagation. |
| 020 | `refactor(server): own listener and cleanup lifecycles` | Put listen/scheduler/start/stop in bootstrap with injectable scheduling; verify no orphan timer/listener after repeated startup/shutdown. |

Gate: route compatibility, domain/HTTP regression suites and lifecycle leak checks.
Document owners and configuration flow as the modules land.

## 3. Room rules and explicit contracts

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 021 | `fix(config): reject invalid runtime limits at startup` | Validate finite port/TTL/text settings, min/default/max relationships and production secret requirements; fail before listening with redacted messages. |
| 022 | `fix(rooms): preserve accepted clipboard text exactly` | Stop trimming accepted payloads while rejecting whitespace-only text; verify trailing newlines, spaces, Unicode and round trips, and document the correction. |
| 023 | `fix(rooms): make TTL validation explicit` | Missing TTL uses default; reject non-integer, non-finite or out-of-range explicit TTL with 400; advertise and test the allowed range. |
| 024 | `fix(api): validate JSON room request shapes` | Handle absent/null/array/wrong-type bodies and unsupported media types with deliberate 4xx responses; test malformed and over-limit JSON. |
| 025 | `fix(rooms): standardize room ID validation` | Centralize accepted ID rules and error classification; verify encoded/path/whitespace edge cases without changing generated ID length. |
| 026 | `fix(rooms): enforce the exact expiry boundary` | Use `now >= expiresAt` consistently across read/update/cleanup; deterministic tests cover before/equal/after and preserved update TTL. |
| 027 | `feat(api): add stable machine-readable error codes` | Add error codes while retaining `message`; test missing/expired equivalence, invalid input and generic unexpected failures. |
| 028 | `feat(api): expose client-safe room capabilities` | Extend health/capabilities with min/default/max TTL and text limit; verify client-relevant fields and no secret/config leakage. |
| 029 | `feat(rooms): support conditional updates with revisions` | Add revision/ETag metadata and optional `If-Match`; atomically reject stale revisions with 412 while legacy unconditional updates still work. |
| 030 | `docs(api): specify corrected room behavior and compatibility` | Add executable contract fixtures and migration notes for text, TTL, expiry, errors and revisions; verify every correction against HTTP tests. |

Gate: deterministic lifecycle and HTTP contract checks, including legacy-client
fixtures and each intentional behavior correction.

## 4. Bounded storage and expiry

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 031 | `feat(storage): account for retained encrypted room bytes` | Track record count and conservative retained-byte cost on create/replace/delete; verify Unicode/ciphertext metadata accounting and repeated mutations. |
| 032 | `feat(storage): enforce measured room and byte capacities` | Select documented configurable defaults from phase-1 profiles; enforce both limits atomically with stable retryable capacity errors. |
| 033 | `fix(storage): keep replacements atomic at capacity` | Growing updates either fit or leave old data/revision/accounting intact; shrinking updates reclaim budget. Verify boundary and failure cases. |
| 034 | `perf(storage): index room expiry deadlines` | Add a deadline index for bounded due-entry work, with no timer per room; verify deletion/replacement cannot retain growing stale index entries. |
| 035 | `fix(storage): reclaim expired capacity before rejecting writes` | Use the deadline index to remove due entries before a capacity decision without scanning every live entry per request; verify expired capacity becomes reusable. |
| 036 | `feat(storage): bound cleanup work per scheduler turn` | Process due records in bounded batches with yielding; test large simultaneous expiry sets, clock injection and eventual reclamation. |
| 037 | `fix(storage): bound room ID collision retries` | Inject collisions and enforce finite generation attempts without replacing existing rooms; return a stable internal failure after exhaustion. |
| 038 | `fix(storage): make cleanup cancellation and disposal complete` | Dispose scheduler/index/store ownership cleanly; test repeated start/stop and callback completion during shutdown. |
| 039 | `test(storage): verify capacity and expiry under sustained churn` | Add a stress regression for mixed create/read/update/delete/expire operations with accounting invariants, bounded index size and no live-room eviction. |
| 040 | `docs(storage): record capacity sizing and lifecycle evidence` | Publish measured memory envelopes, chosen defaults and single-process limits; rerun phase-1 fixtures and record cleanup/event-loop tradeoffs. |

Gate: atomic capacity behavior, expiry stress checks, repeatable memory evidence
and bounded scheduler/index ownership. No persistent-store migration.

## 5. Security, privacy and server resilience

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 041 | `fix(security): generate unbiased cryptographic room IDs` | Replace modulo mapping with a crypto-backed unbiased sampler; verify alphabet/length/collision handling using deterministic fixtures. |
| 042 | `fix(security): validate secrets and crypto failure paths` | Define ephemeral development fallback versus explicit production secret policy; test tampered ciphertext, invalid tags and generic failure responses. |
| 043 | `fix(http): prevent room response caching` | Apply no-store policy to room/capability failures as appropriate; test success/error headers and document proxy/CDN assumptions. |
| 044 | `fix(http): make origin denial and preflight deliberate` | Validate allowed origins, return deliberate 403 denial and handle OPTIONS/requests without Origin correctly; test allowed and denied cases. |
| 045 | `fix(security): define proxy-aware rate-limit policies` | Configure validated trust-proxy policy and separate create/read/mutation budgets where justified; verify forwarded headers cannot bypass the configured policy. |
| 046 | `fix(http): normalize parser and rate-limit failures` | Make 413/415/429 responses machine-readable, retain Retry-After and apply security headers; verify the browser can interpret each failure. |
| 047 | `feat(observability): add redacted request diagnostics` | Add bounded request IDs, route-template/status/timing/error logs; tests assert bodies, raw paths, query strings, room IDs and secrets never appear. |
| 048 | `feat(health): distinguish liveness and readiness` | Define checks for initialized dependencies and draining state without leaking rooms; test startup, healthy, draining and failure responses. |
| 049 | `fix(server): drain requests on process shutdown` | Stop readiness/new work, bound drain time, close listener and dispose owned resources; verify in-flight completion and deadline behavior. |
| 050 | `docs(security): document the bearer-room threat model` | Record trust boundaries, server-side encryption limits, abuse controls, log retention and hosting assumptions; link implemented checks to threats. |

Gate: origin/rate/parser/security regressions, redaction assertions and process
shutdown integration. Security documentation makes no compliance/E2E claim.

## 6. Frontend architecture and behavior boundaries

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 051 | `refactor(client): isolate validated runtime configuration` | Centralize API URL resolution and validation, including normalized trailing paths; test configured and default development URLs. |
| 052 | `refactor(client): extract the validated API adapter` | Move fetch/room methods and runtime response validation out of App; handle JSON, empty 204, non-JSON failures and compatible extra fields. |
| 053 | `refactor(client): isolate room ID and URL parsing` | Centralize ID/link parsing and serialization without render side effects; verify query/path/encoding/invalid-link fixtures. |
| 054 | `refactor(client): model room state transitions explicitly` | Introduce a reducer/controller for current metadata, pending operation and terminal states; verify allowed transitions through public user actions. |
| 055 | `refactor(client): separate drafts from confirmed room text` | Track editable text, saved snapshot and dirty status; preserve existing explicit-save flows and add behavior tests for independent ownership. |
| 056 | `refactor(client): extract the clipboard editor feature` | Move editor/create/update presentation behind a small controller contract; existing rendered-UI and browser journeys stay green. |
| 057 | `refactor(client): extract the room join feature` | Give join input/form its own boundary while sharing parsing/controller behavior; test manual and query-link join parity. |
| 058 | `refactor(client): isolate browser sharing adapters` | Extract clipboard write, QR generation and download adapters with deterministic rejection fixtures; preserve visible controls. |
| 059 | `refactor(client): give feedback and timers one owner` | Centralize operation/copy feedback with cleaned-up timers and stable announcements; test rapid copies, replacement notices and unmount. |
| 060 | `refactor(client): reduce App to feature composition` | Compose extracted features and navigation with explicit dependencies; remove duplicated state paths and rerun full core journeys. |

Gate: component behavior tests, real-API core journeys, lint/build and a documented
state ownership diagram. Keep dependencies small; no mandatory new state library.

## 7. Async reliability and draft integrity

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 061 | `fix(client): abort superseded room reads` | Use AbortController and request identity for reads; reversed completion order cannot overwrite the latest room or error state. |
| 062 | `fix(client): bound request time and support cancellation` | Distinguish timeout, abort, network and server errors; clear timers/listeners on every path and allow deliberate user recovery. |
| 063 | `fix(client): deduplicate automatic and explicit joins` | Share the active read identity across URL, debounce and manual paths; verify one current read per settled ID, including StrictMode remount behavior. |
| 064 | `fix(client): scope pending state to each operation` | Older finally handlers cannot clear newer loading state; rapid join/save/delete interactions have deterministic disabled/busy behavior. |
| 065 | `fix(client): preserve edits made while saving` | Save captures a snapshot; a delayed success updates confirmed text without replacing newer typing. Test create and update separately. |
| 066 | `feat(client): protect unsaved text when switching rooms` | Offer clear stay/discard choices before replacing a dirty draft, including query navigation; cancellation preserves text and active room. |
| 067 | `feat(client): handle stale room update conflicts` | Send optional revision preconditions; on 412 retain the local draft and offer deliberate reload/reapply options without blind overwrite. |
| 068 | `fix(client): synchronize active room and browser navigation` | Handle query restoration, popstate and deletion cleanup using the controller; test back/forward, invalid links and unchanged unrelated URL state. |
| 069 | `fix(client): recover reads without retrying mutations` | Bound any read retry using server hints and visible state; never auto-replay POST/PUT/DELETE after uncertain network completion. |
| 070 | `test(client): cover interleaved room operations and teardown` | Add adversarial delayed/reordered responses, unmounts and delete-then-read fixtures; verify no lost drafts, stale rooms or leaked timers. |

Gate: deterministic race tests plus browser journeys for unsaved text, conflicts,
navigation and recovery. No hidden polling or background mutation retries.

## 8. Visual direction and shared UI foundations

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 071 | `docs(ui): define the clipboard visual direction` | Compare phase-1 screenshots with a small reference board and record chosen hierarchy, density and green identity; define concrete visual acceptance examples. |
| 072 | `style(ui): establish semantic color and surface tokens` | Replace repeated palette literals with semantic CSS tokens for text, surfaces, borders, action/error states; verify contrast and screenshot consistency. |
| 073 | `style(ui): unify spacing typography and responsive scales` | Introduce a restrained spacing/type/radius system and replace ad hoc values; verify readable line lengths and zoom behavior. |
| 074 | `refactor(ui): standardize accessible button contracts` | Normalize variants, loading labels, icon semantics, focus and disabled behavior; verify keyboard and accessible names for all button variants. |
| 075 | `feat(ui): add consistent labelled field primitives` | Share input/textarea/select label, hint and error relationships; verify IDs, aria-describedby and native form semantics. |
| 076 | `refactor(ui): unify panels and state badges` | Create practical panel/status primitives with consistent heading hierarchy; ensure semantic color is accompanied by readable state text. |
| 077 | `feat(ui): add accessible confirmation dialogs` | Provide focus containment/restoration, Escape and labelled actions for dirty-draft/deletion decisions; test keyboard and nested announcement behavior. |
| 078 | `style(layout): improve the responsive workspace shell` | Align editor/join/share proportions across target widths with sensible maximum reading width and no horizontal overflow. |
| 079 | `style(navigation): simplify header and page introduction` | Improve navigation alignment, hero scale and mobile density while keeping skip-link and primary editing controls discoverable. |
| 080 | `style(feedback): unify inline errors and operation notices` | Separate persistent actionable errors from brief copy confirmation; verify feedback does not cover controls and announcements avoid duplication. |

Gate: reviewed screenshots at all target widths, primitive behavior tests,
contrast/focus checks, lint/build and unchanged core journeys.

## 9. Editor, creation and update experience

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 081 | `feat(editor): clarify draft active and saved states` | Replace generic room-created labelling with draft/active/dirty/saving/saved states; verify create and joined-room presentations. |
| 082 | `feat(editor): validate text against server capabilities` | Show a clear limit/count and whitespace-only validation while preserving text fidelity; test configured limits and unavailable capability fallback. |
| 083 | `style(editor): improve text readability and usable height` | Refine editor line height, padding, resize behavior and focus treatment for long text/snippets; verify 20,000-character and mobile fixtures. |
| 084 | `feat(editor): explain and validate expiry choices` | Build choices from advertised TTL bounds with readable lifetime help; server validation remains authoritative and invalid configurations have clear fallback. |
| 085 | `feat(editor): make create and update actions unambiguous` | Distinguish initial sharing from saving edits; disable redundant/invalid submissions with a visible reason, not color alone. |
| 086 | `feat(editor): keep save failures actionable beside the draft` | Preserve text and field context on validation/network/capacity failure; offer a deliberate retry without erasing user edits. |
| 087 | `feat(editor): show saved revision and unsaved differences` | Display confirmed save time/state and a deliberate discard-to-saved action; verify cancelling preserves text and discarding never deletes the room. |
| 088 | `feat(editor): confirm room deletion with clear consequences` | Use the shared dialog, retain context while deleting, and clear state only on success; test failure/cancel/double-click paths. |
| 089 | `style(editor): improve mobile action grouping` | Keep save/copy/delete controls readable and reachable with touch targets and virtual-keyboard space; verify portrait/landscape/zoom layouts. |
| 090 | `test(editor): verify complete draft and save journeys` | Add integrated create/edit/save/error/discard/delete scenarios including typing during save and maximum-length text; update editor interaction docs. |

Gate: editor journeys against the real API, keyboard/mobile checks and screenshots
of draft, active, dirty, error and deletion states.

## 10. Joining and sharing

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 091 | `feat(join): clarify room ID and link input feedback` | Show parsing/validation near the field, accept supported links and IDs, and avoid requests for partial/invalid input. |
| 092 | `feat(join): make automatic joining visible and cancellable` | Explain debounced loading and retain manual submit/retry; cancellation and dirty-draft choices must not unexpectedly restart a join. |
| 093 | `feat(join): distinguish missing expired and connection states` | Present honest missing-or-expired server results separately from connection failure; preserve local text and give a useful next action. |
| 094 | `style(sharing): improve room identity and link presentation` | Make current room identity and share affordances scannable; long links wrap, bearer access is explained and inactive rooms are not shareable. |
| 095 | `fix(sharing): handle QR failures and stale generation` | Give QR work a generation identity and visible retry; a prior room's QR cannot replace the current room or survive deletion. |
| 096 | `feat(sharing): improve clipboard permission fallbacks` | Detect unsupported/denied writes and provide a selectable fallback; verify text, ID and link copy success/failure with accessible feedback. |
| 097 | `fix(sharing): make QR downloads reliable and disposable` | Handle unavailable generation/download failures and release object URLs/resources where used; verify output represents the current room link. |
| 098 | `feat(sharing): add capability-based native link sharing` | Offer the browser share sheet when available, retain copy fallback, and treat user cancellation without an error alert; never share clipboard text implicitly. |
| 099 | `docs(ui): explain room access and temporary retention in context` | Refine concise privacy/expiry help in join/share/instructions, accurately stating server-side encryption and restart behavior. |
| 100 | `test(sharing): verify two-device room handoff paths` | Exercise ID, link and QR-payload handoffs across independent contexts, plus failed copy/QR/native share; verify deletion invalidates sharing UI. |

Gate: real-API cross-context journeys, clipboard/share failure fixtures, QR payload
validation and responsive screenshots. QR scanning hardware is a separate manual check.

## 11. Expiry, accessibility and mobile polish

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 101 | `feat(rooms): reflect expiry in active room controls` | Use server expiry metadata to transition active rooms at the boundary and disable invalid actions; retain local text and explain recovery. |
| 102 | `fix(rooms): reconcile expiry after backgrounding and clock changes` | Refresh derived lifecycle state on visibility/focus without polling or extending TTL; test suspended tabs, clock skew and stale timer callbacks. |
| 103 | `fix(a11y): make focus movement match room actions` | Define focus after join/create/delete/dialog/error and route changes; keyboard tests verify focus is never lost or moved during typing. |
| 104 | `fix(a11y): correct status and error announcements` | Eliminate duplicate live regions, label busy work and keep actionable errors available; run automated checks plus a recorded screen-reader smoke pass. |
| 105 | `fix(a11y): meet contrast zoom and target-size requirements` | Check all state/disabled/focus variants, 200% zoom and touch targets; address findings with documented contrast measurements. |
| 106 | `fix(mobile): prevent overflow and virtual-keyboard occlusion` | Validate 320/390 px portrait and landscape, long identifiers/URLs and keyboard-open editor; adjust layout with screenshot/browser evidence. |
| 107 | `fix(ui): respect reduced motion and forced colors` | Cover spinners, dialogs, transitions, focus and system high-contrast mode; verify visibility/meaning without motion or palette dependence. |
| 108 | `fix(client): recover from unexpected render failures` | Add a minimal error boundary with local-draft preservation where feasible and explicit limits; test fallback/reload without logging clipboard state. |
| 109 | `test(ui): enforce the responsive accessibility matrix` | Convert resolved baseline findings into robust behavior/a11y checks across representative browsers and sizes; avoid brittle pixel-only assertions. |
| 110 | `docs(frontend): document final interaction and accessibility contracts` | Record component/state/focus/expiry behavior, manual findings and any remaining browser limitations; link current screenshots and tests. |

Gate: full viewport matrix, automated accessibility checks, manual keyboard,
screen-reader and mobile smoke evidence. Document what was actually checked.

## 12. Measure and optimize

Optimization commits must include before/after evidence. If a proposed mechanism
shows no benefit, revise the boundary toward a demonstrated issue rather than
adding speculative memoization or claiming an improvement.

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 111 | `perf(tooling): enforce production bundle budgets` | Add repeatable gzip accounting for all eager JS/CSS chunks and report lazy chunks; verify the checker fails on a controlled over-budget fixture. |
| 112 | `perf(tooling): automate interaction timing measurements` | Run fixed maximum-text typing/paste and room-transition traces with p50/p95 reporting; document desktop/mobile-emulation environments. |
| 113 | `perf(tooling): compare API and memory benchmarks reproducibly` | Automate phase-1 versus current fixture comparisons, warmup and sample reporting without noisy default CI wall-time assertions. |
| 114 | `perf(sharing): load QR generation only when required` | Dynamically import QR on an active share link; preserve retry/cache behavior and prove initial-byte reduction plus first-QR latency. |
| 115 | `perf(editor): isolate high-frequency text rendering` | Use measured ownership/component changes so typing does not regenerate sharing/navigation work; compare traces at 20,000 code units. |
| 116 | `perf(client): eliminate measured duplicate requests and effect work` | Use network/effect traces to remove redundant capabilities/join/QR work across mount/navigation; verify no stale-data or recovery regression. |
| 117 | `perf(styles): reduce measured CSS and icon overhead` | Review generated styles/import paths and replace proven repeated cost while preserving tokens/accessibility; compare complete production bytes and screenshots. |
| 118 | `perf(storage): tune cleanup scheduling from load evidence` | Tune batch/index scheduling using measured API p95 and event-loop delay at capacity; retain accounting/expiry correctness and disposal checks. |
| 119 | `perf(server): reduce measured room serialization overhead` | Profile read/update paths and remove demonstrated redundant allocation/serialization work; compare small/maximum payload latency and CPU without exposing plaintext. |
| 120 | `docs(performance): publish measured budgets and tradeoffs` | Rerun the complete benchmark matrix, record before/after results, enforce agreed budgets, and explain any reviewed budget change without claiming deployed gains. |

Gate: <=70 kB initial JS gzip; CSS at baseline budget unless documented; p95 typing
<100 ms in the fixed desktop fixture; API p95 within 10% of baseline under matched
conditions; bounded storage/expiry growth. Derive and record numeric memory and
event-loop budgets from measurements before enforcing them.

## 13. Technical documentation system

Docs contain system design, engineering decisions and measured tradeoffs only.
No hosting-provider guides, deployment tutorials, generic setup or release
checklists belong in docs/. Local commands remain in the root README.

Documentation begins with earlier phases; these commits consolidate, validate
and fill distinct technical gaps. Do not postpone behavior docs until this phase.

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 121 | `docs(architecture): catalogue system invariants and dependencies` | Document runtime assumptions, dependency boundaries and invariants with links to executable checks; keep setup commands in the root README. |
| 122 | `docs(config): explain configuration constraints and failure semantics` | Document configuration defaults/ranges, fail-fast relationships and security consequences; compare the model against the validated schema. |
| 123 | `docs(architecture): publish system boundaries and isolation model` | Expand the verified design into context/container/component diagrams, process isolation and single-instance constraints matching current paths. |
| 124 | `docs(architecture): explain room lifecycle and failure sequences` | Add create/join/save/conflict/delete/expire/shutdown sequences, state diagram and invariants; cross-check against tests and implementation. |
| 125 | `docs(api): publish an executable OpenAPI contract` | Describe all routes/headers/errors/capabilities/revisions and generic examples; validate schemas against HTTP fixtures, including legacy updates. |
| 126 | `docs(adr): record major refactor decisions and alternatives` | Index ADRs for ephemeral storage, encryption boundary, capacity/expiry, frontend state, runtime and performance choices; record actual outcomes, not invented history. |
| 127 | `docs(frontend): publish design tokens and component usage` | Consolidate state ownership, token semantics, primitives and interaction/a11y examples; ensure snippets and screenshots match shipped components. |
| 128 | `docs(quality): explain regression and performance workflows` | Publish test layers, local commands, deterministic fixtures, benchmark limits and privacy-safe artifacts; execute documented commands. |
| 129 | `docs(reliability): explain overload shutdown and recovery semantics` | Model capacity/rate failures, graceful draining, process restart data loss and recovery tradeoffs; verify against lifecycle tests without platform tutorials. |
| 130 | `docs(architecture): map invariants to architectural fitness checks` | Connect design invariants to contract, dependency, accessibility and performance checks; verify documentation links and technical examples. |

Gate: documentation links and API schema fixtures pass; diagrams match modules;
invariants and reliability claims trace to executable engineering checks.

## 14. CI, operational rehearsal and final review

| ID | Intended commit | Deliverable and verification |
| --- | --- | --- |
| 131 | `ci(quality): run reproducible server and client checks` | Add locked installs, selected runtime matrix, lint/build/domain/HTTP jobs and explicit failure behavior; validate equivalent local commands and workflow structure. |
| 132 | `ci(browser): run real-API clipboard journeys` | Wire browser/a11y fixtures with startup/readiness/teardown and sanitized failure artifacts; run the same job locally and separate hosted status. |
| 133 | `ci(contracts): check docs API schemas and bundle budgets` | Enforce links/OpenAPI/compatibility and deterministic byte budgets; prove each check detects a deliberately broken fixture. |
| 134 | `ci(dependencies): document and automate dependency hygiene` | Add scoped audit/update procedures and lockfile reproducibility checks; triage actual findings, avoid blind major upgrades and keep exceptions explicit. |
| 135 | `test(operations): rehearse restart and graceful-drain behavior` | Exercise startup failure, draining, request deadlines and restart room loss using real processes; verify documented client recovery and redacted diagnostics. |
| 136 | `test(resilience): exercise capacity and hostile request scenarios` | Run bounded burst, malformed/oversized body, wrong-origin, rate-limit and mass-expiry scenarios; assert consistent errors and resource recovery. |
| 137 | `test(release): verify the complete cross-browser room lifecycle` | Exercise create/ID/link/QR-payload join, edit/conflict/copy/delete/expiry at target viewports; record manual mobile/QR limitations honestly. |
| 138 | `test(reliability): verify version rollback and restart consequences` | Rehearse API compatibility and process restart in isolation; document ephemeral data loss, client reconciliation and code rollback constraints as engineering behavior. |
| 139 | `refactor(quality): resolve final maintainability review findings` | Review ownership/duplication/dead paths and address concrete findings with regression evidence; remove obsolete code only with existing user authorization or explicit approval. |
| 140 | `docs(handoff): reconcile commit ledger and verification evidence` | Verify all planned IDs map to actual meaningful SHAs, rerun final gates, update docs/OpenSpec state and record remaining hosted/manual limits without claiming deployment. |

Gate: clean-clone local checks, full browser/HTTP suites, documentation/contracts,
production budgets, resilience/restart rehearsal and a complete commit ledger.
Workflow files do not count as hosted CI passing until hosted evidence exists.

## Validation commands and evidence

Commands available at planning time:

```sh
npm --prefix server test
npm --prefix client run lint
npm --prefix client run build
OPENSPEC_TELEMETRY=0 openspec validate --all --strict --no-interactive
git diff --check
```

Phase 1 will introduce the root orchestration and behavioral/browser commands;
later phases will document their actual names. Never report planned scripts as
already runnable. A phase record must include changed behavior, actual commit
IDs, commands/results, performance evidence where relevant and remaining limits.

Current verified baseline: server syntax, client lint and client build pass;
JavaScript is 240.61 kB / 77.23 kB gzip, CSS is 28.19 kB / 6.54 kB gzip.
No behavioral, browser, load or deployment result is claimed for this plan.

## Definition of done

All accepted roadmap tasks are implemented and verified; the actual meaningful
commit count remains within 120–150; supported room flows and documented
corrections pass; the UI meets the recorded visual/accessibility matrix;
performance budgets have repeatable evidence; docs describe the final system;
secrets/clipboard data are absent from source and artifacts; and local versus
hosted/manual verification is explicit. Publishing, pushing and deployment are
separate actions outside this planning handoff.
