# Technology Stack

This document records the default implementation choices for FlowPilot. Replacing a **Locked** choice requires an ADR.

| Area | Choice | Status | Rationale |
|---|---|---|---|
| Desktop runtime | Electron | **Locked** | We need a bundled, controllable Chromium and deep session/WebContents integration across desktop platforms. |
| Language | TypeScript, strict | **Locked** | Shared types across UI, IPC, runtime, workflow schemas, and browser adapters. |
| UI | React | Default | Large ecosystem, predictable agent support, no requirement for SSR. |
| UI build | Vite | Default | Fast desktop renderer development; aligns with Electron tooling. |
| Embedded remote browser | WebContentsView | **Locked** | First-class Electron controlled web content; avoids the discouraged `<webview>` path. |
| Production browser control | Electron webContents/CDP behind ElectronDriver | **Locked boundary** | Keeps the viewed page and automated page identical. |
| Automation/testing | Playwright | Default | Excellent locators, browser integration, test fixtures, and dev/debug tooling. It is an adapter/helper, not the domain runtime. |
| Workflow runtime | FlowPilot custom | **Locked** | This is the core product asset; must be versioned, provider-independent, and self-healing. |
| Validation | Zod | Default | Runtime schemas at persistence/AI/IPC boundaries. |
| Local DB | SQLite | **Locked for MVP** | Local-first desktop state, transactions, migrations, no server requirement. |
| SQLite access | Drizzle ORM + better-sqlite3 initially | Default | Typed schema/migrations with a mature SQLite driver. Isolate behind repositories so driver can change later. |
| UI state | Zustand | Default | Small state layer; keep durable/business state outside renderer stores. |
| Package manager | pnpm workspaces | **Locked** | Efficient monorepo and deterministic lockfile. |
| Unit/integration tests | Vitest | Default | TypeScript/Vite-friendly. |
| E2E | Playwright Test | Default | Cross-process/renderer/browser testing and deterministic fixture-site testing. |
| Packaging | Electron Forge | Default | Electron-focused packaging/rebuild/publishing integration. |
| CI | GitHub Actions | Default | Repository-native checks. |
| Secrets | Electron safeStorage + OS facilities | **Locked policy** | No plaintext credential persistence. |
| AI SDK | provider adapters, no domain dependency on vendor SDK | **Locked boundary** | Avoid model/vendor lock-in. |

## Node and dependency versions

Do not hard-code version numbers into architecture documentation. The repository is authoritative through:
- `package.json#engines`
- `package.json#packageManager`
- `pnpm-lock.yaml`

Bootstrap should choose a supported Node active-LTS line compatible with the chosen Electron release and pin the package manager.

Dependencies use exact or controlled ranges according to the repository update policy. Major upgrades are separate PRs.

## Why Electron rather than Tauri

FlowPilot is browser-centric. Electron gives the desktop product one bundled Chromium behavior model and exposes sessions, WebContentsView, navigation, permissions, and CDP through one runtime. Tauri's system WebView strategy is attractive for small desktop apps but introduces engine differences that are undesirable for persisted web workflows.

This is an architecture choice, not a general claim that Electron is better than Tauri.

## Why WebContentsView

Remote platform UI must be visible to the user and controllable by the runtime. WebContentsView lets Main own the untrusted page separately from the trusted React renderer. Do not use `<webview>` as an implementation shortcut.

## Why BrowserDriver exists

Without BrowserDriver, platform features gradually become coupled to Playwright selectors, Electron APIs, or CDP commands. That would make Workflow IR impossible to keep implementation-neutral.

Only driver packages may depend on browser-specific control APIs.

## Playwright's role

Use Playwright for:
- automated tests
- local fixture workflows
- driver contract verification
- development/debug experiments
- optional fallback/dev driver

Do not serialize Playwright Locator objects or Playwright-specific selectors into Workflow IR.

## SQLite guidance

Persistence is accessed through repositories. Renderer never touches SQLite.

The initial `better-sqlite3` choice is intentionally isolated because it is a native module and must be rebuilt for Electron during packaging. Electron Forge/rebuild configuration must be covered by a packaging smoke test.

If Node's built-in SQLite support becomes the clearly safer production choice for the pinned runtime, migrate behind the repository layer via ADR rather than leaking either API into domain code.

## AI providers

Define a provider-neutral interface such as:
```ts
interface StructuredModel {
  generate<TInput, TOutput>(
    task: ModelTask<TInput, TOutput>,
    signal?: AbortSignal,
  ): Promise<ModelResult<TOutput>>;
}
```

Provider-specific SDKs belong in adapters. Model names, prompts, and provider settings are configuration, not Workflow IR.

## What not to add initially

Do not add without demonstrated need:
- Next.js
- Redux
- NestJS
- Express/Fastify server
- PostgreSQL
- Redis
- Docker requirement for desktop development
- Nx/Turborepo
- Temporal
- LangChain/LangGraph as the workflow runtime
- cloud browser vendors
- stealth browser plugins

These may become valid later, but none is required to prove the core product loop.
