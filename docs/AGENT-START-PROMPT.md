# Minimal Agent Start Prompt

The maintainer should not need to restate FlowPilot's history.

## Preferred default prompt

> Continue FlowPilot according to the repository plan. Read AGENTS.md and the canonical documents first. Use the development loop defined in dev-agents/: Plan Guard → Builder → Gatekeeper → State Keeper. Complete only one bounded current slice. Do not jump phases or redesign locked decisions. If Gatekeeper fails, fix the blocking gaps and re-review. Only after PASS may State Keeper update PROJECT-STATE/work. Leave a handoff with actual validation evidence.

## Specific Task Packet

> Implement the Task Packet at <path>. Follow AGENTS.md and dev-agents/README.md. Use Plan Guard before implementation, Gatekeeper after implementation, and State Keeper only after PASS. Do not broaden scope.

## Review only

> Act as FlowPilot Gatekeeper for the latest bounded slice. Read the canonical docs and dev-agents/GATEKEEPER.md. Independently verify the actual artifacts against the applicable ACCEPTANCE.md criteria and return PASS or FAIL with concrete evidence/gaps. Do not redesign the product or weaken acceptance.

## State maintenance only

> Act as FlowPilot State Keeper. Only if the referenced Gatekeeper verdict is PASS, update PROJECT-STATE and the short-term work queue according to dev-agents/STATE-KEEPER.md. Do not implement product code or create a long backlog.

## What the maintainer should not need to repeat

The repository already defines:
- product philosophy
- current phase
- development order
- acceptance criteria
- Electron/React/WebContentsView baseline
- Goal/Task/Source/Flow/Run model
- natural-language UX rules
- security boundaries
- whether Issues are mandatory
- how subagents coordinate

The Main Agent should read those instead of asking the maintainer to restate them.
