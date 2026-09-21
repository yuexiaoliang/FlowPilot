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

当前根目录命令：

| 命令 | 作用 |
| --- | --- |
| `corepack pnpm install --frozen-lockfile` | 按锁文件安装固定依赖；CI 和 clean-environment 验证使用此命令 |
| `corepack pnpm dev` | 在 `127.0.0.1:43127` 启动 Vite 和 Electron 开发模式 |
| `corepack pnpm fixture:dev` | 在 `127.0.0.1:43128` 启动本地确定性 Fixture Site；可用 `FLOWPILOT_FIXTURE_PORT` 显式覆盖端口 |
| `corepack pnpm typecheck` | 检查 main、renderer 和 test TypeScript |
| `corepack pnpm lint` | 使用 ESLint 检查 TypeScript、React Hooks 和工程脚本，warning 也会失败 |
| `corepack pnpm format:check` | 用 Prettier 检查代码和工程配置，不修改文件 |
| `corepack pnpm format` | 用 Prettier 写入格式；与只读检查命令明确分离 |
| `corepack pnpm test` | 运行 Vitest 单元 / 组件测试 |
| `corepack pnpm build` | 编译 Electron main 并构建 renderer |
| `corepack pnpm test:e2e` | 构建、在 third-party WebContentsView 中验证 Fixture 隔离与状态，并运行确定性的 Electron 黄金路径 E2E |
| `corepack pnpm ci:validate` | 解析并静态检查 GitHub Actions 的必需命令和最小权限 |
| `corepack pnpm package` | 构建、为当前主机平台 / 架构执行 Electron Forge package，并检查 ASAR 内容边界 |

`package` 输出到根目录 `out/desktop/`。当前只验证本机未签名、未 notarize 的 package；code signing、notarization、installer maker、自动发布和跨平台产物都不属于 E0.2。package smoke 要求运行入口存在，并拒绝源码、测试、`.env`、密钥、browser profile / auth state、本地数据库和测试结果进入 ASAR。

Electron Forge 目前精确固定为 `8.0.0-alpha.10`：最新稳定的 7.x 仍通过 Git subdependency 拉取旧 `@electron/rebuild`，会触发 pnpm 12 的 `blockExoticSubdeps`，并带来 high-severity audit 结果。当前固定版本通过 frozen install、`pnpm audit --audit-level high` 和本机 packaging smoke；Forge 发布无这些问题的稳定版后，应在独立依赖升级切片中替换，不能静默漂移版本。

pnpm 使用 `nodeLinker: hoisted` 满足 Electron Forge 的物理依赖树要求。由于 Forge 对 pnpm workspace 的 app-root 解析仍有限制，packaging wrapper 只在 Forge 运行期间把 desktop 的 `node_modules` 临时映射到 workspace 根，结束后恢复原目录；该目录和临时备份都不得进入产物。

GitHub Actions 使用固定 Node `24.15.0`、Corepack 和 pnpm `12.5.1`，以 frozen lockfile 运行 typecheck、lint、format check、workflow contract、test 和 build。CI 不运行真实平台、生产账号或发布操作。

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

`apps/fixture` 是独立 workspace app，只监听 loopback。默认地址是 `http://127.0.0.1:43128`；需要避开本机端口冲突时，必须显式设置 `FLOWPILOT_FIXTURE_PORT=54321`，不会随机选择或静默回退端口。`/health` 提供就绪检查，`/manifest` 返回可重放的 route/state 清单。

稳定场景如下：

| Route | 初始状态 | 用途 |
| --- | --- | --- |
| `/fixture/v1/normal` | `EDITOR_READY` | 正常编辑、确认和本地发布模拟 |
| `/fixture/v1/upload` | `UPLOAD_REQUIRED` | 仅使用仓库内 `fake-cover.svg` 的上传模拟 |
| `/fixture/v1/publish-success` | `PUBLISH_READY` | 确定性成功后置状态 |
| `/fixture/v1/publish-failure` | `PUBLISH_READY` | 确定性失败后置状态 |
| `/fixture/v2/dom-change` | `EDITOR_READY_DOM_CHANGED` | DOM / layout 改变但保留语义控件 |
| `/fixture/v2/ambiguity` | `TARGET_AMBIGUOUS` | 两个等价目标，要求调用方不得猜测 |
| `/fixture/v2/interstitial` | `INTERSTITIAL_REQUIRED` | 阻塞式中间页 |
| `/fixture/v3/auth-expired` | `AUTH_REQUIRED` | 登录过期，只允许人工处理 |
| `/fixture/v3/security-challenge` | `SECURITY_CHALLENGE` | 安全挑战，明确停止且不绕过 |

Fixture 不克隆真实平台、不访问外部网络、不保存 credential，也不执行真实发布。Electron E2E 通过 `createThirdPartyWebContentsView` 加载全部场景，验证页面拿不到 `window.flowPilot`、Node `process`、`require` 或 privileged preload，权限、popup 和越界导航保持默认拒绝。测试结束后服务器必须释放端口。

可分别运行：

```sh
corepack pnpm fixture:dev
corepack pnpm --filter @flowpilot/fixture-site test
corepack pnpm --filter @flowpilot/desktop test:electron-fixture
```

这些 v1 / v2 / v3 场景为后续 BrowserDriver、Discovery 和 Repair 提供测试表面，但 Fixture 本身不承载它们的运行时语义。这能避免 flaky test 和真实误操作。

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

当前 E0 shell 使用 `packages/ipc-contracts` 保存唯一的 shell-info channel、严格 request/result Schema 和可序列化 `AppError`。sandboxed preload 只向可信 Renderer 暴露 `window.flowPilot.getShellInfo()`，不暴露通用 `invoke`；Main 会同时校验 sender identity 与 payload。Renderer 启动 handshake 失败时显式显示失败，不会绕过 bridge 静默继续。

third-party WebContentsView 使用独立的 `persist:flowpilot:account:<opaque-key>` partition，明确关闭 Node integration、privileged preload、`<webview>`、insecure content 和 experimental features，并保持 context isolation、sandbox 与 web security。权限默认全部拒绝；popup 全部拒绝；用户触发的导航和 redirect 只能留在显式 allowlist origin 内。`test:e2e` 在加载任何真实第三方网页前用本地 Electron smoke 验证这些边界。

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
