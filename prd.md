# FoldLens — Product Requirements Document

Status: interview-derived product specification; implementation has not started.
Date: 2026-11-21. Working name: FoldLens.

## 1. Product and success criteria

FoldLens is a desktop-browser application that turns a photograph of an everyday object into a personalised origami approximation and a beginner-oriented visual folding tutorial. The cultural connection to the hackathon theme, **“code meets culture,”** is the practice of origami itself. Dedicated history content is not required.

The user uploads and crops a photograph, previews a generated paper interpretation, and accepts it before following animated folds with diagrams and short instructions. The completed paper object must have some volume or stand up. A mostly flat figure alone does not satisfy the intended product outcome.

The generator uses **adjustable recipes**: authored folding constructions with bounded, photo-dependent proportions. It does not merely retrieve a fixed tutorial, and it does not invent arbitrary fold sequences from a list of named folds.

### Confirmed constraints

| Area | Requirement |
| --- | --- |
| Audience | Teenagers and adults with no origami experience |
| Build target | Approximately six hours, with 3–4 people |
| Team experience | React/TypeScript; no confirmed origami or 3D graphics experience |
| Compute | An Apple Silicon Mac with at least 16GB memory is available |
| Cost | Free tools and models; practical local inference preferred over dependence on free hosted quotas |
| Delivery | Browser demo on the team's own laptop; project submitted online |
| Independent public access | Not required for the MVP |
| Input subjects | Everyday objects; accept arbitrary photos but approximate within supported construction families |
| Personalisation | Photo-dependent shape and proportions, not only colour or model selection |
| Materials | One to four same-size square sheets; no cutting, glue, or tape |
| Assembly | Folded connections or slots belonging to supported recipes |
| Tutorial duration | Intended 5–20 minutes, depending on design complexity |
| Generation latency | Target preview and tutorial readiness within 30 seconds on the demo machine |
| State | Session only; refreshing may discard the design and progress |

“Beginner-oriented” means clear, explicit steps. The agreed MVP acceptance check is a digital walkthrough, not a requirement to recruit a beginner and observe completion. Physical foldability remains a design requirement, but a digital walkthrough does not prove it. Report physical verification separately and do not claim unperformed tests passed.

## 2. Scope and user experience

### Core journey

1. **Upload:** choose or drag in an image. Explain that the result is a simplified paper interpretation. No account is required.
2. **Crop:** isolate one object. Let users adjust the crop before submitting.
3. **Generate:** show real processing stages: analysing photograph, fitting a recipe, and preparing instructions. Do not invent percentage progress.
4. **Preview:** show the cropped photograph beside the rotatable final origami geometry. Display sheet count, paper format, estimated folding time, and a plain-language explanation of major simplifications.
5. **Choose:** accept the interpretation, return to crop, or upload another image. No proportion sliders or multiple-design chooser in the MVP.
6. **Prepare:** show all required sheets and explain how components are identified when more than one is used.
7. **Fold:** display a replayable 3D animation, a fixed-view diagram, and approximately two short sentences describing the current action. Relevant corners remain highlighted. Show step number and component/sheet identifier.
8. **Finish:** show the final model and allow starting a new design. PDF tutorial export is a stretch feature.

### Interaction and presentation

- Desktop-first browser layout with a calm paper-studio style: warm off-white backgrounds, restrained accent colour, crisp diagrams, subtle paper texture, and readable typography.
- The tutorial uses explicit **Back**, **Replay**, and **Next** controls. It waits for the user; no continuous automatic playback or timeline scrubber is required.
- Back restores a saved step state. Replay restarts that step's animation without changing the current step.
- The diagram uses a stable teaching view even if the user rotates the 3D model. Each step supplies a useful default camera position.
- Fold text names the action, identifies the moving corner or layer, and states where it should end. Necessary preparation, unfolding, turning over, opening, and assembly actions must be explicit steps.
- No separate stuck-help panel, conversational tutor, or photo-based folding correction.
- English is the default language. A broader accessibility programme is outside this MVP's requested scope; text accompanies every diagram.

### Approximation and failure behaviour

Any photograph can enter the workflow; not every object can be reproduced closely. Show the closest supported approximation honestly and let the user accept or retry. A bicycle, for example, must not be presented as faithfully reconstructed if only its broad silhouette is captured.

If no supported recipe can produce a valid result, explain that generation failed and offer retry. Never substitute fabricated fold instructions to satisfy an “always return something” rule.

Proposed implementation defaults: JPEG, PNG, and WebP input up to 10MB; reject invalid files clearly; resize the cropped image to at most 1024 pixels on its longest side before inference. These limits are engineering defaults, not interview-mandated product choices.

Handle unavailable model service, malformed model responses, invalid parameters, generation timeout, and unavailable WebGL with actionable messages. Preserve the crop while retrying. Use a 60-second request timeout while measuring the separate 30-second performance target. Do not silently label a cached demonstration as a fresh generation.

### Excluded from the core build

- Photorealistic image-to-3D reconstruction of the source object.
- Arbitrary novel origami topology or unrestricted composition of folds.
- Accounts, cloud storage, saved progress, sharing feeds, webcam capture, and mobile-first optimisation.
- Cutting, adhesives, printable decoration, and more than four sheets.
- AI-generated tutorial images or videos as a substitute for consistent geometry.
- Dedicated cultural-history panels and model training/fine-tuning.

## 3. AI, libraries, and architecture

### Recommended implementation stack

| Component | Choice | Responsibility |
| --- | --- | --- |
| Browser application | React + TypeScript + Vite | Upload/crop, preview, guide, session state |
| Local server | Node.js + TypeScript + Express | Input validation and local inference endpoint |
| Vision model | Qwen3-VL 4B through Ollama | Interpret the photo and propose recipe-compatible features/proportions |
| Validation | Zod | Validate requests, model output, recipes, and tutorial records |
| Geometry and sequencing | Custom TypeScript engine | Instantiate recipes and calculate consistent paper states |
| 3D presentation | Three.js | Render paper faces and animate authored motions |
| Diagrams | SVG rendered in React | Creases, arrows, highlighted corners, and stable teaching views |
| Geometry representation | FOLD-compatible mesh records | Vertices, edges, faces, crease assignments, and layer relationships |
| Tests | Vitest; browser smoke testing | Geometry/contract invariants and complete user flow |

Use one repository and a small shared TypeScript domain module. The frontend accesses the local backend through the Vite development proxy; Ollama is called by the backend. Bind local services to loopback for the laptop demo. No database is required.

Qwen3-VL is available in 2B and 4B variants through Ollama. Start with `qwen3-vl:4b`, use image input and structured JSON output, and benchmark it on the actual Mac. Model download size is not total runtime memory usage. The 30-second target is unverified until measured. If 4B is too slow, evaluate 2B on the same photos before selecting it; smaller does not automatically mean adequate recognition quality.

Ollama structured output constrains response shape, not geometric correctness. The server still validates every field. No paid provider or free-hosted fallback is selected; introducing one would require checking availability and the effect on local-photo handling.

### Data flow

```text
Upload → crop/resize → local analysis endpoint → Qwen3-VL
                                                ↓
                          validated recipe proposal and features
                                                ↓
                        bounded recipe parameter fitting
                                                ↓
                        sequential geometry compilation
                                                ↓
                  final preview + step states + instructions
                                                ↓
                         user accepts → tutorial player
```

Only offer the model recipe identifiers and parameters that are actually implemented. The AI identifies useful object properties and suggests the best supported construction. Deterministic code checks feasibility and compiles the result. The model cannot execute code, introduce new operations, or alter the recipe's sequence.

Keep original images, cropped images, and generated tutorials in memory for the session. Do not log image payloads or retain photos in tracked files. Download model weights ahead of the demo; test operation without network access after setup.

### Library boundaries

**FOLD:** use its mesh concepts for geometry interchange and internal records. It is a representation of crease patterns and folded states, not an instruction planner. Store tutorial steps in our own explicit array of state records rather than assuming a FOLD viewer supports a tutorial timeline.

**Three.js:** renders the geometry and plays motions supplied by the recipe engine. It does not determine valid paper folds or solve layer order automatically.

**Rabbit Ear:** optional feasibility-spike candidate for FOLD graph manipulation and origami calculations. Its documented release is alpha and its license is GPLv3. Evaluate relevant APIs and distribution implications before adopting it. The baseline architecture does not require it, and the PRD does not assume it supplies general squash/reverse-fold tutorial animation.

**Origami Simulator:** optional external inspection tool, not the tutorial engine. Its documented simulation attempts to fold creases simultaneously rather than produce a beginner sequence. A visually converged simulation is not a proof of physical foldability or accessible intermediate steps.

Image-to-3D models such as TRELLIS are excluded from this architecture because the required preview is the generated origami geometry itself.

## 4. How adjustable recipes determine the folds

### Authoring and source material

The team authors each recipe from a coherent construction. Existing tutorials may inform the construction where use is permitted; record provenance and permissions, credit designers, and create our own structured instructions and diagrams rather than copying assets without permission. Recipe content is prepared during development, not scraped or invented at runtime.

Every recipe defines:

- A starting arrangement of one to four square sheets.
- A fixed sequence of actions and any explicitly authored component assembly order.
- Adjustable parameters, their geometric meaning, and permitted combinations.
- The equations that convert those parameters into crease locations and landmarks.
- Which faces/layers move at each action and their relative stacking order.
- Motion descriptions, diagram views, highlighted corners, and instruction templates.
- Preconditions and postconditions for each action, plus evidence and known limitations.

**The recipe determines fold order.** Parameters change positions or dimensions within that construction; they do not permit arbitrary changes to its topology. Components are folded in the recipe's declared order and assembled using its declared connections. A library of named folds alone is insufficient to derive a valid construction.

### Runtime compilation

1. Validate the AI's proposed recipe ID and numeric parameters.
2. Fit those parameters to the recipe's supported domain. Apply only documented bounds and coupled constraints; if a combination fails, choose a valid bounded fit or report failure.
3. Instantiate initial sheet meshes with stable face, edge, and landmark identifiers.
4. Process the ordered actions. Calculate crease geometry, affected layers, before/after meshes, and any required intermediate states.
5. Validate references, finite coordinates, nondegenerate faces, and operation-specific constraints. Numerical consistency checks are not a complete collision or foldability proof.
6. Populate instructions from the same computed landmarks and parameters used by the geometry.
7. Produce the final preview from the final tutorial state, including assembly transforms.

All diagrams, animations, and preview geometry derive from this single compiled result. Never independently generate a prettier preview that the instructions cannot reproduce.

### Motion implementation

For a simple hinge fold, identify and, where needed, split faces at the crease, select the correct moving layers, and rotate those faces about the crease axis to the authored target angle. Preserve lengths within rigid faces. A 180-degree final fold must retain layer identity despite overlapping positions.

Use authored compound motion paths for nontrivial operations such as opening a pocket, squash folds, or reverse folds. These can require several coordinated creases, changing layer relationships, and intermediate states. Do not approximate them by unconstrained vertex interpolation that stretches paper or moves it through unrelated layers.

Opening a volumetric form and assembling modules must be represented explicitly, not hidden in an unexplained jump to the final object. Small display offsets may make overlapping layers visible, but must remain separate from the underlying geometry.

The MVP is a recipe-based animation system, not a general paper physics simulator. General collision resolution, material deformation, and automatic sequence discovery are outside scope. Any unsupported compound operation blocks recipes that depend on it until an appropriate implementation exists.

### Broad fold vocabulary

The desired roadmap includes mountain/valley folds, precrease/unfold actions, inside/outside reverse folds, squash folds, petal folds, rabbit-ear folds, pleats, crimp folds, and sink folds. Turning the paper, opening, tucking, and assembly are also first-class tutorial actions.

For the MVP, implement only the subset needed by the initial recipes. Do not expose an unimplemented operation merely because its name appears in the vocabulary. Advanced operations must still be decomposed into beginner-readable substeps.

### Initial recipe recommendation and feasibility gate

Start by investigating a volumetric tray/open-container construction with adjustable depth and width relationships. It offers useful approximations for trays, bowls, planters, and storage objects. Parameters must follow its actual construction equations, not arbitrary rescaling of a final mesh.

If the first family works, investigate an elongated hull/boat construction to cover a second shape family. Multi-sheet construction is permitted, not mandatory: introduce it only with a specifically authored connection that works using same-size sheets. No arbitrary assembly of unrelated modules.

These are candidate families, not claims that adjustable sequences have already been authored or verified. The first-hour experiment must establish an implementable construction, permitted parameter ranges, all required operations, and a complete path from square paper to volume. Exact recipes and parameter bounds remain implementation prerequisites. The owner explicitly deferred a fallback choice; do not silently replace personalised geometry with fixed-tutorial retrieval if the experiment fails.

## 5. Proposed interfaces and domain records

These are proposed implementation contracts, not existing repository APIs. Establish shared executable schemas before parallel implementation.

### Local endpoint

`POST /api/generate` accepts one cropped image and returns either a compiled tutorial or a structured error. It performs model inference, response validation, and recipe compilation. Return no partial tutorial as a successful result. The browser can show a generic generation state while detailed stages are added only if the implementation actually reports them.

`GET /api/health` reports backend and model readiness for startup diagnostics. This is not an end-user setup screen.

### Core records

| Record | Essential content |
| --- | --- |
| `ObjectAnalysis` | Object label, broad shape features, proposed recipe ID, proposed parameters, approximation notes |
| `RecipeDefinition` | ID/version, provenance, sheet count, bounded parameters, initial geometry, ordered operations, instruction templates |
| `FoldOperation` | Operation type, sheet/component ID, affected faces/layers, crease or compound-motion definition, prerequisites, landmarks |
| `TutorialStep` | Index, component ID, before/after state references, animation description, diagram camera, highlights, instructional text |
| `CompiledTutorial` | Recipe/version, accepted parameters, materials, estimated duration, approximation notes, geometry states, ordered steps, final state |
| `GenerationError` | Error code, user-readable explanation, retry availability |

Keep executable parameter formulas inside trusted recipe code. AI output and API requests contain data only. Assign stable identifiers so the diagram, animation, and text refer to the same corners and layers.

## 6. Build phases and team responsibilities

The schedule is an aggressive target, not a guarantee. Geometry authoring is the critical path, particularly with no existing origami or graphics experience. Work proceeds under the repository's issue-assignment and branch workflow; roles below are suggestions, not assignments or created tickets.

| Time | Phase | Outputs and exit criteria |
| --- | --- | --- |
| 0:00–1:00 | Feasibility and foundation | Run one local vision inference; establish the first adjustable construction; animate at least one real step; enumerate the complete recipe and its required operations. Record unresolved geometry and latency risks. |
| 1:00–2:00 | Contracts and complete vertical slice | Define shared schemas; compile one recipe instance through every step; wire upload/crop to a deterministic sample tutorial while the model integration progresses. Clearly distinguish sample data. |
| 2:00–3:30 | Personalisation and tutorial rendering | Integrate image analysis and bounded parameters; produce consistent final preview, SVG diagrams, step text, and 3D motions. Complete Back/Replay/Next. |
| 3:30–4:30 | End-to-end integration | Connect live photo input to preview and accepted tutorial; handle failures; add material/component guidance. Add a second recipe only if the first flow is stable. |
| 4:30–5:30 | Validation and refinement | Exercise varied parameters and photos; check geometry continuity and step controls; measure latency; fix misleading instructions and visual states. |
| 5:30–6:00 | Demo and handoff | Rehearse the digital walkthrough, confirm local startup, document actual checks and limitations, and prepare online submission materials required by the event. |

Suggested ownership: one person owns recipe geometry and sequence compilation; one owns 3D/SVG tutorial rendering; one owns upload/preview UI and local AI integration; a fourth owns integration, content consistency, and demo verification. With three people, distribute integration work explicitly. Shared schemas, dependencies, and lockfiles have one coordinating owner.

Foundation deliverables include agreed brief/architecture/contracts, application commands, environment placeholders, and actionable assigned issues. This PRD does not itself authorise unassigned implementation or remote publication.

## 7. Acceptance and validation

### Required digital walkthrough

- Upload and crop a photograph of an everyday object.
- Obtain an honest supported approximation with some volume and a sheet count of one to four.
- Accept or reject the preview before entering the guide.
- Demonstrate photo-dependent geometric variation rather than changing only a label or colour.
- Traverse every step from starting squares to the same final geometry shown in the preview.
- See a diagram, relevant highlighted corners, short explanatory text, and the defined animation for each applicable fold.
- Use Back and Replay without state drift; handle component changes and assembly explicitly.
- Demonstrate clear retry behaviour for failed generation and a weak-match preview for a complex input.

### Automated and engineering checks

- Schema tests reject unknown recipes, unsupported operations, invalid numeric values, and malformed AI responses.
- Recipe tests exercise boundaries and interior parameter combinations, checking finite geometry, valid references, nondegenerate faces, and operation-specific constraints.
- Simple rigid-fold tests preserve face dimensions and produce repeatable before/after states.
- Consistency tests ensure the preview equals the final compiled tutorial state, and every highlight references a real landmark.
- UI checks cover upload validation, crop, rejection/retry, acceptance, first/last steps, and navigation during animation.
- Measure end-to-end latency on the actual Mac after model warmup; separately record cold-start behaviour. Treat 30 seconds as a target until measured.
- Confirm the app can run locally after setup without network inference. Run the application's typecheck, tests, and production build once implemented.

Physical folding of representative parameter choices is strongly useful engineering evidence, but no observed beginner-completion test is mandated. Record whether physical checks occurred, which configurations were checked, and what remains unverified. Neither visual plausibility nor numeric mesh validation proves physical foldability.

## 8. Stretch work, open decisions, and evidence

### Stretch priorities

1. Download a PDF tutorial with the same instantiated diagrams and text as the browser guide.
2. Add further adjustable recipe families and verified component connections.
3. Expand the implemented fold vocabulary with coherent constructions and compound-motion handlers.

### Open decisions and risks

- **Recipe feasibility:** exact construction recipes, valid parameter domains, and multi-sheet connection designs are not yet established. They require the first implementation experiment.
- **Fallback:** the owner has not selected a scope fallback if geometry work fails or overruns. Revisit with evidence at the first-hour checkpoint.
- **Model performance:** Qwen3-VL 4B accuracy and latency on the available Mac have not been measured; 2B is an evaluation option, not an automatic substitution.
- **External rules:** only the theme is known. Event rules, permitted dependencies, submission format, and judging criteria remain unconfirmed.
- **Dependencies and content:** pin versions during foundation; record source permissions and attribution for any incorporated construction or asset. Rabbit Ear adoption remains optional and unevaluated.
- **Coverage:** a small set of recipes will yield weak approximations for many everyday objects. The preview and explicit user acceptance are essential.

### Research sources

Checked during planning on 2026-11-21. These sources establish capabilities; no dependency has been installed or benchmarked for this project.

- [Ollama Qwen3-VL models](https://ollama.com/library/qwen3-vl): image-capable variants, including 2B and 4B.
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs): schema-constrained model responses.
- [Three.js documentation](https://threejs.org/docs/): geometry, rendering, and animation primitives.
- [FOLD format and tools](https://github.com/edemaine/fold): origami mesh representation and supporting utilities.
- [Rabbit Ear](https://github.com/rabbit-ear/rabbit-ear): computational origami geometry library; alpha status and GPLv3 license.
- [Origami Simulator](https://github.com/amandaghassaei/OrigamiSimulator): simulation of crease patterns with simultaneous folding, not automatic sequential tutorial generation.

## 9. Document handoff

This file records the interview decisions and clearly labelled technical recommendations. No application code, issue assignment, remote update, deployment, or physical folding verification is implied by its creation. Next: use the geometry and model feasibility findings to resolve the listed open decisions, then create and manually assign implementation issues through the repository workflow.
