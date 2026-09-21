import { z } from 'zod';

export const SHELL_PROTOCOL_VERSION = 1 as const;

export const IPC_CHANNELS = Object.freeze({
  shellGetInfo: 'flowpilot:shell:get-info',
});

export const appErrorSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
    correlationId: z.string().min(1).optional(),
  })
  .strict();

export type AppError = z.infer<typeof appErrorSchema>;

export const shellInfoRequestSchema = z
  .object({
    protocolVersion: z.literal(SHELL_PROTOCOL_VERSION),
  })
  .strict();

export type ShellInfoRequest = z.infer<typeof shellInfoRequestSchema>;

export const shellInfoSchema = z
  .object({
    protocolVersion: z.literal(SHELL_PROTOCOL_VERSION),
    appVersion: z.string().min(1),
    platform: z.string().min(1).max(32),
  })
  .strict();

export type ShellInfo = z.infer<typeof shellInfoSchema>;

export const shellInfoResultSchema = z.discriminatedUnion('ok', [
  z
    .object({
      ok: z.literal(true),
      value: shellInfoSchema,
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      error: appErrorSchema,
    })
    .strict(),
]);

export type ShellInfoResult = z.infer<typeof shellInfoResultSchema>;

export interface FlowPilotDesktopApi {
  getShellInfo(): Promise<ShellInfoResult>;
}
