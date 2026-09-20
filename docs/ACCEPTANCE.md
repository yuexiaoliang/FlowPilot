# FlowPilot Acceptance Specification

This document defines **what counts as complete**.

A feature or milestone is not complete merely because code exists. It must satisfy the relevant acceptance criteria below.

---

# Global Definition of Done

Every implementation change must satisfy, where applicable:

## Code quality

- TypeScript strict mode passes.
- No unexplained `any`.
- No architecture boundary violations.
- Public/external/persisted inputs are runtime validated.
- Errors are typed and actionable.

## Tests

- relevant unit tests exist
- integration tests exist for cross-boundary behavior
- regression tests exist for fixed defects
- no production account is required for CI

## Security

- no secrets committed
- no session/auth data logged
- no credentials passed to AI unless explicitly reviewed
- third-party content has no Node/filesystem/shell access
- security challenges do not get silently bypassed

## Documentation

Update documentation when:
- commands change
- architecture changes
- Workflow IR changes
- data model changes
- security behavior changes
- user-visible behavior changes materially

## Operational behavior

- timeouts/cancellation exist for external operations
- failure does not silently become success
- logs contain correlation/run context
- sensitive fields are redacted

---

# A0 — Repository foundation acceptance

Milestone 0 is complete when:

### Fresh clone

A developer/agent can run:

```
corepack enable
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm dev
```

without undocumented manual setup beyond platform prerequisites.

### Desktop security

Verify:
- Renderer does not have Node integration.
- Context isolation is enabled.
- preload exposes narrow typed APIs.
- third-party WebContentsView receives no privileged preload API.

### CI

A pull request runs automated:
- typecheck
- lint
- unit tests
- build

### Fixture platform

Tests can deterministically choose fixture variants:
- v1
- v2
- v3
- auth expired
- security challenge
- publish success/failure

No real remote platform is required.

---

# A1 — Deterministic runtime acceptance

Milestone 1 is complete when:

1. A valid Flow IR document can be loaded and validated.
2. The runtime executes a complete fixture publishing flow using BrowserDriver.
3. No LLM/API model call occurs during the run.
4. Each meaningful step verifies its postcondition.
5. Missing targets produce TARGET_NOT_FOUND.
6. Ambiguous targets produce TARGET_AMBIGUOUS.
7. Wrong resulting page/state produces POSTCONDITION_FAILED or NAVIGATION_UNEXPECTED.
8. A successful run records step evidence and ends SUCCEEDED.
9. A failed run ends FAILED with typed failure context.
10. Browser-specific objects do not appear in persisted Workflow IR.

Required proof:
- automated tests
- one E2E fixture run

---

# A2 — Persistence/session acceptance

Milestone 2 is complete when:

1. A Flow persists across application restart.
2. Flow revisions remain immutable.
3. A Run references the exact revision executed.
4. Two accounts on the same platform use isolated browser sessions.
5. Session A cannot see Session B's cookies/auth state in the fixture environment.
6. Removing an account clears its local browser/session material.
7. database migrations run atomically.
8. an interrupted/failed migration does not silently corrupt the existing DB.
9. secrets are stored through the secret abstraction, not ordinary plaintext columns/logs.

---

# A3 — Goal compilation and Discovery acceptance

Milestone 3 is complete when:

1. The model provider is accessed through a provider-neutral interface.
2. A user can author a Goal as ordinary Markdown without internal IDs, @goal/@source syntax, cron, selectors, or FlowPilot DSL.
3. Goal Markdown compiles into a schema-validated versioned GoalPlan.
4. A material ambiguity in Goal/platform/account resolution produces a structured clarification request instead of a silent guess.
5. A sanitized snapshot is produced before every discovery model call.
6. Fixture-injected fake secrets do not appear in captured model request fixtures.
7. Discovery returns structured data validated by schema.
8. Invalid model output is rejected safely.
9. A discovered workflow must be compiled/validated before persistence.
10. Fixture v1 can be learned from a GoalPlan.
11. The persisted learned Flow can later execute with zero model calls.
12. Changing Goal Markdown creates a new compiled plan revision rather than silently mutating the prior plan.

Required proof:

```
goal
→ AI discovery
→ Flow revision 1
→ close/reload runtime
→ execute revision 1 without AI
→ success
```

---

# A4 — Repair acceptance

This is the most important technical milestone.

Milestone 4 is complete only when this automated scenario passes:

## Scenario

1. Start fixture platform in v1.
2. Discover or load a valid v1 Flow.
3. Execute successfully.
4. Switch fixture platform to v2.
5. Execute old Flow.
6. Runtime fails at the changed region with a typed failure.
7. Repair receives bounded context.
8. Repair proposes a local patch.
9. Candidate patch is policy/schema validated.
10. Candidate patch is trial-executed.
11. Expected state is reached.
12. Flow revision N+1 is persisted.
13. Revision N remains available.
14. Execute revision N+1 again.
15. Run succeeds.
16. Second successful run does not invoke AI.

Additional criteria:
- repair cannot modify secret/session state
- repair cannot override hard-pause security policy
- repair records provenance and diff
- invalid repair proposal leaves prior Flow untouched

---

# A5 — Human takeover/risk acceptance

Milestone 5 is complete when:

1. Fixture CAPTCHA state pauses automation.
2. Fixture MFA/security challenge pauses automation.
3. QR login state can request user takeover.
4. Runtime does not ask AI to solve/bypass those challenges.
5. User can manually interact with the page.
6. Returning control triggers a fresh snapshot.
7. Resume occurs only if a recognized safe state is verified.
8. Unknown/unsafe state does not auto-resume.
9. destructive-action confirmation can pause before execution.
10. rate-limit state uses backoff/pause rather than rapid retry.

---

# A6 — WeChat Official Accounts MVP acceptance

This milestone is real-platform validation and should not be required in automated CI.

Use a controlled test account.

Acceptance:

1. User can add the platform/account.
2. App opens the correct official platform page.
3. User can complete QR login manually.
4. Closing/restarting the app reuses the existing valid session when available.
5. A previously learned article workflow can open the editor.
6. Title can be inserted.
7. Body can be inserted.
8. supported cover/summary operations work.
9. runtime can reach the publish confirmation stage.
10. irreversible publish requires the configured confirmation policy.
11. success is verified using page/platform state, not only a click result.
12. login expiration becomes a typed auth/user-intervention state.
13. a minor compatible UI change can trigger bounded repair rather than full relearning.
14. no CAPTCHA/MFA/security bypass is attempted.

Evidence should include:
- run log
- workflow revision
- repair record if repair was exercised
- manual validation notes


---

# A7 — Task, Source, and scheduled automation acceptance

Milestone 7 is complete when:

1. A user can author a Task in ordinary Markdown such as “每天早上 8 点从我的行业学习仓库找到今天最新的文章并发布到微信公众号”.
2. The Markdown does not require internal Goal IDs, Source IDs, cron expressions, or binding syntax.
3. FlowPilot can semantically resolve an unambiguous existing Goal and authorized Source.
4. Material ambiguity produces contextual clarification rather than guessing.
5. Local Folder access is scoped to a user-authorized root.
6. Local Git Repository runs record the exact commit SHA and selected file paths/content hashes.
7. Source data is fully resolved before the Flow begins.
8. A Run receives an immutable InputBundle and does not silently reread changed Source files mid-run.
9. Missing required Goal inputs follow an explicit Task policy and cannot silently become empty values.
10. Two runs with the same irreversible destination and same deterministic idempotency key cannot both successfully publish the same source version.
11. A failed Run does not incorrectly advance the Source consumption cursor.
12. A successful Run records sufficient provenance to identify the exact GoalPlan, TaskPlan, Flow revision, Source snapshot, and InputBundle used.
13. “No content today” can end as SKIPPED with a typed reason rather than FAILED.
14. Natural-language schedules are normalized with an explicit timezone.
15. Missed schedule policy supports at least SKIP and RUN_ON_NEXT_START.
16. Scheduler tests use fixture/local sources and never publish to production accounts in CI.

---

# Release acceptance

A distributable release additionally requires:

- packaging test on supported OS targets
- no development secrets bundled
- migrations tested from previous release
- crash on startup not observed in smoke test
- application data location documented
- uninstall/account removal behavior reviewed
- release notes
- version number
- code signing when public distribution begins

---

# Acceptance authority

Order of authority:

1. direct maintainer decision
2. accepted ADR
3. this acceptance specification
4. DEVELOPMENT-PLAN.md
5. GitHub Issues / task notes

An Issue may add stricter acceptance criteria, but must not silently weaken these requirements.
