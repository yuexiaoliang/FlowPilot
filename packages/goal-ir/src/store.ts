import { cloneFrozen } from './immutability';
import { hashGoalSource } from './hash';
import { failure, success, type Result } from './result';
import {
  goalPlanRevisionV1Schema,
  goalSourceSchema,
  type GoalId,
  type GoalPlanRevisionV1,
  type GoalSource,
} from './schema';

export type GoalStoreError = Readonly<{
  code: 'REVISION_CONFLICT' | 'INVALID_RECORD';
  message: string;
  expectedRevision?: number;
  actualRevision?: number;
}>;

export interface GoalRevisionStore {
  appendSource(
    source: GoalSource,
    expectedPreviousRevision: number,
  ): Promise<Result<void, GoalStoreError>>;
  appendPlan(
    plan: GoalPlanRevisionV1,
    expectedPreviousRevision: number,
  ): Promise<Result<void, GoalStoreError>>;
  getSource(goalId: GoalId, sourceRevision: number): Promise<GoalSource | undefined>;
  getPlan(goalId: GoalId, planRevision: number): Promise<GoalPlanRevisionV1 | undefined>;
  getPlanForSource(goalId: GoalId, sourceRevision: number): Promise<GoalPlanRevisionV1 | undefined>;
  getLatestSource(goalId: GoalId): Promise<GoalSource | undefined>;
  getLatestPlan(goalId: GoalId): Promise<GoalPlanRevisionV1 | undefined>;
}

function latestRevision<T>(records: ReadonlyMap<number, T> | undefined): number {
  if (records === undefined || records.size === 0) {
    return 0;
  }
  return Math.max(...records.keys());
}

export class InMemoryGoalRevisionStore implements GoalRevisionStore {
  readonly #sources = new Map<GoalId, Map<number, GoalSource>>();
  readonly #plans = new Map<GoalId, Map<number, GoalPlanRevisionV1>>();

  async appendSource(
    source: GoalSource,
    expectedPreviousRevision: number,
  ): Promise<Result<void, GoalStoreError>> {
    const parsed = goalSourceSchema.safeParse(source);
    if (!parsed.success) {
      return failure({
        code: 'INVALID_RECORD',
        message: 'Goal source record failed schema validation.',
      });
    }

    if (hashGoalSource(source.body) !== source.sourceHash) {
      return failure({
        code: 'INVALID_RECORD',
        message: 'Goal source hash does not match its exact Markdown body.',
      });
    }

    const records = this.#sources.get(source.goalId);
    const actualRevision = latestRevision(records);
    if (
      actualRevision !== expectedPreviousRevision ||
      source.sourceRevision !== expectedPreviousRevision + 1
    ) {
      return failure({
        code: 'REVISION_CONFLICT',
        message: 'Goal source revision is stale or non-sequential.',
        expectedRevision: expectedPreviousRevision,
        actualRevision,
      });
    }

    const writableRecords = records ?? new Map<number, GoalSource>();
    writableRecords.set(source.sourceRevision, cloneFrozen(parsed.data));
    this.#sources.set(source.goalId, writableRecords);
    return success(undefined);
  }

  async appendPlan(
    plan: GoalPlanRevisionV1,
    expectedPreviousRevision: number,
  ): Promise<Result<void, GoalStoreError>> {
    const parsed = goalPlanRevisionV1Schema.safeParse(plan);
    if (!parsed.success) {
      return failure({
        code: 'INVALID_RECORD',
        message: 'Goal plan record failed schema validation.',
      });
    }

    const source = this.#sources.get(plan.goalId)?.get(plan.sourceRevision);
    if (
      source === undefined ||
      source.sourceHash !== plan.sourceHash ||
      Date.parse(plan.compiledAt) < Date.parse(source.createdAt)
    ) {
      return failure({
        code: 'INVALID_RECORD',
        message:
          'Goal plan must reference an existing source revision with the same hash and valid chronology.',
      });
    }

    if ((await this.getPlanForSource(plan.goalId, plan.sourceRevision)) !== undefined) {
      return failure({
        code: 'REVISION_CONFLICT',
        message: 'A GoalPlan already exists for this source revision.',
        expectedRevision: expectedPreviousRevision,
        actualRevision: latestRevision(this.#plans.get(plan.goalId)),
      });
    }

    const records = this.#plans.get(plan.goalId);
    const actualRevision = latestRevision(records);
    if (
      actualRevision !== expectedPreviousRevision ||
      plan.planRevision !== expectedPreviousRevision + 1
    ) {
      return failure({
        code: 'REVISION_CONFLICT',
        message: 'Goal plan revision is stale or non-sequential.',
        expectedRevision: expectedPreviousRevision,
        actualRevision,
      });
    }

    const writableRecords = records ?? new Map<number, GoalPlanRevisionV1>();
    writableRecords.set(plan.planRevision, cloneFrozen(parsed.data));
    this.#plans.set(plan.goalId, writableRecords);
    return success(undefined);
  }

  async getSource(goalId: GoalId, sourceRevision: number): Promise<GoalSource | undefined> {
    const source = this.#sources.get(goalId)?.get(sourceRevision);
    return source === undefined ? undefined : cloneFrozen(source);
  }

  async getPlan(goalId: GoalId, planRevision: number): Promise<GoalPlanRevisionV1 | undefined> {
    const plan = this.#plans.get(goalId)?.get(planRevision);
    return plan === undefined ? undefined : cloneFrozen(plan);
  }

  async getPlanForSource(
    goalId: GoalId,
    sourceRevision: number,
  ): Promise<GoalPlanRevisionV1 | undefined> {
    const plan = [...(this.#plans.get(goalId)?.values() ?? [])].find(
      (candidate) => candidate.sourceRevision === sourceRevision,
    );
    return plan === undefined ? undefined : cloneFrozen(plan);
  }

  async getLatestSource(goalId: GoalId): Promise<GoalSource | undefined> {
    const records = this.#sources.get(goalId);
    return this.getSource(goalId, latestRevision(records));
  }

  async getLatestPlan(goalId: GoalId): Promise<GoalPlanRevisionV1 | undefined> {
    const records = this.#plans.get(goalId);
    return this.getPlan(goalId, latestRevision(records));
  }
}
