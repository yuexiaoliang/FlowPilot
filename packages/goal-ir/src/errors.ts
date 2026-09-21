import type { DeepReadonly } from './immutability';

export type GoalCompileErrorCode =
  | 'INVALID_GOAL_SOURCE'
  | 'GOAL_SOURCE_NOT_FOUND'
  | 'GOAL_SOURCE_UNSUPPORTED'
  | 'GOAL_PROVIDER_FAILED'
  | 'GOAL_COMPILATION_CANCELLED'
  | 'GOAL_CLARIFICATION_REQUIRED'
  | 'GOAL_PLAN_SCHEMA_INVALID'
  | 'GOAL_PLAN_POLICY_REJECTED'
  | 'GOAL_REVISION_CONFLICT'
  | 'UNSUPPORTED_GOAL_PLAN_VERSION';

export type GoalClarificationRequirement = DeepReadonly<{
  kind: 'CHOICE';
  prompt: string;
  options: readonly Readonly<{
    key: string;
    label: string;
  }>[];
}>;

export type GoalErrorDetails = Readonly<
  Record<string, string | number | boolean | readonly string[]>
>;

export type GoalCompileError = DeepReadonly<{
  code: GoalCompileErrorCode;
  message: string;
  retryable: boolean;
  details?: GoalErrorDetails;
  clarification?: GoalClarificationRequirement;
}>;
