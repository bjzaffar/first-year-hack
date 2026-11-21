# Local photo analysis (T004)

Current integration: [T008 live generation](live-generation.md) connects the real catalog, Ollama, compiler and browser. Its API/readiness/setup details supersede the foundation-only or pending-T008 descriptions below; historical verification remains attributed to its original ticket.

The server adapter implements the shared `AnalysisProvider` interface in [ollama.ts](../src/server/providers/ollama.ts). It returns validated `ObjectAnalysis`, not geometry or instructions. Live `/api/generate` and health orchestration remain T008 work: the foundation API still reports not configured until a real compiler/catalog is integrated. No frontend changes are part of T004.

## Setup

Install Ollama from its [official macOS download](https://ollama.com/download/mac) or official platform installer. The demo target is an Apple Silicon Mac with at least 16 GB memory. Download the model before the event; local model weights take several GB and runtime memory exceeds the download size.

```sh
ollama serve
```

In a separate terminal:

```sh
ollama pull qwen3-vl:4b-instruct
ollama list
npm ci
```

No account, API key, paid provider, cloud model or automatic fallback is used. For explicit offline operation start the daemon with cloud disabled:

```sh
OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

Use the existing `.env.example` placeholders in an ignored `.env`:

```dotenv
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3-vl:4b-instruct
```

These are server-only values. `createOllamaProviderFromEnv()` reads them, defaults to 4B, and accepts only HTTP loopback origins without paths/credentials and local `qwen3-vl:4b`, `qwen3-vl:2b`, `qwen3-vl:4b-instruct` or `qwen3-vl:2b-instruct`. The tested setup explicitly selects 4B instruct: the generic 4B/2B tags currently resolve to thinking models and truncated the bounded analysis in our measurements. Defaults are retained for the original 4B baseline; set the model explicitly as shown above. The [official tag list](https://ollama.com/library/qwen3-vl/tags) distinguishes these variants. Redirects are rejected. It never downloads models or accesses hosted inference. Check the model is installed via `readiness(signal)`; an unavailable service/missing model produces `unavailable`. Readiness has a maximum five-second deadline and is not a quality/foldability check.

## Integration contract

```ts
const provider = createOllamaProviderFromEnv();
const analysis = await provider.analyze(croppedImage, trustedRecipes, requestSignal);
```

Import from `src/server/providers/ollama.ts`; shared interfaces and schemas stay unchanged. T008 must supply the real catalog, combine request cancellation, normalize errors and call the compiler before returning any tutorial. The adapter consumes the merged synthetic catalog solely for development until T003 publishes real recipe domains. Do not treat successful synthetic-catalog inference as a valid origami design.

Each request uses [Ollama chat](https://docs.ollama.com/api/chat), base64 image input, `stream: false`, `think: false` (requested, but thinking-only variants may still reason; use the measured explicit instruct variant), a catalog-specific JSON Schema in `format`, temperature zero, 4096-token context and a 768-token output cap. The schema is also included in the prompt, following [structured output guidance](https://docs.ollama.com/capabilities/structured-outputs). Catalog summary includes IDs, versions, parameter bounds, synthetic flags and limitations, never executable formulas. The model cannot select a recipe absent from the passed catalog or invent fold actions. JSON output is parsed and validated again in code, including the selected catalog's narrower bounds. Out-of-range values are rejected, not silently clamped.

Images must satisfy the merged request schema: JPEG/PNG/WebP, canonical raw base64, ≤10 MiB decoded bytes, declared dimensions 1–1024. [Image validation](../src/server/providers/image.ts) checks file signatures and encoded dimensions against those declarations before contacting Ollama. This header inspection is not full codec validation/sanitization; Ollama's decoder can still reject corrupted content. No image URLs, file paths or data URLs are accepted by the adapter. It performs no file writes, image/prompt logging, browser persistence or tutorial generation. Model prose remains untrusted display text; never render it as HTML or execute it.

The 60-second deadline covers network connection, response headers, complete body and parsing; the caller may cancel sooner. Readiness uses at most five seconds. Responses are limited to 64 KiB, analysis text to 32 KiB; incomplete generation, wrong model identity, unsupported fields/actions, non-finite numbers, invalid JSON and tool calls are rejected. There is no automatic retry, cache, partial success, alternate model or hosted fallback.

`AnalysisProviderError.error` is a schema-validated safe `GenerationError`:

| Code | Cause / action |
| --- | --- |
| INVALID_REQUEST | Invalid image envelope/signature/dimensions; fix crop |
| NO_VALID_RECIPE | Empty catalog; integration must provide a supported recipe |
| INVALID_PARAMETERS | Invalid trusted catalog or model parameter outside catalog bounds |
| MODEL_UNAVAILABLE | Service stopped, selected model missing, failed local inference or network interruption; start/pull/check memory |
| INVALID_MODEL_RESPONSE | Malformed, incomplete, oversized or schema-incompatible output; retry clearer crop |
| GENERATION_TIMEOUT | Deadline or caller cancellation; retry when ready |

Errors never include the input payload, raw model response, original network exception/cause or prompt. T008 owns HTTP mappings, including cancellation semantics. Only readiness deliberately reduces all failures to unavailable.

## Repeatable live benchmark

Use non-sensitive local object photos cropped/resized to known matching dimensions. Benchmark files remain outside the repository. The explicit CLI prints only filenames, model metadata, timing, validated analysis and safe error codes; do not publish private labels/photos in benchmark reports.

```sh
node --env-file-if-exists=.env --import tsx src/server/providers/benchmark.ts --cold 512 512 /absolute/path/crop.jpg
```

Pass multiple same-dimension files after WIDTH HEIGHT to evaluate varied objects. `--cold` explicitly unloads the selected model before each file, then runs cold and warm requests. Use an isolated Ollama instance when other sessions share the model, because unloading affects them. Without `--cold`, the first request is labelled unverified temperature. A warm retry after a cold timeout may still be affected by previous loading; record failures honestly. The CLI exits nonzero if any request fails validation or times out. Neither a fast request nor a schema-valid result proves quality, geometric feasibility or end-to-end tutorial readiness.

The benchmark started with the requested `qwen3-vl:4b` baseline, then evaluated 2B when it missed the target. Both generic tags failed bounded-output validation. The explicit 4B instruct variant is the measured working configuration, with no automatic switch at runtime. To reproduce the 2B comparison on the same inputs:

```sh
ollama pull qwen3-vl:2b
OLLAMA_MODEL=qwen3-vl:2b node --env-file-if-exists=.env --import tsx src/server/providers/benchmark.ts --cold 512 512 /absolute/path/crop.jpg
```

Compare object labels, shape/aspect ratio, approximation honesty and schema validity as well as latency. Record results in [the benchmark report](ollama-benchmark.md). Do not automatically change the default or claim the PRD's 30-second end-to-end target from provider-only timing.

## Offline check and tests

After installing npm dependencies, Ollama and weights, inference requires only the loopback service. The adapter has no external URL option and redirects fail. Keep `OLLAMA_NO_CLOUD=1`; do not invoke `ollama pull` during offline testing. Re-run the benchmark with external network access disabled and record how it was disabled. Unit tests are deterministic and require neither model downloads nor external network:

```sh
npm run typecheck
npm test
npm run build
python3 scripts/check_template.py
```

Tests cover structured request shape, narrowed bounds, invalid catalogs/output/operations, malformed/oversized response, missing model, service errors, deadlines through body reading, caller cancellation, readiness, input validation and no sensitive logs. Local HTTP tests may need loopback access in restricted sandboxes.
