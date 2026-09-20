# Codex Development Workflow

FlowPilot development is Codex-native.

Project subagents:

```
.codex/agents/
├── plan_guard.toml
├── builder.toml
├── gatekeeper.toml
└── state_keeper.toml
```

Canonical orchestration is defined in `AGENT-OPERATING-PROTOCOL.md`.

## Start

1. Read `AGENTS.md`.
2. Read `PROJECT-STATE.md`.
3. Read `DEVELOPMENT-PLAN.md`.
4. Read `ACCEPTANCE.md`.
5. Read the relevant product/design/architecture docs.
6. Inspect the repository.

## Execute one bounded slice

Use:

```
plan_guard
→ builder (or main Codex thread)
→ gatekeeper
→ state_keeper
```

Rules:
- work only in the current phase unless the maintainer explicitly changes direction
- do not broaden scope because adjacent work is visible
- Gatekeeper must PASS before State Keeper marks the slice complete
- State Keeper, not Builder, advances PROJECT-STATE/work
- use a Task Packet when scope could be misunderstood

## Validation

Run only checks that actually apply, and never claim a check passed unless it was executed.

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

1. Gatekeeper maps actual evidence to `ACCEPTANCE.md`.
2. If FAIL, return only blocking gaps to Builder.
3. If PASS, State Keeper updates `PROJECT-STATE.md` and the short-term `work/` queue.
4. Leave a handoff using `HANDOFF-TEMPLATE.md`.
5. Report the smallest recommended next slice.

GitHub Issues are optional and never replace this process.

## Codex-first convention

When adding future agent automation, prefer Codex-native mechanisms:
- `AGENTS.md`
- `.codex/config.toml`
- `.codex/agents/*.toml`
- Codex skills
- MCP
- hooks

Only introduce another agent-spec format if Codex cannot express the required behavior.
