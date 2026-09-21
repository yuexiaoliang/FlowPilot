import { z } from 'zod';

import type { DeepReadonly } from './immutability';

export const GOAL_PLAN_SCHEMA_VERSION = 1 as const;

export const goalIdSchema = z
  .string()
  .regex(/^goal_[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/u, 'Goal ID must be opaque and stable.')
  .brand<'GoalId'>();

export type GoalId = z.infer<typeof goalIdSchema>;

export const sourceHashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/u, 'Source hash must be a lowercase SHA-256 digest.')
  .brand<'SourceHash'>();

export type SourceHash = z.infer<typeof sourceHashSchema>;

export const utcIsoTimestampSchema = z.iso.datetime({ offset: false });

const revisionSchema = z.number().int().positive();
const nonEmptyTextSchema = z.string().trim().min(1).max(1_000);
const criterionSchema = z.string().trim().min(1).max(500);

export const goalSourceSchema = z
  .object({
    goalId: goalIdSchema,
    sourceRevision: revisionSchema,
    body: z
      .string()
      .max(100_000)
      .refine((body) => body.trim().length > 0, 'Goal Markdown must not be empty.'),
    sourceHash: sourceHashSchema,
    createdAt: utcIsoTimestampSchema,
  })
  .strict();

export type GoalSource = DeepReadonly<z.infer<typeof goalSourceSchema>>;

export const goalInputSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/u),
    label: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(500),
    kind: z.enum(['text', 'document', 'file', 'image']),
  })
  .strict();

export type GoalInput = DeepReadonly<z.infer<typeof goalInputSchema>>;

export const confirmationPolicySchema = z
  .object({
    trigger: z.enum(['BEFORE_IRREVERSIBLE_ACTION', 'NONE']),
    mode: z.enum(['REQUIRE_EXPLICIT_CONFIRMATION', 'NO_CONFIRMATION_REQUIRED']),
    rationale: nonEmptyTextSchema,
  })
  .strict();

export const interventionPolicySchema = z
  .object({
    loginRequired: z.enum(['REQUEST_HUMAN', 'FAIL']),
    securityChallenge: z.literal('STOP_AND_REQUEST_HUMAN'),
    ambiguousState: z.enum(['REQUEST_CLARIFICATION', 'FAIL']),
  })
  .strict();

export const goalPlanV1Schema = z
  .object({
    intent: nonEmptyTextSchema,
    semanticCapabilities: z
      .array(z.string().regex(/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/u))
      .min(1)
      .max(20),
    requiredInputs: z.array(goalInputSchema).max(50),
    optionalInputs: z.array(goalInputSchema).max(50),
    successCriteria: z.array(criterionSchema).min(1).max(20),
    nonSuccessCriteria: z.array(criterionSchema).min(1).max(20),
    confirmationPolicy: confirmationPolicySchema,
    interventionPolicy: interventionPolicySchema,
  })
  .strict();

export type GoalPlanV1 = DeepReadonly<z.infer<typeof goalPlanV1Schema>>;

export const compilerIdentitySchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9.-]{2,63}$/u),
    version: z.string().regex(/^\d+\.\d+\.\d+$/u),
  })
  .strict();

export const providerIdentitySchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9.-]{2,63}$/u),
    version: z.string().trim().min(1).max(64),
  })
  .strict();

export const goalPlanRevisionV1Schema = z
  .object({
    schemaVersion: z.literal(GOAL_PLAN_SCHEMA_VERSION),
    goalId: goalIdSchema,
    sourceRevision: revisionSchema,
    planRevision: revisionSchema,
    sourceHash: sourceHashSchema,
    compiledAt: utcIsoTimestampSchema,
    compiler: compilerIdentitySchema,
    provider: providerIdentitySchema,
    plan: goalPlanV1Schema,
  })
  .strict();

export type GoalPlanRevisionV1 = DeepReadonly<z.infer<typeof goalPlanRevisionV1Schema>>;
