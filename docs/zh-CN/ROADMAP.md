# Roadmap

> [English canonical](../ROADMAP.md)

Roadmap 以风险为导向。不要在核心 runtime 闭环尚未证明前追求平台数量。

> 注意：具体实现顺序以 `DEVELOPMENT-PLAN.md` 为准；本文件是较高层的历史 / 战略摘要。

## Phase 0 — Foundation

目标：仓库可以被多个 Agent 安全开发。

交付：workspace/tooling、Electron shell + React、strict TypeScript / CI、package boundaries、SQLite migration、typed IPC、安全默认值、ADR、local fixture site。

退出：clean clone 可以确定性 install / test / build / launch。

## Phase 1 — Deterministic workflow runtime

目标：无 AI 执行已知 Flow。

交付：Workflow IR v1、BrowserDriver v1、ElectronDriver、executor、validator、run state machine、typed errors、structured event log、fixture flow。

退出：fixture workflow 可以重复执行且零 LLM call。

## Phase 2 — Persistence / Session

目标：App restart 后仍可继续。

交付：platform/account/flow/revision/run schema、per-account Electron session、session health、account cleanup、secret abstraction。

## Phase 3 — Discovery

目标：从 Goal + page state 学习 Flow。

交付：provider-neutral AI gateway、sanitized snapshot、structured discovery、workflow compiler / validator、Discovery UI、成本 / token / latency instrumentation。

## Phase 4 — Repair loop

目标：已知 Workflow 失效后自愈。

关键证明：

    learn v1 → run → switch v2 → fail → repair → validate → revision+1 → next run succeeds without AI

## Phase 5 — Human Takeover / Risk

目标：安全处理不可自动化 / 安全状态。

包括 pause / resume、takeover UI、risk taxonomy、QR / security / MFA fixture、confirmation、rate limit / backoff。

## Phase 6 — WeChat Official Accounts MVP

第一个真实平台：手工 QR login、persistent session、文章 editor discovery、title/body/cover/summary、publish、confirmation、success verification、repair evidence。

自动 CI 不使用生产账号。

## Phase 7 — Product hardening

- crash recovery
- resumable runs
- update system
- secret-safe diagnostics
- workflow inspector
- compatibility matrix
- performance / memory profiling
- signed installers

## Phase 8 — Additional platforms / API actions

只有这时再按真实用户需求增加平台。

有官方 API 时优先引入授权 API action，并保持 browser / API 语义一致。

## Deferred

早期不做：

- cloud browser execution
- desktop 关闭后的 background publish
- team collaboration / RBAC
- workflow marketplace
- stealth / anti-detection evasion
- CAPTCHA solving
- arbitrary destructive website automation