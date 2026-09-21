import { describe, expect, it } from 'vitest';

import {
  GOAL_PLAN_COMPILER_ID,
  GOAL_PLAN_COMPILER_VERSION,
  InMemoryGoalRevisionStore,
  cloneFrozen,
  goalIdSchema,
  hashGoalSource,
  type GoalPlanRevisionV1,
  type GoalSource,
} from '../src';
import { PUBLISH_ARTICLE_GOAL_MARKDOWN, PUBLISH_ARTICLE_GOAL_PLAN } from './fixtures';

const goalId = goalIdSchema.parse('goal_article_01');

function sourceRecord(): GoalSource {
  return cloneFrozen({
    goalId,
    sourceRevision: 1,
    body: PUBLISH_ARTICLE_GOAL_MARKDOWN,
    sourceHash: hashGoalSource(PUBLISH_ARTICLE_GOAL_MARKDOWN),
    createdAt: '2026-09-21T12:00:00.000Z',
  });
}

function planRecord(source: GoalSource): GoalPlanRevisionV1 {
  return cloneFrozen({
    schemaVersion: 1,
    goalId,
    sourceRevision: 1,
    planRevision: 1,
    sourceHash: source.sourceHash,
    compiledAt: '2026-09-21T12:00:01.000Z',
    compiler: { id: GOAL_PLAN_COMPILER_ID, version: GOAL_PLAN_COMPILER_VERSION },
    provider: { id: 'flowpilot.deterministic-goal-provider', version: '1' },
    plan: PUBLISH_ARTICLE_GOAL_PLAN,
  });
}

describe('InMemoryGoalRevisionStore', () => {
  it('stores append-only source and plan revisions with exact audit lookup', async () => {
    const store = new InMemoryGoalRevisionStore();
    const source = sourceRecord();
    const plan = planRecord(source);

    expect(await store.appendSource(source, 0)).toEqual({ ok: true, value: undefined });
    expect(await store.appendPlan(plan, 0)).toEqual({ ok: true, value: undefined });
    expect(await store.getSource(goalId, 1)).toEqual(source);
    expect(await store.getPlan(goalId, 1)).toEqual(plan);
    expect(await store.getPlanForSource(goalId, 1)).toEqual(plan);
  });

  it('returns independent deeply frozen records', async () => {
    const store = new InMemoryGoalRevisionStore();
    const source = sourceRecord();
    const plan = planRecord(source);
    await store.appendSource(source, 0);
    await store.appendPlan(plan, 0);

    const firstRead = await store.getPlan(goalId, 1);
    const secondRead = await store.getPlan(goalId, 1);
    expect(firstRead).not.toBe(secondRead);
    expect(Object.isFrozen(firstRead)).toBe(true);
    expect(Object.isFrozen(firstRead?.plan.requiredInputs)).toBe(true);
    expect(Reflect.set(firstRead?.plan.requiredInputs[0] ?? {}, 'label', 'Changed')).toBe(false);
    expect(secondRead?.plan.requiredInputs[0]?.label).toBe('文章标题');
  });

  it('rejects revision overwrite and plans that do not match their source hash', async () => {
    const store = new InMemoryGoalRevisionStore();
    const source = sourceRecord();
    await store.appendSource(source, 0);

    const overwrite = await store.appendSource(source, 0);
    expect(overwrite.ok).toBe(false);
    if (!overwrite.ok) {
      expect(overwrite.error.code).toBe('REVISION_CONFLICT');
    }

    const mismatchedPlan = cloneFrozen({
      ...planRecord(source),
      sourceHash: 'b'.repeat(64) as GoalPlanRevisionV1['sourceHash'],
    });
    const mismatch = await store.appendPlan(mismatchedPlan, 0);
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) {
      expect(mismatch.error.code).toBe('INVALID_RECORD');
    }

    const invalidSourceHash = cloneFrozen({
      ...source,
      sourceRevision: 2,
      sourceHash: 'c'.repeat(64) as GoalSource['sourceHash'],
    });
    const invalidSource = await store.appendSource(invalidSourceHash, 1);
    expect(invalidSource.ok).toBe(false);
    if (!invalidSource.ok) {
      expect(invalidSource.error.code).toBe('INVALID_RECORD');
    }
  });
});
