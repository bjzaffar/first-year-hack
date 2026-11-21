# Architecture and ownership

The owner designated [prd.md](../prd.md) as the planning source for T002. The integration branch is `main`; implementation and handoff use ticket branches and PRs. Foundation does not implement live analysis or a geometry engine.

## Selected foundation

One npm package, exact direct dependencies, one lockfile. React/TypeScript/Vite browser, Node/TypeScript/Express local API, Zod shared runtime contracts, Three.js for future rendering, Vitest for contracts and HTTP tests. Versions are authoritative in [package.json](../package.json); Node 24+ is required. No Rabbit Ear or external tutorial assets were adopted.

```text
React browser → /api via Vite proxy → loopback Express
                                      ├─ health: backend ready, live dependencies absent
                                      ├─ fixture request: synthetic shared tutorial
                                      └─ live request: structured 503
Future: validated crop → AnalysisProvider → validated analysis → RecipeCompiler → tutorial
```

The built server also serves `dist/client` at the API port. Development uses Vite at WEB_PORT with a proxy to API_PORT. Both listeners bind 127.0.0.1. Deployment is outside this ticket; no service binds publicly. Environment setup is in [development](development.md).

## Module ownership and dependencies

| Location | Owner / intended consumers |
| --- | --- |
| `src/shared/schemas.ts` | T002/integration owns contract changes; all workers consume |
| `src/shared/interfaces.ts` | Provider/compiler boundary; T004 and T005 implement |
| `src/shared/fixtures.ts` | T002 synthetic data for independent UI/provider development |
| `src/server/` | T002 scaffold, T004 adds provider; T008 coordinates live orchestration |
| `src/client/` | T002 diagnostic shell; T007 frontend shell; T006 renderer; T008 integration |
| Root configs, package manifests/lockfile, CI | Integration; coordinate changes in issue #2 |
| Real recipe IDs, parameter bounds, operations | T003 publishes evidence and contract additions before T005/T006 consume |

Future geometry/compiler code belongs in a trusted TypeScript module (proposed `src/geometry/`), renderer code in the client. No executable formulas, scripts or arbitrary operations may arrive through requests or model JSON. The synthetic hinge contract is the only registered domain; it does not authorize exposing a real recipe. T003 must explicitly extend schemas after feasibility evidence. Provider/compiler interfaces are defined now but no implementations are claimed.

## State, errors and limitations

Data exists only in request/React memory; refresh discards it. No authentication/accounts, database, files for uploaded images, analytics, service workers, browser storage, image logs or external network inference. API responses use Cache-Control no-store. No CORS middleware is enabled: browser use is through the same-origin Vite proxy or built server. This local foundation is not a public hosting security boundary.

Backend readiness is distinct from model/compiler readiness. The fixture endpoint is opt-in on each request and always labelled synthetic. Real generation never falls back to fixture data. The future provider must enforce the PRD 60-second cancellation/timeout and separately measure the 30-second target; those paths are not implemented while live generation is unavailable.

Geometry uses stable string IDs and FOLD-compatible concepts (vertices, edges, faces, crease assignments and layers), not a claim of full FOLD file serialization. Preview must resolve finalStateId from the compiled states; diagrams/animations consume those same states. Numeric/reference checks do not prove physical foldability. The scaffold has no WebGL renderer, crop UI, novel topology, motion engine or complete volumetric recipe.
