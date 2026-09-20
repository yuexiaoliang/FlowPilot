# Task Packet Template

Copy this template for a bounded agent assignment when useful.

A Task Packet may live in a PR description, temporary work note, or `work/` document. It is not required to become a GitHub Issue.

---

# <Task ID>: <Short name>

## Role

Builder | Reviewer | Planner

## Phase

Example: D0 — Design Contract

## Goal

One or two sentences describing the concrete outcome.

## Why now

Which prerequisite/gate this advances.

## Canonical references

Read:
- AGENTS.md
- PROJECT-STATE.md
- DEVELOPMENT-PLAN.md
- ACCEPTANCE.md
- <relevant design/architecture docs>

## In scope

- ...
- ...

## Out of scope

- ...
- ...

## Expected files/artifacts

- ...
- ...

## Constraints

List relevant non-negotiable product, architecture, security, or design rules.

## Acceptance mapping

Explicitly cite the acceptance criteria this task must satisfy.

Example:

```
Acceptance: D0.1, D0.3, Global Definition of Done
```

## Validation

Commands/reviews/evidence required:

```
pnpm typecheck
pnpm test
...
```

For design work:
- compare against DESIGN-PRINCIPLES
- verify all required states
- verify simple/professional disclosure hierarchy

## Stop conditions

Stop and escalate instead of guessing if:
- ...
- ...

## Handoff

Use `docs/HANDOFF-TEMPLATE.md`.
