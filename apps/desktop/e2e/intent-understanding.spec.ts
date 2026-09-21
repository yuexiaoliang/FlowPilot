import { _electron as electron, expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

test('deterministic Intent → Understanding → Source → Input → Execution → Confirmation → Result → Inspector walkthrough', async () => {
  const electronApp = await electron.launch({ args: ['.'] });

  try {
    const window = await electronApp.firstWindow();
    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(1);
    });

    await expect(window.getByRole('heading', { name: '你希望 FlowPilot 做什么？' })).toBeVisible();
    const editor = window.getByLabel('用自然语言描述你的意图');
    await expect(editor).toHaveValue(/每天早上 8 点检查我的行业学习仓库/u);
    await expect(window.getByRole('heading', { name: '我的理解' })).toHaveCount(0);

    await window.getByRole('button', { name: '分析我的意图' }).click();
    await expect(window.getByText('正在理解这段意图…')).toBeVisible();
    await expect(window.getByRole('heading', { name: '我的理解' })).toBeVisible();
    await expect(window.getByText('每天 08:00（你的时区）')).toBeVisible();
    await expect(window.getByText('行业学习仓库 → 今天最新文章')).toBeVisible();
    await expect(window.getByText('发布微信公众号文章')).toBeVisible();
    await expect(window.getByText('请求确认')).toBeVisible();
    await expect(window.getByRole('heading', { name: '连接行业学习仓库' })).toBeVisible();
    await expect(window.getByText('默认只读，不允许修改文件')).toBeVisible();
    await window.locator('.understanding-card').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });

    const evidenceDirectory = path.resolve(process.cwd(), '../../evidence');
    await mkdir(evidenceDirectory, { recursive: true });
    await window.screenshot({
      path: path.join(evidenceDirectory, 'P0.1-intent-understanding.png'),
      fullPage: true,
    });

    await window.getByRole('button', { name: '选择范围' }).click();
    await expect(window.getByRole('heading', { name: '选择一个本地范围' })).toBeFocused();
    await window.keyboard.press('Escape');
    await expect(window.getByRole('button', { name: '选择范围' })).toBeFocused();

    await window.getByRole('button', { name: '选择范围' }).click();
    await window.getByRole('button', { name: '取消选择' }).click();
    await expect(window.getByRole('heading', { name: '还不能使用行业学习仓库' })).toBeFocused();
    await expect(window.getByText(/没有获得任何文件访问权限/u)).toBeVisible();

    await window.getByRole('button', { name: '重新选择' }).click();
    await window.getByRole('radio', { name: /下载文件夹/u }).check();
    await window.getByRole('button', { name: '授权所选范围' }).click();
    await expect(window.getByText(/权限没有扩大，请重新选择/u)).toBeVisible();

    await window.getByRole('button', { name: '重新选择' }).click();
    await window.getByRole('radio', { name: /行业学习仓库/u }).check();
    await window.getByRole('button', { name: '授权所选范围' }).click();
    await expect(window.getByRole('heading', { name: /正在检查只读授权/u })).toBeFocused();
    await expect(window.getByRole('heading', { name: /正在解析已授权的数据来源/u })).toBeVisible();
    await expect(window.getByRole('heading', { name: '行业学习仓库已连接' })).toBeFocused();
    await expect(window.getByText('所选的行业学习 Git 仓库')).toBeVisible();
    await expect(
      window.getByText(
        '范围检查已通过。准备输入后，FlowPilot 将选择并冻结本次文章和封面；尚未开始执行。',
      ),
    ).toBeVisible();
    await expect(
      window.getByText('理解已形成，数据来源已获得只读授权；可以开始准备本次输入。'),
    ).toBeVisible();
    await expect(window.getByRole('button', { name: '选择范围' })).toHaveCount(0);

    await window.locator('.source-card-success').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    await window.screenshot({
      path: path.join(evidenceDirectory, 'P0.2-source-resolution.png'),
      fullPage: true,
    });

    await window.getByRole('button', { name: '准备本次输入' }).click();
    await expect(window.getByRole('heading', { name: '正在选择并冻结本次输入…' })).toBeFocused();
    await window.getByRole('button', { name: '取消输入准备' }).click();
    await expect(window.getByRole('heading', { name: '还不能准备本次输入' })).toBeFocused();
    await expect(window.getByText('输入准备已取消。没有创建可继续使用的本次输入。')).toBeVisible();

    await window.getByRole('button', { name: '重新准备' }).click();
    await expect(window.getByRole('heading', { name: '本次输入已准备' })).toBeFocused();
    await expect(
      window.getByRole('heading', {
        name: '让自动化真正可维护：从意图到确定性执行',
      }),
    ).toBeVisible();
    await expect(window.getByText('演示快照 · 固定内容版本 1')).toBeVisible();
    await expect(
      window.getByRole('img', {
        name: '蓝色路径穿过浅色网格，连接“意图”“输入”和“执行”三个节点',
      }),
    ).toBeVisible();
    await expect(window.getByText('必需字段已齐全')).toBeVisible();
    await expect(
      window.getByText(
        '进入预览后，这篇文章和封面不会静默刷新。若意图或来源改变，必须重新创建一份输入。',
      ),
    ).toBeVisible();

    await window.getByRole('button', { name: '展开正文' }).click();
    await expect(window.getByText(/自动化的起点应该是人真正想得到的结果/u)).toBeVisible();

    await window.locator('.input-preview-success').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    await window.screenshot({
      path: path.join(evidenceDirectory, 'P0.3-input-preview.png'),
      fullPage: true,
    });

    await window.getByRole('button', { name: '继续准备运行' }).click();
    await expect(window.getByRole('heading', { name: '正在准备已冻结的输入' })).toBeFocused();
    await expect(window.getByText(/核对文章、正文和封面仍来自同一份演示快照/u)).toBeVisible();

    await window.getByRole('button', { name: '停止运行准备' }).click();
    await expect(window.getByRole('heading', { name: '还不能准备本次运行' })).toBeFocused();
    await expect(window.getByText(/没有打开确认界面，也没有执行或发布/u)).toBeVisible();
    await expect(window.getByRole('button', { name: '模拟运行已创建' })).toBeDisabled();

    await window.getByRole('button', { name: '返回输入预览' }).click();
    await expect(window.getByRole('button', { name: '继续准备运行' })).toBeFocused();
    await window.getByRole('button', { name: '继续准备运行' }).click();

    await expect(window.getByRole('heading', { name: '等待你的确认' })).toBeFocused();
    await expect(window.getByText('FlowPilot 已在不可逆发布动作前暂停。')).toBeVisible();
    await expect(window.getByText('已完成')).toHaveCount(3);
    await expect(window.getByText(/尚未确认，也没有发布/u)).toBeVisible();
    await expect(window.getByRole('button', { name: '查看发布确认' })).toBeEnabled();
    await expect(window.getByRole('button', { name: '确认发布' })).toHaveCount(0);
    await expect(window.getByRole('button', { name: '取消发布' })).toHaveCount(0);

    await window.locator('.execution-paused').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    await window.screenshot({
      path: path.join(evidenceDirectory, 'P0.4-mock-execution.png'),
      fullPage: true,
    });

    await expect(window.locator('body')).not.toContainText(
      /@source|sourceId|runId|GoalPlan|InputBundle|contentHash|cron|selector|\/Users\//u,
    );

    await window.getByRole('button', { name: '查看发布确认' }).click();
    await expect(window.getByRole('heading', { name: '正在复核发布决定' })).toBeFocused();
    await expect(window.getByRole('button', { name: '确认发布' })).toBeDisabled();
    await expect(window.getByRole('heading', { name: '确认发布这篇文章？' })).toBeVisible();
    await window.keyboard.press('Escape');
    await expect(window.getByRole('dialog')).toHaveCount(0);
    await expect(window.getByRole('button', { name: '查看发布确认' })).toBeFocused();
    await expect(window.getByRole('heading', { name: '等待你的确认' })).toBeVisible();

    await window.getByRole('button', { name: '查看发布确认' }).click();
    await expect(window.getByRole('heading', { name: '确认发布这篇文章？' })).toBeVisible();
    await window.getByRole('button', { name: '关闭发布确认' }).click();
    await expect(window.getByRole('dialog')).toHaveCount(0);
    await expect(window.getByRole('button', { name: '查看发布确认' })).toBeFocused();

    await window.getByRole('button', { name: '查看发布确认' }).click();
    await expect(window.getByRole('button', { name: '取消发布' })).toBeEnabled();
    await window.getByRole('button', { name: '取消发布' }).click();
    await expect(window.getByRole('heading', { name: '本次发布已取消' })).toBeFocused();
    await expect(window.getByText(/没有执行动作，也不会自动重试/u)).toBeVisible();
    await expect(window.locator('.result-panel-cancelled')).toBeVisible();
    await expect(window.locator('.result-panel')).not.toContainText('模拟发布已验证');

    await window.getByRole('button', { name: '检查详情' }).click();
    await expect(window.getByRole('button', { name: '检查详情', exact: true })).toBeFocused();
    await expect(window.getByRole('heading', { name: '本次模拟运行的检查详情' })).toBeVisible();
    await window.keyboard.press('Shift+Tab');
    await expect(window.getByRole('button', { name: /Run timeline/u })).toBeFocused();
    await window.keyboard.press('Tab');
    await expect(window.getByRole('button', { name: '关闭检查详情' })).toBeFocused();
    await expect(window.getByText('CANCELLED')).toBeVisible();
    await expect(window.getByText('未执行')).toHaveCount(2);
    await window.keyboard.press('Escape');
    await expect(window.getByRole('dialog')).toHaveCount(0);
    await expect(window.getByRole('button', { name: '检查详情', exact: true })).toBeFocused();

    await window.getByRole('button', { name: '返回输入预览' }).last().click();
    await expect(window.getByRole('button', { name: '继续准备运行' })).toBeFocused();
    await window.getByRole('button', { name: '继续准备运行' }).click();
    await expect(window.getByRole('heading', { name: '等待你的确认' })).toBeFocused();
    await window.getByRole('button', { name: '查看发布确认' }).click();
    await expect(window.getByRole('heading', { name: '确认发布这篇文章？' })).toBeVisible();

    await window.locator('.confirmation-dialog').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    await window.screenshot({
      path: path.join(evidenceDirectory, 'P0.5-confirmation.png'),
      fullPage: true,
    });

    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(2);
    });
    const confirmationHeading = window.getByRole('heading', { name: '确认发布这篇文章？' });
    await confirmationHeading.scrollIntoViewIfNeeded();
    await expect(confirmationHeading).toBeVisible();
    await expect
      .poll(() =>
        window.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);

    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(1);
    });
    await window.getByRole('button', { name: '确认发布' }).click();
    await expect(window.getByRole('heading', { name: '正在执行本地 Mock 动作' })).toBeFocused();
    await expect(window.getByRole('heading', { name: '模拟发布已验证' })).toHaveCount(0);
    await expect(window.getByRole('heading', { name: '正在验证模拟结果' })).toBeVisible();
    await expect(window.getByRole('heading', { name: '模拟发布已验证' })).toBeFocused();
    await expect(window.getByText(/未连接微信，也没有执行真实发布/u)).toBeVisible();
    await expect(window.getByRole('button', { name: '检查详情' })).toBeEnabled();
    await expect(window.getByText(/按需查看本次结果绑定/u)).toBeVisible();

    await window.locator('.result-panel-success').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    await window.screenshot({
      path: path.join(evidenceDirectory, 'P0.6-result.png'),
      fullPage: true,
    });

    await window.getByRole('button', { name: '检查详情' }).click();
    await expect(window.getByRole('button', { name: '检查详情', exact: true })).toBeFocused();
    await expect(window.getByRole('heading', { name: '本次模拟运行的检查详情' })).toBeVisible();
    await window.keyboard.press('Tab');
    await expect(window.getByRole('button', { name: '关闭检查详情' })).toBeFocused();
    await expect(window.getByText('SUCCEEDED')).toBeVisible();
    await expect(window.getByText('已确认')).toBeVisible();
    await expect(window.locator('#inspector-section-outcome').getByText('已验证')).toBeVisible();
    await expect(window.getByText('每日行业学习发布 · 修订 1')).toHaveCount(0);

    await window.getByRole('button', { name: /计划与 Flow 版本/u }).click();
    await expect(window.getByText('每日行业学习发布 · 修订 1')).toBeVisible();
    await expect(window.getByText('发布最新行业文章 · 修订 1')).toBeVisible();
    await expect(window.getByText('微信公众号文章发布流程 · 修订 1')).toBeVisible();
    await window.getByRole('button', { name: /Source 与 InputBundle/u }).click();
    await expect(window.getByText('演示 Source 快照 · 版本 1')).toBeVisible();
    await expect(window.getByText('演示快照 · 固定内容版本 1 · 不可变')).toBeVisible();
    await window.getByRole('button', { name: /Run timeline/u }).click();
    await expect(window.getByText('Mock 后置条件已验证')).toBeVisible();
    await expect(window.getByRole('dialog')).not.toContainText(
      /@source|sourceId|runId|contentHash|selector|\/Users\//u,
    );

    await window.locator('.inspector-panel').evaluate((element) => {
      element.scrollTop = 0;
    });
    await window.locator('.inspector-panel-success').evaluate(async (element) => {
      await Promise.all(element.getAnimations().map((animation) => animation.finished));
    });
    await window.screenshot({
      path: path.join(evidenceDirectory, 'P0.7-inspector-provenance.png'),
      fullPage: false,
    });

    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(2);
    });
    const inspectorHeading = window.getByRole('heading', {
      name: '本次模拟运行的检查详情',
    });
    await inspectorHeading.scrollIntoViewIfNeeded();
    await expect(inspectorHeading).toBeVisible();
    await expect
      .poll(() =>
        window.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);

    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(1);
    });
    await window.keyboard.press('Escape');
    await expect(window.getByRole('dialog')).toHaveCount(0);
    await expect(window.getByRole('button', { name: '检查详情', exact: true })).toBeFocused();

    await editor.fill(`${await editor.inputValue()}\n如果电脑没有启动，稍后再运行。`);
    await expect(window.getByText('需要更新')).toBeVisible();
    await expect(window.getByRole('heading', { name: '先更新理解，再连接数据来源' })).toBeVisible();
    await expect(window.getByRole('heading', { name: '模拟发布已验证' })).toBeVisible();
    await expect(window.getByText('让自动化真正可维护：从意图到确定性执行').last()).toBeVisible();
    await expect(window.getByRole('button', { name: '模拟运行已创建' })).toBeDisabled();
    await window.getByRole('button', { name: '检查详情' }).click();
    await expect(window.getByRole('heading', { name: '本次模拟运行的检查详情' })).toBeVisible();
    await window.getByRole('button', { name: /Source 与 InputBundle/u }).click();
    await expect(
      window.locator('#inspector-section-source').getByText('演示快照 · 固定内容版本 1 · 不可变'),
    ).toBeVisible();
  } finally {
    await electronApp.close();
  }
});
