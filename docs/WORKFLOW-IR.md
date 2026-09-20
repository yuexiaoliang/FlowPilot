# Workflow IR

Workflow IR 是 FlowPilot 最重要的长期契约之一。

它必须：确定性、可版本化、可审计、可修复，并且不绑定某个浏览器库。

## 原则

Workflow 记录的是**意图 + 可验证状态变化**，不是原始宏。

坏例子：

    {"click":"#app > div:nth-child(4) > button"}

更好的模型：

```json
{
  "id": "open-editor",
  "preconditions": [
    { "kind": "platformState", "state": "HOME" }
  ],
  "action": {
    "kind": "click",
    "target": {
      "role": "button",
      "names": ["新的创作", "写文章"]
    }
  },
  "expected": [
    { "kind": "elementSemantic", "label": "标题" },
    { "kind": "platformState", "state": "ARTICLE_EDITOR" }
  ]
}
```

Selector 只是 fallback hint，不是主要身份。

## 核心实体

### Flow

概念字段：

- id
- schemaVersion
- revision
- platformId
- capability
- name
- createdAt / updatedAt
- inputSchema
- steps
- successConditions
- safetyPolicy
- provenance

### Step

- stable id
- description
- preconditions
- action
- expected conditions
- timeout policy
- retry policy
- repair policy
- optional checkpoint metadata

### TargetDescriptor

使用多信号定位：

- ARIA role
- accessible name / visible text aliases
- label
- placeholder
- semantic type
- stable attributes
- relative anchors
- optional selector hints

不要把脆弱 DOM ancestry 当主要身份。

### Condition

初始词汇保持小：

- urlMatches
- elementPresent
- elementAbsent
- elementSemantic
- textPresent
- platformState
- authState
- dialogPresent
- networkIdle（弱条件，不能单独作为 success）
- custom adapter condition

### Action

MVP：

- navigate
- click
- fill
- clear
- select
- upload
- wait
- press
- scroll
- requestHumanTakeover
- platformAction

不要把“execute arbitrary JavaScript”作为持久化通用 action。

## 版本管理

有两个版本概念：

- **schemaVersion** —— Workflow IR 的结构 / 语义版本
- **revision** —— 某个 Flow 的不可变版本

每次成功 Repair 创建新 revision。

示例：

```text
wechat.publish.article
revision 6 ──repair──> revision 7
```

Run 保存它实际执行的 exact revision。

## Target 解析

解析应按信号排序，而不是第一个匹配就接受：

1. semantic role / name
2. label / accessibility
3. platform-stable attribute
4. relative / anchored structure
5. selector hint

如果仍有实质歧义，返回 TARGET_AMBIGUOUS，不要猜。

## 校验

每个有意义 action 都必须有 expected outcome，例如：

- navigation 到预期 route / state
- editor field 出现
- upload asset 出现
- publish confirmation dialog 出现
- success page / message 出现

没有 exception 不等于 success。

## 错误分类

Runtime failure 应 typed：

- PRECONDITION_FAILED
- TARGET_NOT_FOUND
- TARGET_AMBIGUOUS
- ACTION_FAILED
- ACTION_TIMEOUT
- POSTCONDITION_FAILED
- NAVIGATION_UNEXPECTED
- AUTH_REQUIRED
- SECURITY_CHALLENGE
- RATE_LIMITED
- PLATFORM_PERMISSION_DENIED
- USER_INTERVENTION_REQUIRED
- REPAIR_FAILED
- CANCELLED
- UNKNOWN

Repair policy 基于 typed error，而不是 message string。

## Repair 范围

RepairContext 包含：

- failed step
- previous successful checkpoint
- bounded neighboring steps
- expected target state
- current sanitized snapshot
- failure evidence
- platform adapter hints

Repair model 默认返回 patch proposal，不是整套替换 Flow。

## 来源记录

Flow revision 应记录：

- origin: manual | discovery | repair | migration
- parent revision
- AI provider / model metadata（非 Secret）
- repair reason / failure type
- validation result
- timestamp

这对 Debug / rollback 是必须的。

## 安全

Workflow 文件不得包含：

- password
- cookie
- bearer token
- API key
- raw authorization header
- 可避免时的完整本地路径
- 从页面复制出的 Secret

敏感 input 应使用 runtime reference / secret handle。

## 兼容性

活跃开发期间 runtime 至少支持当前 schema 和上一 schema。

Migration 必须显式且有测试。

最终 definitive schema 在 `packages/workflow-ir`；本文解释语义，必须与代码同步。
