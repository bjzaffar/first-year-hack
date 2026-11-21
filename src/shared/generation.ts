import { z } from 'zod';
import { CompiledTutorialSchema, GenerationErrorSchema } from './schemas.js';
import { LiveTutorialSchema } from '../geometry/live-compiler.js';

// Additive wire union: original v1 hinge fixtures and the authored masu-1 recipe.
export const GenerationResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), tutorial: z.union([LiveTutorialSchema, CompiledTutorialSchema]) }),
  z.strictObject({ ok: z.literal(false), error: GenerationErrorSchema }),
]);
