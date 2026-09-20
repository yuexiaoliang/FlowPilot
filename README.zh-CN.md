# FlowPilot

[English](./README.md) | **简体中文**

FlowPilot 是一个**意图优先（intent-first）**的桌面 AI 自动化运行时。

用户通过自然语言描述想要的结果和规则。FlowPilot 将这些意图编译成结构化计划，连接经过授权的数据 Source，执行确定性的 Workflow，并在环境变化时进行修复。

> 自然语言描述意图。结构化计划负责执行。只有在人需要观察、选择、批准或介入时，UI 才出现。

## 产品原则

**默认简单，按需透明。**

- 自然语言 / Markdown 是主要创作入口
- 用户写语义，系统保存内部引用
- 普通用户无需学习 FlowPilot DSL
- 默认界面尽量降低心智负担
- 在需要信任、调试时可以进入专业检查层
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
- Playwright 用于测试/开发适配
- SQLite
- Zod
- pnpm workspaces
- Vitest + Playwright Test
- GitHub Actions

架构级变化必须通过 ADR。

## 开发模型

FlowPilot 是**文档驱动，而不是 Issue 驱动**。

仓库本身是所有人类和 AI 贡献者共享的项目记忆。

从这里开始：

- [AGENTS.md](./AGENTS.md) —— Codex 使用的英文规范指令
- [AGENTS.zh-CN.md](./AGENTS.zh-CN.md) —— 中文阅读镜像
- [docs/zh-CN/PROJECT-STATE.md](./docs/zh-CN/PROJECT-STATE.md) —— 当前阶段和下一推荐切片
- [docs/zh-CN/DEVELOPMENT-PLAN.md](./docs/zh-CN/DEVELOPMENT-PLAN.md) —— 规范开发顺序
- [docs/zh-CN/ACCEPTANCE.md](./docs/zh-CN/ACCEPTANCE.md) —— Gate / 完成定义
- [.codex/agents/](./.codex/agents/) —— Codex 原生项目 subagents
- [docs/zh-CN/AGENT-OPERATING-PROTOCOL.md](./docs/zh-CN/AGENT-OPERATING-PROTOCOL.md) —— Codex subagent 调度规则
- [docs/zh-CN/README.md](./docs/zh-CN/README.md) —— 中文文档索引

双语维护规范：

- [English policy](./docs/DOCUMENTATION-POLICY.md)
- [中文规范](./docs/zh-CN/DOCUMENTATION-POLICY.md)

## 当前交付顺序

    D0 Design Contract
    → P0 Interactive Mock Prototype
    → E0 Engineering Foundation
    → E1 Intent Compiler
    → E2 Source / InputBundle
    → E3 Deterministic Workflow Runtime
    → E4 AI Discovery / Repair
    → E5 Human Takeover / Risk
    → E6 WeChat MVP

具体当前 Gate 请查看 `PROJECT-STATE.md`。

## 给 Codex 的最短日常指令

在仓库里通常只需要：

> 继续开发。

仓库中的 `AGENTS.md`、`.codex/agents/`、`PROJECT-STATE.md`、`DEVELOPMENT-PLAN.md` 和 `ACCEPTANCE.md` 负责告诉 Codex 应该如何继续。