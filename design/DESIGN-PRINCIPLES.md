# FlowPilot Design Principles

[简体中文](zh-CN/DESIGN-PRINCIPLES.md)

These principles are operational rules. Each one states what is visible by
default, what remains hidden, what reveals it, where the underlying truth can be
inspected, and what constitutes a contract violation.

## Product invariant

> Simple by default. Transparent on demand.

Simplicity is the removal of irrelevant decisions, not the removal of truth.
Transparency is contextual access to evidence, not permanent exposure of every
implementation detail.

When principles appear to compete, apply this order:

1. preserve safety, explicit authorization, and honest runtime state;
2. preserve the user's stated outcome and semantic source text;
3. show only the information needed for the current decision;
4. keep the structured plan, provenance, and evidence inspectable;
5. prefer a calm, readable presentation over greater information density.

## 1. Simple by default

**Rule.** The primary surface presents one coherent outcome, a concise account
of FlowPilot's understanding or current state, and the essential next action.

- **Default:** natural-language intent, material interpretation, current status,
  and one primary action.
- **Hidden:** diagnostic metadata, revision history, raw events, normalized
  schedules, identifiers, and controls unrelated to the current state.
- **Reveal event:** the user asks to inspect, or a current ambiguity, risk,
  failure, or comparison requires more information.
- **Professional truth:** the contextual Inspector for the current Goal, Task,
  Source, Flow, or Run.
- **Violation:** a landing dashboard, multi-column control center, or form that
  exposes every capability before the user has expressed an outcome.

## 2. Transparent on demand

**Rule.** Every consequential interpretation, input selection, action, pause,
repair, and result has an understandable route to its evidence.

- **Default:** a plain-language summary and a visible `Inspect details` affordance
  when underlying detail exists.
- **Hidden:** full GoalPlan/TaskPlan/Flow data, Source snapshot provenance,
  InputBundle contents, run events, screenshots, and repair diffs.
- **Reveal event:** explicit inspection, expansion of a material item, or a
  failure whose resolution depends on evidence.
- **Professional truth:** structured Inspector sections linked to exact versions
  and the current object, never an unrelated global log dump.
- **Violation:** claiming success without evidence, hiding a consequential AI
  interpretation, or requiring raw logs to understand an ordinary failure.

## 3. Intent-first

**Rule.** Begin with what the user wants to be true, not with product
configuration or implementation steps.

- **Default:** the Intent Home editor or the natural-language source of the open
  Goal or Task.
- **Hidden:** connector setup, workflow steps, retry settings, and scheduling
  implementation until the expressed intent makes them relevant.
- **Reveal event:** analysis identifies a missing Source, material ambiguity,
  policy decision, or execution requirement.
- **Professional truth:** compiled understanding and bindings beside the original
  source in the Inspector.
- **Violation:** making users choose an automation template, connector, or node
  graph before they can state the outcome.

## 4. Natural language is the control plane

**Rule.** Users author semantics in ordinary language or Markdown; FlowPilot
stores stable machine references and normalized policies behind that source.

- **Default:** readable prose, semantic names, and concise interpretation chips
  or summaries.
- **Hidden:** UUIDs, `@goal/...`, `@source/...`, cron, selectors, retry codes, and
  workflow-node syntax.
- **Reveal event:** explicit professional inspection or export of a compiled
  artifact; never a prerequisite for ordinary use.
- **Professional truth:** the original source, resolved entity references, and
  normalized compiled values shown as distinct layers.
- **Violation:** a hidden FlowPilot DSL inside Markdown, an ID required to bind a
  Source, or a cron expression required to schedule a Task.

Natural language is not permission. A phrase that names local data cannot expand
filesystem access; authorization remains a separate explicit interaction.

## 5. Progressive disclosure

**Rule.** Detail appears in response to a user question or a state transition,
and each disclosure adds one level of specificity without changing meaning.

- **Default:** the smallest complete explanation of the current state.
- **Hidden:** optional fields, alternate branches, historical versions, and
  implementation evidence.
- **Reveal event:** expand, inspect, compare, diagnose, or a runtime state that
  makes the detail actionable.
- **Professional truth:** drill-down from summary to structured detail to raw,
  redacted evidence while preserving context.
- **Violation:** accordions that merely hide a configuration form, critical
  safety facts buried behind disclosure, or a detail view that contradicts its
  summary.

Information may move upward from Inspection to Execution or Simple only when it
becomes necessary for a present decision. It returns to its lower-detail home
when the condition ends; the user's resolved choice remains visible in summary.

## 6. Contextual and ephemeral UI

**Rule.** A picker, resolver, confirmation, takeover, diff, or recovery card
exists because the current state calls for it and disappears from the primary
path after resolution.

- **Default:** intent and the current outcome, without empty placeholders for
  every possible interaction.
- **Hidden:** Source picker, ambiguity resolver, confirmation card, browser
  takeover, repair comparison, and recovery choices.
- **Reveal event:** a typed requirement such as missing authorization, material
  ambiguity, irreversible action, security intervention, proposed repair, or
  actionable failure.
- **Professional truth:** the resulting authorization scope, semantic binding,
  confirmation event, takeover event, or repair revision in the Inspector.
- **Violation:** permanent side panels for inactive tools, pre-emptive permission
  prompts, or a generic chat prompt where a bounded choice communicates better.

## 7. Trust without black-box behavior

**Rule.** FlowPilot states what it understood, what it will use, what it is
doing, and how it knows the result, at the level appropriate to the moment.

- **Default:** concise understanding before action, concrete input preview before
  consequential execution, meaningful progress, and verified result language.
- **Hidden:** full compilation and runtime evidence.
- **Reveal event:** inspection, changed interpretation, uncertainty, repair, or
  disputed result.
- **Professional truth:** exact GoalPlan, TaskPlan, Source snapshot, InputBundle,
  Flow revision, step evidence, and result criteria associated with the Run.
- **Violation:** “AI handled it” as an explanation, silent input substitution,
  silent fallback, or treating absence of an exception as success.

## 8. Minimal navigation

**Rule.** Navigation represents stable user destinations, not internal entities
or every product capability. Intent Home is the primary entry and work remains
in one contextual workspace whenever possible.

- **Default:** the current workspace, a clear way home, and access to recent or
  existing work without a taxonomy of runtime internals.
- **Hidden:** Inspector sections, Source administration, Flow revisions, run
  evidence, and settings until entered from relevant context.
- **Reveal event:** opening an existing Goal/Task, selecting a past Run, choosing
  `Inspect details`, or entering an infrequent management task.
- **Professional truth:** context-preserving Inspector routes and history views;
  back/close returns to the originating object.
- **Violation:** permanent top-level destinations for GoalPlan, TaskPlan,
  InputBundle, Flow nodes, logs, repairs, or every connector type.

Do not add a top-level destination unless it supports a recurring user goal that
cannot be reached coherently from the existing workspace. D0.1 does not fix
labels or layout for later screen specifications; it fixes this test.

## 9. Error and intervention clarity

**Rule.** Uncertainty, failure, and human-required states are named honestly and
offer only safe, relevant next actions.

- **Default:** a plain-language state, impact, and recommended next action; prior
  successful progress remains intact where true.
- **Hidden:** typed error codes, attempts, screenshots, and redacted diagnostic
  events.
- **Reveal event:** `Why?`, `Inspect details`, comparison, or a professional
  diagnostic action.
- **Professional truth:** typed failure, last successful checkpoint, current
  evidence, allowed recovery paths, and immutable history.
- **Violation:** success styling for skipped/partial work, automatic continuation
  from an unknown state, generic “Something went wrong,” or an AI attempt to
  bypass CAPTCHA, MFA, login, consent, or an account warning.

Confirmation is used before an irreversible action. Human Takeover is used when
the user must operate or decide inside the real context. They are different
states and must not be collapsed into a generic warning dialog.

## 10. Accessible and readable by construction

**Rule.** Hierarchy, state, and action cannot depend on color, motion, pointer
precision, or visual density alone.

- **Default:** clear text hierarchy, descriptive labels, visible focus, generous
  targets, readable line lengths, and state conveyed with text plus redundant
  cues.
- **Hidden:** nothing required to understand or operate the current state solely
  behind hover, animation, color, or an unlabeled icon.
- **Reveal event:** disclosure controls that are keyboard operable, announced,
  and preserve focus when content changes.
- **Professional truth:** the same semantic structure and evidence available to
  assistive technology, including status updates and error relationships.
- **Violation:** color-only status, auto-advancing content that cannot be paused,
  focus loss when contextual UI appears, or an Inspector unusable at zoom.

Motion should explain continuity, not delay work. Respect reduced-motion
preferences. Dynamic execution updates must be announced without repeatedly
interrupting the user.

## Entity separation in the UI

The UI may summarize relationships, but must not merge the underlying concepts:

| Entity | Human question | Default presentation |
| --- | --- | --- |
| Goal | What outcome should exist? | Natural-language outcome and success meaning. |
| Task | When and under what rules? | Natural-language policy and concise interpreted schedule. |
| Source | Where may data come from? | Semantic name and explicit authorization scope when relevant. |
| InputBundle | What exact inputs does this Run use? | Concrete preview before execution; immutable provenance on inspection. |
| Flow | How will the outcome be achieved? | Hidden on the ordinary path; versioned strategy on inspection. |
| Run | What happened this time? | Current status/result; timeline and evidence on inspection. |

## Review test

For every new surface, answer:

1. What decision or outcome matters to the user now?
2. What is the minimum complete information needed for it?
3. Which typed event makes any additional UI appear?
4. Where can the user inspect the underlying structured truth?
5. Does the exported natural-language source still make sense outside FlowPilot?
6. Would removing internal IDs, workflow vocabulary, and raw logs break ordinary
   use? If yes, the design violates this contract.
