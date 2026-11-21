# Local vision benchmark — T004

Measured 2026-11-21 on this demo Mac: **Apple M1, 16 GiB unified memory**, Node 26.13.0, Ollama 0.40.17. Ollama used Metal; 4B instruct used the llama.cpp runner. Services bound 127.0.0.1:43174, cloud disabled. Only original/public test inputs were used; no private user photos or image bytes are tracked.

## Method and limits

The adapter ran against the merged `synthetic-hinge` catalog and its 15–75 degree parameter domain. This validates local vision transport, catalog constraints and structured analysis, not a real origami recipe. Each photo is a 512×512 JPEG crop. One cold request (selected model explicitly unloaded first), then one immediate warm repeat of the same photo. Cold is a model-unloaded run, not a reboot or empty filesystem cache; warm benefits from prompt/image caching. Other applications were running. These are individual observations, not a statistically robust benchmark.

Reproduce with the CLI in [local model setup](ollama.md), for example:

```sh
OLLAMA_URL=http://127.0.0.1:43174 OLLAMA_MODEL=qwen3-vl:4b-instruct node --import tsx src/server/providers/benchmark.ts --cold 512 512 /tmp/foldlens-benchmark-images/coffee.jpg /tmp/foldlens-benchmark-images/plant.jpg /tmp/foldlens-benchmark-images/bicycle.jpg
```

Public sample URLs (downloaded only into /tmp, not redistributed): [coffee](https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=512&h=512&fit=crop&fm=jpg), [plant](https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=512&h=512&fit=crop&fm=jpg), [bicycle](https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=512&h=512&fit=crop&fm=jpg). Coffee is a deliberately cluttered scene containing several cups and plants; plant/bicycle are clearer primary objects. All images were visually inspected before comparing recognition.

## Requested generic 4B baseline and 2B comparison

Started with `qwen3-vl:4b`, digest `a1b29c246319cdcb1f3842f36d29f198f737c0cf516ba1bcba34b1b974e87980`, Q4_K_M, 4.0B. The tag currently aliases a thinking variant, as both local metadata and the [official model tags](https://ollama.com/library/qwen3-vl/tags) show. A coffee cold run took 55.304 s and failed bounded-output validation; a retry with `think:false` took 53.486 s and also failed. The warm attempt was interrupted before completion while diagnosing this problem; no completed warm 4B baseline timing is claimed. A smaller-schema diagnostic confirmed that this thinking variant can still emit reasoning even with `think:false`. The adapter rejected the truncated full analysis, rather than presenting it as success.

Because this missed the target, evaluated the requested generic `qwen3-vl:2b` on all the same photos. Digest `0635d9d857d497aeadba3d7d27485746c50554446f9f6ec01ef39788221adbe8`, Q4_K_M, 2.1B. This tag also resolves to a thinking variant.

| Photo | Cold (s) | Warm (s) | Validated analysis |
| --- | ---: | ---: | --- |
| coffee.jpg | 38.528 | 19.918 | Both rejected: INVALID_MODEL_RESPONSE |
| plant.jpg | 27.838 | 19.271 | Both rejected: INVALID_MODEL_RESPONSE |
| bicycle.jpg | 27.685 | 19.582 | Both rejected: INVALID_MODEL_RESPONSE |

2B was faster but returned **0/6 valid analyses** under the bounded output configuration. Its recognition/parameter quality cannot be accepted or meaningfully compared from rejected responses. It was not selected as an automatic fallback. More tokens/longer deadlines could change this tradeoff but would conflict with this latency investigation; no such success is claimed.

## Explicit 4B instruct variant

Evaluated `qwen3-vl:4b-instruct`, digest `84f7ed8042fa7cdbd902f7dcb7d0370e032095047cc3244179f263b77b5bc318`, Q4_K_M, 4.0B. This is the **explicitly configured working setup** in docs; the adapter retains the originally requested generic 4B baseline as its default and never switches models automatically. Set OLLAMA_MODEL explicitly as documented. Structured output uses the final bounded prompt/schema, temperature 0, requested think:false, 768 output tokens, 4096 context and the normal 60-second deadline.

| Photo | Cold (s) | Warm (s) | Observed label | Shape / width-height estimate |
| --- | ---: | ---: | --- | --- |
| coffee.jpg | 19.727 | 5.804 | coffee cup with latte art | container / 0.7 |
| plant.jpg | 19.005 | 5.438 | potted succulent | container / 0.5 |
| bicycle.jpg | 17.969 | 5.344 | Bicycle | elongated / 0.75 |

All **6/6 analyses passed** shared schema and catalog-bound validation. Labels identify the visible primary objects. Quality remains limited: the bicycle's 0.75 width/height estimate is visibly inconsistent with its wider-than-tall silhouette, and the cup's dimensional prose is not a measured geometric fact. Shape/proportion output still requires deterministic fitting and subsequent product validation. All proposals chose 45 degrees for the synthetic hinge: this is **not evidence of personalised fold geometry**. The adapter appends an unavoidable development-only synthetic-recipe warning; no valid origami design is claimed.

These provider timings were below 30 seconds on these samples, but **the PRD end-to-end 30-second generation target remains unverified**. No real recipe fitting/compiler/tutorial exists in this ticket; no physical foldability or full demo test was performed. New images may take longer than cached repeats. Prefer explicit instruct tags for this bounded JSON workload and remeasure whenever model digests change. The default model is not silently replaced by the faster/successful variant.

## Offline and failure-path verification

Both the temporary Ollama daemon and benchmark client were restarted under a macOS process sandbox allowing only loopback outbound networking, with OLLAMA_NO_CLOUD=1 and predownloaded weights. The profile denied outbound networking except `(remote ip "localhost:*")`; external hostname lookup and a numeric external-IP connection probe failed, while loopback version checks worked. This did not alter the Mac's Wi-Fi or system firewall. An offline plant run with 4B instruct passed: **19.044 s cold, 5.571 s warm**, same validated label/features as the network-enabled sample run.

Actual failure-path probes: an unused loopback service port returned readiness unavailable and MODEL_UNAVAILABLE; an uninstalled explicit 2B instruct model returned readiness unavailable and MODEL_UNAVAILABLE without a download attempt; a one-millisecond request deadline returned GENERATION_TIMEOUT. Unit tests additionally exercise malformed model output, unsupported fields/actions, non-finite values, narrower catalog bounds, body-read timeouts and caller cancellation. None of these paths logged an image payload.

Ollama was unpacked into /tmp/foldlens-ollama-runtime; weights remain in /tmp/foldlens-ollama-models for this experiment and may be cleared by the OS. No system package, startup agent, API credentials or global network settings were configured. Install Ollama normally and pull the selected explicit model for a durable demo setup. The temporary daemon is stopped after verification; unrelated services are left alone.

## Engineering checks

`npm run typecheck`, `npm test` (**52 passed**), `npm run build`, `python3 scripts/check_template.py` (22 documents) and `git diff --check` passed. HTTP tests were run with authorized loopback access because the default sandbox rejects listening sockets. No dependency/lockfile, shared schema/interface, frontend, application CI or recipe-engine changes were needed. Hosted CI status belongs to the PR, not these local measurements.
