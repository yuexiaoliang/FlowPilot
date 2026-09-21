import { z } from 'zod';

import { decodeGoalPlanRevision } from './compatibility';
import type { GoalCompileError } from './errors';
import { hashGoalSource } from './hash';
import { cloneFrozen } from './immutability';
import { validateGoalPlanPolicy } from './policy';
import type { GoalProviderError, StructuredGoalProvider } from './provider';
import { failure, success, type Result } from './result';
import {
  GOAL_PLAN_SCHEMA_VERSION,
  goalIdSchema,
  goalPlanV1Schema,
  goalSourceSchema,
  type GoalId,
  type GoalPlanRevisionV1,
  type GoalSource,
} from './schema';
import type { GoalRevisionStore, GoalStoreError } from './store';

export const GOAL_PLAN_COMPILER_ID = 'flowpilot.goal-plan-compiler' as const;
export const GOAL_PLAN_COMPILER_VERSION = '1.0.0' as const;

export interface GoalClock {
  now(): Date;
}

export const systemGoalClock: GoalClock = Object.freeze({
  now: () => new Date(),
});

const reviseGoalRequestSchema = z
  .object({
    goalId: goalIdSchema,
    expectedSourceRevision: z.number().int().nonnegative(),
    body: z
      .string()
      .max(100_000)
      .refine((body) => body.trim().length > 0),
  })
  .strict();

const compileStoredSourceRequestSchema = z
  .object({
    goalId: goalIdSchema,
    sourceRevision: z.number().int().positive(),
  })
  .strict();

export type ReviseGoalRequest = Readonly<{
  goalId: string;
  expectedSourceRevision: number;
  body: string;
}>;

export type CompileStoredGoalSourceRequest = Readonly<{
  goalId: string;
  sourceRevision: number;
}>;

export type GoalCompilation = Readonly<{
  source: GoalSource;
  plan: GoalPlanRevisionV1;
}>;

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

function zodIssuePaths(error: z.ZodError): readonly string[] {
  return error.issues.map(({ code, path }) => `${path.join('.') || 'root'}:${code}`);
}

function mapStoreError(error: GoalStoreError): GoalCompileError {
  if (error.code === 'REVISION_CONFLICT') {
    return {
      code: 'GOAL_REVISION_CONFLICT',
      message: error.message,
      retryable: true,
      details: {
        ...(error.expectedRevision === undefined
          ? {}
          : { expectedRevision: error.expectedRevision }),
        ...(error.actualRevision === undefined ? {} : { actualRevision: error.actualRevision }),
      },
    };
  }

  return {
    code: 'GOAL_PLAN_SCHEMA_INVALID',
    message: error.message,
    retryable: false,
  };
}

function mapProviderError(error: GoalProviderError): GoalCompileError {
  switch (error.code) {
    case 'CANCELLED':
      return {
        code: 'GOAL_COMPILATION_CANCELLED',
        message: 'Goal compilation was cancelled.',
        retryable: true,
      };
    case 'CLARIFICATION_REQUIRED':
      return {
        code: 'GOAL_CLARIFICATION_REQUIRED',
        message: 'The Goal source needs clarification before it can be compiled.',
        retryable: false,
        ...(error.clarification === undefined ? {} : { clarification: error.clarification }),
      };
    case 'UNSUPPORTED_SOURCE':
      return {
        code: 'GOAL_SOURCE_UNSUPPORTED',
        message: 'The Goal source is not supported by the current compiler provider.',
        retryable: false,
      };
    case 'PROVIDER_FAILED':
      return {
        code: 'GOAL_PROVIDER_FAILED',
        message: 'The Goal compiler provider failed.',
        retryable: error.retryable,
      };
  }
}

export class GoalPlanCompiler {
  readonly #provider: StructuredGoalProvider;
  readonly #store: GoalRevisionStore;
  readonly #clock: GoalClock;

  constructor(
    options: Readonly<{
      provider: StructuredGoalProvider;
      store: GoalRevisionStore;
      clock?: GoalClock;
    }>,
  ) {
    this.#provider = options.provider;
    this.#store = options.store;
    this.#clock = options.clock ?? systemGoalClock;
  }

  async reviseGoal(
    request: ReviseGoalRequest,
    signal?: AbortSignal,
  ): Promise<Result<GoalCompilation, GoalCompileError>> {
    const parsedRequest = reviseGoalRequestSchema.safeParse(request);
    if (!parsedRequest.success) {
      return failure({
        code: 'INVALID_GOAL_SOURCE',
        message: 'Goal source request failed validation.',
        retryable: false,
        details: { issues: zodIssuePaths(parsedRequest.error) },
      });
    }

    const createdAt = this.#clock.now().toISOString();
    const parsedSource = goalSourceSchema.safeParse({
      goalId: parsedRequest.data.goalId,
      sourceRevision: parsedRequest.data.expectedSourceRevision + 1,
      body: parsedRequest.data.body,
      sourceHash: hashGoalSource(parsedRequest.data.body),
      createdAt,
    });

    if (!parsedSource.success) {
      return failure({
        code: 'INVALID_GOAL_SOURCE',
        message: 'Goal source revision failed validation.',
        retryable: false,
        details: { issues: zodIssuePaths(parsedSource.error) },
      });
    }

    const source = cloneFrozen(parsedSource.data);
    const stored = await this.#store.appendSource(
      source,
      parsedRequest.data.expectedSourceRevision,
    );
    if (!stored.ok) {
      return failure(mapStoreError(stored.error));
    }

    const compiled = await this.compileStoredSource(
      { goalId: source.goalId, sourceRevision: source.sourceRevision },
      signal,
    );
    if (!compiled.ok) {
      return compiled;
    }

    return success(cloneFrozen({ source, plan: compiled.value }));
  }

  async compileStoredSource(
    request: CompileStoredGoalSourceRequest,
    signal?: AbortSignal,
  ): Promise<Result<GoalPlanRevisionV1, GoalCompileError>> {
    const parsedRequest = compileStoredSourceRequestSchema.safeParse(request);
    if (!parsedRequest.success) {
      return failure({
        code: 'INVALID_GOAL_SOURCE',
        message: 'Stored Goal source request failed validation.',
        retryable: false,
        details: { issues: zodIssuePaths(parsedRequest.error) },
      });
    }

    const goalId: GoalId = parsedRequest.data.goalId;
    const source = await this.#store.getSource(goalId, parsedRequest.data.sourceRevision);
    if (source === undefined) {
      return failure({
        code: 'GOAL_SOURCE_NOT_FOUND',
        message: 'Goal source revision was not found.',
        retryable: false,
      });
    }

    const latestSource = await this.#store.getLatestSource(goalId);
    if (latestSource?.sourceRevision !== source.sourceRevision) {
      return failure({
        code: 'GOAL_REVISION_CONFLICT',
        message: 'Only the latest Goal source revision can be compiled.',
        retryable: false,
        details: {
          sourceRevision: source.sourceRevision,
          latestSourceRevision: latestSource?.sourceRevision ?? 0,
        },
      });
    }

    const existingPlan = await this.#store.getPlanForSource(goalId, source.sourceRevision);
    if (existingPlan !== undefined) {
      return success(existingPlan);
    }

    if (isAborted(signal)) {
      return failure({
        code: 'GOAL_COMPILATION_CANCELLED',
        message: 'Goal compilation was cancelled.',
        retryable: true,
      });
    }

    let providerResult: Awaited<ReturnType<StructuredGoalProvider['interpret']>>;
    try {
      providerResult = await this.#provider.interpret({ markdown: source.body }, signal);
    } catch {
      return failure({
        code: isAborted(signal) ? 'GOAL_COMPILATION_CANCELLED' : 'GOAL_PROVIDER_FAILED',
        message: isAborted(signal)
          ? 'Goal compilation was cancelled.'
          : 'The Goal compiler provider failed.',
        retryable: true,
      });
    }

    if (!providerResult.ok) {
      return failure(mapProviderError(providerResult.error));
    }

    if (isAborted(signal)) {
      return failure({
        code: 'GOAL_COMPILATION_CANCELLED',
        message: 'Goal compilation was cancelled.',
        retryable: true,
      });
    }

    const parsedPlan = goalPlanV1Schema.safeParse(providerResult.value);
    if (!parsedPlan.success) {
      return failure({
        code: 'GOAL_PLAN_SCHEMA_INVALID',
        message: 'GoalPlan output failed schema validation.',
        retryable: false,
        details: { issues: zodIssuePaths(parsedPlan.error) },
      });
    }

    const policyViolations = validateGoalPlanPolicy(parsedPlan.data);
    if (policyViolations.length > 0) {
      return failure({
        code: 'GOAL_PLAN_POLICY_REJECTED',
        message: 'GoalPlan output failed policy validation.',
        retryable: false,
        details: {
          violations: policyViolations.map(({ code, path }) => `${path}:${code}`),
        },
      });
    }

    const latestPlan = await this.#store.getLatestPlan(goalId);
    const planCandidate = {
      schemaVersion: GOAL_PLAN_SCHEMA_VERSION,
      goalId,
      sourceRevision: source.sourceRevision,
      planRevision: (latestPlan?.planRevision ?? 0) + 1,
      sourceHash: source.sourceHash,
      compiledAt: this.#clock.now().toISOString(),
      compiler: {
        id: GOAL_PLAN_COMPILER_ID,
        version: GOAL_PLAN_COMPILER_VERSION,
      },
      provider: {
        id: this.#provider.id,
        version: this.#provider.version,
      },
      plan: parsedPlan.data,
    };

    const decodedPlan = decodeGoalPlanRevision(planCandidate);
    if (!decodedPlan.ok) {
      return decodedPlan;
    }

    const stored = await this.#store.appendPlan(decodedPlan.value, latestPlan?.planRevision ?? 0);
    if (!stored.ok) {
      return failure(mapStoreError(stored.error));
    }

    return success(decodedPlan.value);
  }
}
