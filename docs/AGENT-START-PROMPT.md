# 最小 Codex 启动说明

FlowPilot 的开发 Agent 机制使用 Codex 原生能力。

项目 subagents：

    .codex/agents/
    ├── plan_guard.toml
    ├── builder.toml
    ├── gatekeeper.toml
    └── state_keeper.toml

`.codex/config.toml` 开启项目多 Agent 支持。

## 日常推荐用法

正常开发时，你通常只需要在 FlowPilot 仓库里说：

> 继续开发。

`AGENTS.md` 会要求主 Codex 自动执行 Plan Guard → Builder → Gatekeeper → State Keeper。

## 完整兜底 Prompt

只有当某次 Codex 明显没有按仓库流程执行时，才需要使用较长的兜底说明：

> 按仓库计划继续开发 FlowPilot。先阅读 AGENTS.md 和规范文档。使用项目 Codex subagent 执行 Plan Guard → Builder → Gatekeeper → State Keeper 闭环。只完成一个有界的当前切片；不得跳阶段或重新设计已锁定决策。Gatekeeper 失败时，只修复阻塞缺口并重新评审。只有 PASS 后 State Keeper 才能更新 PROJECT-STATE / work。最后留下包含真实验证证据的 handoff。

## 指定 Task Packet

> 实现 `<path>` 中的 Task Packet。遵守 AGENTS.md；实现前使用 plan_guard，实现后使用 gatekeeper，并且只在 PASS 后使用 state_keeper。不得扩大范围。

## 只做验收

> 使用 FlowPilot gatekeeper subagent，依据 ACCEPTANCE.md 独立验证最新有界切片，并返回 PASS 或 FAIL。

## 只维护项目状态

> 使用 FlowPilot state_keeper subagent。只有已有 Gatekeeper PASS 时才能继续。更新 PROJECT-STATE 和短期工作队列；不要实现产品代码。

## Codex-first 约定

未来新增 Agent 自动化时，优先使用：

- `AGENTS.md`
- `.codex/config.toml`
- `.codex/agents/*.toml`
- Codex skills
- MCP
- hooks

只有 Codex 无法表达需求时，才考虑额外 Agent 规范格式。

## Maintainer 不需要重复的内容

仓库已经记录：

- 产品哲学
- 当前阶段
- 开发顺序
- 验收标准
- 技术基线
- Goal / Task / Source / Flow / Run 模型
- 自然语言 UX 规则
- 安全边界
- Codex subagent 调度方式

新 Codex 会话应读取仓库，而不是让 Maintainer 重新讲项目历史。
