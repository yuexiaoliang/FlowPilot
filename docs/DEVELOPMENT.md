# 开发指南

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

## Monorepo 结构

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

## 分支与提交

- `main` 保持可发布。
- 短分支：`feat/*`、`fix/*`、`docs/*`、`refactor/*`。
- Commit 尽量小，使用 Conventional Commit 风格。
- 大重构不要和功能变更混在一起。
- 架构变化必须在同一 PR 包含 ADR。

## PR 检查清单

PR 应说明：

- 解决的问题
- 架构影响
- 关键实现选择
- 实际运行的测试
- 适用时的 UI screenshot / video
- 安全 / session 影响
- migration 影响
- follow-up

## 测试金字塔

### 单元测试

纯 domain rule、schema、workflow compiler、validator、policy、redaction。

### 契约测试

所有 BrowserDriver 实现必须跑同一套行为 contract。

### 集成测试

SQLite repository、migration、IPC、Electron session、worker orchestration。

### 基于 Fixture 的 AI 测试

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

## 确定性 Fixture

在仓库里建立内部测试站点，不直接拿真实微信公众号做 repair 测试。

至少有 v1 / v2 / v3，可人为破坏已知 Workflow。

这能避免 flaky test 和真实误操作。

## 依赖策略

新增依赖前问：

1. Node / Electron 是否已有能力？
2. 是否维护良好、广泛使用？
3. 是否增加 native build 复杂度？
4. 是否运行在 Renderer 或接触 remote content？
5. 是否可以隔离在 interface 后面？

Feature PR 不做 Electron / Playwright / React 跨 major 升级。

## 数据库

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

## 错误处理

跨 package / process 的 error 使用稳定可序列化 envelope：

```ts
type AppError = {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
  correlationId?: string;
};
```

敏感 detail 必须省略 / 脱敏。

## Feature flag 管理

实验性 discovery / repair 在 fixture 和 runtime telemetry 证明可靠前使用 feature flag。

## 开发顺序说明

实现应采用垂直切片，而不是先把所有基础设施一次性搭完。

以下是用于尽早验证架构的工程切片示例：

1. desktop shell
2. embedded test page
3. BrowserDriver snapshot / find / click / fill
4. hardcoded Flow IR
5. executor + validator
6. persistence
7. intentional break
8. 使用 deterministic fake provider 的 Repair 接口
9. 真实 AI provider
10. 微信 Adapter / 手工登录

这样可以在依赖真实平台前验证架构。

此列表是历史工程验证顺序，不是当前阶段 Roadmap。**规范开发顺序始终以 `DEVELOPMENT-PLAN.md` 和当前 Gate 为准**，不得用本示例跳过 D0、P0 或其他已批准阶段。
