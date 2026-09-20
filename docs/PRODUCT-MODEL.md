# FlowPilot Product Model

FlowPilot is an intent-first automation runtime.

The user expresses **meaning** in natural language. FlowPilot compiles that meaning into structured, versioned artifacts that machines can execute deterministically.

> The closer a layer is to the human, the more natural-language it should be.  
> The closer a layer is to execution, the more structured and deterministic it must be.

## Core principle

**Users write semantics; the system stores references.**

Users should never need to write internal syntax such as:

```
@goal/publish-wechat
source://industry-learning
goal_01JXYZ...
```

Those are implementation details.

A user-facing task may simply say:

```md
# 每天发布行业文章

每天早上 8 点检查我的行业学习内容。

如果今天有新的文章，就发布到微信公众号。

数据来自我的行业学习仓库。

正式发布之前让我确认。
```

FlowPilot may internally compile that to stable IDs, schedules, source bindings, policies, and workflow revisions.

---

# Primary entities

## Goal — what outcome the user wants

A Goal represents durable intent.

Example:

```md
# 发布微信公众号文章

把准备好的文章发布到微信公众号。

需要标题、正文和封面。
摘要可以没有。

如果需要登录或安全验证，让我接管。
正式发布前让我确认。

只有真正发布成功才算完成。
保存草稿不算完成。
```

A Goal does **not** describe button paths, selectors, schedule, or where data is stored.

Goal answers:

> What result should exist when this is finished?

Internally, a Goal is compiled into a structured GoalPlan containing:
- intent
- required/optional inputs
- success criteria
- failure/non-success criteria
- safety/confirmation policy
- semantic capabilities

The natural-language source remains the human-readable source of truth.

## Task — when and under what rules to pursue a Goal

A Task represents automation policy around a Goal.

Example:

```md
# 每日行业文章发布

每天早上 8 点运行。

从我的行业学习仓库中找到今天最新的文章。

如果今天没有新内容，就跳过。

发布到微信公众号。

只发布从未发布过的版本。

正式发布之前让我确认。
```

Task answers:

> When should this happen, with which data and policies?

Internally a TaskPlan may contain:
- trigger/schedule
- resolved Goal reference
- resolved Source references
- data selection rules
- input bindings
- deduplication/idempotency strategy
- missed schedule policy
- confirmation policy
- retry/backoff policy

Users do not author these internal references directly.

## Source — where data is allowed to come from

A Source is an explicitly authorized data boundary.

Examples:
- selected local folder
- local Git repository
- GitHub repository
- Google Drive folder
- HTTP API
- database
- RSS feed

A Source has:
- stable internal ID
- user-visible semantic name
- connector/type
- scoped permissions
- location/configuration
- capability metadata
- optional cursor/watermark metadata

User language:

> 数据来自我的行业学习仓库。

Internal resolution:

```
sourceId = src_...
```

The internal ID must not be required in the Markdown.

## Flow — how a Goal is achieved

A Flow is a versioned executable strategy.

Example:

```
Check login
→ Open editor
→ Fill title
→ Fill content
→ Upload cover
→ Publish
→ Verify success
```

Flow is compiled/discovered from the Goal and current platform environment.

A Goal can remain stable while Flow revisions change repeatedly.

Repair changes the Flow, not the Goal.

## Run — one concrete execution

A Run is a historical execution record.

It binds immutable versions/snapshots:

```
TaskPlan revision
GoalPlan revision
Flow revision
Source snapshot / commit / file hashes
Resolved InputBundle
Run policy
Result/evidence
```

This makes every execution reproducible and auditable.

---

# Compilation layers

User-facing source:

```
Goal.md
Task.md
Preferences.md
```

Compilation pipeline:

```
Natural Language / Markdown
        ↓
Semantic Resolution
        ↓
GoalPlan / TaskPlan
        ↓
Flow Discovery / Selection
        ↓
Versioned Flow
        ↓
Runtime Run
```

The persisted structured plans are compiled artifacts.

The human-facing Markdown must remain readable without FlowPilot.

---

# Semantic resolution

When a Task says:

> 发布到微信公众号。

FlowPilot should semantically resolve the phrase to an existing compatible Goal.

If there is one unambiguous match, bind it silently.

If there are multiple material matches, do not guess.

Example contextual UI:

```
你说的“发布到微信公众号”是指：

○ 发布文章
○ 发布视频
```

After the user chooses, the internal TaskPlan stores the stable Goal reference.

The Markdown can remain human-readable and unchanged.

The same rule applies to Sources, accounts, platforms, policies, and other entities.

---

# No user-facing DSL

Do not introduce required syntax for ordinary users such as:
- `@goal/...`
- `@source/...`
- YAML IDs
- UUID references
- cron expressions
- selector expressions
- retry codes
- workflow node syntax

FlowPilot may offer rich editor mentions/autocomplete visually, but the underlying user-visible text should remain normal human language.

The UI may attach hidden semantic metadata to text spans, but exported Markdown must remain understandable as prose.

---

# Versioning

Each compiled artifact is versioned independently:

- Goal source revision
- GoalPlan revision
- Task source revision
- TaskPlan revision
- Flow revision

A Run references exact versions.

When Markdown changes:
1. detect source hash change
2. recompile
3. compare old/new structured plan
4. require user review only for material behavior/safety changes
5. create a new plan revision
6. keep prior revision for audit/history

---

# Product model example

Human source:

```md
# 每天发布行业文章

每天早上 8 点检查我的行业学习仓库。

找到今天最新的文章和封面。

如果有新内容，就发布到微信公众号。

如果电脑早上没有运行 FlowPilot，
当天第一次启动后执行。

正式发布前让我确认。
```

Compiled:

```
TaskPlan
├── Schedule: daily 08:00
├── Missed policy: run on next start
├── Source: src_industry_repo
├── Selection: today's latest publishable article
├── Deduplication: source version not previously consumed
├── Goal: goal_publish_wechat_article
├── Bindings
│   ├── title ← resolved article title
│   ├── content ← resolved article body
│   └── cover ← associated cover image
└── Confirmation: before irreversible publish
```

Then:

```
TaskPlan
   ↓
Source Resolver
   ↓
Immutable InputBundle
   ↓
GoalPlan
   ↓
Flow revision
   ↓
Run
```

---

# Design consequence

FlowPilot is not configuration-first.

The primary interaction is:
1. express intent
2. let FlowPilot understand/compile it
3. review only material ambiguity or risk
4. run
5. show contextual UI when observation, choice, comparison, or intervention is useful

The product should not force users to understand the machine representation.
