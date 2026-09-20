# Minimal Codex Start Prompt

FlowPilot's development agent framework is Codex-native.

Project subagents live in:

```
.codex/agents/
├── plan_guard.toml
├── builder.toml
├── gatekeeper.toml
└── state_keeper.toml
```

Codex project multi-agent support is enabled by `.codex/config.toml`.

## Preferred default prompt

> Continue FlowPilot according to the repository plan. Read AGENTS.md and the canonical documents first. Use the project Codex subagents with the Plan Guard → Builder → Gatekeeper → State Keeper loop. Complete only one bounded current slice. Do not jump phases or redesign locked decisions. If Gatekeeper fails, fix only the blocking gaps and re-review. Only after PASS may State Keeper update PROJECT-STATE/work. Leave a handoff with actual validation evidence.

## Specific Task Packet

> Implement the Task Packet at <path>. Follow AGENTS.md. Use the project Codex plan_guard before implementation, builder for the bounded slice if delegation is useful, gatekeeper after implementation, and state_keeper only after PASS. Do not broaden scope.

## Review only

> Use the FlowPilot gatekeeper subagent to independently validate the latest bounded slice against the applicable ACCEPTANCE.md criteria. Return PASS or FAIL with concrete evidence/gaps. Do not redesign the product or weaken acceptance.

## State maintenance only

> Use the FlowPilot state_keeper subagent. Proceed only if the referenced Gatekeeper verdict is PASS. Update PROJECT-STATE and the short-term work queue; do not implement product code or create a long backlog.

## Codex-first convention

For future agent automation in this repository, prefer Codex-native facilities first:
- `AGENTS.md` for persistent project instructions
- `.codex/agents/*.toml` for reusable custom subagents
- `.codex/config.toml` for project-level Codex configuration
- Codex skills for repeatable workflows when a role alone is insufficient
- MCP for external systems when needed
- hooks only for concrete enforceable lifecycle policies

Do not invent a parallel generic agent specification unless Codex cannot express the required behavior.

## What the maintainer should not need to repeat

The repository already defines:
- product philosophy
- current phase
- development order
- acceptance criteria
- technology baseline
- Goal/Task/Source/Flow/Run model
- natural-language UX rules
- security boundaries
- how Codex subagents coordinate

A new Codex session should read those rather than asking the maintainer to retell project history.
