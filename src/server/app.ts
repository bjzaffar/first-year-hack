import express, { type ErrorRequestHandler } from 'express';
import { GenerateRequestSchema, GenerateResponseSchema, HealthSchema, type GenerationError } from '../shared/schemas.js';
import { syntheticTutorial, unavailableError } from '../shared/fixtures.js';

export function createApp(staticDirectory?: string) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  // No request logging, uploads, disk persistence, or model calls in this foundation.
  app.use(express.json({ limit: '14mb', strict: true }));
  const error = (code: GenerationError['code'], message: string, retryable = false) =>
    GenerateResponseSchema.parse({ ok: false, error: { contractVersion: '1', code, message, retryable } });
  app.get('/api/health', (_req, res) => res.json(HealthSchema.parse({
    contractVersion: '1', backend: 'ready', model: 'not_configured', compiler: 'not_configured',
    generationReady: false, fixtureAvailable: true,
  })));
  app.post('/api/generate', (req, res) => {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(error('INVALID_REQUEST', 'Send a version 1 fixture request or a JPEG, PNG, or WebP crop up to 10 MiB and 1024 pixels per side.'));
      return;
    }
    if (parsed.data.mode === 'fixture') {
      res.json(GenerateResponseSchema.parse({ ok: true, tutorial: structuredClone(syntheticTutorial) }));
      return;
    }
    res.status(503).json(GenerateResponseSchema.parse({ ok: false, error: unavailableError }));
  });
  if (staticDirectory) app.use(express.static(staticDirectory));
  app.use((_req, res) => res.status(404).json(error('NOT_FOUND', 'Endpoint not found.')));
  const handler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
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
