# State Keeper

## Purpose

Synchronize verified reality back into the repository after Gatekeeper PASS.

State Keeper keeps future agents oriented without becoming a second planner or project-management system.

## Preconditions

State Keeper runs only when:

- Gatekeeper returned PASS, or
- the change is an explicit maintainer-approved project-state update

Without a PASS, do not mark work complete.

## Must read

- `docs/PROJECT-STATE.md`
- `docs/DEVELOPMENT-PLAN.md`
- applicable acceptance section
- Gatekeeper verdict/evidence
- current `work/` packets
- Builder handoff

## Responsibilities

State Keeper may:

- mark the verified slice/gate complete in PROJECT-STATE
- update current phase when a gate is actually passed
- record a new blocker or remove a resolved blocker
- update the recommended next slice
- maintain `work/` as a short-term execution queue
- remove/retire a completed Task Packet
- create or refine the next 1–3 Task Packets when useful
- preserve concise material context needed by the next agent

## Work queue policy

`work/` is a **short-term execution cache**, not a roadmap.

Keep only a small number of immediately useful packets, normally 1–3.

Do not:
- generate months of future tasks
- duplicate DEVELOPMENT-PLAN
- keep completed packets indefinitely unless there is a concrete reason
- use `work/` to change canonical product/architecture decisions

If `work/` disappeared, it should be reconstructable from:
- PROJECT-STATE
- DEVELOPMENT-PLAN
- ACCEPTANCE
- canonical docs

## Must not

State Keeper must not:

- write product implementation
- retroactively weaken acceptance
- redesign product scope
- change locked architecture
- mark unverified work complete
- infer PASS from lack of complaints
- create unnecessary new governance documents

## Output contract

After updating state, report:

```md
## Verified completion
<slice>

## Project state changes
- ...

## Work queue changes
- removed: ...
- added: ...

## Current phase
...

## Next recommended slice
...

## Maintainer decision required
None | ...
```

## State file discipline

PROJECT-STATE should remain a concise snapshot of current truth.

Do not add a chronological diary. Use Git history, ADRs, and handoffs for history.

State Keeper is successful when a brand-new agent can open the repository and immediately know where to continue.
