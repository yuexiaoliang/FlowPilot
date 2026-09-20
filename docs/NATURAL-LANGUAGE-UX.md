# Natural-Language UX Principles

FlowPilot intentionally moves beyond traditional form-first application design.

Natural language is the control plane. GUI is a contextual visualization/manipulation layer.

## Core UX statement

> Natural language describes intent.  
> Structured plans execute it.  
> UI appears when humans need to observe, choose, compare, approve, or intervene.

## Intent-first, not dashboard-first

Do not assume the Home screen must primarily be dashboards, settings, charts, or navigation.

The primary product surface should make it easy to create/open a Goal or Task and express what should happen in ordinary language.

Example:

```
What do you want FlowPilot to do?

┌──────────────────────────────────────┐
│ # 每天发布行业文章                   │
│                                      │
│ 每天早上 8 点检查我的行业学习内容。 │
│ 如果今天有新文章，发布到公众号。    │
│ 发布前让我确认。                     │
└──────────────────────────────────────┘

                              Analyze
```

The editor may support Markdown, drag/drop files, semantic suggestions, and entity selection, but should not require a DSL.

## AI understanding review

After compiling natural language, FlowPilot may show a concise interpretation:

```
I understood:

Schedule
每天 08:00

Data
行业学习仓库 → 今天最新文章

Action
发布微信公众号文章

When there is no new content
Skip

Before publishing
Ask for confirmation
```

This is a **review of understanding**, not a configuration form.

Only ambiguous or materially risky items should require interaction.

## Contextual / ephemeral UI

UI components should appear because the current state benefits from them.

Examples:

- needs an image choice → image picker
- needs source authorization → folder/repository picker
- needs ambiguity resolution → compact choice UI
- needs approval → confirmation card
- needs comparison → diff UI
- needs security verification → browser takeover
- needs progress visibility → execution timeline
- needs repair review → old/new route diff
- needs debugging → logs/screenshot inspector

Do not permanently expose every possible control just because the system supports it.

## Dynamic UI primitives

The implementation should evolve toward a reusable set of UI primitives:

- Markdown/intent editor
- semantic entity suggestion
- schedule interpretation chip
- Source permission picker
- file/content preview
- InputBundle preview
- ambiguity resolver
- confirmation card
- progress timeline
- diff viewer
- human takeover surface
- run evidence viewer
- error/recovery card

AI/runtime chooses which primitive is appropriate from structured state. AI should not generate arbitrary executable UI code.

## Entity references

The user sees semantic names:

- 我的行业学习仓库
- 微信公众号
- 每天早上 8 点

The system stores:
- Source ID
- Goal ID
- account/platform IDs
- normalized schedule

Rich text may bind a visible phrase to an internal entity reference.

Do not render internal IDs in ordinary user flows.

## Scheduling UX

Users can write:

- 每天早上 8 点
- 工作日下班后
- 每周一上午
- 每个月最后一天

FlowPilot normalizes the schedule and shows its interpretation.

If interpretation is materially ambiguous, ask.

Do not ask users to write cron unless an advanced/debug interface explicitly exposes it.

## Source UX

A user authorizes a Source through an explicit picker/connection step.

Natural language may say:

> 数据来自我的行业学习仓库。

If no matching authorized Source exists, FlowPilot presents a contextual connection UI.

Once authorized, subsequent natural-language references can resolve semantically.

## Goal UX

Goal documents should focus on:
- intended result
- required information if the user naturally knows it
- constraints
- success definition
- human intervention/approval expectations

Users should not define selectors, steps, waits, retries, or browser paths.

## Task UX

Task documents should focus on:
- trigger/timing
- data context/source in natural language
- selection rules
- which outcome should be produced
- exceptional policies that matter to the user

Users should not define runtime orchestration details unless they intentionally enter an advanced mode.

## Advanced users

Advanced/debug views may expose:
- compiled GoalPlan
- compiled TaskPlan
- Workflow IR
- IDs
- normalized cron/schedules
- source cursors
- repair diffs
- runtime events

These are inspection tools, not required authoring syntax.

## Design test

Before adding a persistent form field, ask:

> Could the user state this naturally, with FlowPilot compiling it and only asking for clarification if necessary?

If yes, prefer natural-language authoring plus structured review.

Before adding a chat panel, ask:

> Is AI actually the primary interaction here, or would a contextual UI primitive communicate the state better?

Do not turn every interaction into chat.

## Exportability

A Goal/Task Markdown file should remain useful and understandable if opened in a plain text editor outside FlowPilot.

This is a strong design constraint against hidden DSL pollution.
