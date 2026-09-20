# Codex 开发流程

FlowPilot 的开发流程采用 Codex 原生能力。

项目 subagents：

    .codex/agents/
    ├── plan_guard.toml
    ├── builder.toml
    ├── gatekeeper.toml
    └── state_keeper.toml

规范调度见 `AGENT-OPERATING-PROTOCOL.md`。

## 开始

1. 读取 `AGENTS.md`。
2. 读取 `PROJECT-STATE.md`。
3. 读取 `DEVELOPMENT-PLAN.md`。
4. 读取 `ACCEPTANCE.md`。
5. 读取与当前任务相关的产品 / 设计 / 架构文档。
6. 检查仓库当前实现。

## 一次只执行一个 bounded slice

使用：

    plan_guard
    → builder（或主 Codex 线程）
    → gatekeeper
    → state_keeper

规则：

- 除非 Maintainer 明确改变方向，否则只做当前阶段
- 不因为看到相邻工作就扩大范围
- Gatekeeper PASS 后 State Keeper 才能标记完成
- Builder 不负责推进 PROJECT-STATE / work
- 范围容易误解时使用 Task Packet

## 验证

只执行真正适用的检查，并且绝不能声称未执行的检查已经通过。

典型工程检查：

    pnpm typecheck
    pnpm lint
    pnpm test
    pnpm test:e2e
    pnpm build
    pnpm package

设计工作使用 Acceptance 映射和 Reviewer 证据，不要伪造命令输出。

## 完成

1. Gatekeeper 将真实证据映射到 `ACCEPTANCE.md`。
2. FAIL 时只把 blocking gaps 交回 Builder。
3. PASS 时 State Keeper 更新 `PROJECT-STATE.md` 和短期 `work/` 队列。
4. 使用 `HANDOFF-TEMPLATE.md` 留下 handoff。
5. 报告最小推荐下一切片。

GitHub Issues 是可选的，不替代这套流程。

## Codex-first

未来增加 Agent 自动化时优先：

- `AGENTS.md`
- `.codex/config.toml`
- `.codex/agents/*.toml`
- Codex skills
- MCP
- hooks

只有 Codex 原生机制无法表达需求时，才增加新的 Agent spec 格式。
