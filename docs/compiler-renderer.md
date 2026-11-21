# Adjustable compiler and fold renderer (T005 / T006)

Current integration: [T008 live generation](live-generation.md) connects the real catalog, Ollama, compiler and browser. Its API/readiness/setup details supersede the foundation-only or pending-T008 descriptions below; historical verification remains attributed to its original ticket.

The compiler at `src/geometry/compiler.ts` consumes the merged [T003 motion contract](recipes/masu-motion.md). `compileMasu(unknown)` validates the recipe ID, bounded parameters, object label and approximation notes, and returns a schema-validated nine-step tutorial with ten saved geometry states. `masuCompiler.recipes` exposes the trusted catalog. No operation sequence comes from model output.

## Compiler boundary

```ts
const tutorial = compileMasu({
  recipeId: 'masu-box',
  parameters: { wallHeightFraction: 0.1 },
  objectLabel: 'Planter',
  approximationNotes: ['Approximated as a square open container.'],
});
```

The fitting policy rejects, rather than clamps, parameters outside [0.06, 0.16], unknown fields, non-finite values, and unsupported recipes. The domain guarantees `2h < s`; the compiler also checks that coupled constraint. The one unit square sheet keeps the original 29 rigid panels and every shared vertex throughout the four packet folds, coupled wall lift, and four corner closures. No assembly, turn or unfold is required by this construction; none is hidden in a state jump. Dimensions in the wall instruction come from the same equations as the geometry.

The additive `MasuTutorialSchema` uses `contractVersion: "masu-1"`; it does **not** silently expand the existing synthetic HTTP v1 registry. It retains local corner layer ordering, the normative three motion kinds, sheet/component identifiers, cameras, highlights and shared before/after state references. This recipe-specific compiler boundary supersedes the foundation's synthetic-only compiler proposal for this recipe. T008 must explicitly adapt the analysis catalog and HTTP response union before live generation can return it. The current Ollama adapter and API remain unchanged. `estimatedMinutes: null` means unmeasured; numeric physical folding estimates are not invented.

The preview resolves `finalStateId` directly into the tutorial's saved state array. The renderer consumes that same state. Coordinates are never rescaled into a separate final shape.

## Renderer interface

`FoldScene({ tutorial, index?, replayKey?, onComplete?, onError? })` accepts either the foundation fixture or the compiled box tutorial:

- Omit `index` to render the rotatable final preview.
- Set/change `index` to load a step, restore its exact before state and play it once using its default camera.
- Increment `replayKey` to replay from the saved before state.
- `onComplete` fires once at the exact saved endpoint; `onError` ends playback on initialization, motion or WebGL context failure.
- Unmount or change inputs to cancel the old animation and dispose GPU geometry, materials, controls and renderer resources.

Motion uses the authored evaluator, including the coupled solver. It never interpolates vertices between endpoint meshes. The foundation hinge uses axis-angle rotation. Polygon depth bias is a display-only aid for coincident layers; it does not modify mesh coordinates or assert finite-thickness correctness.

`FoldDiagram({ tutorial, index })` uses the saved before/after states and `diagramCamera`. It shows paper panels, dashed crease cues, highlighted landmarks, and movement arrows. Orbit controls affect only the 3D camera. Back/Replay/Next wait for actual renderer completion; errors release navigation and retain diagram/text access.

Open `/fixtures/masu` on the running application for an explicitly labelled offline nine-step walkthrough. This route uses h=0.1 and never claims to analyse a photograph. The normal upload flow now uses the same fixed nine-step box sample, clearly labelled as independent of the uploaded photo. Live photo analysis remains with T008.

## Verification and handoff

Issues: [#5](https://github.com/bjzaffar/first-year-hack/issues/5), [#6](https://github.com/bjzaffar/first-year-hack/issues/6). Branch: `design/paper-studio`, retaining the owner's existing eight design commits and merging prerequisite main at `8429d64`. The owner explicitly requested both issues on this branch; implementation proceeded compiler first, renderer second. The follow-up adds pinned happy-dom for component lifecycle/flow tests; the model provider and API schemas remain unchanged.

- `npm test`: 123 tests across nine files passed. Compiler tests cover boundaries/interiors, exact T003 fixture agreement, finite/nondegenerate geometry, all rigid-face pairwise lengths, reference validation, repeatability, variation, malformed parameters and operations. Renderer tests cover all steps forward/back/replay, exact endpoints, rigid hinge intermediates, stale playback tokens, fixed SVGs/arrows/highlights and unsupported motions. Existing T003 sampled motion/intersection tests also pass.
- `npm run build`: passed, including strict typecheck. Vite reports a large client chunk warning with Three.js included; no build error.
- `python3 scripts/check_template.py` and `git diff --check`: passed.
- Browser walkthrough, interactive rotation, GPU layer appearance, context loss and actual WebGL-unavailable UI: **not verified**. Browser access host was unavailable and native Chrome access was denied. Run the route, traverse all nine steps, reverse/replay, rotate the preview, and simulate WebGL loss before approval.
- Physical folding, paper thickness, shape retention, beginner usability and folding time remain unverified, consistent with T003.
- Remote status comments, push and PR creation: blocked because the connector requires an unavailable connection setting and the Git HTTPS identity check found no usable credential. No remote writes were attempted with another identity.

Next action: enable browser access for the remaining acceptance walkthrough; authenticate as the repository operator, push this branch and submit a PR targeting main for review. No merge, deployment or issue closure is performed.

## Browser-report follow-up

The user reported a generic playback error and missing diagrams in both entry points. Playback now starts its clock from the first RAF timestamp and clamps progress, avoiding negative progress when a frame timestamp precedes effect initialization. Errors distinguish initialization, playback and context loss and include the actual error message. Rotation hints disappear on failure. SVG height and zero-minimum grid columns keep diagrams visible independently of canvas failure.

Both the main upload/crop flow and the fixture route now call the same box-sample factory. A crop is retained for comparison but never sent to inference or claimed to affect the fixed sample. The completed main flow renders the final model. React component tests exercise early timestamps, Strict Mode cleanup, all nine steps and replay, initialization/context errors, diagram dimensions, and the upload-to-tutorial transition. GPU calls are mocked in these tests: actual browser/GPU confirmation remains outstanding.

## Owner acceptance and integration authorization

After the timing/layout fix and main-flow integration, the owner reported “it works!” in their browser and explicitly authorized publishing, merging into main, and closing issues #5 and #6. A fresh verification ran 123 tests successfully and passed the production build/typecheck. This records the owner's browser confirmation, not an agent-observed exhaustive GPU/context-loss walkthrough. The GitHub connector subsequently verified the operator's bjzaffar identity, enabling publication without terminal Git credentials. Physical folding and live image analysis remain outside this handoff.
