# FlowPilot Interaction Model

[简体中文](zh-CN/INTERACTION-MODEL.md)

FlowPilot uses three product surfaces: **Simple**, **Execution**, and
**Inspection**. They are levels of interaction and information, not necessarily
separate windows, routes, or navigation items. One workspace may move between or
compose them while preserving the user's context.

## Surface hierarchy

```text
Simple Surface
  intent → concise understanding → essential next action → minimal result
                         ↓ run
Execution Surface
  useful progress → confirmation / takeover / recovery → verified outcome
                         ↓ inspect
Inspection Surface
  structured plans → provenance → timeline/evidence → revisions/diffs
```

The default path starts on the Simple Surface. A state transition opens the
Execution Surface when work begins or needs active attention. Inspection is
always user-invoked except when a failure must reveal a specific piece of
evidence to make recovery understandable. Opening Inspection must not discard
the current Simple or Execution context.

## 1. Simple Surface

### Purpose

Let the user express, review, and pursue an outcome without learning FlowPilot's
internal model.

### Contains

- natural-language/Markdown intent;
- a concise understanding of schedule, data, action, exceptional policy, and
  required confirmation when those are material;
- semantic names for Goals, Tasks, Sources, accounts, and destinations;
- the one essential next action;
- minimal success, skipped, cancelled, or failure state;
- contextual prompts only when a current unresolved condition exists;
- an `Inspect details` affordance when underlying detail is available.

### Excludes by default

- internal IDs and serialized plans;
- cron expressions, selectors, workflow nodes, retry codes, and model prompts;
- raw logs, event streams, screenshots, hashes, and database concepts;
- empty panels for Sources, approvals, repair, or runtime tools;
- navigation organized around internal entity types.

### Completion rule

The Simple Surface is complete when a user can understand what FlowPilot believes
will happen, identify any material uncertainty, and choose the next action
without opening the Inspector.

## 2. Execution Surface

### Purpose

Make active work, consequential decisions, and recoverable intervention visible
without turning execution into a monitoring dashboard.

### Contains

- a short current-status statement and useful milestone progress;
- the exact input preview when the user must know what will be acted on;
- pending confirmation before an irreversible action;
- Human Takeover with the live context, reason, and return-control action;
- actionable failure or pause with safe recovery choices;
- cancellation when safe and applicable;
- a route to inspect the Run timeline and evidence.

### Excludes by default

- every deterministic Step and browser event;
- continuously scrolling logs or low-level timing data;
- raw target descriptors, selector candidates, model requests, or stack traces;
- speculative recovery actions that policy has not allowed;
- success before postconditions have been verified.

### Progress rule

Show progress at milestones the user can understand, such as `Preparing inputs`,
`Opening the publisher`, `Waiting for your confirmation`, and `Verifying the
result`. Do not surface every internal Step unless it becomes relevant to a
failure or is explicitly inspected.

## 3. Inspection Surface

### Purpose

Expose the structured truth needed for audit, diagnosis, professional review,
and trust without imposing it on ordinary operation.

### Contains, when applicable

- original Goal/Task source and exact GoalPlan/TaskPlan revisions;
- semantic bindings and normalized schedule with timezone;
- Source permission scope, snapshot/version, selected paths, and hashes;
- the immutable InputBundle used for a Run;
- Flow revision and human-readable Step structure;
- Run timeline, typed states/errors, postcondition evidence, and redacted logs;
- screenshots or page evidence with sensitive data handled safely;
- repair proposal, bounded diff, validation result, and old/new revisions;
- confirmation and Human Takeover events;
- model provenance where AI materially interpreted, derived, discovered, or
  repaired something.

### Rules

- Enter from the object or statement being explained; do not make the user hunt
  in a global diagnostics area.
- Preserve exact version relationships. A Run's detail must not silently update
  to the latest TaskPlan, GoalPlan, Source content, or Flow revision.
- Start with structured, readable sections. Raw redacted evidence is a deeper
  disclosure, not the first view.
- Label user-authored source, compiled interpretation, deterministic runtime
  facts, and AI-derived content distinctly.
- Closing Inspection returns to the originating context and restores focus.

## Movement between surfaces

Information changes surface only for a reason:

| Event | From → to | What becomes visible | What happens after resolution |
| --- | --- | --- | --- |
| User submits or re-analyzes intent | Simple → Simple | Concise understanding and material changes | Remains as the current understanding summary. |
| Missing Source authorization | Simple → contextual Simple | Required capability, requested scope, and connect action | Picker closes; semantic Source name and connection state remain. |
| Material semantic ambiguity | Simple → contextual Simple | Bounded choices and consequence of the unresolved phrase | Resolver closes; chosen meaning remains in the summary/binding. |
| Input is ready to review | Simple → Simple or Execution | Concrete selected content needed to judge this Run | Collapses to a summary after acceptance; exact bundle remains inspectable. |
| Run starts | Simple → Execution | User-meaningful milestones and cancel/inspect actions | Ends in a minimal result and keeps the Run inspectable. |
| Irreversible action is next | Execution → contextual Execution | Exact action, destination, material input, and confirm/cancel choices | Confirmation card resolves into an event; execution continues or stops. |
| User/security action is required | Execution → Human Takeover | Reason, live interaction context, safe instructions, return-control action | Runtime re-snapshots and resumes only from a recognized safe state. |
| Recoverable typed failure | Execution → contextual Execution | Impact, evidence-based explanation, and allowed recovery actions | Selected recovery is recorded; resolved card becomes timeline evidence. |
| Repair is proposed | Execution → contextual Execution/Inspection | User impact and bounded old/new difference when review is required | Accepted repair creates a new Flow revision; prior revision remains. |
| User chooses `Inspect details` | Simple or Execution → Inspection | Detail anchored to the selected statement/object | Close/back restores the originating surface and focus. |

No transition may silently change the user's natural-language source, Source
permissions, confirmation policy, immutable InputBundle, or version bound to an
existing Run.

## Contextual interaction triggers

### Source connection

Appear only when the intent references data or a capability for which no
compatible authorized Source can be resolved. State why access is needed and
the requested scope before opening the system picker. Natural language may name
a Source but never grants access by itself. Do not show Source setup as a
mandatory first-run checklist.

After authorization, show the semantic name and a concise scope confirmation.
The Source ID, provider metadata, snapshot, and permission details belong in
Inspection or an explicit management task.

### Ambiguity

Appear only when competing interpretations would materially change outcome,
data, destination, timing, or safety. Offer a small set of human-readable
choices anchored to the ambiguous phrase and explain the meaningful difference.
Bind silently when there is one unambiguous compatible match. Never ask the user
to choose an ID.

### Confirmation

Appear immediately before the consequential boundary it protects, not at initial
authoring and not after the action. It states the exact irreversible action,
destination, and material input. Confirm and cancel are explicit; dismissal does
not count as confirmation. The policy and event remain inspectable.

### Human Takeover

Appear for login, QR, CAPTCHA, MFA, security challenge, consent, account warning,
ambiguous destructive action, or another typed state that requires human
operation or judgment. Preserve the real browser context. Clearly distinguish
what the user must do from what FlowPilot will verify afterward. Returning
control triggers a fresh snapshot and safe-state check; it does not imply
success.

### Inspector

Offer `Inspect details` beside an understanding, selected input, active or past
Run, pause, failure, result, or repair when structured truth exists. Do not make
Inspector a required step on the golden path. Deep links must identify the exact
object/version while displaying human-readable names first.

### Repair review

Appear when a repair changes behavior materially, crosses a policy review
boundary, or needs user judgment. Show the smallest meaningful old/new
difference and its effect. Do not expose a full workflow editor by default and
do not silently overwrite the previous Flow revision.

## Default-surface prohibition list

The following must not appear on the default path unless the current state makes
one item directly actionable:

- Goal, Task, Source, InputBundle, Flow, or Run internal IDs;
- serialized GoalPlan, TaskPlan, Workflow IR, or database records;
- cron expressions, selectors, target descriptors, workflow graphs, retry codes,
  and provider/model configuration;
- Source hashes, Git SHAs, file paths beyond the user-relevant selection summary,
  and permission internals;
- every runtime Step, raw events, stack traces, network data, or unredacted logs;
- dormant Source pickers, confirmation cards, takeover frames, diff viewers, and
  recovery controls;
- analytics, counters, charts, and status grids that do not advance the current
  outcome;
- controls that imply FlowPilot may bypass a security challenge or expand access.

Hiding these items does not permit omitting them from provenance when the
runtime contract requires them. Required truth lives in Inspection.

## Navigation and continuity

- Intent Home is the primary entry.
- Opening an existing Goal or Task returns to its human-authored source and
  current concise understanding, not to a generated configuration form.
- Active execution remains associated with its originating Task/Goal context.
- Results and past Runs are reached from that context or a concise recent-work
  entry, not through a mandatory operations dashboard.
- Inspection is contextual and closable; it is not a competing home screen.
- Back, close, and resume preserve unsaved intent and return focus predictably.
- A new top-level destination requires evidence of a distinct recurring user
  goal. An internal entity type alone is not sufficient.

Exact labels and navigation composition are finalized in later screen specs;
these invariants already constrain them.

## Concrete example across the surfaces

User source:

```md
每天早上 8 点检查我的行业学习仓库。
如果今天有新的文章，就发布到微信公众号。
正式发布之前让我确认。
```

### Simple Surface

The source remains editable as ordinary Markdown. After analysis, FlowPilot
shows:

```text
I understood
When        Every day at 08:00 (your timezone)
Data        Industry learning repository → today's newest article
Action      Publish a WeChat Official Account article
No content  Skip
Before publish  Ask for confirmation
```

If `行业学习仓库` is not authorized, a Source connection card appears at the
Data line and asks for the relevant folder/repository scope. If two compatible
publishing Goals exist, a compact choice appears at the Action line. Neither
interaction exposes IDs. Once resolved, the page returns to the concise
understanding with semantic names.

### Execution Surface

At trigger time, FlowPilot resolves the Source and creates an immutable
InputBundle before the Flow starts. The user sees meaningful milestones and a
concrete preview of the selected article and cover. Immediately before publish,
execution pauses with:

```text
Ready to publish
Article      <human-readable title>
Destination  <WeChat account name>

[Cancel]  [Confirm publish]
```

If login or QR verification is required, the confirmation is not treated as
authentication. FlowPilot enters Human Takeover, displays the real page, and
resumes only after a fresh safe-state check. After publishing, the default result
states success only when the success postcondition is verified.

### Inspection Surface

`Inspect details` for this Run reveals the exact TaskPlan and GoalPlan revisions,
normalized schedule and timezone, Source authorization and snapshot, selected
paths/hashes, immutable InputBundle, Flow revision, confirmation event, Run
timeline, Step evidence, and verified success criterion. If repair occurred, it
also shows the old/new Flow revisions and bounded diff. The original Markdown is
shown separately from compiled artifacts and remains unchanged.

This example is the review baseline for D0.1: the ordinary path is understandable
without Inspection, and the underlying truth is available without turning the
ordinary path into a dashboard.
