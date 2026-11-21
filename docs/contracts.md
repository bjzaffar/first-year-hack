# Shared contracts, version 1

[Executable schemas and inferred types](../src/shared/schemas.ts) are the source of truth. [Interfaces](../src/shared/interfaces.ts) define future compiler/provider boundaries. [Fixtures](../src/shared/fixtures.ts) supply validated deterministic examples. T002/integration owns these shared files; workers propose changes in issue #2 before changing consumers. Product source: [PRD](../prd.md).

All wire envelopes carry `contractVersion: "1"` (tutorial/error for responses). Unknown fields, invalid versions, non-finite numbers, unknown recipe/operation IDs and missing required fields are rejected. IDs are stable lowercase strings; mesh indices are represented as references to IDs. API values contain data only. There are no credentials or auth headers in the local API.

## POST /api/generate

Content-Type: application/json. Explicit discriminated mode is required; no default fixture or fallback.

Fixture request (no photograph submitted):

```json
{"contractVersion":"1","mode":"fixture"}
```

Live request shape:

```json
{"contractVersion":"1","mode":"live","image":{"mimeType":"image/png","base64":"iVBORw==","width":1,"height":1}}
```

The live example is intentionally only encoded sample bytes, not a usable PNG. Foundation validates envelope, MIME declaration, canonical base64 and declared dimensions; it does not decode/verify image content. The real provider integration must decode/validate actual image format and dimensions before inference. JPEG/PNG/WebP declarations only, raw base64 without a data-URL prefix, decoded length ≤10 MiB, declared integer width/height 1–1024. Browser crop/resize belongs to T007. No image URLs (and therefore no server-side fetching) are accepted. JSON parser limit is 14 MiB including base64 overhead.

Success: HTTP 200, `{"ok":true,"tutorial":CompiledTutorial}`. Fixture response always sets tutorial.synthetic true and explains that no image/model was used. No partial tutorial success.

Failure: `{"ok":false,"error":{"contractVersion":"1","code":"INVALID_REQUEST","message":"…","retryable":false}}`.

| HTTP | Code / behavior |
| --- | --- |
| 400 | INVALID_REQUEST: missing/invalid fields, malformed JSON or unsupported encoding |
| 413 | PAYLOAD_TOO_LARGE: JSON parser limit exceeded |
| 503 | MODEL_UNAVAILABLE: every structurally valid live request in this foundation |
| 404 | NOT_FOUND: unknown route |
| 500 | INTERNAL_ERROR: unexpected failure, no raw exception or request body returned |

Reserved future codes: INVALID_MODEL_RESPONSE, INVALID_PARAMETERS, GENERATION_TIMEOUT, NO_VALID_RECIPE. Integration must define their HTTP mapping and implement 60-second cancellation before enabling live success. Retain the crop in client memory during retries. `retryable` describes whether a retry is meaningful after the cause is resolved; 503 requires installing/connecting live implementations first. Responses are not cached. There are no progress events yet, so a consumer must not invent detailed processing stages or percentages.

## GET /api/health

HTTP 200 means the backend can answer diagnostics, not that generation is ready:

```json
{"contractVersion":"1","backend":"ready","model":"not_configured","compiler":"not_configured","generationReady":false,"fixtureAvailable":true}
```

The current schema intentionally only admits actual foundation states. T004/T008 must extend it for genuine ready/unavailable model/compiler states and checks. No model download/check occurs here.

## Domain records

| Record | Version 1 content and invariants |
| --- | --- |
| ObjectAnalysis | Label, typed broad shape/aspect ratio, registered recipe ID, bounded parameters, honest approximation notes |
| RecipeDefinition | ID/version, synthetic flag, provenance/permission, 1–4 square sheets, numeric bounds, initial geometry, ordered operations, instruction templates and limitations |
| FoldOperation | Hinge only: ID, sheet/component, moving faces, distinct axis landmarks, angle, prior-operation IDs, explicit pre/postconditions |
| GeometryState | Stable ID, finite 3D vertices, edges with FOLD assignments B/M/V/F/U, sheet-linked faces/layers, vertex-linked landmarks |
| TutorialStep | Consecutive zero-based index, stable ID, sheet/component, operation, before/after state IDs, hinge motion duration, default/diagram cameras, highlights, instruction |
| CompiledTutorial | Recipe/version, accepted parameters, synthetic flag, materials, duration, approximation notes, geometry states, ordered steps and finalStateId |
| GenerationError | Version, enumerated code, user message, retryable |

The only registered recipe is `synthetic-hinge`, with `angleDegrees` 15–75. Only its deterministic 45-degree instance is supplied; no runtime fitting/compiler is implemented. The schema does not register candidate tray/boat recipes as implemented. Only hinge is admitted; T003 must add operations needed by the selected coherent recipe, with explicit motion contracts, rather than placeholder support for every roadmap fold.

Tutorial validation checks unique state/step IDs, state continuity, ordered prerequisites, final-state identity, valid face/sheet/component references, and landmarks present before and after each step. Mesh checks reject duplicate IDs and missing vertex references. These are structural contracts, not collision, face-area or physical-foldability proofs; compiler-specific geometric tests belong to T005. The single shared finalStateId is also the preview source, avoiding an independent invented preview.

## Provider/compiler integration and fixtures

`AnalysisProvider.analyze(image, recipes, signal)` returns validated ObjectAnalysis; readiness is separately queried. `RecipeCompiler.recipes` lists trusted available recipes; `compile(analysis)` returns a fully validated CompiledTutorial. Parameters and formulas are fitted/evaluated only by trusted recipe code. The future orchestrator must pass only real implemented recipes to the model, validate provider output, enforce cancellation, validate compiled output, and normalize failures to the response envelope. JSON cannot supply executable functions.

Use `syntheticAnalysis`, `syntheticRecipe`, `syntheticTutorial`, `unavailableError`, `malformedAnalysisFixture` and `invalidRequestFixture` in tests/development. All successful fixture data is original synthetic content; no external designer/tutorial assets were copied. The fixture demonstrates ID continuity and a rigid diagonal hinge, not a full origami model or personalised analysis. Replace via explicit live implementations; never relabel the fixture as fresh generation.

Changes to discriminants, fields, recipe domains or meanings require coordinated consumer updates and fixture/tests changes. Bump contractVersion for incompatible wire changes; recipeVersion tracks a specific authored recipe independently. No external provider or paid service is selected by this foundation.
