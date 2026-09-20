# 架构

> [English canonical](../ARCHITECTURE.md)

## 架构目标

FlowPilot 是 local-first、intent-first 的桌面自动化运行时。

人的意图主要以自然语言 / Markdown 编写，然后编译为结构化 plan。长期资产包括 versioned GoalPlan、TaskPlan、Source、Workflow 和 Run provenance。

AI 用于理解意图、发现 Workflow、修复 Workflow；它不是确定性 Workflow Runtime 本身。

## Runtime topology

### Electron Main

负责：

- App 生命周期
- Window / WebContentsView
- persistent Electron session / partition
- permission / navigation policy
- secure storage
- IPC endpoint
- BrowserDriver implementation wiring
- worker lifecycle

### Renderer

负责：

- React UI
- platform / account 管理视图
- Flow / Run inspection
- Human Takeover 控制
- 用户确认
- settings

Renderer 除了最小 preload API 外，没有 filesystem / database / Node 访问。

### Automation Worker / Application Services

负责：

- Goal / Task 自然语言编译编排
- semantic entity resolution
- Source Manager / InputBundle construction
- scheduler / task orchestration
- Flow loading
- deterministic execution planning
- executor
- validators
- retry / backoff
- risk classification
- discovery / repair orchestration
- run event stream

长时间 / CPU 工作不能阻塞 Electron Main 或 Renderer。

## Core packages

目标 monorepo：

    apps/desktop/src/main
    apps/desktop/src/preload
    apps/desktop/src/renderer
    apps/desktop/src/workers

    packages/domain
    packages/goal-ir
    packages/task-ir
    packages/source-core
    packages/workflow-ir
    packages/workflow-runtime
    packages/browser-driver
    packages/electron-driver
    packages/playwright-driver
    packages/ai-core
    packages/ai-discovery
    packages/ai-repair
    packages/storage
    packages/ipc-contracts
    packages/observability
    packages/platform-sdk

不是第一天就必须创建所有 package；只有真实边界出现时才抽取，但依赖方向必须保持。

## 产品编译模型

FlowPilot 将人类 Source 与机器执行分离：

    Goal.md / Task.md
          ↓
    semantic compilation
          ↓
    GoalPlan / TaskPlan
          ↓
    Source resolution
          ↓
    immutable InputBundle
          ↓
    Flow discovery / selection
          ↓
    versioned Flow
          ↓
    Run

规则：

- 面向用户 Markdown 必须保持正常人类语言，不要求内部 ID / DSL
- 语义短语解析到稳定内部实体引用
- 实质歧义时暂停并让用户选择，而不是猜
- compiled plan 是版本化产物
- Run 绑定 exact plan / Flow revision 和不可变 input provenance
- Repair 更新 Flow revision，不静默改用户 Goal

## Source / Input 模型

Source 是显式权限边界。

自然语言引用永远不能授予任意 filesystem / repository 权限。

执行前把 Source 解析成不可变 InputBundle；Flow 运行中不能重新读取可变 Source。

定时 / recurring Task 必须有 deterministic idempotency / consumption semantics。

## Browser 模型

生产桌面浏览使用 Main 控制的 **Electron WebContentsView**。

每个 platform account 都有隔离 persistent session / partition；不同账号不能混用 Session identity。

Runtime 只通过 BrowserDriver：

- navigate
- snapshot
- find
- click
- fill
- upload
- evaluate
- waitFor
- screenshot

调用方不能知道底层到底是 Electron / CDP 还是 Playwright。

## Authentication 模型

优先顺序：

1. persistent browser session / profile
2. 平台支持的 OAuth / API credential
3. 正常 reauthentication
4. QR / CAPTCHA / MFA / security challenge 时 Human Takeover

不要把逆向 undocumented token refresh 作为默认登录策略。

Auth material 是 Secret；AI 只接收“logged in / login page / security challenge”等派生状态。

## Workflow Runtime

Run state machine：

    PENDING
    → PREPARING
    → RUNNING
    → [PAUSED_HUMAN | REPAIRING | RETRY_WAIT]
    → RUNNING
    → VERIFYING
    → SUCCEEDED

任何状态都可进入 FAILED / CANCELLED。

每个 Step：

    check preconditions
    → resolve target
    → execute action
    → await transition
    → validate expected state
    → record evidence

浏览器操作没有抛错不代表成功。

## AI Discovery

输入尽量最小化：

- user goal
- sanitized page snapshot
- allowed action vocabulary
- current URL / domain metadata
- platform capabilities
- prior relevant steps

输出必须 structured + schema validated。

AI proposal 不能直接修改持久 Workflow，必须先 compile / validate。

## AI Repair

Repair 从 failed Step + bounded neighboring context 开始。

流程：

1. classify failure
2. capture sanitized current state / evidence
3. 请求 candidate patch
4. policy / schema validate
5. bounded trial
6. verify target state
7. 保存新 Flow revision
8. 关联 repair provenance / diff

永远不覆盖旧 Flow revision。

## Risk Engine

typed risk 至少：

- LOGIN_REQUIRED
- QR_REQUIRED
- CAPTCHA
- MFA_REQUIRED
- SECURITY_CHALLENGE
- ACCOUNT_WARNING
- RATE_LIMIT
- PERMISSION_DENIED
- DESTRUCTIVE_ACTION_CONFIRMATION
- UNKNOWN_INTERSTITIAL

Risk 可以 pause / stop；AI 不能覆盖 hard-stop policy。

## Platform abstraction

Platform Adapter 提供 capability / hint，而不是另一套 execution engine。

generic runtime 必须保持 generic。

## Persistence

SQLite 保存：

- platforms
- accounts（非 Secret metadata）
- goals / goal revisions / GoalPlans
- tasks / task revisions / TaskPlans
- sources / permission / cursor
- input bundles / provenance / consumption record
- flows / flow_versions
- runs / run_steps
- repair_attempts
- publish_jobs
- event metadata

Browser profile / session storage 放在 App data 目录，不放 DB blob。

Secret 按需使用 OS-backed secure storage 加密。

## Observability

每个 Run 发结构化 event + correlation ID，例如：

- run.started
- step.started
- step.target_resolved
- step.succeeded
- step.failed
- repair.started
- repair.proposed
- repair.validated
- human_takeover.required
- run.succeeded / failed

日志必须可用于排查，但不能泄漏页面 Secret。

## API-first option

平台如果提供官方、授权 API，可以由 Platform Adapter 实现对应 action。

Browser / API action 可以在语义一致时共享同一 Flow action model。

## MVP 明确非目标

- cloud browser farm
- multi-user collaboration
- stealth / fingerprint spoofing
- CAPTCHA solving / bypass
- arbitrary user-authored JavaScript execution
- autonomous destructive actions
- dozens of platforms
- desktop 关闭时的 server-side scheduling