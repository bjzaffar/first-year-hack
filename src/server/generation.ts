import { performance } from 'node:perf_hooks';
import type { AnalysisProvider, LiveImage } from '../shared/interfaces.js';
import { LiveAnalysisSchema, type LiveAnalysis, type LiveRecipe } from '../shared/live-analysis.js';
import { liveCompiler, LiveTutorialSchema } from '../geometry/live-compiler.js';
import { AnalysisProviderError } from './providers/errors.js';
import { validateImage } from './providers/image.js';

export type LiveProvider = AnalysisProvider<LiveRecipe, LiveAnalysis>;
export type GenerationOptions = {
  provider: LiveProvider | null;
  timeoutMs?: number;
  compile?: typeof liveCompiler.compile;
};

/** One deadline covers analysis, compilation and final validation. No partial success. */
export async function generate(image: LiveImage, options: GenerationOptions, caller: AbortSignal) {
  validateImage(image);
  if (!options.provider) throw new AnalysisProviderError('MODEL_UNAVAILABLE', 'Local photo analysis is not configured. Start Ollama with the configured model, then retry.', true);
  const timeoutMs = options.timeoutMs ?? 60_000;
  const started = performance.now();
  const controller = new AbortController();
  const signal = AbortSignal.any([caller, controller.signal]);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeoutError = () => new AnalysisProviderError('GENERATION_TIMEOUT', 'Generation was cancelled or exceeded 60 seconds. Your crop is saved; retry when the local model is ready.', true);
  let abort: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => reject(timeoutError());
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
  const checkDeadline = () => {
    if (signal.aborted || performance.now() - started >= timeoutMs) throw timeoutError();
  };
  try {
    return await Promise.race([cancelled, (async () => {
      checkDeadline();
      const raw = await options.provider!.analyze(image, liveCompiler.recipes, signal);
      checkDeadline();
      const parsed = LiveAnalysisSchema.safeParse(raw);
      if (!parsed.success) throw new AnalysisProviderError('INVALID_MODEL_RESPONSE', 'The local model returned an invalid analysis. Try a clearer crop.', true);
      const analysis = parsed.data;
      const notes = [`Photo interpretation: ${analysis.objectLabel}.`, ...analysis.approximationNotes];
      if (analysis.features.shape === 'other' || (analysis.recipeId === 'masu-box' && analysis.features.shape !== 'container')) notes.push('Weak match: this is a simplified supported paper form, not a faithful reconstruction.');
      const tutorial = (options.compile ?? liveCompiler.compile)({
        recipeId: analysis.recipeId, parameters: analysis.parameters,
        objectLabel: analysis.objectLabel, approximationNotes: notes,
      });
      checkDeadline();
      const validated = LiveTutorialSchema.parse(tutorial);
      checkDeadline();
      return validated;
    })()]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    controller.abort();
  }
}
