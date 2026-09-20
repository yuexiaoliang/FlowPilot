# Task、Source 与 Input Runtime

本文件定义定时 Task 如何安全、可复现地消费外部用户数据。

## Pipeline

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

发布过程中不能反复读取可变 Source。

Source 数据在执行前解析并冻结。

---

# Source 授权

Source 是明确的权限边界。

对于本地文件，用户通过 OS / UI 选择文件夹或仓库。

授权范围示例：

```text
~/projects/industry-learning-journal
```

FlowPilot 保存内部 Source record 和 scoped permission。

AI / runtime 获得 Source handle / capability，而不是整个用户 Home 的无限制访问。

不能因为自然语言写“从我的文件里找文章”就授予广泛文件系统权限。

未授权 Source 必须请求连接 / permission。

## 初始 Source 类型

MVP：

1. Local Folder
2. Local Git Repository

后续：GitHub Repository、Google Drive、Dropbox / OneDrive、HTTP API、RSS、database、Notion 等。

Source 实现应尽量共享统一 interface。

概念接口：

```ts
interface SourceProvider {
  inspect(source: SourceRef): Promise<SourceMetadata>;
  list(request: SourceListRequest): Promise<SourceItem[]>;
  read(request: SourceReadRequest): Promise<SourceContent>;
  snapshot(request: SourceSnapshotRequest): Promise<SourceSnapshot>;
}
```

写权限如果未来支持，必须独立授权，不能默认包含在 read capability 中。

---

# Source selection

Task 可以自然写：

> 找到今天最新的文章和封面。

Task compiler 把它编译成 structured selection rule。

Selection 在 Flow 开始前执行。

多个候选存在实质歧义时不能随机选择；应展示 ambiguity resolver 或使用用户已明确学习的 policy。

---

# InputBundle

每个 Run 获得不可变 InputBundle。

示例：

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

实际内容可以根据大小 / 安全策略保存或引用，但 Run 必须保留足够的不可变 provenance，明确知道到底用了什么。

## 为什么先 snapshot

没有这个边界会出现：

- title 来自一个版本，正文中途变成另一个版本
- retry 发布比原始 attempt 更新的数据
- 无法审计 / 复现
- 并发编辑造成不一致

Run 一旦进入执行，InputBundle 不允许静默变化。

如果用户想使用新数据，应创建新 Run 或明确重新 snapshot。

---

# Git provenance

Git Source 特别适合 FlowPilot，因为 commit 是天然不可变版本。

Run 应记录：

- repository Source ID
- selection 使用的 branch / ref
- exact commit SHA
- selected paths
- content hashes

示例：

```text
Source: industry-learning-journal
Branch: main
Commit: 7acf921
Files:
- daily/2026-09-20/article.md
- daily/2026-09-20/cover.png
```

---

# Idempotency 与防重复

定时发布不能重复发布相同 input。

每个 Task 需要 deterministic consumption / idempotency key。

可以由以下信息组合：

- TaskPlan revision
- Goal ID
- Source snapshot / version
- selected content hashes
- destination account / platform
- logical content identity

创建不可逆 Run 前，检查相同 key 是否已成功或正在执行。

自然语言：

> 只发布从未发布过的版本。

内部策略：

```text
dedupeStrategy = source-version-and-destination
```

不能只依赖 timestamp。

## Cursor / watermark

Source / Task 可以维护：

- last processed Git commit
- last processed item ID
- last successful content hash
- feed cursor

只有达到正确 success boundary 后才更新 cursor。Failure 不能把内容错误标记为已消费。

---

# Scheduling

Task schedule 从自然语言编译成标准 schedule。

用户：

> 每天早上 8 点运行。

内部：

```text
normalized schedule + timezone
```

必须显式保存用户 timezone。

普通用户不需要 cron。

## Missed schedule policy

桌面 App 在计划时间可能没有运行。

概念 policy：

- SKIP
- RUN_ON_NEXT_START
- CATCH_UP_WITH_LIMIT

MVP 可以要求 FlowPilot runtime 正在运行。

后台 daemon / cloud runner 属于后续架构阶段。

自然语言可以明确 missed policy：

> 如果电脑早上 8 点没有运行 FlowPilot，当天第一次启动后执行。

编译后的 TaskPlan 保存对应策略。

---

# Task 执行生命周期

    SCHEDULED
    → RESOLVING_SOURCE
    → BUILDING_INPUT
    → VALIDATING_INPUT
    → READY
    → WAITING_CONFIRMATION（可选）
    → RUNNING
    → SUCCEEDED / SKIPPED / FAILED / CANCELLED

SKIPPED 是合法结果，例如今天没有新内容。

原因必须记录，例如：

- NO_MATCHING_INPUT
- ALREADY_CONSUMED
- SOURCE_UNAVAILABLE
- USER_POLICY_SKIP

---

# 将 Source 数据绑定到 Goal input

Compiler 创建语义 binding。

例如用户说：

> Markdown 第一行标题作为标题，正文作为公众号正文，同目录 cover.png 作为封面。

内部编译为：

- Goal input `title` ← document title
- Goal input `content` ← document body
- Goal input `cover` ← associated cover image

Run 开始前必须验证 binding。

缺失 required input 根据 Task policy：

- ask user
- skip
- fail
- derive with AI（只有显式允许且安全时）

AI 派生 input 必须有 provenance。

---

# 安全与隐私

Source 规则：

- least privilege
- 默认只读
- 显式用户授权
- 禁止 unrestricted filesystem traversal
- 只有当前任务真正需要时才把 Source 内容发给 AI
- 按需脱敏
- Prompt 只包含相关 excerpt
- 大仓库通过搜索 / scope，不整体上传

Source 内容中的 prompt injection 不能扩大权限。

---

# 持久化模型

计划中的记录包括：

- goals / goal_revisions / goal_plans
- tasks / task_revisions / task_plans
- sources / source_permissions / source_cursors
- input_bundles
- runs / run_inputs / provenance
- consumption_records

表名可以变化，但职责分离不能消失。

---

# Local runner 演进

早期：

    FlowPilot Desktop
    ├── Scheduler（runtime 活跃时）
    ├── Source Manager
    ├── Task Engine
    └── Workflow Runtime

后续：

    FlowPilot Desktop UI
            ↓
    FlowPilot Local Runner / Daemon
            ↓
    Scheduler + Task Engine + Sources + Runtime

未来可让同一 TaskPlan 运行在 Local Runner 或授权 Cloud Runner。

在本地语义、provenance、idempotency、安全没有证明前，不引入 Cloud execution。
