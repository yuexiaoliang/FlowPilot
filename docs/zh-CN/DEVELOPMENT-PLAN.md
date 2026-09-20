# FlowPilot 开发计划

> [English canonical](../DEVELOPMENT-PLAN.md)

本文件是规范实现顺序的中文镜像。英文版是唯一事实源。

FlowPilot 通过 **Gate** 推进，而不是简单堆功能。只有当前阶段在 `ACCEPTANCE.md` 中具备验收证据后，才能进入下一阶段。

GitHub Issues 是可选的；仓库文档才是事实源。

---

# 交付模型

    D0 Design Contract
            ↓
    P0 Interactive Mock Prototype
            ↓
    E0 Engineering Foundation
            ↓
    E1 Intent Compiler (Goal / Task)
            ↓
    E2 Source / InputBundle / Scheduling Semantics
            ↓
    E3 Deterministic Workflow Runtime
            ↓
    E4 AI Discovery / Repair
            ↓
    E5 Human Takeover / Risk
            ↓
    E6 WeChat Official Accounts MVP
            ↓
    H0 Hardening / Runner / Expansion

采用这个顺序是刻意的：

1. 在搭基础设施前先验证产品交互；
2. 将面向人的语义与机器执行分离；
3. 在加入 AI 自愈前先证明确定性执行；
4. 在接真实平台前先验证安全与人工介入。

---

# D0 — Design Contract

## 目标

把已确认的产品原则和视觉方向变成可以直接实现的设计合同，避免后续 Agent 在写代码时重新设计 FlowPilot。

## 必须产出

在 `design/` 下创建：

- `README.md`
- `DESIGN-PRINCIPLES.md`
- `DESIGN-SYSTEM.md`
- `INTERACTION-MODEL.md`
- `COMPONENTS.md`
- `SCREEN-SPECS.md`
- `FLOWS.md`

## 必须表达

- 默认简单，按需透明
- intent-first，而不是 dashboard-first
- 自然语言 / Markdown 是主要创作入口
- 不要求用户编写 DSL / ID
- 渐进披露
- 上下文式 / 临时 UI
- 专业 Inspector 按需出现
- 最少导航
- Simple / Execution / Inspection 三层清晰分离

## Golden screens

至少规范：

1. Intent Home
2. AI Understanding Review
3. 上下文式 Source Connection
4. Input Preview
5. Execution
6. Confirmation / Human Takeover
7. Result
8. Inspector / professional detail
9. Repair Diff
10. 已存在 Task / Goal 的查看页

## 退出条件

Acceptance D0。

---

# P0 — Interactive Mock Prototype

## 目标

在接入生产基础设施前验证产品体验。

构建真实的 Electron + React 桌面原型，但**只使用 Mock service**。

## 黄金路径

    Intent
    → AI Understanding
    → Source resolution
    → Input preview
    → Run
    → Human confirmation
    → Success
    → Inspect details

## 只做 Mock

不要依赖：

- 真实 LLM
- 真实微信
- 生产 BrowserDriver
- 真实 Scheduler
- 复杂 SQLite
- 真实 Git 解析

使用确定性 Mock fixture。

## 原型行为

用户应该可以自然输入：

    每天早上 8 点检查我的行业学习仓库。
    如果今天有新的文章，就发布到微信公众号。
    正式发布之前让我确认。

原型应该：

- 展示 FlowPilot 的结构化理解
- 只有缺少 Source 时才请求连接
- 展示本次 Input Preview
- 模拟执行
- 在发布前暂停确认
- 完成成功态
- 只有用户需要时才展开专业详情

## 退出条件

Acceptance P0。

---

# E0 — Engineering Foundation

## 目标

建立适合多 Agent 持续开发的确定性工程底座。

## 交付

- pnpm workspace
- 固定 Node / pnpm 策略
- strict TypeScript
- Electron main / preload / renderer
- React + Vite
- ESLint + Prettier
- Vitest
- Playwright Test
- typed IPC skeleton
- 安全 Electron 默认配置
- GitHub Actions
- 本地确定性 fixture web app

根命令：

    pnpm dev
    pnpm build
    pnpm typecheck
    pnpm lint
    pnpm test
    pnpm test:e2e
    pnpm package

Fixture 至少支持：

- 正常 flow
- DOM / layout 改动
- 歧义 / interstitial
- auth expired
- security challenge
- upload
- publish success / failure

## 退出条件

Acceptance E0。

---

# E1 — Intent Compiler: Goal and Task

## 目标

把普通自然语言 / Markdown 编译为可版本化的结构化计划，同时不把机器语法暴露给用户。

## Goal

实现：

- Goal source / revision
- GoalPlan schema
- intent
- required / optional inputs
- success / non-success criteria
- human confirmation / intervention policy

## Task

实现：

- Task source / revision
- TaskPlan schema
- 语义 Goal reference
- schedule interpretation
- Source reference
- selection rule
- policy
- source-hash → compiled-plan revision 关联

## Semantic resolution

自然语言短语解析到稳定内部实体。

无歧义：静默绑定。

有实质歧义：返回上下文式 clarification UI。

普通用户绝不能被要求写：

- `@goal/...`
- `@source/...`
- UUID
- cron
- selector
- retry DSL

## Provider 边界

使用 provider-neutral structured-model 接口。

先用 fake / deterministic provider 支持测试，再接真实 provider。

## 退出条件

Acceptance E1。

---

# E2 — Source, InputBundle, and Scheduling Semantics

## 目标

把经过授权的外部数据安全、可复现地连接到 Task。

## 初始 Source

- Local Folder
- Local Git Repository

## Source 规则

- 用户显式授权
- scoped root
- 默认只读
- 自然语言不能扩大文件系统权限
- provider 接口与 domain model 隔离

## InputBundle

执行前：

    Task trigger
    → resolve Source
    → select content
    → bind Goal inputs
    → capture immutable provenance
    → validate
    → create InputBundle

Flow 运行过程中不得静默重新读取变化中的 Source 文件。

Git provenance 至少记录：

- Source ID
- branch / ref
- exact commit SHA
- selected paths
- content hashes

## Idempotency

重复不可逆动作必须有确定性去重和 consumption record。

失败 Run 不能错误地把 Source 标记为已消费。

## Schedule semantics

自然语言 schedule 编译为标准 schedule + 明确 timezone。

至少支持：

- SKIP missed schedule
- RUN_ON_NEXT_START

本阶段只要求 FlowPilot runtime 活跃时本地调度；后台 daemon / cloud runner 延后。

## 退出条件

Acceptance E2。

---

# E3 — Deterministic Workflow Runtime

## 目标

在不调用 AI 的情况下重复执行一个已知 Flow。

## Workflow IR

实现：

- Flow
- immutable FlowRevision
- Step
- TargetDescriptor
- Condition
- Action
- RetryPolicy
- RepairPolicy
- typed error taxonomy

## BrowserDriver

最小能力：

- navigate
- snapshot
- find
- click
- fill
- upload
- waitFor
- screenshot

runtime / domain 不能直接 import Electron、Playwright 或 CDP。

## ElectronDriver

按需使用 WebContentsView / webContents / CDP 实现 BrowserDriver。

## Execution

每个有意义 Step：

    precondition
    → target resolution
    → action
    → transition / wait
    → postcondition
    → evidence

没有抛异常不等于成功。

## State machine

至少：PENDING、PREPARING、RUNNING、VERIFYING、SUCCEEDED、FAILED、CANCELLED。

## 退出条件

Acceptance E3。

---

# E4 — AI Discovery and Repair

## 目标

从 Goal 学习 Flow，并在环境变化时只修复失败局部。

## Discovery

    GoalPlan
    + sanitized page state
    + allowed actions
    → structured proposal
    → schema validation
    → policy validation
    → trial
    → persisted Flow revision

## Repair

RepairContext 包含：

- typed failure
- failed Step
- last successful checkpoint
- bounded neighboring context
- expected target state
- sanitized page snapshot
- platform hints

默认输出最小可行 patch。

成功修复创建新的 immutable Flow revision。

## 必须证明

    learn fixture v1
    → run with no AI
    → switch fixture to v2
    → typed failure
    → local repair
    → validate
    → revision N+1
    → next run succeeds with no AI

## 退出条件

Acceptance E4。

---

# E5 — Human Takeover and Risk

## 目标

显式、安全地处理用户 / 安全验证介入。

## Risk taxonomy

至少：LOGIN_REQUIRED、QR_REQUIRED、CAPTCHA、MFA_REQUIRED、SECURITY_CHALLENGE、ACCOUNT_WARNING、RATE_LIMIT、PERMISSION_DENIED、DESTRUCTIVE_ACTION_CONFIRMATION、UNKNOWN_INTERSTITIAL。

## Runtime states

增加：PAUSED_HUMAN、RETRY_WAIT、REPAIRING。

## Takeover

用户可以接管、完成登录 / 验证 / 手工决定，再把控制权交回。

恢复前必须重新 snapshot 并验证已知安全状态。

禁止 CAPTCHA / MFA / security bypass。

## 退出条件

Acceptance E5。

---

# E6 — WeChat Official Accounts MVP

## 目标

把已经验证的产品模型 / runtime 应用到第一个真实平台。

## 范围

- 添加账号 / 平台
- 手工二维码登录
- 持久账号 session
- 学习文章发布 Flow
- title
- body
- cover
- summary（适用时）
- publish confirmation
- success verification
- repair evidence

CI 不使用生产账号。

禁止 stealth / fingerprint / CAPTCHA / MFA bypass。

## 退出条件

Acceptance E6。

---

# H0 — Hardening and Expansion

只有 E6 后再考虑：

- crash recovery
- resumable runs
- local background runner / daemon
- scheduler robustness
- application updates
- workflow / run Inspector polish
- diagnostics export with redaction
- compatibility matrix
- performance / memory profiling
- signed installers
- additional platforms
- official API-backed actions
- optional cloud runner
- team features

重大扩展应有自己的计划 / ADR。

---

# Agent 如何选择工作

没有明确指定时：

1. 读 `AGENTS.md`；
2. 读 `PROJECT-STATE.md`；
3. 读本计划；
4. 读 `ACCEPTANCE.md`；
5. 选择当前阶段最小未完成 slice；
6. 需要时使用 `TASK-PACKET-TEMPLATE.md`；
7. 实现；
8. 验证；
9. 当前事实变化时更新 PROJECT-STATE；
10. 留下 handoff。

没有 Gate 证据时不要跳到下一阶段。