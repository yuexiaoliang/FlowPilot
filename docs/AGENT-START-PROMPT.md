# Minimal Agent Start Prompt

The maintainer should not need to restate FlowPilot's history.

For a capable repository-aware coding/design agent, this is the preferred default prompt:

> Continue FlowPilot according to the repository plan. Read AGENTS.md and the canonical project documents first. Determine the current phase from docs/PROJECT-STATE.md, choose the smallest appropriate unfinished slice, implement it, validate it against docs/ACCEPTANCE.md, update project state if needed, and leave a handoff. Do not redesign locked product/architecture decisions or jump ahead to later phases.

## For a builder

> Work as a Builder. Continue FlowPilot according to the repository plan. Complete one bounded slice only, with tests/evidence and handoff.

## For a reviewer

> Work as a Reviewer. Read the canonical FlowPilot documents, inspect the latest implementation against the applicable acceptance criteria, run appropriate validation, report concrete gaps, and only make narrowly scoped fixes when clearly justified.

## For a design agent

> Work as a Product/UX Builder. Follow FlowPilot's principles: simple by default, transparent on demand; natural language is the control plane; no user-facing DSL. Continue the current design gate from PROJECT-STATE.md and produce implementation-ready design contracts, not speculative feature expansion.

## When assigning a specific slice

> Implement Task Packet <name/path>. Follow AGENTS.md and all canonical references in the packet. Do not broaden scope. Validate the stated acceptance criteria and leave a handoff.

## What the maintainer should not need to say

The maintainer should not have to repeat:
- Electron vs Tauri
- React vs Vue
- whether AI runs every workflow step
- whether users write @goal/@source IDs
- whether CAPTCHA should be bypassed
- whether Issues are mandatory
- current product philosophy
- current milestone order

Those belong in the repository.
