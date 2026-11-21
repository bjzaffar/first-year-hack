import { z } from 'zod';
import { ObjectAnalysisSchema } from './schemas.js';
import { BoatParametersSchema } from '../recipes/boat.js';
import { MasuMotionParametersSchema, masuMotionContract } from './masu-contract.js';

// Only trusted implemented recipes enter the model catalog. Motion stays in code.
export const MasuLiveRecipeSchema = z.strictObject({
  id: z.literal('masu-box'), version: z.literal('0.1.0'), synthetic: z.literal(false),
  parameterBounds: z.strictObject({ wallHeightFraction: z.strictObject({
    min: z.literal(masuMotionContract.parameterBounds.wallHeightFraction.min),
    max: z.literal(masuMotionContract.parameterBounds.wallHeightFraction.max),
  }) }),
  limitations: z.array(z.string().min(1)).min(1),
});
export const MasuLiveAnalysisSchema = ObjectAnalysisSchema.extend({
  recipeId: z.literal('masu-box'), parameters: MasuMotionParametersSchema,
  objectLabel: z.string().min(1).max(80),
  approximationNotes: z.array(z.string().min(1).max(200)).min(1).max(2),
});
export const BoatLiveRecipeSchema = z.strictObject({
  id: z.literal('basic-boat'), version: z.literal('0.1.0'), synthetic: z.literal(false),
  parameterBounds: z.strictObject({ hullWidthFraction: z.strictObject({ min: z.literal(0.24), max: z.literal(0.30) }) }),
  limitations: z.array(z.string().min(1)).min(1),
});
export const BoatLiveAnalysisSchema = MasuLiveAnalysisSchema.extend({ recipeId: z.literal('basic-boat'), parameters: BoatParametersSchema });
export const LiveRecipeSchema = z.discriminatedUnion('id', [MasuLiveRecipeSchema, BoatLiveRecipeSchema]);
export const LiveAnalysisSchema = z.discriminatedUnion('recipeId', [MasuLiveAnalysisSchema, BoatLiveAnalysisSchema]);
export type LiveRecipe = z.infer<typeof LiveRecipeSchema>;
export type LiveAnalysis = z.infer<typeof LiveAnalysisSchema>;
