# ADR-0001：桌面技术基线

- Status: Accepted
- Date: 2026-09-19
- Decision owners: FlowPilot maintainers

## 背景

FlowPilot 需要在桌面 UI 内展示真实第三方 Web App，同时控制用户看到的同一页面，维持隔离持久 Session，观察导航和页面状态，并支持用户接管。

Workflow 表示不能绑定某个特定 browser automation library。

## 决策

采用：

- Electron 作为 desktop runtime
- React + Vite 作为可信 renderer UI
- WebContentsView 承载第三方平台页面
- FlowPilot 自己拥有 BrowserDriver interface
- Electron webContents / CDP 作为生产 embedded driver
- Playwright 用于 E2E、fixture、debug 和可选 adapter
- 全项目 TypeScript strict
- SQLite 通过 repository interface 做 local-first persistence
- provider-neutral AI adapter 只用于 Discovery / Repair
- pnpm workspaces

Workflow Runtime 和 Workflow IR 是 FlowPilot 自有核心代码，不能被通用 Agent framework 取代。

## 已考虑的替代方案

### Tauri

体积小、Rust backend 很好，但不同 OS 使用系统 WebView。持久化跨平台 Web Workflow 更需要统一 Chromium 行为模型。

### Playwright 启动独立 Chrome 作为最终 UX

原型速度快，但会制造第二个浏览器窗口，并把用户看到的页面与产品主 UI 分开。适合早期实验，不适合作为目标架构。

### 保存原始宏 / selector

起步简单，但脆弱、难修复、难验证。FlowPilot 需要 semantic target 和 state transition。

### 每一步都让 LLM Agent 执行

灵活，但慢、贵、难复现，而且对已知 Workflow 没有必要。

## 影响

### 正面影响

- Chromium-centric 桌面行为一致
- 用户与自动化操作同一个 embedded page
- Workflow Runtime 与浏览器库解耦
- 正常 Run 快且无需模型
- account session 自然映射到 Electron partition

### 负面影响 / 取舍

- Electron 体积 / 内存开销
- WebContentsView 布局需要和 Renderer 协调
- native SQLite driver 需要 Electron rebuild / packaging 注意
- CDP / Electron driver 需要自定义工程

### 迁移 / 兼容性影响

Workflow IR 不能包含 Electron / Playwright 对象身份。

driver-specific 数据只能作为 hint / adapter detail，以便未来可替换 driver。

## 验证

当本地 fixture site 可以：

1. 在 WebContentsView 中运行；
2. 持久 account / session；
3. 通过 BrowserDriver 执行 Flow IR；
4. 人为破坏一个 Flow；
5. 通过 provider-neutral repair path 修复；
6. 不调用 AI 再次成功运行；

则该决策得到验证。
