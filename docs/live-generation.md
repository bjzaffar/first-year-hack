# Live photo generation (T008)

Issue [#8](https://github.com/bjzaffar/first-year-hack/issues/8) joins the merged T004 provider, T005 compiler, T006 player and T007 crop UI. The browser submits only its confirmed, resized crop to the loopback Express API. Original/cropped photos and tutorials remain in session/request memory. No image or provider-payload logging, storage, cloud fallback or background model download is added.

## Contracts and pipeline

The existing version 1 request and error envelopes remain unchanged. `src/shared/generation.ts` exports `GenerationResponseSchema`, the additive response union accepting original synthetic v1 tutorials and the existing real `masu-1` tutorial schema. The original `GenerateResponseSchema` in `schemas.ts` remains the legacy fixture-only parser. New consumers must use `GenerationResponseSchema`; the live browser additionally rejects synthetic/legacy success responses.

`src/shared/live-analysis.ts` defines strict real analysis and model-facing catalog records. `masuCompiler.recipes` publishes the implemented `masu-box` version 0.1.0 with its authored [0.06, 0.16] wall-height bounds. The generic `AnalysisProvider<Recipe, Analysis>` preserves synthetic defaults; the Ollama adapter overload accepts either explicit catalog. It never receives executable formulas or asks the model for fold sequences. The prompt explains the parameter's physical meaning and asks for photo-dependent proportions and honest simplifications.

`src/server/generation.ts` validates encoded image signatures and declared dimensions before analysis; independently revalidates provider output; compiles trusted actions; and validates the complete tutorial, including its authored geometry, before success. Invalid proposals are rejected rather than silently clamped. The result includes the recognized object label, model notes, fixed recipe limitations and an additional weak-match warning for non-containers. The crop shown beside the preview is the exact crop sent. All rendering, text and highlights consume that one returned tutorial.

A server deadline of 60 seconds covers analysis, compilation and validation. Deadline/cancellation races also terminate the HTTP request if an adapter ignores its signal; checks after synchronous compilation prevent late success. Disconnecting the HTTP client aborts provider work. The browser has a 65-second transport guard, cancels on leaving generation/unmount, ignores obsolete results and retains its source/crop for retry. No invented processing percentages or stage events are displayed.

## API outcomes

| HTTP | Error code | Meaning |
| --- | --- | --- |
| 400 | INVALID_REQUEST | Invalid envelope, encoded image metadata or JSON |
| 413 | PAYLOAD_TOO_LARGE | More than 14 MiB JSON; crop limit is 10 MiB and 1024 pixels per side |
| 422 | INVALID_PARAMETERS / NO_VALID_RECIPE | Unsupported proportions or no supported recipe |
| 502 | INVALID_MODEL_RESPONSE | Invalid, unknown or incomplete analysis |
| 503 | MODEL_UNAVAILABLE | Local service/model missing or unavailable |
| 504 | GENERATION_TIMEOUT | Generation deadline or cancellation |
| 500 | INTERNAL_ERROR | Unexpected compiler/server failure; no raw exception echoed |

`GET /api/health` checks the exact configured installed model with a bounded local request. Compiler reports `ready`; model reports `ready` or `unavailable` (`not_configured` for an explicitly absent injected provider). `generationReady` is true only when both dependencies are ready. Readiness is not an inference or physical-foldability guarantee.

Encoded headers are checked at the server boundary; full codec decoding remains with Ollama. This is not an image sanitizer. Local binding and no CORS remain unchanged; this is a laptop demo, not a public hosting security boundary.

## Testing locally

Follow [README](../README.md) to start Ollama and the app. The measured working configuration explicitly sets `OLLAMA_MODEL=qwen3-vl:4b-instruct`; generic 4B remains the adapter default for compatibility. Set `OLLAMA_URL` if the daemon uses a nondefault loopback port. No new packages or migrations are required.

1. Upload a photo, move/resize the crop, confirm and generate. Compare the returned photograph and simplifications with the box preview.
2. Return to crop: the source and selection remain. Generate again; accept, inspect materials, and traverse all nine steps. Back/Replay restores saved recipe states without accumulated transforms.
3. Try a shallow object and a taller object. Inspect the model's chosen proportions; the single supported family has a square footprint and cannot represent handles, wheels or decoration. Try a complex object and check the weak-match explanation.
4. Stop your own Ollama daemon, generate and retry: expect an actionable error with the same crop retained. Restart and retry. Cancel during generation and confirm the old request cannot overwrite the upload screen.
5. If WebGL fails, preview falls back to a final-geometry SVG; tutorial diagrams and navigation remain available, with an explicit playback failure message and Replay retry. No successful animation is claimed.
6. Use `/fixtures/masu` for a clearly labelled fixed sample without submitting a photo. It works in both development and built-server mode.

## Verification evidence (2026-11-21)

Local Node 26.13.0 / npm 11.20.0: dependency install, strict typecheck, all 149 tests, production build, Markdown-link and whitespace checks passed. The test suite includes real loopback HTTP requests with controlled provider failures, exact live catalog/geometry consistency, malformed provider/compiler output, invalid image metadata, 60-second policy with shortened test deadlines, disconnect cancellation, crop-preserving rejection/retry, stale-response suppression, fixture rejection, nine-step completion and Back/Replay. GPU behavior is separately covered by the existing renderer/motion tests with mocked GPU calls. Build emits the existing large-bundle advisory; no build error.

Actual local API requests used Apple M1 / 16 GiB, Ollama 0.40.17, `qwen3-vl:4b-instruct`, predownloaded weights and the public 512×512 JPEGs documented in [T004 benchmark](ollama-benchmark.md). No photos or response payloads were committed.

| Photo | API elapsed seconds | wallHeightFraction | Result |
| --- | ---: | ---: | --- |
| Coffee | 23.323 | 0.10 | Complete nine-step cup approximation |
| Plant | 24.026 | 0.10 | Complete nine-step planter approximation |
| Bicycle | 26.849 | 0.08 | Complete nine-step weak match, explicit wheels/handlebar omissions |

These requests demonstrate actual photo-dependent geometry and are below 30 seconds on these samples. They include model loading/queue effects and are not isolated warm benchmarks. The two container images selecting the same parameter is not evidence of exact visual fitting. Model-generated claims about colour are not reproduced in the paper material. Wider image coverage and physical folding remain unverified; no universal latency or fidelity guarantee is implied.


## Owner-authorized boat addition

The owner requested exactly one additional recipe: a basic boat/kayak. `basic-boat` / `boat-1` is an original four-step pointed V-hull from one square sheet, with `hullWidthFraction` in [0.24, 0.30]. See [construction and checks](recipes/basic-boat.md). `liveCompiler.recipes` now passes both registered recipes to Ollama; its structured output can select either. Box containers remain on the box recipe; boat/kayak images and elongated silhouettes can select the V hull. This is not arbitrary object reconstruction, and adding the boat does not add cube support.

`LiveTutorialSchema` and the HTTP success union validate either complete recipe. The renderer dispatches to the selected recipe's rigid-motion sampler; the preview and guide retain the same final state. `/fixtures/boat` provides an explicitly labelled, offline boat walkthrough. The source photo remains unchanged and no sample is substituted for live errors.

Boat tests cover three parameter values and 21 samples of every fold: complete unit-square area, every face's pairwise distances, shared-vertex continuity, finite coordinates, visible volume, slender pointed proportions, final-state equality, deterministic playback, invalid parameters/output, and provider-to-compiler recipe selection. These are digital checks; paper folding, shape retention and flotation remain unverified.
