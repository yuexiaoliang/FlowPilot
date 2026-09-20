# FlowPilot 项目状态

本文件是项目**当前状态**的规范快照。

最近一次架构/产品规划更新：2026-09-20

## 当前阶段

**D0 — Design Contract**

状态：**进行中**

已确认的产品方向：

> 默认简单，按需透明。

> 用户写语义，系统保存引用。

> 自然语言是控制层。结构化计划 / Workflow 负责执行。只有在人需要观察、选择、比较、批准或介入时，UI 才出现。

## 已确认事项

### 产品模型

已确认：

- Goal = 想要达到的结果
- Task = 什么时候、按什么规则执行 Goal
- Source = 明确授权的数据边界
- InputBundle = 某一次 Run 使用的不可变输入
- Flow = 可版本化的执行策略
- Run = 带来源信息的一次具体执行

规范源：`PRODUCT-MODEL.md`

### UX 模型

已确认：

- intent-first，而不是 dashboard-first
- 自然语言 / Markdown 创作
- 不要求用户学习 FlowPilot DSL
- 默认 UI 极简
- 专业 / 技术透明性按需展开
- 使用渐进披露，而不是永久展示复杂度
- 使用上下文式 / 临时 UI primitive，而不是巨大的设置表单

规范源：`NATURAL-LANGUAGE-UX.md`

### 视觉方向

已确认方向：

- 浅色、安静、现代的桌面 UI
- 宽松留白
- 最少导航
- 自然语言意图界面作为主要入口
- AI Understanding 是结构化解释，而不是配置表单
- 执行 / 数据来源细节隐藏在可展开的专业 Inspector 中
- 之前密集的 SaaS / Dashboard 探索稿仅作为历史参考，不是规范设计

### 技术

已确认基线：

- Electron
- TypeScript
- React + Vite
- WebContentsView
- BrowserDriver 抽象
- Playwright 用于测试 / 开发适配
- SQLite
- Zod
- pnpm
- Vitest + Playwright Test

规范源：`TECH-STACK.md`、ADR-0001

## 当前交付目标

创建 **Design Contract**，让后续实现 Agent 不需要重新设计产品。

已验证进展：

- **D0.1 — Design principles + interaction hierarchy：已验收。** Gatekeeper 于 2026-09-20 对当时提交的六个中英文设计产物返回 PASS。这一历史验收事实仍然有效：该合同已将十条原则操作化，定义 Simple / Execution / Inspection 界面及其转场，覆盖所有必需的上下文触发器，保留文字规范的权威性和 Reviewer 指引，并明确密集 Dashboard 探索稿不是规范设计。历史验证证据：六个产物均非空，中英文标题结构一致，无尾随空白，英文和中文各 50 个标题、50 个自检字段，以及六个上下文触发器章节。
- **D0-PREFLIGHT — 中文规范源迁移：已验收。** Gatekeeper 已返回 PASS。简体中文现为长期项目文档唯一默认语言和规范源；稳定主路径保持不变；26 个重复语言镜像文件已移除；`.codex/agents/*.toml` 与 `work/*.md` 已中文化；原英文规范中的关键 AGENTS、架构接口、SourceProvider、InputBundle provenance、D0.1 设计和安全约束均已保留。验证证据：规则 1–20、分层边界、实现风格、验证要求和四 Agent 闭环完整；根目录长期文档、`docs/`、`docs/adr/` 与 `design/` 中无英文副本；相对链接 0 失效；TOML 结构与行为保持；`git diff --check` PASS；ACCEPTANCE 编号 125/125、DEVELOPMENT-PLAN 标题 59/59。
- **D0-PREFLIGHT-COMPLETE — 规范完整性复核：已验收。** Gatekeeper 已返回 PASS。第二轮复核确认限定的 8 份文档已补回原英文规范中曾被压缩的条目、代码示例和退出条件，包括 ROADMAP 阶段 2–7 / Repair 闭环、AppError、10 步切片、StructuredModel、Workflow JSON、revision 6→7、sourceId、隐藏语义元数据、UX 示例、授权路径和 WebContentsView 依据；接口 / 技术标识符与原文一致，语义和计划顺序不变。证据：链接、镜像扫描和 `git diff --check` PASS；ROADMAP bullets 65/65、DEVELOPMENT 41/41（编号 15/15）、WORKFLOW 92/92（编号 5/5），inline 技术标识符缺失 0。
- D0 仍为**进行中**。Design Contract 的其余产物尚未验收；不要推进到 P0。

必须包含：

- `design/README.md`
- `design/DESIGN-PRINCIPLES.md`
- `design/DESIGN-SYSTEM.md`
- `design/INTERACTION-MODEL.md`
- `design/COMPONENTS.md`
- `design/SCREEN-SPECS.md`
- `design/FLOWS.md`

至少覆盖：

- Intent Home
- AI Understanding Review
- 上下文式 Source Connection
- Input Preview
- Execution
- Confirmation / Human Takeover
- Result
- 渐进透明 / Inspector

## D0 之后的 Gate

**P0 — Interactive Mock Prototype**

使用 Mock service 构建 Electron + React 原型，不接真实 AI、微信、Git 解析或生产自动化。

黄金路径：

    Intent
    → Understanding
    → Source resolution
    → Input preview
    → Run
    → Human confirmation
    → Success
    → Inspect details

## 当前不要开始

在 D0 和 P0 验收前，不要投入大量精力到：

- 真实微信接入
- AI Repair
- 生产 BrowserDriver / CDP
- 复杂 SQLite 持久化
- Cloud runner
- Analytics / Dashboard
- Template marketplace
- Team / Billing

## 仍需在 D0/P0 中解决的问题

- 最小导航模型到底长什么样
- Intent 文档在主工作区中如何表示
- 专业 Inspector 的深度和入口位置
- 如何显示语义实体绑定而不暴露内部 ID
- AI Understanding 默认展示多少结构化内容
- 编辑已有 Task 时如何回到自然语言 Source，而不是只编辑编译后的解释

## 下一推荐切片

**D0.2 — Design system + components**

需要在已验收的 D0.1 层级基础上，定义可实现的视觉基础和可复用的上下文 UI primitive。覆盖 tokens、字体、间距、动效、无障碍以及意图、理解、Source、输入、确认、执行、接管、结果、检查、歧义、修复和恢复界面的组件状态/行为。Screen spec 和端到端 Flow 留给后续 D0 切片。
