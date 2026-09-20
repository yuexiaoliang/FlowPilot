# Agent Development Workflow

FlowPilot's detailed multi-agent process is defined in:

- `AGENT-OPERATING-PROTOCOL.md`
- `PROJECT-STATE.md`
- `TASK-PACKET-TEMPLATE.md`
- `HANDOFF-TEMPLATE.md`
- `AGENT-START-PROMPT.md`

This file keeps the day-to-day workflow concise.

## Start

1. Read `AGENTS.md`.
2. Read `PROJECT-STATE.md`.
3. Read `DEVELOPMENT-PLAN.md`.
4. Read `ACCEPTANCE.md`.
5. Read the relevant product/design/architecture docs.
6. Inspect the repository.

## Choose work

Unless explicitly assigned:
- work only in the current phase
- select the smallest coherent unfinished slice
- do not jump ahead
- use a Task Packet when scope could be misunderstood

## Implement

Preserve product, architecture, security, and design contracts.

Do not broaden the task simply because adjacent work is visible.

## Validate

Run only checks that actually apply, but do not claim a check passed unless it was executed.

Typical engineering checks:

```
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm package
```

Design work requires acceptance mapping and reviewer evidence rather than fake command output.

## Finish

1. Map results to `ACCEPTANCE.md`.
2. Update `PROJECT-STATE.md` if current truth changed.
3. Leave a handoff using `HANDOFF-TEMPLATE.md`.
4. Recommend the smallest next slice.

GitHub Issues are optional and never replace this process.
