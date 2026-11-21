/** Explicit developer CLI. Images stay in memory and are sent only to loopback Ollama. */
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { cpus, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
import { createOllamaProviderFromEnv } from './ollama.js';
import { AnalysisProviderError } from './errors.js';
import { syntheticRecipe } from '../../shared/fixtures.js';
import type { LiveImage } from '../../shared/interfaces.js';

const args = process.argv.slice(2);
const cold = args[0] === '--cold';
if (cold) args.shift();
const [w, h, ...paths] = args;
const width = Number(w), height = Number(h);
try {
if (!paths.length || !Number.isInteger(width) || !Number.isInteger(height)) {
  console.error('Usage: node --import tsx src/server/providers/benchmark.ts [--cold] WIDTH HEIGHT IMAGE...');
  process.exitCode = 1;
} else {
  const provider = createOllamaProviderFromEnv();
  // Constructor validates loopback origin/model before any I/O.
  const origin = new URL(process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434').origin;
  const version = await fetch(`${origin}/api/version`, { redirect: 'error', signal: AbortSignal.timeout(5000) }).then(r => r.json()) as { version: string };
  const tags = await fetch(`${origin}/api/tags`, { redirect: 'error', signal: AbortSignal.timeout(5000) }).then(r => r.json()) as { models: { name: string; digest: string; details: unknown }[] };
  const model = tags.models.find(m => m.name === provider.model);
  console.log(JSON.stringify({ runtime: process.version, ollama: version.version, cpu: cpus()[0]?.model,
    memoryGiB: totalmem() / 1024 ** 3, model: provider.model, digest: model?.digest, details: model?.details,
    catalog: 'synthetic-hinge (development only)', cloudFallback: false }));
  if (await provider.readiness(AbortSignal.timeout(5000)) !== 'ready') {
    console.error('Selected model is not installed/running locally.'); process.exitCode = 1;
  } else for (const path of paths) {
    const mimeTypes: Record<string, LiveImage['mimeType'] | undefined> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    const mimeType = mimeTypes[extname(path).toLowerCase()];
    if (!mimeType) throw new Error('Use JPEG, PNG or WebP benchmark images.');
    const bytes = await readFile(path);
    const image: LiveImage = { mimeType, width, height, base64: bytes.toString('base64') };
    if (cold) {
      const unload = await fetch(`${origin}/api/generate`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: provider.model, keep_alive: 0, stream: false }) });
      if (!unload.ok) throw new Error('Could not unload selected model for a cold run.');
      await unload.arrayBuffer();
    }
    for (const phase of [cold ? 'cold' : 'first-unverified-temperature', 'warm']) {
      const start = performance.now();
      try {
        const result = await provider.analyze(image, [syntheticRecipe], new AbortController().signal);
        console.log(JSON.stringify({ image: basename(path), phase, wallMs: Math.round(performance.now() - start),
          objectLabel: result.objectLabel, features: result.features, parameters: result.parameters,
          approximationNotes: result.approximationNotes, schemaValid: true }));
      } catch (error) {
        console.log(JSON.stringify({ image: basename(path), phase, wallMs: Math.round(performance.now() - start),
          error: error instanceof AnalysisProviderError ? error.error.code : 'UNKNOWN_ERROR', schemaValid: false }));
        process.exitCode = 1;
      }
    }
  }
}

} catch {
  console.error("Benchmark could not complete. Check local Ollama, the selected model, and image paths/dimensions.");
  process.exitCode = 1;
}
