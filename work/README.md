# Task Packet

本目录可以存放当前有用的有界 Agent 任务说明。

这些文件是**执行辅助**，不是产品或架构的规范事实。

规范权威仍来自：

- `AGENTS.md`
- `docs/PROJECT-STATE.md`
- `docs/DEVELOPMENT-PLAN.md`
- `docs/ACCEPTANCE.md`
- 已接受 ADR 和相关规范文档

规则：

- 一个 Task Packet 对应一个有界、可评审的切片
- Task Packet 必须引用规范验收标准
- 任务完成后可以删除 / 归档，但 `PROJECT-STATE.md` 和 Git 历史必须保留当前事实
- 不得在这里建立第二套 Roadmap
- 不得用 Task Packet 弱化验收标准

Maintainer 可以这样分配任务：

> 实现 `work/<file>` 中的 Task Packet。遵守 `AGENTS.md`，完成验证，在适用时更新项目状态，并留下 handoff。
