# FlowPilot 项目状态

> [English canonical](../PROJECT-STATE.md)

本文件是项目**当前状态**的中文镜像。英文版是规范源。

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

**D0.1 — Design principles + interaction hierarchy**

需要正式定义：

- “默认简单，按需透明”
- Simple / Execution / Inspection 三层
- 渐进披露规则
- 导航规则
- 什么时候出现上下文 UI
- 默认界面禁止出现哪些技术细节

然后再进入组件和页面规范。