# FoldLens

FoldLens turns a photograph into an adjustable origami approximation and a visual folding guide. [prd.md](prd.md) is the planning source for this foundation, as instructed by the owner for [T002 / issue #2](https://github.com/bjzaffar/first-year-hack/issues/2). Planning templates elsewhere do not supersede the PRD.

This branch establishes the application foundation. Live photo analysis, a real recipe compiler, upload/crop and tutorial rendering are separate tickets. The browser includes local diagnostics and an explicitly labelled synthetic fixture; it does not generate origami yet.

## Run locally

Requires Node.js 24+ and npm 11. Use npm only; commit `package-lock.json` with dependency changes.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The backend listens on **127.0.0.1:3001** and Vite proxies `/api`. No credentials, database or model download are required for the foundation. Optionally copy `.env.example` to `.env` for port overrides.

```sh
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the built browser and API together at **http://127.0.0.1:3001**. `npm run dev` is the development flow with hot reload. Production build output stays local in ignored `dist/`.

## Foundation diagnostics

Click **Check server**: backend ready, model/compiler not configured. Click **Load synthetic fixture**: a schema-validated single-hinge example appears, with a warning that no photograph was analysed. Live generation returns HTTP 503 and never silently substitutes this fixture.

The server-side [local Ollama analysis adapter](docs/ollama.md) can be exercised independently with the benchmark CLI. It is not yet connected to live tutorial generation.

See [development](docs/development.md) for exact checks and port examples, [architecture](docs/architecture.md) for ownership, and [contracts](docs/contracts.md) for API examples and schema boundaries.

## Repository workflow

Read [AGENTS.md](AGENTS.md) and [workflow](docs/workflow.md) before contributing. The lead assigns one issue per named branch and reviews PRs targeting `main`. Do not push to `main`, merge, deploy or close implemented issues without assignment. Separate concurrent sessions use separate worktrees/clones and ports.

## Folder map

- `src/client/`: minimal React browser shell; Three.js is installed for the renderer ticket.
- `src/server/`: Express app, startup and port validation.
- `src/shared/`: version 1 Zod schemas/types, compiler/provider interfaces, synthetic and invalid fixtures.
- `tests/`: contract invariants and actual HTTP boundary tests.
- `docs/`, `prd.md`: product and technical context.
- `.github/workflows/app-check.yml`: install, typecheck, tests and build.
- `.github/workflows/template-check.yml`: separate documentation check.
- `prompts/`, `tasks/TEMPLATE.md`, [QUICKSTART.md](QUICKSTART.md): collaboration templates retained from the starter.

Template validation is separate from app validation:

```sh
python3 scripts/check_template.py
```
