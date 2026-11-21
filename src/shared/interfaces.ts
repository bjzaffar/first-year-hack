import type { CompiledTutorial, GenerateRequest, ObjectAnalysis, RecipeDefinition } from './schemas.js';

export type LiveImage = Extract<GenerateRequest, { mode: 'live' }>['image'];
// Implementations must validate unknown provider output before returning it.
export interface AnalysisProvider {
  analyze(image: LiveImage, recipes: readonly RecipeDefinition[], signal: AbortSignal): Promise<ObjectAnalysis>;
  readiness(signal: AbortSignal): Promise<'ready' | 'unavailable'>;
}
// Executable fitting/formulas live in trusted code, never in JSON or AI output.
export interface RecipeCompiler {
  readonly recipes: readonly RecipeDefinition[];
  compile(analysis: ObjectAnalysis): CompiledTutorial;
}
