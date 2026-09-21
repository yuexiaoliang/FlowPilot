import { createHash } from 'node:crypto';

import { sourceHashSchema, type SourceHash } from './schema';

export function hashGoalSource(body: string): SourceHash {
  return sourceHashSchema.parse(createHash('sha256').update(body, 'utf8').digest('hex'));
}
