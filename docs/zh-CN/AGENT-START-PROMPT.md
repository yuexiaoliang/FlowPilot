# 最小 Codex 启动说明

> [English canonical](../AGENT-START-PROMPT.md)

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

> Continue FlowPilot according to the repository plan. Read AGENTS.md and the canonical documents first. Use the project Codex subagents with the Plan Guard → Builder → Gatekeeper → State Keeper loop. Complete only one bounded current slice. Do not jump phases or redesign locked decisions. If Gatekeeper fails, fix only the blocking gaps and re-review. Only after PASS may State Keeper update PROJECT-STATE/work. Leave a handoff with actual validation evidence.

## 指定 Task Packet

> Implement the Task Packet at <path>. Follow AGENTS.md. Use plan_guard before implementation, gatekeeper after implementation, and state_keeper only after PASS. Do not broaden scope.

## 只做验收

> Use the FlowPilot gatekeeper subagent to independently validate the latest bounded slice against ACCEPTANCE.md and return PASS or FAIL.

## 只维护项目状态

> Use the FlowPilot state_keeper subagent. Proceed only if Gatekeeper PASS is available. Update PROJECT-STATE and the short-term work queue; do not implement product code.

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