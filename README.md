# FlowPilot

FlowPilot 是一个**意图优先（intent-first）**的桌面 AI 自动化运行时。

用户通过自然语言描述想要的结果和规则。FlowPilot 将意图编译成结构化计划，连接经过授权的数据 Source，执行确定性的 Workflow，并在环境变化时进行修复。

> 自然语言描述意图。结构化计划负责执行。只有在人需要观察、选择、批准或介入时，UI 才出现。

## 产品原则

**默认简单，按需透明。**

- 自然语言 / Markdown 是主要创作入口
- 用户写语义，系统保存内部引用
- 普通用户无需学习 FlowPilot DSL
- 默认界面尽量降低心智负担
- 在需要建立信任或调试时，可以进入专业检查层
- 已知 Flow 的正常执行优先使用确定性运行时
- AI 用于理解、发现和修复，而不是每个已知步骤都重新推理

## 核心模型

- **Goal** —— 用户想达到的结果
- **Task** —— 什么时候、按什么规则执行某个 Goal
- **Source** —— 用户明确授权的数据边界
- **InputBundle** —— 某一次 Run 解析出的不可变输入
- **Flow** —— 可版本化的执行策略
- **Run** —— 带完整来源信息的一次具体执行
- **Human Takeover** —— 登录、验证或高风险决策时明确暂停并交给用户

## 技术基线

- Electron
- TypeScript
- React + Vite
- WebContentsView
- BrowserDriver 抽象
- Playwright 用于测试 / 开发适配
- SQLite
- Zod
- pnpm workspaces
- Vitest + Playwright Test
- GitHub Actions

架构级变化必须通过 ADR。

## 开发模型

FlowPilot 是**文档驱动，而不是 Issue 驱动**。

仓库本身是所有人类和 AI 贡献者共享的项目记忆。简体中文是长期项目文档的唯一默认语言和规范源。

当前 P0 原型使用仓库固定的 Node / pnpm 版本，根目录可执行：

```sh
corepack pnpm install
corepack pnpm dev
corepack pnpm fixture:dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm test
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm package
```

`dev` 在 `127.0.0.1:43127` 启动桌面原型；`fixture:dev` 在 `127.0.0.1:43128` 启动只用于测试的确定性站点。`test:e2e` 会构建并启动本地 Electron 原型，在隔离的 third-party WebContentsView 中验证 Fixture，并运行 P0 黄金路径；全程不连接真实服务或生产账号。

`package` 会先构建应用，再用 Electron Forge 为当前主机平台和架构生成未签名产物，并检查 ASAR 中包含运行入口且不包含源码、测试、Secret、浏览器身份状态或本地数据库。产物位于 `out/desktop/`；它是工程 smoke，不是可公开分发的签名安装包。

如果你要直接体验和验收当前成果，请从 [人工验收指南](./docs/MANUAL-ACCEPTANCE.md) 开始。它按实际界面列出了启动、点击步骤、预期结果、失败分支和当前尚未实现的边界。

从这里开始：

- [docs/README.md](./docs/README.md) —— 文档索引
- [docs/DOCUMENTATION-POLICY.md](./docs/DOCUMENTATION-POLICY.md) —— 中文单语文档规范
- [AGENTS.md](./AGENTS.md) —— 不可违反的项目与 Agent 规则
- [docs/PROJECT-STATE.md](./docs/PROJECT-STATE.md) —— 当前阶段和下一推荐切片
- [docs/DEVELOPMENT-PLAN.md](./docs/DEVELOPMENT-PLAN.md) —— 规范交付顺序
- [docs/ACCEPTANCE.md](./docs/ACCEPTANCE.md) —— Gate 和完成定义
- [docs/MANUAL-ACCEPTANCE.md](./docs/MANUAL-ACCEPTANCE.md) —— 维护者可直接执行的人工验收步骤
- [.codex/agents/](./.codex/agents/) —— Plan Guard、Builder、Gatekeeper、State Keeper
- [.codex/config.toml](./.codex/config.toml) —— 项目级 Codex 多 Agent 配置
- [docs/AGENT-OPERATING-PROTOCOL.md](./docs/AGENT-OPERATING-PROTOCOL.md) —— Codex subagent 调度规则
- [docs/AGENT-START-PROMPT.md](./docs/AGENT-START-PROMPT.md) —— Codex 会话最短启动说明
- [docs/TASK-PACKET-TEMPLATE.md](./docs/TASK-PACKET-TEMPLATE.md) —— 有界任务模板
- [docs/HANDOFF-TEMPLATE.md](./docs/HANDOFF-TEMPLATE.md) —— Agent 交接模板

产品、设计和运行时参考：

- [docs/PRODUCT-MODEL.md](./docs/PRODUCT-MODEL.md)
- [docs/NATURAL-LANGUAGE-UX.md](./docs/NATURAL-LANGUAGE-UX.md)
- [docs/TASK-SOURCE-RUNTIME.md](./docs/TASK-SOURCE-RUNTIME.md)
- [docs/TECH-STACK.md](./docs/TECH-STACK.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/WORKFLOW-IR.md](./docs/WORKFLOW-IR.md)
- [docs/SECURITY.md](./docs/SECURITY.md)
- [docs/adr/](./docs/adr/)

## 当前交付顺序

```text
D0 Design Contract
→ P0 Interactive Mock Prototype
→ E0 Engineering Foundation
→ E1 Intent Compiler
→ E2 Source / InputBundle
→ E3 Deterministic Workflow Runtime
→ E4 AI Discovery / Repair
→ E5 Human Takeover / Risk
→ E6 WeChat MVP
```

当前 Gate 以 `docs/PROJECT-STATE.md` 为准。

## 给 Codex 的最短日常指令

在仓库里通常只需要说：

> 按仓库计划继续开发 FlowPilot。

仓库中的 `AGENTS.md`、`.codex/agents/`、`PROJECT-STATE.md`、`DEVELOPMENT-PLAN.md` 和 `ACCEPTANCE.md` 会告诉 Codex 如何执行 Plan Guard → Builder → Gatekeeper → State Keeper 闭环。Maintainer 不需要重复项目历史或技术选择。
