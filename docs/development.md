# Development environment

Planning source: [PRD](../prd.md). Scope: T002 foundation only. Use Node.js **24+**, npm **11**, and the committed npm lockfile. Local verification used Node 26.13.0 / npm 11.20.0; CI uses Node 24. All direct dependencies are exact versions in [package.json](../package.json).

## Fresh checkout

```sh
npm ci
npm run dev
```

No secrets, model service or database is needed. Optional configuration:

```sh
cp .env.example .env
```

Visit http://127.0.0.1:5173. Backend: http://127.0.0.1:3001. Both bind loopback; Vite uses strict ports so conflicts fail clearly. Stop both development processes with Ctrl-C. No global Git configuration changes are needed.

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproduce dependencies from package-lock.json |
| `npm run dev` | Start backend watch and Vite, terminate peers when either exits |
| `npm run dev:server` | Backend only |
| `npm run dev:client` | Browser dev server only |
| `npm run typecheck` | Strict TypeScript for client, server, contracts, tests, configuration |
| `npm test` | Vitest contract and loopback HTTP checks |
| `npm run build` | Typecheck, Vite browser build, emitted Node server/shared modules |
| `npm start` | Serve built client and API together on API_PORT |
| `python3 scripts/check_template.py` | Starter document/link validation only |

No formatter/linter has been selected; typecheck is not a substitute for a future lint policy. Database, seed/reset, migrations and deployment are not applicable to this foundation. `npm start` is a local build smoke check, not a shared deployment.

## Configuration and isolation

| Variable | Default | Visibility / provisioning |
| --- | --- | --- |
| `API_PORT` | `3001` | Local server and Vite proxy; `.env` or process environment |
| `WEB_PORT` | `5173` | Vite listener; `.env` or process environment |
| `OLLAMA_URL` | placeholder `http://127.0.0.1:11434` | Server-only adapter/benchmark configuration; API orchestration remains T008 |
| `OLLAMA_MODEL` | placeholder `qwen3-vl:4b` | Server-only adapter/benchmark configuration; API orchestration remains T008 |

No variables use a public `VITE_` prefix. Vite loads configuration to set its proxy but does not expose server configuration to the browser. Credentials are never required for fixtures. Services use no persisted photos or tutorial data, browser storage, request-body logs or database.

Each worktree needs its own `npm ci` and optional ignored `.env`. Example second session:

```sh
API_PORT=3002 WEB_PORT=5174 npm run dev
```

Ports must be integers 1–65535. Use distinct API and browser ports; worktrees do not isolate processes.

## Reproducible smoke check

Start `npm run dev` and open the browser URL. Check the server, then load the synthetic fixture. Expect an honest not-configured readiness message and labelled JSON fixture data. Stop the backend and retry: expect an actionable local-server error.

```sh
curl -i http://127.0.0.1:3001/api/health
curl -i http://127.0.0.1:3001/api/generate -H 'Content-Type: application/json' -d '{"contractVersion":"1","mode":"fixture"}'
curl -i http://127.0.0.1:3001/api/generate -H 'Content-Type: application/json' -d '{}'
```

Expect 200 with generationReady false, 200 with tutorial.synthetic true, then 400 with INVALID_REQUEST. `npm test` additionally checks live generation 503, malformed JSON, oversized payloads, invalid crop metadata and unknown routes. Stop development, run `npm run build` then `npm start`, and open http://127.0.0.1:3001 to check the built browser/API. No real inference, 30-second benchmark, complete demo, WebGL rendering or physical folding is claimed by foundation checks.

## CI

[Application checks](../.github/workflows/app-check.yml) run npm ci, typecheck, tests and build on Node 24. [Template checks](../.github/workflows/template-check.yml) separately validate local Markdown links. Both run on pushes and PRs. Branch protection/check requirements remain repository settings managed by the lead.

## Foundation verification (2026-11-21)

Observed locally on Node 26.13.0 / npm 11.20.0: `npm ci` succeeded (154 packages, zero reported vulnerabilities), `npm run typecheck` and `npm run build` passed, and `npm test` passed all 16 tests. `python3 scripts/check_template.py` and `git diff --check` passed. HTTP tests required permission to bind loopback outside the sandbox; the initial sandbox-only attempt failed with EPERM.

Default ports were occupied, so development startup used `API_PORT=43171 WEB_PORT=43172 npm run dev`. HTTP smoke checks confirmed the browser HTML, transformed React module, proxied health, and labelled fixture response. `API_PORT=43173 npm start` served built HTML and health successfully. Existing processes on default ports were not stopped. Browser automation host was unavailable, so button interaction/visual checks remain unverified. CI's Node 24 run is pending the PR. No inference, complete user journey, geometry compiler or physical folding was tested.

## Local photo analysis

T004 adds a standalone server-side AnalysisProvider and explicit benchmark CLI. See [Ollama setup and integration](ollama.md) and [measured latency/quality results](ollama-benchmark.md). The tested setup sets OLLAMA_MODEL=qwen3-vl:4b-instruct explicitly; generic tags currently point to thinking variants. App fixture startup still needs no model, and the live tutorial API remains unavailable pending compiler/orchestration integration.

## T007 frontend review fixes

Sample mode is explicitly labelled before loading; it never submits a photograph or invents backend processing stages. Choose an image, resize the crop rectangle by dragging its corners, or drag inside it to move the selection (arrow keys work when the box or a corner is focused), confirm it, then load the synthetic tutorial. Returning from preview preserves the source and crop for adjustment. A request error offers direct retry with the confirmed crop or a separate new-image action. Invalid, oversized, unreadable and undecodable files invalidate the previous selection.

Verification: production build/typecheck, all 19 Vitest tests (including selected-region/resizing and invalid-crop tests), template checks and whitespace checks passed. HTTP tests required loopback permission. Browser interaction checks remain unperformed; renderer and diagram slots remain placeholders. On review, exercise recrop, same-image retry, corrupt-file handling and completion while replay is active before merging.
