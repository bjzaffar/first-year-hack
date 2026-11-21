import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../src/server/app.js';
import { GenerateResponseSchema, HealthSchema } from '../src/shared/schemas.js';
import { port } from '../src/server/config.js';

let server: Server, base: string;
beforeAll(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No TCP address');
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { if (!server?.listening) return; await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); });
const post = (body: unknown) => fetch(`${base}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
describe('local HTTP boundary', () => {
  it('reports backend availability separately from live readiness', async () => {
    const r = await fetch(`${base}/api/health`);
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(HealthSchema.parse(await r.json()).generationReady).toBe(false);
  });
  it('returns a synthetic fixture only when explicitly requested', async () => {
    const r = await post({ contractVersion: '1', mode: 'fixture' });
    expect(r.status).toBe(200);
    const value = GenerateResponseSchema.parse(await r.json());
    expect(value.ok && value.tutorial.synthetic).toBe(true);
  });
  it('does not substitute a fixture for live generation', async () => {
    const r = await post({ contractVersion: '1', mode: 'live', image: { mimeType: 'image/png', base64: 'iVBORw==', width: 1, height: 1 } });
    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({ ok: false, error: { code: 'MODEL_UNAVAILABLE' } });
  });
  it('rejects missing mode, invalid crop dimensions and unknown fields', async () => {
    for (const body of [{}, { contractVersion: '1', mode: 'fixture', image: 'unexpected' },
      { contractVersion: '1', mode: 'live', image: { mimeType: 'image/png', base64: 'iVBORw==', width: 1025, height: 1 } }]) {
      const r = await post(body); expect(r.status).toBe(400);
      expect(await r.json()).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    }
  });
  it('normalizes malformed JSON and oversized bodies without echoing payloads', async () => {
    const r = await fetch(`${base}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{secret' });
    expect(r.status).toBe(400); expect(JSON.stringify(await r.json())).not.toContain('secret');
    const large = await post({ data: 'x'.repeat(14 * 1024 * 1024) });
    expect(large.status).toBe(413);
    expect(await large.json()).toMatchObject({ ok: false, error: { code: 'PAYLOAD_TOO_LARGE' } });
  });
  it('returns a structured unknown-route error', async () => {
    const r = await fetch(`${base}/api/unknown`);
    expect(r.status).toBe(404);
    expect(GenerateResponseSchema.parse(await r.json()).ok).toBe(false);
  });
  it('validates configurable ports', () => {
    expect(port(undefined, 3001)).toBe(3001); expect(port('5301', 3001)).toBe(5301);
    for (const bad of ['0', '-1', '65536', '3.5', 'oops', '']) expect(() => port(bad, 3001)).toThrow();
  });
});
