# FlowPilot Acceptance Specification

This document defines what counts as complete.

A phase is complete only when its criteria have evidence. Code, screenshots, or prose alone do not imply acceptance.

---

# Global Definition of Done

Applicable changes require:

## Product alignment
- follows PRODUCT-MODEL.md
- follows NATURAL-LANGUAGE-UX.md
- ordinary users are not required to learn internal IDs/DSL
- default surfaces remain simple
- professional detail is available on demand where relevant

## Code quality
- TypeScript strict mode passes when code exists
- no unexplained `any`
- boundaries are preserved
- external/persisted/model inputs are runtime validated
- failures are typed/actionable

## Tests/evidence
- relevant tests exist
- regressions get regression tests
- no production account is required for CI
- acceptance evidence is named in the handoff

## Security
- no secrets committed/logged
- no session/auth data sent to AI by default
- remote content gets no Node/filesystem/shell privileges
- no security challenge bypass

## Documentation
Update canonical documents when behavior, architecture, product semantics, or acceptance changes.

## Operational truth
- external operations have timeout/cancellation where applicable
- failure never silently becomes success
- evidence/provenance can be inspected
- sensitive fields are redacted

---

# D0 — Design Contract acceptance

D0 is complete when:

1. all required `design/` contract documents exist
2. "Simple by default, transparent on demand" is explicit and operationalized
3. Intent Home is the primary entry pattern, not a dense dashboard
4. natural language/Markdown is the primary authoring mechanism
5. ordinary flows do not require IDs, DSL, cron, selectors, workflow nodes, or machine configuration
6. Simple / Execution / Inspection layers are defined
7. progressive-disclosure rules specify what is hidden by default vs inspectable
8. contextual UI rules cover Source connection, ambiguity, confirmation, takeover, repair, and professional detail
9. component specs include all meaningful states (idle/loading/success/failure/paused/disabled where applicable)
10. screen specs cover the golden screens listed in DEVELOPMENT-PLAN
11. the golden user flow is documented end-to-end
12. image-generation mockups are treated as visual references, while written specs are implementation authority
13. dense prior SaaS/dashboard explorations are explicitly non-canonical
14. a Reviewer can determine whether a future UI implementation matches the design without inventing missing behavior

Required evidence:
- committed design contract
- reviewer checklist/mapping against D0 criteria

---

# P0 — Interactive Mock Prototype acceptance

P0 is complete when:

1. Electron + React prototype launches
2. prototype uses deterministic mocks and does not require real AI/WeChat/Git/backend automation
3. user can author the example task in ordinary natural language
4. FlowPilot shows a concise AI Understanding Review
5. Source connection appears only because the referenced Source is missing/unconnected
6. Source selection/authorization does not expose internal IDs
7. Input Preview shows the concrete article/cover selected for this run
8. simulated execution shows only useful default progress
9. irreversible publish pauses for explicit confirmation
10. success state is intentionally minimal
11. user can expand professional details after success
12. professional details expose mock provenance (TaskPlan/GoalPlan/Flow revision, Source version, InputBundle/run timeline)
13. technical detail is not permanently visible on the default path
14. navigation and page density conform to the D0 contract
15. the complete golden path can be demonstrated without explaining hidden UI conventions

Required evidence:
- automated build/typecheck where applicable
- screenshots/video or deterministic E2E walkthrough
- design-contract review
- handoff identifying usability gaps found

---

# E0 — Engineering Foundation acceptance

E0 is complete when a clean clone can run documented setup and:

```
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm dev
```

Additional:
1. Renderer has no Node integration
2. context isolation is enabled
3. preload is narrow and typed
4. third-party WebContentsView has no privileged preload surface
5. CI runs typecheck/lint/test/build
6. deterministic fixture site supports required variants
7. root commands are documented
8. no undocumented production credential is required

---

# E1 — Intent Compiler acceptance

E1 is complete when:

1. Goal can be authored as ordinary Markdown
2. Task can be authored as ordinary Markdown
3. no internal ID/DSL/cron is required
4. Goal source compiles to schema-validated versioned GoalPlan
5. Task source compiles to schema-validated versioned TaskPlan
6. unambiguous semantic references resolve to stable internal entities
7. material ambiguity returns a structured clarification requirement
8. user-facing text remains human-readable outside FlowPilot
9. changing Markdown creates a new compiled-plan revision
10. prior plan revisions remain auditable
11. provider access is behind a provider-neutral interface
12. fake/deterministic compiler providers support CI tests
13. unsafe/invalid structured model output is rejected

Required proof:
- natural-language fixture → structured plans
- ambiguity fixture → clarification
- modified source → revision N+1

---

# E2 — Source / InputBundle / Scheduling acceptance

E2 is complete when:

1. Local Folder Source is explicitly authorized and scoped
2. Local Git Repository Source is explicitly authorized and scoped
3. natural language cannot expand filesystem access beyond authorized Sources
4. Source data is resolved before Flow execution
5. Run receives an immutable InputBundle
6. changing a source file after InputBundle creation does not silently change the running Run
7. Git provenance records exact commit SHA + selected paths/hashes
8. required Goal inputs are validated before execution
9. missing inputs follow explicit Task policy
10. deterministic idempotency prevents duplicate irreversible publishing for the same logical input/destination
11. failed Run does not incorrectly advance consumption state
12. successful Run records exact TaskPlan, GoalPlan, Source snapshot, InputBundle and destination provenance
13. no new content can end SKIPPED with typed reason
14. natural-language schedule normalizes with explicit timezone
15. SKIP and RUN_ON_NEXT_START missed-schedule policies are supported semantically
16. tests use local fixtures only

---

# E3 — Deterministic Workflow Runtime acceptance

E3 is complete when:

1. Workflow IR validates
2. complete fixture flow executes through BrowserDriver
3. no LLM call occurs on happy-path execution
4. every meaningful Step verifies postconditions
5. missing target → TARGET_NOT_FOUND
6. ambiguous target → TARGET_AMBIGUOUS
7. unexpected state/navigation produces typed failure
8. successful Run records step evidence
9. failed Run records typed context
10. browser-library objects do not leak into persisted Workflow IR
11. BrowserDriver contract tests pass
12. one end-to-end fixture run passes

---

# E4 — AI Discovery / Repair acceptance

E4 is complete only when the automated scenario passes:

1. start fixture v1
2. discover/compile a valid Flow
3. execute successfully
4. execute again with zero model calls
5. switch fixture to v2
6. old Flow fails with typed localized failure
7. bounded RepairContext is created
8. repair proposes a local patch
9. patch passes schema/policy validation
10. candidate is trial-executed
11. expected state is reached
12. revision N+1 is persisted
13. revision N remains available
14. revision N+1 executes successfully again
15. second success uses zero model calls

Additional:
- secrets/session state never enter model context
- repair cannot override hard-stop safety policy
- invalid repair leaves prior Flow untouched
- repair provenance/diff is inspectable

---

# E5 — Human Takeover / Risk acceptance

E5 is complete when:

1. CAPTCHA fixture pauses
2. MFA/security fixture pauses
3. QR login can request takeover
4. runtime never asks AI to bypass those controls
5. user can manually interact
6. returning control triggers fresh snapshot
7. resume occurs only from recognized safe state
8. unsafe/unknown state does not auto-resume
9. destructive confirmation can pause before execution
10. rate limit uses backoff/pause, not rapid retries
11. default UI remains simple while professional detail can explain the pause

---

# E6 — WeChat Official Accounts MVP acceptance

Real-platform validation uses a controlled test account and is not CI-required.

E6 is complete when:

1. account/platform can be added
2. official page opens in isolated persistent session
3. user completes QR login manually
4. valid session can survive app restart
5. persisted learned article Flow opens editor
6. title is inserted
7. body is inserted
8. supported cover/summary input works
9. run reaches publish confirmation
10. irreversible publish follows confirmation policy
11. success is verified from platform/page state, not click success alone
12. login expiration becomes typed intervention state
13. a minor compatible UI change can use bounded repair
14. no CAPTCHA/MFA/security/stealth bypass is attempted
15. Run evidence identifies exact input/source/Flow used

---

# Release acceptance

A distributable release additionally requires:

- packaging smoke tests for supported targets
- no development secrets bundled
- migration path tested from previous release
- startup smoke test
- application-data location documented
- account/source removal behavior reviewed
- release notes/version
- code signing when public distribution begins

---

# Acceptance authority

Order of authority:

1. direct maintainer decision
2. accepted ADR
3. this specification
4. DEVELOPMENT-PLAN.md
5. product/design/architecture/security docs
6. Task Packets / Issues

A Task Packet or Issue may be stricter, but cannot silently weaken these gates.
