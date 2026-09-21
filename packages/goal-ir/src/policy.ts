import type { GoalPlanV1 } from './schema';

export type GoalPlanPolicyViolation = Readonly<{
  code:
    | 'INPUT_KEY_CONFLICT'
    | 'CONFIRMATION_POLICY_CONFLICT'
    | 'DUPLICATE_CAPABILITY'
    | 'DUPLICATE_CRITERION';
  path: string;
  message: string;
}>;

function findDuplicates(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates].sort();
}

export function validateGoalPlanPolicy(plan: GoalPlanV1): readonly GoalPlanPolicyViolation[] {
  const violations: GoalPlanPolicyViolation[] = [];
  const requiredKeys = plan.requiredInputs.map(({ key }) => key);
  const optionalKeys = plan.optionalInputs.map(({ key }) => key);
  const allInputKeys = [...requiredKeys, ...optionalKeys];

  for (const key of findDuplicates(allInputKeys)) {
    violations.push({
      code: 'INPUT_KEY_CONFLICT',
      path: 'requiredInputs|optionalInputs',
      message: `Input key "${key}" must be unique across required and optional inputs.`,
    });
  }

  const { mode, trigger } = plan.confirmationPolicy;
  const validConfirmationCombination =
    (trigger === 'BEFORE_IRREVERSIBLE_ACTION' && mode === 'REQUIRE_EXPLICIT_CONFIRMATION') ||
    (trigger === 'NONE' && mode === 'NO_CONFIRMATION_REQUIRED');

  if (!validConfirmationCombination) {
    violations.push({
      code: 'CONFIRMATION_POLICY_CONFLICT',
      path: 'confirmationPolicy',
      message: 'Confirmation mode must match its declared trigger.',
    });
  }

  for (const capability of findDuplicates(plan.semanticCapabilities)) {
    violations.push({
      code: 'DUPLICATE_CAPABILITY',
      path: 'semanticCapabilities',
      message: `Semantic capability "${capability}" must be unique.`,
    });
  }

  for (const [path, criteria] of [
    ['successCriteria', plan.successCriteria],
    ['nonSuccessCriteria', plan.nonSuccessCriteria],
  ] as const) {
    for (const criterion of findDuplicates(criteria)) {
      violations.push({
        code: 'DUPLICATE_CRITERION',
        path,
        message: `Criterion "${criterion}" must be unique within ${path}.`,
      });
    }
  }

  return violations;
}
