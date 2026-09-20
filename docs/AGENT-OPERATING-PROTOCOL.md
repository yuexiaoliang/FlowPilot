# FlowPilot Agent Operating Protocol

This document defines how independent coding/design agents coordinate through the repository without relying on chat history.

## Principle

**The repository is the shared memory.**

An agent must be able to enter with no prior conversation context, inspect the repository, determine the current approved direction, complete one bounded slice, validate it, and leave enough evidence for the next agent.

## Canonical control loop

```
Read rules
→ Read project state
→ Read development plan
→ Read acceptance
→ Choose one bounded slice
→ Implement
→ Validate
→ Update project state
→ Leave handoff
```

Do not skip directly from "read request" to "write code".

## Required reading order

Every agent must read, in order:

1. `AGENTS.md`
2. `docs/PROJECT-STATE.md`
3. `docs/DEVELOPMENT-PLAN.md`
4. `docs/ACCEPTANCE.md`
5. `docs/PRODUCT-MODEL.md`
6. `docs/NATURAL-LANGUAGE-UX.md`
7. relevant design/architecture/security documents
8. relevant ADRs

The agent may then inspect code/tests/history.

## Task selection

Unless the maintainer explicitly assigns a different task, the agent should:

1. identify the current phase from PROJECT-STATE.md
2. find the first incomplete gate/slice in DEVELOPMENT-PLAN.md
3. verify prerequisites are satisfied
4. choose the smallest coherent deliverable that can be completed and validated
5. create/use a Task Packet based on TASK-PACKET-TEMPLATE.md

Do not jump ahead because a later feature is more interesting.

## Change size

One agent run should usually produce one reviewable vertical slice.

Good examples:
- finalize Intent Home screen spec + states + interaction rules
- implement mock Intent Editor → Understanding Review interaction
- implement LocalFolderSource read-only adapter + tests
- implement one BrowserDriver contract method end-to-end

Bad examples:
- "build the whole app"
- redesign UI + replace storage + add WeChat integration in one task
- broad refactor unrelated to acceptance criteria

## Roles

An agent can act in one of three roles.

### Builder
Implements a bounded Task Packet.

### Reviewer
Validates an existing change against repository rules and ACCEPTANCE.md. Reviewer should not silently redesign the feature while reviewing.

### Planner
May refine PROJECT-STATE, DEVELOPMENT-PLAN, design specs, acceptance criteria, or create Task Packets. Planner must not weaken acceptance to make existing code pass.

A single agent may perform multiple roles sequentially, but the handoff must say which role(s) it performed.

## Gate discipline

A later phase may begin only when the current gate's acceptance criteria have evidence.

"Looks good" is not evidence.

Evidence examples:
- screenshots of the interactive prototype
- automated test output
- fixture run logs
- exact build/typecheck/lint commands
- screen-spec-to-implementation review
- recorded structured output
- versioned artifact committed to the repository

## Repository updates

After completing a slice, update PROJECT-STATE.md if:
- phase status changed
- a gate passed
- a blocker appeared/disappeared
- a material decision was made
- next recommended slice changed

Do not turn PROJECT-STATE.md into a diary. Keep only current truth plus recent material context.

## Architecture/design drift

If implementation conflicts with a canonical design or architecture rule:

Do not silently "make it work".

Choose one:
1. fix implementation to match the contract
2. if the contract is genuinely wrong, create an ADR/design decision change and update affected canonical docs together

## Concurrent agents

If multiple agents may work concurrently:
- use separate branches/worktrees
- each agent owns a non-overlapping Task Packet
- avoid simultaneous edits to canonical coordination files when possible
- merge foundational/canonical document changes before dependent implementation branches
- rebase/re-read PROJECT-STATE after another agent merges

Do not use a shared browser profile, database, or real production account across concurrent automated tests.

## Handoff requirement

Every completed agent run must provide a handoff using HANDOFF-TEMPLATE.md.

A handoff must state:
- what changed
- what was validated
- which acceptance criteria now pass
- what remains
- known risks/limitations
- recommended next slice

Do not claim completion without evidence.

## Human maintainer interaction

Escalate to the maintainer only when:
- product intent is genuinely ambiguous and materially affects behavior
- a locked architecture choice should change
- a security/privacy tradeoff requires human approval
- two valid UX directions cannot be resolved from canonical docs
- an irreversible external action requires explicit approval

Do not ask the maintainer questions that the repository already answers.

## Definition of autonomy

An agent is considered properly autonomous when the maintainer can say only:

> Continue FlowPilot according to the repository plan.

and the agent can safely identify and complete the next appropriate bounded slice.
