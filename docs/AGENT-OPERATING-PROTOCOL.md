# FlowPilot Agent Operating Protocol

This protocol exists to keep development moving safely across different main agents and sessions.

## Principle

**The repository is the shared memory.**

A capable Main Agent should be able to enter with no chat history, identify the current approved slice, implement it, obtain an independent acceptance verdict, update project state, and hand off cleanly.

## Minimal control loop

Use the four development roles in `dev-agents/`:

```
Plan Guard
   ↓
Builder
   ↓
Gatekeeper
   ↓
State Keeper
```

Normally:
- the Main Agent orchestrates the loop
- the Main Agent may perform the Builder role itself
- Plan Guard, Gatekeeper, and State Keeper provide separation of concerns
- do not add permanent specialist roles unless there is demonstrated need

See `dev-agents/README.md`.

## Required reading order

Before starting:

1. `AGENTS.md`
2. `docs/PROJECT-STATE.md`
3. `docs/DEVELOPMENT-PLAN.md`
4. `docs/ACCEPTANCE.md`
5. current Task Packet if assigned
6. relevant product/design/architecture/security documents
7. relevant ADRs

Do not rely on chat history when repository truth exists.

## Step 1 — Plan Guard

Before implementation, determine:

- current phase
- smallest correct unfinished slice
- prerequisites
- applicable acceptance criteria
- explicit out-of-scope work

If an assigned task conflicts with the current gate or canonical docs, stop and report the conflict.

Plan Guard does not implement code.

## Step 2 — Builder

Implement one bounded slice.

Rules:
- solve the complete slice, not isolated file fragments
- do not start adjacent future work
- do not modify acceptance to make implementation pass
- do not introduce speculative abstractions
- preserve design, architecture, security, and product boundaries
- run applicable validation
- report actual validation only

A strong general-purpose Builder is the default. Do not create permanent technology-specific agents as routine process.

## Step 3 — Gatekeeper

Gatekeeper independently checks the actual artifacts/diff against the selected acceptance criteria.

Gatekeeper returns only:
- PASS
- FAIL with blocking gaps

A later slice/gate cannot begin while required acceptance items fail.

"Looks good" and Builder self-approval are not evidence.

## Step 4 — State Keeper

Run State Keeper only after Gatekeeper PASS.

State Keeper:
- updates `PROJECT-STATE.md` when current truth changed
- advances phase/slice only when verified
- maintains `work/` as a small short-term queue
- removes/retire completed packets
- creates/refines only the next 1–3 useful packets when needed

State Keeper does not implement product code or redesign planning.

## Task Packets

Task Packets are optional execution aids.

Use `docs/TASK-PACKET-TEMPLATE.md` when:
- scope could be misunderstood
- multiple agents may work independently
- acceptance mapping needs to be explicit

`work/` is not a second roadmap. It should be reconstructable from canonical docs.

## Change size

One loop should normally deliver one reviewable vertical slice.

Good:
- finalize one design-contract layer
- implement Intent → Understanding mock interaction
- implement LocalFolderSource + tests
- implement a BrowserDriver contract slice end-to-end

Bad:
- "build the whole app"
- combine redesign + storage migration + real platform integration
- broad cleanup unrelated to current acceptance

## Temporary research/review subagents

A Builder may use a temporary subagent only when there is a concrete benefit:
- focused security review
- isolated investigation of uncertain Electron/CDP/library behavior
- independent second opinion on a high-risk decision
- large isolated analysis that would pollute Builder context

Temporary helpers:
- do not own roadmap state
- do not update acceptance
- do not become permanent role files by default
- return findings to the Builder/Main Agent for integration

## Architecture/design drift

If implementation conflicts with a canonical contract:

1. fix implementation to match the contract, or
2. if the contract is genuinely wrong, use the ADR/design-decision path and update affected canonical docs together

Do not silently diverge.

## Concurrent work

If multiple main agents work concurrently:
- use separate branches/worktrees
- assign non-overlapping Task Packets
- avoid concurrent edits to PROJECT-STATE/work queue
- merge canonical changes before dependent implementation
- re-read PROJECT-STATE after upstream merges

## Handoff

After a bounded slice, use `docs/HANDOFF-TEMPLATE.md`.

The handoff must identify:
- what changed
- validation actually performed
- acceptance mapping
- known limitations
- remaining work
- recommended next slice

## Escalate to maintainer only when needed

Ask the maintainer when:
- product intent is materially ambiguous
- a locked architecture choice should change
- a security/privacy tradeoff needs human approval
- canonical docs conflict in a way that changes behavior
- an irreversible external action requires approval

Do not ask questions the repository already answers.

## Definition of autonomy

The process works when the maintainer can say:

> Continue FlowPilot according to the repository plan.

and the Main Agent can run Plan Guard → Builder → Gatekeeper → State Keeper without needing the project history retold.
