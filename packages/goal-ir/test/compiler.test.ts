import { describe, expect, it } from 'vitest';

import {
  DeterministicGoalProvider,
  GoalPlanCompiler,
  InMemoryGoalRevisionStore,
  goalIdSchema,
  type GoalClock,
  type GoalPlanV1,
  type StructuredGoalProvider,
} from '../src';
import {
  AMBIGUOUS_PUBLISH_GOAL_MARKDOWN,
  HAPPY_PATH_FIXTURES,
  PUBLISH_ARTICLE_GOAL_MARKDOWN,
  PUBLISH_ARTICLE_GOAL_PLAN,
  PUBLISH_GOAL_CLARIFICATION,
  UPDATED_PUBLISH_ARTICLE_GOAL_MARKDOWN,
} from './fixtures';

const goalId = goalIdSchema.parse('goal_article_01');

class SequenceClock implements GoalClock {
  readonly #timestamps: readonly string[];
  #index = 0;

  constructor(timestamps: readonly string[]) {
    this.#timestamps = timestamps;
  }

  now(): Date {
    const timestamp = this.#timestamps[this.#index];
    if (timestamp === undefined) {
      throw new Error('SequenceClock has no timestamp left.');
    }
    this.#index += 1;
    return new Date(timestamp);
  }
}

function createCompiler(
  store = new InMemoryGoalRevisionStore(),
  provider: StructuredGoalProvider = new DeterministicGoalProvider(HAPPY_PATH_FIXTURES),
) {
  return {
    compiler: new GoalPlanCompiler({
      provider,
      store,
      clock: new SequenceClock([
        '2026-09-21T12:00:00.000Z',
        '2026-09-21T12:00:01.000Z',
        '2026-09-21T12:00:02.000Z',
        '2026-09-21T12:00:03.000Z',
        '2026-09-21T12:00:04.000Z',
        '2026-09-21T12:00:05.000Z',
      ]),
    }),
    store,
  };
}

describe('GoalPlanCompiler', () => {
  it('compiles readable Markdown into a complete versioned GoalPlan', async () => {
    const { compiler, store } = createCompiler();
    const result = await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.source).toMatchObject({
      goalId,
      sourceRevision: 1,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
      sourceHash: 'ffeecc4a597dcc294085963c3f7354fe3c6111c35c3a1f158efbd6b6ce8ce49b',
      createdAt: '2026-09-21T12:00:00.000Z',
    });
    expect(result.value.source.body).not.toMatch(/@goal\/|@source\/|source:\/\/|cron/iu);
    expect(result.value.plan).toMatchObject({
      schemaVersion: 1,
      sourceRevision: 1,
      planRevision: 1,
      compiledAt: '2026-09-21T12:00:01.000Z',
      plan: PUBLISH_ARTICLE_GOAL_PLAN,
    });
    expect(await store.getSource(goalId, 1)).toEqual(result.value.source);
    expect(await store.getPlan(goalId, 1)).toEqual(result.value.plan);
  });

  it('creates independent N+1 revisions and preserves the old plan for audit', async () => {
    const { compiler, store } = createCompiler();
    const first = await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });
    const second = await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 1,
      body: UPDATED_PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.value.source.sourceRevision).toBe(2);
    expect(second.value.plan.planRevision).toBe(2);
    expect(second.value.plan.sourceRevision).toBe(2);
    expect(await store.getPlan(goalId, 1)).toEqual(first.value.plan);
    expect((await store.getSource(goalId, 1))?.body).toBe(PUBLISH_ARTICLE_GOAL_MARKDOWN);
  });

  it('returns structured clarification without saving a plan', async () => {
    const { compiler, store } = createCompiler();
    const result = await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: AMBIGUOUS_PUBLISH_GOAL_MARKDOWN,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'GOAL_CLARIFICATION_REQUIRED',
        message: 'The Goal source needs clarification before it can be compiled.',
        retryable: false,
        clarification: PUBLISH_GOAL_CLARIFICATION,
      },
    });
    expect((await store.getLatestSource(goalId))?.sourceRevision).toBe(1);
    expect(await store.getLatestPlan(goalId)).toBeUndefined();
  });

  it('rejects invalid provider output without saving a plan', async () => {
    const provider = new DeterministicGoalProvider([
      {
        markdown: PUBLISH_ARTICLE_GOAL_MARKDOWN,
        outcome: {
          kind: 'draft',
          value: { ...PUBLISH_ARTICLE_GOAL_PLAN, schedule: '0 8 * * *' },
        },
      },
    ]);
    const { compiler, store } = createCompiler(new InMemoryGoalRevisionStore(), provider);
    const result = await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('GOAL_PLAN_SCHEMA_INVALID');
    }
    expect(await store.getLatestPlan(goalId)).toBeUndefined();
  });

  it('rejects schema-valid unsafe policy and keeps the prior accepted plan', async () => {
    const store = new InMemoryGoalRevisionStore();
    const initial = createCompiler(store);
    const first = await initial.compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });
    expect(first.ok).toBe(true);

    const unsafePlan = {
      ...PUBLISH_ARTICLE_GOAL_PLAN,
      confirmationPolicy: {
        ...PUBLISH_ARTICLE_GOAL_PLAN.confirmationPolicy,
        mode: 'NO_CONFIRMATION_REQUIRED',
      },
    } satisfies GoalPlanV1;
    const unsafeProvider = new DeterministicGoalProvider([
      {
        markdown: UPDATED_PUBLISH_ARTICLE_GOAL_MARKDOWN,
        outcome: { kind: 'draft', value: unsafePlan },
      },
    ]);
    const unsafe = createCompiler(store, unsafeProvider);
    const second = await unsafe.compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 1,
      body: UPDATED_PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.code).toBe('GOAL_PLAN_POLICY_REJECTED');
    }
    expect((await store.getLatestSource(goalId))?.sourceRevision).toBe(2);
    expect((await store.getLatestPlan(goalId))?.planRevision).toBe(1);
    expect(await store.getPlanForSource(goalId, 2)).toBeUndefined();
  });

  it('sanitizes thrown provider errors and supports cancellation', async () => {
    const throwingProvider: StructuredGoalProvider = {
      id: 'flowpilot.throwing-provider',
      version: '1',
      interpret: () => Promise.reject(new Error('secret-token-must-not-leak')),
    };
    const failed = createCompiler(new InMemoryGoalRevisionStore(), throwingProvider);
    const failureResult = await failed.compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });
    expect(JSON.stringify(failureResult)).not.toContain('secret-token-must-not-leak');
    expect(failureResult.ok).toBe(false);
    if (!failureResult.ok) {
      expect(failureResult.error.code).toBe('GOAL_PROVIDER_FAILED');
    }

    const abortController = new AbortController();
    abortController.abort();
    const cancelled = createCompiler();
    const cancelledResult = await cancelled.compiler.reviseGoal(
      {
        goalId: 'goal_article_02',
        expectedSourceRevision: 0,
        body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
      },
      abortController.signal,
    );
    expect(cancelledResult.ok).toBe(false);
    if (!cancelledResult.ok) {
      expect(cancelledResult.error.code).toBe('GOAL_COMPILATION_CANCELLED');
    }
  });

  it('does not accept stale source revisions or silently reuse an old plan', async () => {
    const { compiler, store } = createCompiler();
    await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });

    const staleWrite = await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: UPDATED_PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });
    expect(staleWrite.ok).toBe(false);
    if (!staleWrite.ok) {
      expect(staleWrite.error.code).toBe('GOAL_REVISION_CONFLICT');
    }

    const unsupported = await compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 1,
      body: '# 一个尚未配置的目标\n\n做一件确定的事情。',
    });
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok) {
      expect(unsupported.error.code).toBe('GOAL_SOURCE_UNSUPPORTED');
    }
    expect((await store.getLatestSource(goalId))?.sourceRevision).toBe(2);
    expect((await store.getLatestPlan(goalId))?.sourceRevision).toBe(1);

    const staleCompile = await compiler.compileStoredSource({ goalId, sourceRevision: 1 });
    expect(staleCompile.ok).toBe(false);
    if (!staleCompile.ok) {
      expect(staleCompile.error.code).toBe('GOAL_REVISION_CONFLICT');
    }
  });

  it('can retry the latest failed source with a new deterministic provider', async () => {
    const store = new InMemoryGoalRevisionStore();
    const unsupported = createCompiler(store, new DeterministicGoalProvider([]));
    const failedResult = await unsupported.compiler.reviseGoal({
      goalId,
      expectedSourceRevision: 0,
      body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    });
    expect(failedResult.ok).toBe(false);

    const retry = createCompiler(store);
    const retried = await retry.compiler.compileStoredSource({ goalId, sourceRevision: 1 });
    expect(retried.ok).toBe(true);
    if (retried.ok) {
      expect(retried.value.planRevision).toBe(1);
      expect(retried.value.sourceRevision).toBe(1);
    }
  });
});
