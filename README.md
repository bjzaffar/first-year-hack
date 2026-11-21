# FoldLens

FoldLens turns a cropped photograph into a bounded tray or pointed boat approximation and a visual folding guide. [prd.md](prd.md) is the owner-designated product source. Local Qwen3-VL analysis selects proportions; the trusted recipe compiler supplies every geometry state and instruction. Preview acceptance is required before the guide.

## Run locally

Requires Node.js 24+, npm 11 and local [Ollama](docs/ollama.md). Install the measured model explicitly:

```sh
ollama pull qwen3-vl:4b-instruct
ollama serve
```

In another terminal:

```sh
npm ci
cp .env.example .env
npm run dev
```

Open **http://127.0.0.1:5173**. Choose a JPEG, PNG or WebP, adjust and confirm its crop, then **Generate from photograph**. Review the photograph, geometry and simplifications; accept to enter materials and Back/Replay/Next navigation. Rejecting or retrying retains the crop. No accounts, cloud inference, persisted photos or credentials are used.

The backend binds **127.0.0.1:3001**; Vite proxies `/api`. Use `API_PORT` / `WEB_PORT` for another local session. `.env.example` explicitly selects `qwen3-vl:4b-instruct`; without a setting, the adapter retains its original `qwen3-vl:4b` default. There is no model or sample fallback.

**Sample without a model:** open `/fixtures/masu` for the labelled box or `/fixtures/boat` for the four-step boat walkthrough. Live generation failures never substitute this sample. `GET /api/health` reports model availability and compiler readiness; it does not guarantee inference speed.

```sh
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the built browser and API at **http://127.0.0.1:3001**. Build output stays in ignored `dist/`. See [live generation and testing](docs/live-generation.md), [development](docs/development.md), [architecture](docs/architecture.md), and [contracts](docs/contracts.md).

## Limits

Two authored families are supported: square open container (wall-height fraction 0.06–0.16) and basic pointed V-hull boat (transverse crease fraction 0.24–0.30). Both use one square sheet. The boat is not claimed to be watertight or physically verified. Complex objects receive an honest approximation, not a reconstruction. Physical folding, paper thickness, shape retention, beginner usability and folding duration remain unverified. Preview and tutorial share the same final geometry. The 60-second server deadline is enforced; the separate 30-second performance target depends on the image and machine.

## Repository workflow

Read [AGENTS.md](AGENTS.md) and [workflow](docs/workflow.md). The lead assigns one issue per named branch and reviews PRs targeting `main`. Do not push to `main`, merge, deploy or close implemented issues without assignment. Concurrent sessions use separate worktrees/clones and ports.

## Folder map

- `src/client/`: upload/crop, live request flow, preview and Three.js/SVG player.
- `src/server/`: local Express API, generation orchestration and Ollama adapter.
- `src/shared/`: schemas, supported analysis catalog and response union.
- `src/geometry/`, `src/recipes/`: trusted compiler and authored motion.
- `tests/`: geometry, contracts, HTTP boundaries, adapter and browser component tests.
- `docs/`, `prd.md`: product and technical context.
- `.github/workflows/`: app checks and separate template documentation checks.
- `prompts/`, `tasks/TEMPLATE.md`, [QUICKSTART.md](QUICKSTART.md): collaboration templates.

Run `python3 scripts/check_template.py` for local Markdown links; this is separate from application validation.
