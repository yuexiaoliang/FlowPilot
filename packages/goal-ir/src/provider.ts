import { cloneFrozen } from './immutability';
import { failure, success, type Result } from './result';
import type { GoalClarificationRequirement } from './errors';

export type GoalProviderError = Readonly<{
  code: 'UNSUPPORTED_SOURCE' | 'CLARIFICATION_REQUIRED' | 'PROVIDER_FAILED' | 'CANCELLED';
  message: string;
  retryable: boolean;
  clarification?: GoalClarificationRequirement;
}>;

export type StructuredGoalRequest = Readonly<{
  markdown: string;
}>;

export interface StructuredGoalProvider {
  readonly id: string;
  readonly version: string;

  interpret(
    request: StructuredGoalRequest,
    signal?: AbortSignal,
  ): Promise<Result<unknown, GoalProviderError>>;
}

export type DeterministicGoalFixture = Readonly<{
  markdown: string;
  outcome:
    | Readonly<{ kind: 'draft'; value: unknown }>
    | Readonly<{ kind: 'clarification'; requirement: GoalClarificationRequirement }>;
}>;

export class DeterministicGoalProvider implements StructuredGoalProvider {
  readonly id: string;
  readonly version: string;
  readonly #fixtures: ReadonlyMap<string, DeterministicGoalFixture['outcome']>;

  constructor(
    fixtures: readonly DeterministicGoalFixture[],
    identity: Readonly<{ id: string; version: string }> = {
      id: 'flowpilot.deterministic-goal-provider',
      version: '1',
    },
  ) {
    const fixtureMap = new Map<string, DeterministicGoalFixture['outcome']>();
    for (const fixture of fixtures) {
      if (fixtureMap.has(fixture.markdown)) {
        throw new Error('Deterministic goal fixtures must use unique Markdown inputs.');
      }
      fixtureMap.set(fixture.markdown, cloneFrozen(fixture.outcome));
    }

    this.id = identity.id;
    this.version = identity.version;
    this.#fixtures = fixtureMap;
  }

  async interpret(
    request: StructuredGoalRequest,
    signal?: AbortSignal,
  ): Promise<Result<unknown, GoalProviderError>> {
    await Promise.resolve();

    if (signal?.aborted === true) {
      return failure({
        code: 'CANCELLED',
        message: 'Goal interpretation was cancelled.',
        retryable: true,
      });
    }

    const outcome = this.#fixtures.get(request.markdown);
    if (outcome === undefined) {
      return failure({
        code: 'UNSUPPORTED_SOURCE',
        message: 'The deterministic provider has no matching fixture.',
        retryable: false,
      });
    }

    if (outcome.kind === 'clarification') {
      return failure({
        code: 'CLARIFICATION_REQUIRED',
        message: 'The Goal source needs clarification.',
        retryable: false,
        clarification: cloneFrozen(outcome.requirement),
      });
    }

    return success(cloneFrozen(outcome.value));
  }
}
