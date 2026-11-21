import { afterEach, describe, expect, it, vi } from 'vitest';
import { OllamaAnalysisProvider, createOllamaProviderFromEnv } from '../src/server/providers/ollama.js';
import { AnalysisProviderError } from '../src/server/providers/errors.js';
import { validateImage } from '../src/server/providers/image.js';
import { syntheticAnalysis, syntheticRecipe } from '../src/shared/fixtures.js';
import type { LiveImage } from '../src/shared/interfaces.js';

const image: LiveImage = { mimeType: 'image/png', width: 1, height: 1,
  base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC' };
const signal = () => new AbortController().signal;
const envelope = (analysis: unknown = syntheticAnalysis) => ({ model: 'qwen3-vl:4b', done: true, message: { role: 'assistant', content: JSON.stringify(analysis) } });
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
function setup(value: unknown = envelope(), status = 200, timeoutMs = 60_000) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(response(value, status));
  return { request, provider: new OllamaAnalysisProvider({ fetch: request, timeoutMs }) };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Ollama AnalysisProvider', () => {
  it('sends a local non-streaming vision request with catalog-specific schema and no tools', async () => {
    const { provider, request } = setup();
    const recipe = structuredClone(syntheticRecipe);
    recipe.parameterBounds.angleDegrees = { min: 40, max: 50 };
    const result = await provider.analyze(image, [recipe], signal());
    expect(result.parameters.angleDegrees).toBe(45);
    expect(result.approximationNotes.at(-1)).toContain('synthetic');
    const [url, init] = request.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:11434/api/chat');
    expect(init?.redirect).toBe('error');
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({ model: 'qwen3-vl:4b', stream: false, think: false, options: { temperature: 0 } });
    expect(body.messages[1].images).toEqual([image.base64]);
    expect(body.format.properties.recipeId.const).toBe(recipe.id);
    expect(body.format.properties.parameters.properties.angleDegrees).toMatchObject({ minimum: 40, maximum: 50 });
    expect(body.format.additionalProperties).toBe(false);
    expect(body.tools).toBeUndefined();
    expect(recipe).toEqual({ ...syntheticRecipe, parameterBounds: { angleDegrees: { min: 40, max: 50 } } });
  });
  it('accepts an explicitly configured instruct model without fallback', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response({ ...envelope(), model: 'qwen3-vl:4b-instruct' }));
    const provider = new OllamaAnalysisProvider({ model: 'qwen3-vl:4b-instruct', fetch: request });
    expect((await provider.analyze(image, [syntheticRecipe], signal())).recipeId).toBe('synthetic-hinge');
    expect(JSON.parse(request.mock.calls[0][1]?.body as string).model).toBe('qwen3-vl:4b-instruct');
  });
  it('refuses empty, duplicate or invalid trusted catalogs before inference', async () => {
    const { provider, request } = setup();
    await expect(provider.analyze(image, [], signal())).rejects.toMatchObject({ error: { code: 'NO_VALID_RECIPE' } });
    await expect(provider.analyze(image, [syntheticRecipe, syntheticRecipe], signal())).rejects.toMatchObject({ error: { code: 'INVALID_PARAMETERS' } });
    const bad = structuredClone(syntheticRecipe); bad.parameterBounds.angleDegrees.min = 80;
    await expect(provider.analyze(image, [bad], signal())).rejects.toMatchObject({ error: { code: 'INVALID_PARAMETERS' } });
    expect(request).not.toHaveBeenCalled();
  });
  it.each([
    { ...syntheticAnalysis, recipeId: 'invented' },
    { ...syntheticAnalysis, parameters: { angleDegrees: 100 } },
    { ...syntheticAnalysis, parameters: { angleDegrees: '45' } },
    { ...syntheticAnalysis, parameters: { angleDegrees: 45, code: 'run()' } },
    { ...syntheticAnalysis, actions: ['sink'] },
    { ...syntheticAnalysis, features: { aspectRatio: 0, shape: 'other' } },
    { ...syntheticAnalysis, approximationNotes: [] },
  ])('rejects unsupported/malformed analysis %#', async proposed => {
    const { provider } = setup(envelope(proposed));
    await expect(provider.analyze(image, [syntheticRecipe], signal())).rejects.toMatchObject({ error: { code: 'INVALID_MODEL_RESPONSE' } });
  });
  it('rejects finite values outside the passed recipe domain without clamping', async () => {
    const { provider } = setup();
    const r = structuredClone(syntheticRecipe); r.parameterBounds.angleDegrees.max = 40;
    await expect(provider.analyze(image, [r], signal())).rejects.toMatchObject({ error: { code: 'INVALID_PARAMETERS' } });
  });
  it.each([
    { ...envelope(), done: false },
    { ...envelope(), done_reason: 'length' },
    { ...envelope(), model: 'other-model' },
    { ...envelope(), message: { role: 'assistant', content: '```json\n{}\n```' } },
    { ...envelope(), message: { role: 'assistant', content: '{}', tool_calls: [{ function: 'run' }] } },
    { ...envelope(), message: { role: 'assistant', content: JSON.stringify(syntheticAnalysis).replace('45', '1e999') } },
  ])('rejects invalid/truncated/tool-call envelope %#', async value => {
    const { provider } = setup(value);
    await expect(provider.analyze(image, [syntheticRecipe], signal())).rejects.toMatchObject({ error: { code: 'INVALID_MODEL_RESPONSE' } });
  });
  it('normalizes malformed JSON and limits response bytes', async () => {
    for (const text of ['not json', 'x'.repeat(65 * 1024)]) {
      const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(text));
      const provider = new OllamaAnalysisProvider({ fetch: request });
      await expect(provider.analyze(image, [syntheticRecipe], signal())).rejects.toMatchObject({ error: { code: 'INVALID_MODEL_RESPONSE' } });
    }
  });
  it.each([404, 500, 503])('normalizes model/service HTTP %s without exposing response text', async status => {
    const { provider } = setup({ error: 'private image content' }, status);
    try { await provider.analyze(image, [syntheticRecipe], signal()); throw new Error('Expected error'); }
    catch (e) {
      expect(e).toBeInstanceOf(AnalysisProviderError);
      expect((e as AnalysisProviderError).error.code).toBe('MODEL_UNAVAILABLE');
      expect(JSON.stringify((e as AnalysisProviderError).error)).not.toContain('private');
    }
  });
  it('normalizes network exceptions and never logs image/prompt/model output', async () => {
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'error'), vi.spyOn(console, 'warn')];
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error(image.base64));
    const provider = new OllamaAnalysisProvider({ fetch: request });
    try { await provider.analyze(image, [syntheticRecipe], signal()); }
    catch (e) {
      expect((e as AnalysisProviderError).error.code).toBe('MODEL_UNAVAILABLE');
      expect(String(e)).not.toContain(image.base64);
      expect((e as Error).cause).toBeUndefined();
    }
    logs.forEach(log => expect(log).not.toHaveBeenCalled());
  });
  it('times out a stalled request and supports caller cancellation', async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init!.signal!.addEventListener('abort', () => reject(new Error('raw payload')), { once: true });
    }));
    const provider = new OllamaAnalysisProvider({ fetch: request, timeoutMs: 100 });
    const assertion = expect(provider.analyze(image, [syntheticRecipe], signal())).rejects.toMatchObject({ error: { code: 'GENERATION_TIMEOUT' } });
    await vi.advanceTimersByTimeAsync(101); await assertion;
    const caller = new AbortController();
    const cancelled = expect(provider.analyze(image, [syntheticRecipe], caller.signal)).rejects.toMatchObject({ error: { code: 'GENERATION_TIMEOUT', message: expect.stringContaining('cancelled') } });
    caller.abort(); await cancelled;
    const preCancelled = new AbortController(); preCancelled.abort(); request.mockClear();
    await expect(provider.analyze(image, [syntheticRecipe], preCancelled.signal)).rejects.toMatchObject({ error: { code: 'GENERATION_TIMEOUT' } });
    expect(request).not.toHaveBeenCalled();
  });
  it('keeps the deadline active while reading a stalled response body', async () => {
    vi.useFakeTimers();
    const request = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => new Response(new ReadableStream({
      start(controller) { init!.signal!.addEventListener('abort', () => controller.error(new Error('abort'))); },
    })));
    const provider = new OllamaAnalysisProvider({ fetch: request, timeoutMs: 100 });
    const assertion = expect(provider.analyze(image, [syntheticRecipe], signal())).rejects.toMatchObject({ error: { code: 'GENERATION_TIMEOUT' } });
    await vi.advanceTimersByTimeAsync(101); await assertion;
  });
  it('reports ready only when the exact selected model is installed', async () => {
    for (const [models, expected] of [[[{ name: 'qwen3-vl:4b' }], 'ready'], [[{ name: 'qwen3-vl:2b' }], 'unavailable'], [[], 'unavailable']] as const) {
      const { provider, request } = setup({ models });
      expect(await provider.readiness(signal())).toBe(expected);
      expect(request.mock.calls[0][0]).toBe('http://127.0.0.1:11434/api/tags');
    }
    const { provider } = setup({}, 503);
    expect(await provider.readiness(signal())).toBe('unavailable');
  });
  it('returns unavailable for readiness network failure or timeout', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    expect(await new OllamaAnalysisProvider({ fetch: request }).readiness(signal())).toBe('unavailable');
    vi.useFakeTimers();
    request.mockImplementation((_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('abort')))));
    const result = new OllamaAnalysisProvider({ fetch: request }).readiness(signal());
    await vi.advanceTimersByTimeAsync(5001); expect(await result).toBe('unavailable');
  });
  it('requires explicit local model selection and rejects remote origins/cloud/redirects', () => {
    expect(createOllamaProviderFromEnv({}).model).toBe('qwen3-vl:4b');
    expect(createOllamaProviderFromEnv({ OLLAMA_MODEL: 'qwen3-vl:2b' }).model).toBe('qwen3-vl:2b');
    expect(createOllamaProviderFromEnv({ OLLAMA_MODEL: 'qwen3-vl:4b-instruct' }).model).toBe('qwen3-vl:4b-instruct');
    for (const baseUrl of ['https://ollama.com', 'http://example.com', 'http://user:pass@127.0.0.1', 'http://127.0.0.1/api', 'http://127.0.0.1?x=1']) expect(() => new OllamaAnalysisProvider({ baseUrl })).toThrow();
    for (const timeoutMs of [0, -1, 60001, NaN]) expect(() => new OllamaAnalysisProvider({ timeoutMs })).toThrow();
    expect(() => createOllamaProviderFromEnv({ OLLAMA_MODEL: 'qwen3-vl:cloud' })).toThrow();
  });
});

describe('encoded crop validation', () => {
  it('accepts a PNG with matching file dimensions', () => expect(validateImage(image)).toEqual(image));
  it('accepts a JPEG with matching encoded dimensions', () => {
    const jpeg: LiveImage = { ...image, mimeType: 'image/jpeg', base64: '/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwUDAwMFBgUFBQUGCAYGBgYGCAoICAgICAgKCgoKCgoKCgwMDAwMDA4ODg4ODw8PDw8PDw8PD//bAEMBAgICBAQEBwQEBxALCQsQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEP/dAAQAAf/aAAwDAQACEQMRAD8A/fyiiigD/9k=' };
    expect(validateImage(jpeg)).toEqual(jpeg);
    expect(() => validateImage({ ...jpeg, width: 2 })).toThrow(AnalysisProviderError);
  });
  it('accepts encoded WebP dimensions and rejects a truncated RIFF payload', () => {
    const webp: LiveImage = { ...image, mimeType: 'image/webp', base64: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA' };
    expect(validateImage(webp)).toEqual(webp);
    expect(() => validateImage({ ...webp, base64: webp.base64.slice(0,-4) })).toThrow(AnalysisProviderError);
    expect(() => validateImage({ ...webp, width: 2 })).toThrow(AnalysisProviderError);
  });
  it.each([
    { ...image, width: 2 }, { ...image, height: 1025 }, { ...image, mimeType: 'image/jpeg' },
    { ...image, base64: 'iVBORw==' }, { ...image, base64: 'not-base64' },
    { ...image, base64: image.base64.slice(0, -4) },
  ])('rejects malformed or mismatched crop %# before network', async bad => {
    const { provider, request } = setup();
    await expect(provider.analyze(bad as LiveImage, [syntheticRecipe], signal())).rejects.toMatchObject({ error: { code: 'INVALID_REQUEST' } });
    expect(request).not.toHaveBeenCalled();
  });
});
