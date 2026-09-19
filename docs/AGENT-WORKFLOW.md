# Agent Development Workflow

This document defines how coding agents should work on FlowPilot.

The project is **document-driven**, not Issue-driven.

GitHub Issues are optional coordination/tracking artifacts.

---

# Before coding

Every agent must read:

1. `AGENTS.md`
2. `docs/DEVELOPMENT-PLAN.md`
3. `docs/ACCEPTANCE.md`
4. `docs/ARCHITECTURE.md`
5. relevant feature/domain documentation
6. relevant ADRs

Then inspect the repository state.

Do not assume the latest GitHub Issue describes the canonical plan.

---

# Selecting the next task

Determine:
- earliest incomplete milestone
- blockers
- smallest coherent vertical slice
- required acceptance criteria

Prefer a slice that can be fully completed and tested in one change.

Do not start later milestones to avoid finishing an earlier hard problem.

Examples:

Good:
- BrowserDriver + one fixture-backed click/fill path

Bad:
- start WeChat integration while deterministic runtime is unfinished

---

# Before implementation

Write down internally or in the PR/task:
- goal
- files/modules likely affected
- architecture boundaries involved
- acceptance criteria
- tests required
- security/session implications

If the work changes a locked architectural choice, create an ADR before or with the implementation.

---

# Implementation rules

Follow AGENTS.md.

Particularly:
- use BrowserDriver
- no AI in happy-path execution
- no raw secrets in prompts/logs
- validate external/model/persisted data
- preserve old Flow revisions
- prefer local repair
- use human takeover for security gates

---

# Validation sequence

Before considering work complete, run the applicable subset of:

```
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm package
```

Do not claim a command passed if it was not run.

If a command cannot run because of environment limitations, state exactly what was not verified.

---

# Handoff format

When an agent finishes work, its handoff should contain:

## Completed
What was implemented.

## Validation
Exact commands/tests run and results.

## Acceptance mapping
Which ACCEPTANCE.md criteria are now satisfied.

## Architecture/security notes
Any decisions or implications.

## Remaining work
What is still incomplete in the current milestone.

## Known limitations
Anything intentionally deferred.

This is more important than an Issue checkbox.

---

# Documentation updates

Update:
- DEVELOPMENT-PLAN.md when planned sequence/scope changes
- ACCEPTANCE.md when completion semantics change
- ARCHITECTURE.md when boundaries/responsibilities change
- WORKFLOW-IR.md when workflow semantics change
- SECURITY.md when trust/auth/AI boundaries change
- ADR when a durable architecture choice changes

Do not rewrite planning documents simply to describe implementation details. Keep them stable and high-level.

---

# GitHub Issues

Issues can be used for:
- assigning work
- discussion
- bug reports
- tracking a smaller implementation slice
- linking PRs

Issues are **not required**.

If Issues are used, they should link back to the relevant milestone and acceptance section rather than duplicate the full specification.

Recommended Issue format:

```
Plan: Milestone 1 / 1.3 ElectronDriver
Acceptance: A1 items 2, 4, 5, 6

Scope:
...

Out of scope:
...

Validation:
...
```

---

# When an agent encounters ambiguity

Use this decision order:

1. preserve architecture and safety boundaries
2. choose the smallest reversible implementation
3. avoid adding infrastructure
4. keep domain abstractions implementation-neutral
5. document material decisions
6. create an ADR when the decision is durable and expensive to reverse

Do not invent a large new subsystem just because a local implementation detail is unclear.
