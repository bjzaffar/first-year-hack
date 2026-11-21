import type { CompiledTutorial, GenerateRequest, ObjectAnalysis, RecipeDefinition } from './schemas.js';

export type LiveImage = Extract<GenerateRequest, { mode: 'live' }>['image'];
// Implementations must validate unknown provider output before returning it.
export interface AnalysisProvider<Recipe = RecipeDefinition, Analysis = ObjectAnalysis> {
  analyze(image: LiveImage, recipes: readonly Recipe[], signal: AbortSignal): Promise<Analysis>;
  readiness(signal: AbortSignal): Promise<'ready' | 'unavailable'>;
}
// Executable fitting/formulas live in trusted code, never in JSON or AI output.
export interface RecipeCompiler {
  readonly recipes: readonly RecipeDefinition[];
  compile(analysis: ObjectAnalysis): CompiledTutorial;
}
