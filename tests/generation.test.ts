import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../src/server/app.js';
import { generate, type GenerationOptions, type LiveProvider } from '../src/server/generation.js';
import { AnalysisProviderError } from '../src/server/providers/errors.js';
import { OllamaAnalysisProvider } from '../src/server/providers/ollama.js';
import { GenerationResponseSchema } from '../src/shared/generation.js';
import { HealthSchema } from '../src/shared/schemas.js';
import { compileMasu, finalState, masuCompiler } from '../src/geometry/compiler.js';
import { liveCompiler } from '../src/geometry/live-compiler.js';
import type { LiveAnalysis } from '../src/shared/live-analysis.js';
import type { LiveImage } from '../src/shared/interfaces.js';

const image: LiveImage = { mimeType: 'image/png', width: 1, height: 1,
  base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC' };
const analysis = (h = 0.1): LiveAnalysis => ({ contractVersion: '1', recipeId: 'masu-box',
  parameters: { wallHeightFraction: h }, objectLabel: 'Tray', features: { aspectRatio: 2, shape: 'container' },
  approximationNotes: ['Approximated as a square open container.'] });
const provider = (h = 0.1): LiveProvider => ({ readiness: async () => 'ready', analyze: vi.fn(async () => analysis(h)) });
const servers: Server[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(s => new Promise<void>(resolve => s.close(() => resolve())))); });
async function start(options: GenerationOptions) {
  const server = createApp(undefined, options).listen(0, '127.0.0.1'); servers.push(server);
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
  const base = `http://127.0.0.1:${address.port}`;
  return { base, post: (value: unknown = image, signal?: AbortSignal) => fetch(`${base}/api/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractVersion: '1', mode: 'live', image: value }), signal,
  }) };
}

describe('live photo-to-tutorial boundary', () => {
  it('compiles the real catalog through HTTP and preserves the generated instance', async () => {
    const p = provider(0.06), { base, post } = await start({ provider: p });
    expect(HealthSchema.parse(await (await fetch(`${base}/api/health`)).json()).generationReady).toBe(true);
    const response = await post(); expect(response.status).toBe(200);
    const value = GenerationResponseSchema.parse(await response.json());
    expect(value.ok).toBe(true);
    if (!value.ok || value.tutorial.contractVersion !== 'masu-1') throw new Error('Expected live');
    expect(p.analyze).toHaveBeenCalledWith(image, liveCompiler.recipes, expect.any(AbortSignal));
    expect(value.tutorial.synthetic).toBe(false);
    expect(value.tutorial.parameters.wallHeightFraction).toBe(0.06);
    expect(value.tutorial.approximationNotes).toContain('Photo interpretation: Tray.');
    expect(finalState(value.tutorial)).toEqual(value.tutorial.states.at(-1));
    expect(value.tutorial.steps).toHaveLength(9);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('produces different geometry and matching instructions for different valid proportions', async () => {
    const a = await generate(image, { provider: provider(0.06) }, new AbortController().signal);
    const b = await generate(image, { provider: provider(0.16) }, new AbortController().signal);
    expect(finalState(a)).not.toEqual(finalState(b));
    expect(a.steps[4].instruction).not.toEqual(b.steps[4].instruction);
  });
  it('adds unavoidable weak-match disclosure for a non-container', async () => {
    const p = provider(); p.analyze = async () => ({ ...analysis(), objectLabel: 'Bicycle', features: { shape: 'elongated', aspectRatio: 2 } });
    const tutorial = await generate(image, { provider: p }, new AbortController().signal);
    expect(tutorial.approximationNotes.some(n => n.startsWith('Weak match:'))).toBe(true);
  });
  it.each([
    ['MODEL_UNAVAILABLE', 503], ['INVALID_MODEL_RESPONSE', 502], ['INVALID_PARAMETERS', 422],
    ['NO_VALID_RECIPE', 422], ['GENERATION_TIMEOUT', 504],
  ] as const)('returns %s without a partial tutorial', async (code, status) => {
    const p = provider(); p.analyze = async () => { throw new AnalysisProviderError(code, 'Safe explanation.', true); };
    const { post } = await start({ provider: p }); const response = await post();
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ ok: false, error: { contractVersion: '1', code, message: 'Safe explanation.', retryable: true } });
  });
  it('rejects invalid image content before calling the provider', async () => {
    const p = provider(), { post } = await start({ provider: p });
    for (const invalid of [{ ...image, base64: 'iVBORw==' }, { ...image, width: 2 }, { ...image, mimeType: 'image/jpeg' }]) {
      expect((await post(invalid)).status).toBe(400);
    }
    expect(p.analyze).not.toHaveBeenCalled();
  });
  it('revalidates provider output and compiler output and never echoes exceptions', async () => {
    const p = provider(); p.analyze = vi.fn().mockResolvedValue({ ...analysis(), recipeId: 'invented' });
    const invalidAnalysis = await start({ provider: p }); expect((await invalidAnalysis.post()).status).toBe(502);
    const compile = vi.fn().mockReturnValue({ ...compileMasu({ recipeId: 'masu-box', parameters: { wallHeightFraction: 0.1 }, objectLabel: 'Tray', approximationNotes: ['Test'] }), states: [] });
    const invalidCompiler = await start({ provider: provider(), compile });
    expect((await invalidCompiler.post()).status).toBe(500);
    const logs = [vi.spyOn(console, 'error'), vi.spyOn(console, 'log')];
    try {
      p.analyze = async () => { throw new Error(`secret ${image.base64}`); };
      const r = await invalidAnalysis.post(); const body = JSON.stringify(await r.json());
      expect(r.status).toBe(500); expect(body).not.toContain('secret'); expect(body).not.toContain(image.base64);
      logs.forEach(log => expect(log).not.toHaveBeenCalled());
    } finally { logs.forEach(log => log.mockRestore()); }
  });
  it('enforces the deadline even if the provider ignores cancellation', async () => {
    const p = provider(); let signal: AbortSignal | undefined;
    p.analyze = async (_image, _recipes, s) => { signal = s; return new Promise(() => {}); };
    const { post } = await start({ provider: p, timeoutMs: 20 });
    const response = await post(); expect(response.status).toBe(504); expect(signal?.aborted).toBe(true);
  });
  it('cancels model work when the HTTP client disconnects', async () => {
    let entered!: () => void, aborted!: () => void;
    const called = new Promise<void>(r => { entered = r; }), cancelled = new Promise<void>(r => { aborted = r; });
    const p = provider(); p.analyze = async (_image, _recipes, signal) => {
      entered(); signal.addEventListener('abort', aborted, { once: true }); return new Promise(() => {});
    };
    const { post } = await start({ provider: p }); const caller = new AbortController();
    const pending = post(image, caller.signal).catch(() => undefined);
    await called; caller.abort(); await pending; await cancelled;
  });
});

describe('real Ollama catalog adaptation', () => {
  it('passes only the implemented box domain and validates its response', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ model: 'qwen3-vl:4b', done: true, message: { role: 'assistant', content: JSON.stringify(analysis(0.16)) } })));
    const adapter = new OllamaAnalysisProvider({ fetch: request });
    expect(await adapter.analyze(image, masuCompiler.recipes, new AbortController().signal)).toEqual(analysis(0.16));
    const body = JSON.parse(request.mock.calls[0][1]?.body as string);
    expect(body.format.properties.recipeId.const).toBe('masu-box');
    expect(body.format.properties.parameters.properties.wallHeightFraction).toMatchObject({ minimum: 0.06, maximum: 0.16 });
    expect(body.messages[1].content).not.toContain('synthetic-hinge');
  });
  it('rejects out-of-domain box parameters without clamping', async () => {
    const adapter = new OllamaAnalysisProvider({ fetch: async () => new Response(JSON.stringify({ model: 'qwen3-vl:4b', done: true, message: { role: 'assistant', content: JSON.stringify(analysis(0.2)) } })) });
    await expect(adapter.analyze(image, masuCompiler.recipes, new AbortController().signal)).rejects.toMatchObject({ error: { code: 'INVALID_PARAMETERS' } });
  });
});
