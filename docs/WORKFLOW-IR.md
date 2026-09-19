# Workflow IR

Workflow IR is FlowPilot's most important durable contract. It must be deterministic, versioned, auditable, repairable, and independent of any one browser library.

## Principles

A workflow records **intent and verifiable state transitions**, not a raw macro.

Bad:
```json
{"click":"#app > div:nth-child(4) > button"}
```

Better:
```json
{
  "id":"open-editor",
  "preconditions":[{"kind":"platformState","state":"HOME"}],
  "action":{"kind":"click","target":{"role":"button","names":["新的创作","写文章"]}},
  "expected":[{"kind":"elementSemantic","label":"标题"},{"kind":"platformState","state":"ARTICLE_EDITOR"}]
}
```

## Canonical entities

### Flow
Required conceptual fields:
- id
- schemaVersion
- revision
- platformId
- capability
- name
- createdAt / updatedAt
- inputSchema
- steps
- successConditions
- safetyPolicy
- provenance

### Step
- stable id
- description
- preconditions
- action
- expected conditions
- timeout policy
- retry policy
- repair policy
- optional checkpoint metadata

### TargetDescriptor
Targeting is multi-signal. It may include:
- ARIA role
- accessible names / visible text aliases
- label
- placeholder
- semantic type
- stable attributes
- relative anchors
- optional selector hints

Selectors are fallback hints only. Do not encode brittle DOM ancestry as the primary identity.

### Condition
Initial condition vocabulary should remain small:
- urlMatches
- elementPresent
- elementAbsent
- elementSemantic
- textPresent
- platformState
- authState
- dialogPresent
- networkIdle (weak; never sole success criterion)
- custom adapter condition

### Action
MVP vocabulary:
- navigate
- click
- fill
- clear
- select
- upload
- wait
- press
- scroll
- requestHumanTakeover
- platformAction

Avoid "execute arbitrary JavaScript" as a persisted generic action.

## Versioning

There are two versions:
- **schemaVersion** — shape/semantics of Workflow IR
- **revision** — immutable revision of one Flow

Any successful repair creates a new revision.

Example:
```
wechat.publish.article
revision 6 ──repair──> revision 7
```

A run stores the exact revision it executed.

## Target resolution

Resolution should rank signals rather than accept first match:

1. semantic role/name match
2. label/accessibility match
3. platform-stable attribute
4. relative/anchored structure
5. selector hint

If multiple candidates remain materially ambiguous, fail with TARGET_AMBIGUOUS rather than guessing.

## Validation

Each meaningful action must have an expected outcome. Examples:
- navigation changes to expected route/state
- editor fields become present
- uploaded asset appears
- publish confirmation dialog appears
- success page/message appears

Absence of an exception is not success.

## Error taxonomy

Runtime failures should be typed:
- PRECONDITION_FAILED
- TARGET_NOT_FOUND
- TARGET_AMBIGUOUS
- ACTION_FAILED
- ACTION_TIMEOUT
- POSTCONDITION_FAILED
- NAVIGATION_UNEXPECTED
- AUTH_REQUIRED
- SECURITY_CHALLENGE
- RATE_LIMITED
- PLATFORM_PERMISSION_DENIED
- USER_INTERVENTION_REQUIRED
- REPAIR_FAILED
- CANCELLED
- UNKNOWN

Repair policy is keyed off typed errors, not message strings.

## Repair scope

A RepairContext contains:
- failed step
- previous successful checkpoint
- bounded neighboring steps
- expected target state
- current sanitized snapshot
- failure evidence
- platform adapter hints

The repair model returns a patch proposal, not an entire replacement Flow unless explicitly escalated.

## Provenance

Flow revisions should record:
- origin: manual | discovery | repair | migration
- parent revision
- AI provider/model metadata (non-secret)
- repair reason/failure type
- validation result
- timestamp

This is necessary for debugging and rollback.

## Security

Workflow files must never contain:
- passwords
- cookies
- bearer tokens
- API keys
- raw authorization headers
- full local file paths when avoidable
- secrets copied from page content

Inputs containing sensitive content should use runtime references/secret handles.

## Compatibility policy

The runtime should support at least the current Workflow IR schema and one prior schema during active development. Migrations must be explicit and tested.

The definitive schema will live in code under `packages/workflow-ir`; this document explains semantics and must stay synchronized with it.
