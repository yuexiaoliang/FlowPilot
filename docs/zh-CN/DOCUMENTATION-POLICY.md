# 文档语言规范

FlowPilot 长期维护两套人类可读文档：

- **英文** —— 规范源 / 默认版本
- **简体中文** —— 同步阅读镜像

## 规范源规则

英文文档是唯一事实源。如果中英文内容冲突，实现、架构、验收和 Codex 行为以英文版为准，并应尽快修正中文版。

中文版不得引入英文规范中不存在的新要求。

## 文件结构

- `README.md` / `README.zh-CN.md`
- `AGENTS.md` / `AGENTS.zh-CN.md`
- `docs/<FILE>.md` / `docs/zh-CN/<FILE>.md`
- `docs/adr/<FILE>.md` / `docs/zh-CN/adr/<FILE>.md`
- 未来稳定设计文档：`design/<FILE>.md` / `design/zh-CN/<FILE>.md`

## 哪些文档必须双语

长期、稳定、面向人的项目文档都应维护中文镜像，包括：产品模型、项目状态、开发计划、验收标准、架构、技术决策、安全规范、Workflow 语义、开发流程、稳定设计合同和 ADR。

## 哪些内容默认只保留英文

除非确有需要，不复制源代码、测试、迁移、package/config 文件、`.codex/config.toml`、`.codex/agents/*.toml`、生成产物、临时 `work/` Task Packet、临时 handoff 和 commit message。

## 更新规则

英文规范文档发生实质变化时：

1. 先修改英文；
2. 条件允许时在同一次变更中同步中文镜像；
3. 尽量保持中英文标题和结构可比较；
4. 代码标识符、Schema 名、路径、命令、API 名保持不变；
5. 翻译语义，不翻译实现标识符。

不影响语义的纯拼写修正可以延后同步。

## Codex 规则

Codex 在规划、实现和验收时必须使用英文规范文档。中文版用于人的可读性，不能覆盖英文规范。

如果 Codex 的任务实质修改了一个需要双语维护的长期文档，Builder 应在 Gatekeeper 验收前同步更新两种语言。

主动修改长期规范文档却没有同步中文，应视为阻塞问题；纯代码修改且没有改变文档语义则不阻塞。

## 翻译风格

使用清晰的简体中文。Goal、Task、Source、InputBundle、Flow、Run、Workflow IR、BrowserDriver 等关键领域术语，在保留英文更精确时可以继续保留。代码和技术标识符保持不变。

## 导航

顶层文档索引应提供明显的中英文切换入口。