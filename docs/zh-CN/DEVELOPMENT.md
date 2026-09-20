# 开发指南

> [English canonical](../DEVELOPMENT.md)

## 工具链

基线：

- Node.js：仓库固定的 active LTS
- pnpm：通过 `packageManager` 固定
- TypeScript strict
- Electron
- React + Vite
- Electron Forge（除非 ADR 修改）
- Vitest
- Playwright
- ESLint + Prettier
- GitHub Actions

不要全局安装项目依赖，使用仓库固定的 Corepack / pnpm。

## Monorepo

使用 pnpm workspaces。

没有真实构建规模需求时，不引入 Turborepo / Nx。

根脚本最终应提供：

    pnpm dev
    pnpm build
    pnpm typecheck
    pnpm lint
    pnpm test
    pnpm test:e2e
    pnpm package

文档中优先使用 root script，而不是 package-specific 命令。

## Branch / Commit

- `main` 保持可发布。
- 短分支：`feat/*`、`fix/*`、`docs/*`、`refactor/*`。
- Commit 尽量小，使用 Conventional Commit 风格。
- 大重构不要和功能变更混在一起。
- 架构变化必须在同一 PR 包含 ADR。

## PR checklist

PR 应说明：

- 解决的问题
- 架构影响
- 关键实现选择
- 实际运行的测试
- 适用时的 UI screenshot / video
- 安全 / session 影响
- migration 影响
- follow-up

## Test pyramid

### Unit

纯 domain rule、schema、workflow compiler、validator、policy、redaction。

### Contract

所有 BrowserDriver 实现必须跑同一套行为 contract。

### Integration

SQLite repository、migration、IPC、Electron session、worker orchestration。

### Fixture-based AI test

Discovery / repair 使用已提交的 sanitized DOM / accessibility / snapshot fixture，验证结构化 proposal / policy，不依赖模型自然语言。

### E2E

使用本地 fixture site 模拟：

- normal editor flow
- selector / DOM change
- interstitial
- login expiry
- ambiguous button
- security challenge
- upload
- publish success / failure

CI 不得向真实服务发布。

## Deterministic fixture

在仓库里建立内部测试站点，不直接拿真实微信公众号做 repair 测试。

至少有 v1 / v2 / v3，可人为破坏已知 Workflow。

这能避免 flaky test 和真实误操作。

## Dependency policy

新增依赖前问：

1. Node / Electron 是否已有能力？
2. 是否维护良好、广泛使用？
3. 是否增加 native build 复杂度？
4. 是否运行在 Renderer 或接触 remote content？
5. 是否可以隔离在 interface 后面？

Feature PR 不做 Electron / Playwright / React 跨 major 升级。

## Database

- migration append-only
- migration 原子执行
- backup / rollback 行为有测试
- repository 负责 row → domain type
- Renderer 不直接 query SQLite

## IPC

Preload 只暴露最小 typed API。

IPC channel / payload 放 `packages/ipc-contracts`。

规则：

- 所有 incoming payload validate
- 不向 Renderer 暴露通用 `invoke(channel, payload)`
- 不提供任意文件系统路径访问
- 不提供任意 shell / process 执行
- 不泄漏 `webContents` object

## Error handling

跨 package / process 的 error 使用稳定可序列化 envelope：

- code
- message
- retryable
- optional details
- optional correlationId

敏感 detail 必须省略 / 脱敏。

## Feature flag

实验性 discovery / repair 在 fixture 和 runtime telemetry 证明可靠前使用 feature flag。

## 开发顺序说明

历史上曾建议从 runtime vertical slice 开始；当前**规范开发顺序以 DEVELOPMENT-PLAN.md 为准**。

不要使用本文件末尾的工程建议覆盖当前 Gate 顺序。