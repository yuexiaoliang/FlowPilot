import { describe, expect, it } from 'vitest';

import { decodeGoalPlanRevision, goalPlanV1Schema, validateGoalPlanPolicy } from '../src';
import { PUBLISH_ARTICLE_GOAL_PLAN } from './fixtures';

const validRevision = {
  schemaVersion: 1,
  goalId: 'goal_article_01',
  sourceRevision: 1,
  planRevision: 1,
  sourceHash: 'a'.repeat(64),
  compiledAt: '2026-09-21T12:00:00.000Z',
  compiler: { id: 'flowpilot.goal-plan-compiler', version: '1.0.0' },
  provider: { id: 'flowpilot.deterministic-goal-provider', version: '1' },
  plan: PUBLISH_ARTICLE_GOAL_PLAN,
};

describe('GoalPlan v1 compatibility', () => {
  it('accepts the complete v1 schema and rejects extra machine fields', () => {
    expect(goalPlanV1Schema.safeParse(PUBLISH_ARTICLE_GOAL_PLAN).success).toBe(true);
    expect(
      goalPlanV1Schema.safeParse({
        ...PUBLISH_ARTICLE_GOAL_PLAN,
        schedule: '0 8 * * *',
      }).success,
    ).toBe(false);
  });

  it('reads schema v1 and explicitly rejects unknown versions', () => {
    const decoded = decodeGoalPlanRevision(validRevision);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.value.schemaVersion).toBe(1);
      expect(Object.isFrozen(decoded.value.plan.requiredInputs)).toBe(true);
    }

    const unsupported = decodeGoalPlanRevision({ ...validRevision, schemaVersion: 2 });
    expect(unsupported).toEqual({
      ok: false,
      error: {
        code: 'UNSUPPORTED_GOAL_PLAN_VERSION',
        message: 'GoalPlan schema version is not supported.',
        retryable: false,
      },
    });
  });

  it('rejects schema-valid but unsafe confirmation combinations by policy', () => {
    const unsafePlan = {
      ...PUBLISH_ARTICLE_GOAL_PLAN,
      confirmationPolicy: {
        ...PUBLISH_ARTICLE_GOAL_PLAN.confirmationPolicy,
        mode: 'NO_CONFIRMATION_REQUIRED' as const,
      },
    };

    expect(goalPlanV1Schema.safeParse(unsafePlan).success).toBe(true);
    expect(validateGoalPlanPolicy(unsafePlan)).toEqual([
      expect.objectContaining({ code: 'CONFIRMATION_POLICY_CONFLICT' }),
    ]);
  });
});
