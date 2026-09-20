# Task, Source, and Input Runtime

This document defines how scheduled tasks consume external user data safely and reproducibly.

## Pipeline

```
Trigger
   ↓
TaskPlan
   ↓
Source Resolution
   ↓
Selection
   ↓
Immutable InputBundle
   ↓
GoalPlan
   ↓
Flow
   ↓
Run
```

A workflow should never repeatedly read a mutable Source while publishing.

Source data is resolved and frozen before execution.

---

# Source authorization

A Source is an explicit permission boundary.

For local files, the user chooses a folder/repository through the OS/UI.

Example authorization:

```
~/projects/industry-learning-journal
```

FlowPilot stores an internal Source record and scoped permission.

AI/runtime receives a Source handle/capability, not unrestricted access to the user's home directory.

Do not grant broad filesystem access because natural language said:

> 从我的文件里找文章。

If a Source is not authorized, FlowPilot must request connection/permission.

## Initial Source types

MVP-friendly:
1. Local Folder
2. Local Git Repository

Later:
- GitHub Repository
- Google Drive
- Dropbox/OneDrive
- HTTP API
- RSS
- database
- Notion/other connectors

Source implementations should share a common interface where practical.

Conceptual interface:

```ts
interface SourceProvider {
  inspect(source: SourceRef): Promise<SourceMetadata>;
  list(request: SourceListRequest): Promise<SourceItem[]>;
  read(request: SourceReadRequest): Promise<SourceContent>;
  snapshot(request: SourceSnapshotRequest): Promise<SourceSnapshot>;
}
```

Write capability, if ever supported, must be separate and explicitly authorized.

---

# Source selection

Task natural language may say:

> 找到今天最新的文章和封面。

The Task compiler turns that into a structured selection rule.

Selection is evaluated before Flow execution.

If multiple candidates are materially ambiguous, do not randomly choose. Surface an ambiguity resolver or use an explicit, previously learned policy.

---

# InputBundle

Every Run receives an immutable InputBundle.

Example:

```json
{
  "createdAt": "2026-09-20T00:00:00Z",
  "sourceSnapshot": {
    "sourceId": "src_...",
    "gitCommit": "7acf921"
  },
  "inputs": {
    "title": {
      "type": "text",
      "valueHash": "..."
    },
    "content": {
      "type": "document",
      "origin": "daily/2026-09-20/article.md",
      "contentHash": "..."
    },
    "cover": {
      "type": "file",
      "origin": "daily/2026-09-20/cover.png",
      "contentHash": "..."
    }
  }
}
```

The actual content may be stored/referenced according to size/security policy, but the Run must retain enough immutable provenance to know exactly what was used.

## Why snapshot first

Without this boundary:
- title may come from one version while body changes mid-run
- retries may publish a newer file than the original attempt
- audit/reproduction becomes impossible
- concurrent editors can cause inconsistent results

Once a Run enters execution, the InputBundle must not silently change.

If the user wants newer data, create a new Run or explicitly restart with a new snapshot.

---

# Git provenance

Git Sources are especially useful because commits provide natural immutable source versions.

A Run should record:
- repository Source ID
- branch/ref used for selection
- exact commit SHA
- selected paths
- content hashes

Example:

```
Source: industry-learning-journal
Branch: main
Commit: 7acf921
Files:
- daily/2026-09-20/article.md
- daily/2026-09-20/cover.png
```

---

# Idempotency and duplicate prevention

Scheduled publishing must not repeatedly publish the same input.

Each Task needs a deterministic consumption/idempotency key.

Possible components:
- TaskPlan revision
- Goal ID
- Source snapshot/version
- selected content hashes
- destination account/platform
- logical content identity

Before creating an irreversible Run, check whether the same idempotency key has already succeeded or is already in-flight.

Natural language:

> 只发布从未发布过的版本。

Internal policy:

```
dedupeStrategy = source-version-and-destination
```

Do not rely only on timestamps.

## Cursor / watermark

A Source/Task may maintain a cursor such as:
- last processed Git commit
- last processed item ID
- last successful content hash
- feed cursor

Cursor updates occur only at the appropriate success boundary. Failure must not incorrectly mark content as consumed.

---

# Scheduling

Task schedule is compiled from natural language into a normalized schedule.

User:

> 每天早上 8 点运行。

Internal:

```
normalized schedule + timezone
```

Store the user's chosen timezone explicitly.

Do not require cron syntax for ordinary users.

## Missed schedule policy

Desktop apps may be closed at scheduled time.

Supported conceptual policies:
- SKIP
- RUN_ON_NEXT_START
- CATCH_UP_WITH_LIMIT

Natural language example:

> 如果电脑早上 8 点没有运行 FlowPilot，当天第一次启动后执行。

The compiled plan stores the policy.

MVP scheduling can require FlowPilot to be running.

Background daemon/cloud runner are later architecture stages.

---

# Task execution lifecycle

```
SCHEDULED
→ RESOLVING_SOURCE
→ BUILDING_INPUT
→ VALIDATING_INPUT
→ READY
→ WAITING_CONFIRMATION (optional)
→ RUNNING
→ SUCCEEDED / SKIPPED / FAILED / CANCELLED
```

SKIPPED is a valid outcome, e.g. no new content.

Reason must be recorded.

Examples:
- NO_MATCHING_INPUT
- ALREADY_CONSUMED
- SOURCE_UNAVAILABLE
- USER_POLICY_SKIP

---

# Binding Source data to Goal inputs

The compiler creates semantic bindings.

Human language:

> Markdown 第一行标题作为标题，正文作为公众号正文，同目录 cover.png 作为封面。

Compiled:

```
Goal input "title"   ← document title
Goal input "content" ← document body
Goal input "cover"   ← associated cover image
```

Bindings must be validated before a Run starts.

Missing required input follows the Task policy:
- ask user
- skip
- fail
- derive with AI (only when explicitly safe/allowed)

AI-generated derived inputs should have provenance.

---

# Security and privacy

Source rules:
- least privilege
- read-only by default
- explicit user authorization
- no unrestricted filesystem traversal
- no Source content sent to AI unless necessary for the current compilation/resolution task
- redact secrets where applicable
- prompts receive only relevant excerpts
- large repositories are searched/scoped rather than blindly uploaded

AI must never use page prompt injection or Source content instructions to expand permissions.

---

# Persistence model

Planned records:
- goals
- goal_revisions
- goal_plans
- tasks
- task_revisions
- task_plans
- sources
- source_permissions
- source_cursors
- input_bundles
- runs
- run_inputs / provenance
- consumption_records

Names may evolve, but separation of responsibilities must remain.

---

# Local runner evolution

Early desktop:

```
FlowPilot Desktop
├── Scheduler (while app/runtime active)
├── Source Manager
├── Task Engine
└── Workflow Runtime
```

Later:

```
FlowPilot Desktop UI
        ↓
FlowPilot Local Runner / Daemon
        ↓
Scheduler + Task Engine + Sources + Runtime
```

Potential future:

```
same TaskPlan
   ↓
Local Runner OR authorized Cloud Runner
```

Do not introduce cloud execution before local semantics, provenance, idempotency, and safety are proven.
