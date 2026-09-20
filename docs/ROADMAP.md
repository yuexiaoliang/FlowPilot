# 路线图

路线图以风险为导向。在证明核心运行时闭环之前，不要追求支持平台的数量。

> 注意：具体实现顺序以 `DEVELOPMENT-PLAN.md` 为准；本文件是较高层的历史 / 战略摘要。

## 阶段 0 — 基础

目标：仓库可以由多个 Agent 安全开发。

交付内容：

- workspace / tooling / bootstrap
- Electron shell + React renderer
- strict TypeScript / lint / test CI
- package 边界
- SQLite migration 机制
- typed IPC
- 安全默认配置
- ADR 流程
- 本地 fixture 网站

退出条件：clean clone 可以确定性地完成 install、test、build 和 launch。

## 阶段 1 — 确定性 Workflow 运行时

目标：在不调用 AI 的情况下执行已知 Flow。

交付内容：

- Workflow IR v1
- BrowserDriver v1
- ElectronDriver 的基础 navigate / snapshot / find / click / fill / upload 能力
- executor
- precondition / postcondition validator
- Run 状态机
- typed error
- structured event log
- 本地 fixture Flow

退出条件：fixture Workflow 可以重复执行，且零 LLM 调用。

## 阶段 2 — 持久化与账号 / Session 模型

目标：App 重启后仍能保留状态。

交付内容：

- platform / account / Flow / revision / Run Schema
- 每个账号独立的 persistent Electron session
- Session health 检测
- 账号删除 / Session 清理
- 加密 Secret 抽象

退出条件：在 fixture 环境中，登录 / Session 和 Workflow 可以跨 App 重启保持。

## 阶段 3 — Discovery

目标：从 Goal 和页面状态学习 Flow。

交付内容：

- provider-neutral AI gateway
- sanitized snapshot pipeline
- structured discovery output
- Workflow compiler / validator
- Discovery UI 和审阅
- cost / token / latency instrumentation

退出条件：AI 可以学习 fixture v1，生成一个之后无需 AI 即可执行的 Flow。

## 阶段 4 — Repair 闭环

目标：已知 Workflow 失效后能够自愈。

交付内容：

- failure classifier
- bounded RepairContext
- repair proposal Schema
- candidate patch validation
- safe trial execution
- 新 revision 创建
- rollback / version inspection

测试 fixture v2 必须故意破坏 v1 的 selector / layout。

退出条件：

```text
learn v1 → run → switch site to v2 → fail → repair → validate → revision+1 → next run succeeds without AI
```

这是关键技术里程碑。

## 阶段 5 — Human Takeover 与风险引擎

目标：安全处理不可自动化或涉及安全验证的状态。

交付内容：

- pause / resume 状态
- takeover UI
- risk event taxonomy
- QR / security / MFA fixture
- confirmation checkpoint
- rate limiting / backoff

退出条件：所有 hard-pause fixture 都会停止自动化，并且只有在用户介入经过验证后才恢复。

## 阶段 6 — 微信公众号 MVP

目标：完成第一个真实平台 Adapter。

范围：

- 手工 QR login
- persistent account session
- article editor discovery
- 在适用时输入 title / body / cover / summary
- publish Flow
- 不可逆发布前确认
- success verification
- Repair 证据收集

自动化 CI 不得使用生产账号。

退出条件：受控测试账号可以可靠地重复发布文章，并且故意引入的轻微 UI 变化可以被修复。

## 阶段 7 — 产品加固

- crash recovery
- resumable Run
- update system
- 不包含 Secret 的 diagnostics export / import
- Workflow Inspector
- platform compatibility matrix
- performance / memory profiling
- signed installer

## 阶段 8 — 更多平台与 API Action

只有进入此阶段后，才根据真实用户需求增加更多 Adapter。

平台提供官方 API 时，引入经过授权的 API Action。Browser / API 实现应共享相同的 capability 语义。

## 延后事项

早期版本不包含：

- cloud browser execution
- desktop 关闭后的 background publish
- team collaboration / RBAC
- Workflow marketplace
- stealth browser / anti-detection evasion
- CAPTCHA solving
- 任意网站的破坏性自动化
