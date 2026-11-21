import express, { type ErrorRequestHandler } from 'express';
import { resolve } from 'node:path';
import { GenerateRequestSchema, GenerateResponseSchema, HealthSchema, type GenerationError } from '../shared/schemas.js';
import { syntheticTutorial } from '../shared/fixtures.js';
import { generate, type GenerationOptions } from './generation.js';
import { createOllamaProviderFromEnv } from './providers/ollama.js';
import { AnalysisProviderError } from './providers/errors.js';

export function createApp(staticDirectory?: string, options: GenerationOptions = { provider: createOllamaProviderFromEnv() }) {
  if (options.timeoutMs !== undefined && (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1 || options.timeoutMs > 60_000)) throw new Error('Generation timeout must be 1–60000 milliseconds.');
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  // Images stay in request memory. Never log request bodies or raw provider errors.
  app.use(express.json({ limit: '14mb', strict: true }));
  const error = (code: GenerationError['code'], message: string, retryable = false) =>
    GenerateResponseSchema.parse({ ok: false, error: { contractVersion: '1', code, message, retryable } });
  app.get('/api/health', async (_req, res) => {
    const model = options.provider ? await options.provider.readiness(AbortSignal.timeout(5000)).catch(() => 'unavailable' as const) : 'not_configured';
    res.json(HealthSchema.parse({ contractVersion: '1', backend: 'ready', model, compiler: 'ready',
      generationReady: model === 'ready', fixtureAvailable: true }));
  });
  app.post('/api/generate', async (req, res, next) => {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(error('INVALID_REQUEST', 'Send a version 1 fixture request or a JPEG, PNG, or WebP crop up to 10 MiB and 1024 pixels per side.'));
      return;
    }
    if (parsed.data.mode === 'fixture') {
      res.json(GenerateResponseSchema.parse({ ok: true, tutorial: structuredClone(syntheticTutorial) }));
      return;
    }
    const controller = new AbortController();
    const disconnect = () => { if (!res.writableEnded) controller.abort(); };
    res.once('close', disconnect);
    try {
      const tutorial = await generate(parsed.data.image, options, controller.signal);
      if (!res.destroyed) res.json({ ok: true, tutorial });
    } catch (cause) {
      if (!res.destroyed) next(cause);
    } finally { res.off('close', disconnect); }
  });
  if (staticDirectory) {
    app.use(express.static(staticDirectory));
    app.get(['/fixtures/masu', '/fixtures/boat'], (_req, res) => res.sendFile(resolve(staticDirectory, 'index.html')));
  }
  app.use((_req, res) => res.status(404).json(error('NOT_FOUND', 'Endpoint not found.')));
  const handler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
    if (err instanceof AnalysisProviderError) {
      const status: Record<GenerationError['code'], number> = {
        INVALID_REQUEST: 400, PAYLOAD_TOO_LARGE: 413, MODEL_UNAVAILABLE: 503,
        INVALID_MODEL_RESPONSE: 502, INVALID_PARAMETERS: 422, GENERATION_TIMEOUT: 504,
        NO_VALID_RECIPE: 422, NOT_FOUND: 404, INTERNAL_ERROR: 500,
      };
      res.status(status[err.error.code]).json({ ok: false, error: err.error });
      return;
    }
    const type = typeof err === 'object' && err !== null && 'type' in err ? err.type : undefined;
    if (type === 'entity.too.large') {
      res.status(413).json(error('PAYLOAD_TOO_LARGE', 'Request exceeds the 14 MiB JSON limit. Use a crop up to 10 MiB.'));
    } else if (type === 'entity.parse.failed' || type === 'charset.unsupported' || type === 'encoding.unsupported') {
      res.status(400).json(error('INVALID_REQUEST', 'Request must be valid UTF-8 JSON.'));
    } else {
      res.status(500).json(error('INTERNAL_ERROR', 'The local server could not process this request.', true));
    }
  };
  app.use(handler);
  return app;
}
