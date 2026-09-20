# 自然语言 UX 原则

FlowPilot 有意跨出传统“表单优先”应用设计。

**自然语言是控制层，GUI 是上下文式的可视化 / 操作层。**

## 核心 UX 陈述

> 自然语言描述意图。
> 结构化计划负责执行。
> 只有在人需要观察、选择、比较、批准或介入时，UI 才出现。

## Intent-first，而不是 Dashboard-first

不要默认首页必须展示 Dashboard、设置、图表或大量导航。

主要界面应该让用户能够创建 / 打开 Goal 或 Task，并用普通语言描述想发生什么。

示例：

```text
你希望 FlowPilot 做什么？

┌──────────────────────────────────────┐
│ # 每天发布行业文章                   │
│                                      │
│ 每天早上 8 点检查我的行业学习内容。 │
│ 如果今天有新文章，发布到公众号。    │
│ 发布前让我确认。                     │
└──────────────────────────────────────┘

                                  分析
```

编辑器可以支持 Markdown、拖拽文件、语义建议、实体选择，但不能要求 DSL。

## AI Understanding Review

自然语言编译后，FlowPilot 可以简洁展示自己的理解：

```text
我的理解：

时间
每天 08:00

数据
行业学习仓库 → 今天最新文章

操作
发布微信公众号文章

没有新内容时
跳过

发布之前
请求确认
```

这是**理解确认**，不是配置表单。

只有存在实质歧义或风险时才要求用户交互。

## 上下文 / 临时 UI

组件只因为当前状态需要它才出现。

例如：

- 需要选择图片 → image picker
- 需要 Source 授权 → folder / repository picker
- 需要解决歧义 → compact choice UI
- 需要批准 → confirmation card
- 需要比较 → diff UI
- 需要安全验证 → browser takeover
- 需要看进度 → execution timeline
- 需要 Review 修复 → old / new route diff
- 需要调试 → logs / screenshot inspector

不要因为系统支持某个能力，就把控制项永久暴露。

## 动态 UI primitive

实现应逐渐形成复用组件：

- Markdown / intent editor
- semantic entity suggestion
- schedule interpretation chip
- Source permission picker
- file / content preview
- InputBundle preview
- ambiguity resolver
- confirmation card
- progress timeline
- diff viewer
- human takeover surface
- run evidence viewer
- error / recovery card

AI / runtime 根据结构化状态选择合适 primitive；AI 不应该生成任意可执行 UI 代码。

## Entity reference

用户看到：

- 我的行业学习仓库
- 微信公众号
- 每天早上 8 点

系统内部保存：

- Source ID
- Goal ID
- account / platform ID
- normalized schedule

富文本可以把一个可见短语绑定到内部实体引用。

普通用户流程不显示内部 ID。

## Scheduling UX

用户可以写：

- 每天早上 8 点
- 工作日下班后
- 每周一上午
- 每个月最后一天

FlowPilot 标准化 schedule 并展示自己的理解。

如果存在实质歧义，再询问。

普通用户不需要写 cron；只有高级 / Debug 界面可以在明确需要时暴露规范化 cron。

## Source UX

用户通过明确的 picker / connect 过程授权 Source。

自然语言可以写：

> 数据来自我的行业学习仓库。

如果不存在匹配的已授权 Source，FlowPilot 临时展示连接 UI。

一旦授权，后续自然语言可以语义解析到它。

## Goal UX

Goal 文档关注：

- 想达到的结果
- 用户自然知道的必需信息
- 约束
- 成功定义
- 人工介入 / 批准预期

用户不定义 selector、step、wait、retry 或浏览器路径。

## Task UX

Task 文档关注：

- trigger / timing
- 用自然语言表达的数据 context / Source
- selection rule
- 想产生的结果
- 真正影响用户的异常规则

除非用户主动进入高级模式，否则不要求 runtime orchestration 细节。

## 高级用户

高级 / Debug 视图可以暴露：

- compiled GoalPlan
- compiled TaskPlan
- Workflow IR
- IDs
- normalized cron / schedules
- source cursors
- repair diffs
- runtime events

这些是检查工具，不是必须的创作语法。

## 设计自检

增加永久表单字段前问：

> 用户能不能直接用自然语言表达，而 FlowPilot 只在必要时澄清？

如果可以，优先自然语言创作 + 结构化 Review。

增加 Chat 面板前问：

> AI 真的是这里最适合的交互方式，还是上下文 UI primitive 更清晰？

不要把所有交互都变成 Chat。

## 可导出性

Goal / Task Markdown 在 FlowPilot 外用普通文本编辑器打开，也应该仍然有用、可理解。

这是防止隐藏 DSL 污染的重要设计约束。
