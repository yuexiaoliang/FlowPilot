import { cloneFrozen } from './immutability';
import { failure, success, type Result } from './result';
import { goalPlanRevisionV1Schema, type GoalPlanRevisionV1 } from './schema';
import type { GoalCompileError } from './errors';

function issuePaths(issues: readonly Readonly<{ path: readonly PropertyKey[]; code: string }>[]) {
  return issues.map(({ code, path }) => `${path.join('.') || 'root'}:${code}`);
}

export function decodeGoalPlanRevision(
  input: unknown,
): Result<GoalPlanRevisionV1, GoalCompileError> {
  if (
    input === null ||
    typeof input !== 'object' ||
    !('schemaVersion' in input) ||
    Reflect.get(input, 'schemaVersion') !== 1
  ) {
    return failure({
      code: 'UNSUPPORTED_GOAL_PLAN_VERSION',
      message: 'GoalPlan schema version is not supported.',
      retryable: false,
    });
  }

  const parsed = goalPlanRevisionV1Schema.safeParse(input);
  if (!parsed.success) {
    return failure({
      code: 'GOAL_PLAN_SCHEMA_INVALID',
      message: 'GoalPlan revision failed schema validation.',
      retryable: false,
      details: { issues: issuePaths(parsed.error.issues) },
    });
  }

  return success(cloneFrozen(parsed.data));
}
