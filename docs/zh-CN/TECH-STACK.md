# 技术栈

> [English canonical](../TECH-STACK.md)

本文件记录 FlowPilot 的默认实现选择。替换标记为 **Locked** 的选择必须通过 ADR。

| 领域 | 选择 | 状态 | 原因 |
|---|---|---|---|
| Desktop runtime | Electron | **Locked** | 需要统一、可控的 Chromium，以及深度 Session / WebContents 集成。 |
| Language | TypeScript strict | **Locked** | UI、IPC、runtime、schema、adapter 共用类型。 |
| UI | React | Default | 生态成熟、Agent 支持稳定，不需要 SSR。 |
| UI build | Vite | Default | 桌面 renderer 开发快，适合 Electron。 |
| Embedded browser | WebContentsView | **Locked** | Electron 原生受控 web content，避免 `<webview>` 路线。 |
| Production browser control | Electron webContents/CDP behind ElectronDriver | **Locked boundary** | 保证用户看到和自动化控制的是同一页面。 |
| Automation/testing | Playwright | Default | locator、测试、调试优秀，但它是 adapter/helper，不是 domain runtime。 |
| Workflow runtime | FlowPilot custom | **Locked** | 这是核心产品资产，必须版本化、provider-independent、可自愈。 |
| Validation | Zod | Default | 用于 persistence / AI / IPC 边界。 |
| Local DB | SQLite | **Locked for MVP** | Local-first、事务、迁移、不依赖 server。 |
| SQLite access | Drizzle ORM + better-sqlite3 initially | Default | typed schema / migration，且隔离在 repository 层。 |
| UI state | Zustand | Default | 轻量；durable / business state 不放 renderer store。 |
| Package manager | pnpm workspaces | **Locked** | 适合 monorepo，lockfile 稳定。 |
| Unit/integration tests | Vitest | Default | TypeScript / Vite 友好。 |
| E2E | Playwright Test | Default | 适合桌面 / browser / fixture 测试。 |
| Packaging | Electron Forge | Default | Electron 打包、rebuild、发布能力完整。 |
| CI | GitHub Actions | Default | 与仓库原生集成。 |
| Secrets | Electron safeStorage + OS facilities | **Locked policy** | 不允许明文持久 credential。 |
| AI SDK | provider adapters | **Locked boundary** | domain 不依赖厂商 SDK，避免模型 / 厂商锁定。 |

## Node 与依赖版本

架构文档不写死版本号。实际版本以仓库中的以下文件为准：

- `package.json#engines`
- `package.json#packageManager`
- `pnpm-lock.yaml`

Bootstrap 选择与 Electron 兼容的受支持 Node active-LTS，并固定 package manager。

大版本升级应独立 PR，不与普通 feature 混合。

## 为什么选 Electron 而不是 Tauri

FlowPilot 的核心是浏览器。Electron 提供统一 Chromium 运行时，并直接暴露 session、WebContentsView、navigation、permission 和 CDP。

Tauri 对普通小型桌面 App 很有吸引力，但依赖系统 WebView，会带来不同 OS 的浏览器引擎差异，不利于持久化网页 Workflow。

这是 FlowPilot 的具体架构选择，不代表 Electron 普遍优于 Tauri。

## 为什么是 WebContentsView

第三方平台 UI 需要同时可见、可由 runtime 控制。WebContentsView 可以由 Main 独立拥有不可信页面。

不要为了省事使用 `<webview>`。

## 为什么需要 BrowserDriver

如果没有 BrowserDriver，平台功能会逐渐直接耦合 Playwright selector、Electron API、CDP。

那会让 Workflow IR 无法保持实现中立。

只有 driver package 可以依赖 browser-specific control API。

## Playwright 的角色

使用 Playwright：

- automated tests
- local fixture workflows
- driver contract verification
- development / debug experiments
- optional fallback / dev driver

不要把 Playwright Locator 或 Playwright-specific selector 序列化进 Workflow IR。

## SQLite 说明

持久化只能经过 repository 层；Renderer 不直接访问 SQLite。

初始 `better-sqlite3` 是 native module，Electron 打包时需要 rebuild，因此必须有 packaging smoke test。

如果未来 Node 内置 SQLite 明显更适合固定 runtime，应通过 ADR 在 repository 层替换，而不是让两套 API 泄漏到 domain。

## AI provider

定义 provider-neutral structured model interface。

厂商 SDK 只存在于 adapter；模型名、prompt、provider 设置属于配置，不属于 Workflow IR。

## 初期不要加入

没有明确需求时不要加：

- Next.js
- Redux
- NestJS
- Express / Fastify server
- PostgreSQL
- Redis
- Docker 作为桌面开发前置
- Nx / Turborepo
- Temporal
- LangChain / LangGraph 作为 Workflow Runtime
- Cloud browser vendor
- stealth browser plugin

这些未来可能合理，但都不是证明核心闭环的前置条件。