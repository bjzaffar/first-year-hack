/** Additive T003 feasibility handoff. The existing HTTP contract remains unchanged.
 * T005 consumes the recipe-specific evaluator; T006 must implement all three motion kinds
 * before T008 can register this recipe in live generation. This is not a RecipeCompiler.
 */
export {
  MasuMotionParametersSchema, MasuMotionRequestSchema, MasuOperationSchema,
  masuMotionContract, masuOperations, masuCornerLayerStacks, masuMotionFixtures,
  masuMotionStepIds, masuMotionInstructions, sampleMasuMotion,
} from '../recipes/masu-motion.js';
export type { MasuMotionParameters, MasuMotionStepId } from '../recipes/masu-motion.js';
