# FlowPilot Development Subagents

These subagents exist for one purpose:

> **Keep FlowPilot moving forward according to the approved plan without turning the development process into a second product.**

This is intentionally a small system.

## Default development loop

```
Main Agent
   ↓
Plan Guard
   ↓
Builder (usually the Main Agent itself)
   ↓
Gatekeeper
   ↓
State Keeper
   ↓
next slice
```

The four roles are:

- [PLAN-GUARD.md](./PLAN-GUARD.md) — decides what should be worked on now and prevents scope/phase drift
- [BUILDER.md](./BUILDER.md) — implements exactly one bounded slice
- [GATEKEEPER.md](./GATEKEEPER.md) — independently checks whether that slice really passes acceptance
- [STATE-KEEPER.md](./STATE-KEEPER.md) — updates repository state/work queue only after verified results

## Important: do not over-orchestrate

The Main Agent should remain responsible for integration and final delivery.

The Builder is expected to be a strong general-purpose coding agent and should normally handle the complete slice across UI, Electron, TypeScript, tests, documentation, etc.

Do **not** create permanent specialist subagents just because a task touches a technology domain.

Temporary research/review subagents are acceptable only when there is a concrete benefit, such as:
- isolated security review
- focused investigation of an unfamiliar runtime behavior
- independent second opinion on a high-risk architecture decision
- large-context analysis that would otherwise distract the Builder

Temporary specialists do not own roadmap state, acceptance, or architecture.

## Repository is the shared memory

Subagents must use repository truth rather than chat history.

Canonical context:
1. `AGENTS.md`
2. `docs/PROJECT-STATE.md`
3. `docs/DEVELOPMENT-PLAN.md`
4. `docs/ACCEPTANCE.md`
5. `docs/AGENT-OPERATING-PROTOCOL.md`
6. relevant product/design/architecture/security docs
7. current Task Packet / handoff

## Authority boundaries

No subagent may:
- weaken acceptance criteria to make work pass
- change a locked architecture choice without ADR/maintainer approval
- jump to a later phase because it seems more interesting
- invent product direction that conflicts with canonical docs
- claim validation it did not perform

## Main Agent behavior

For a normal bounded task:

1. invoke/use Plan Guard before implementation
2. perform the Builder role (or delegate it once)
3. invoke/use Gatekeeper after implementation
4. if FAIL, return to Builder with only the failed acceptance gaps
5. if PASS, invoke/use State Keeper
6. report completion and next state to the maintainer

Do not recursively spawn the same role or create agent chains deeper than needed.

## When the four-role loop can be shortened

For trivial changes such as typo-only documentation fixes, the Main Agent may combine roles mentally/in one context if:
- no phase/gate status changes
- no architecture/product semantics change
- no acceptance-sensitive behavior changes

For any implementation slice, gate completion, design contract work, security-sensitive change, or project-state transition, keep the independent Plan Guard → Builder → Gatekeeper → State Keeper sequence.
