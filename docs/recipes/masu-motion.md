# T003 complete digital construction and handoff

This completes the **digital feasibility prototype**, building on PR #18's [29-panel net](masu-box-candidate.md). It is an authored generalized box construction, not a claim to reproduce the traditional Masu tutorial verbatim. The original endpoint left four corner packets projecting diagonally into the cavity; the new final state lays those packets against the north/south walls. No second recipe, external geometry library, production compiler, or live API integration is included.

## Evidence and limits

The continuation's first derivation and targeted test pass were completed within a one-hour investigation. The original PR did not record its investigation duration. The earlier independent-wall attempt remains a useful failing construction: its shared corner separates by `sqrt(2) h`. The replacement moves all connected panels together, keeps a single position for each sheet vertex, and preserves **all** pairwise distances within every face, including quadrilateral diagonals.

**No physical paper fold was performed.** Retention of shape, ease of performing the simultaneous lift, paper thickness, and beginner completion remain unverified. The prototype provides a complete continuous zero-thickness path and explicit corner closure, not a general collision solver or a physical-foldability certification. The full PRD demo and its 5–20 minute folding-time target have not been tested. Do not invent an estimated duration from this spike.

The provenance and permissions recorded in the [candidate notes](masu-box-candidate.md) remain applicable. Hans Dybkjær's CC BY 4.0 traditional Masu instructions describe blintzing, raising walls, pushing in diagonal corner pockets, and wrapping end flaps onto the floor. Our construction instead keeps all four blintzed tips on the floor while raising four walls together, then rotates the corner packets onto the walls. This alternate sequence and its equations are original project code; no source diagrams or text are reproduced. The published dimension relation motivates the net; this is not a verified transcription of the publisher's crease drawing. Rabbit Ear is not adopted; no license/dependency changes.

## Domain and equations

Use unit square paper. Coordinates are the candidate's rotated `(u,v)` frame, not its translated original `(x,y)` frame. One sheet `paper-1`, one component `box`; all 29 face IDs and 28 vertex IDs stay fixed. The floor remains in `z=0` throughout.

`h = wallHeightFraction`, `s = 1/sqrt(2) - 2h`, `q = 1/(2sqrt(2))`.

The supported **digital motion domain is [0.06, 0.16]**, inclusive. The old mathematical domain `(0, 1/(2sqrt(2)))` is not the recipe domain. We require `2h < s`: opposite corner packets on a wall have disjoint interiors, with positive clearance even at the upper bound. This conservative interval gives nonzero faces and volume; it is not a measured paper-thickness tolerance. Scaling physical paper changes all lengths uniformly, not the fraction.

| h | s | nominal volume s²h |
| --- | --- | --- |
| 0.06 | 0.587107 | 0.020682 |
| 0.10 | 0.507107 | 0.025716 |
| 0.16 | 0.387107 | 0.023976 |

For the northeast corner, relative to its floor corner, the wall-top vertices are `B=(h cos θ,0,h sin θ)` and `C=(0,h cos θ,h sin θ)`. The shared outer corner is `D=(d,d,z)` with:

```text
θ = progress π/2
z = h sin θ (2 + sqrt(2) cos θ) / (1 + sin² θ)
d = h (cos θ - sqrt(2) sin² θ) / (1 + sin² θ)
```

Other corners use their outward x/y signs. These formulas solve `D·B=D·C=h²`, `|D|²=2h²`, and take the inward branch. They have no division by `cos θ` at the upright endpoint. Each gusset triangle is rigid; both triangles share the same `D`. Bands overlay their corresponding walls, the `flap-*` vertices stay on the floor corners, and all `paper-*` tips stay at the floor centre. Thus the blintzed corner patches accompany their matching gusset triangles without tears. At θ=π/2, `D` is horizontally `h/sqrt(2)` inward in each direction and at height h.

The final corner action rotates this four-layer packet about the vertical floor-corner→wall-top axis by 45 degrees, until its free edge lies on the inside north or south wall. Its inward offsets are `(h cos α,h sin α)` with `α=(1-progress)π/4`; signs follow the corner. There is no vertex interpolation or topology change.

## Ordered actions and contracts

The crease locations are parameter-dependent: floor edges at `u,v=±s/2`, blintz edges at `±q`, rim-tip edges at `±(q+h)`, and the corner diagonals from `base-*` to `outer-*`. Refer to the full flat net for every face/crease; these lines are the intended folds, not a claim that the input paper is already folded. The demonstration starts from an entirely flat square. Each action introduces its named creases as it moves; there are no hidden precreases, unfolds, turns, assemblies, or endpoint jumps. Simultaneously establishing the corner creases is likely to need practice and remains a usability limitation.

| Step IDs, in order | Action / axes / moving layers | Preconditions → postconditions |
| --- | --- | --- |
| blintz-north, east, south, west | Rotate each complete outer triangle 180° upward about its `outer-*` edge; centre band, two corner patches and tip move together | Square/previous packets flat → next paper tip at centre; outer triangle reflected onto central square |
| raise-walls-together | `masu-inward-v1` coupled solver above; all four walls, bands, eight gussets and eight rim corner patches move | All four blintzes complete → walls upright, tips still on floor, four inward corner packets |
| lay-gusset-nw, ne, se, sw | Four faces containing the relevant `outer-*` rotate 45° about the vertical `base-*`→`corner-*-in-north/south` axis | Walls upright → NW/NE packets against north wall; SE/SW against south wall; open cavity |

`src/shared/masu-contract.ts` is the additive handoff entry point:

- `MasuMotionParametersSchema`: strict bounded parameter object; rejects extra fields and non-finite values.
- `MasuMotionRequestSchema`: strict parameters, enumerated step, progress in [0,1].
- `MasuOperationSchema`, `masuOperations`: enumerated packet hinge, coupled solver, corner hinge definitions. The solver, signs and path in `sampleMasuMotion` are normative; a consumer must not replace them with independent hinges or linear interpolation.
- `masuMotionContract`: recipe `masu-box` version `0.1.0`, sheet/component, bounds, ordered steps, prerequisites, exact affected face IDs, original instructions.
- `sampleMasuMotion(parameters, step, progress)`: whole-sheet frame in the rotated frame, stable vertices/faces/edges. Pure and deterministic; Back/Replay sample saved inputs and cannot accumulate drift.
- `masuMotionFixtures`: three parameter instances with flat state plus all nine saved endpoints. Preview is the last saved state. For step i the before state is `states[i]` and after is `states[i+1]`.
- `masuCornerLayerStacks`: four coincident corner faces ordered from negative to positive along the ordered `gusset-*-a` normal. Wall bands cover walls; tip triangles cover the floor. Shared vertices/face identities survive exact contact. Visual offsets must remain separate from geometric coordinates.

The candidate's `U` crease assignments are preserved as unknown static assignments; **operation direction comes from the explicit motion**, not a guessed global M/V assignment. A single global layer integer is insufficient for this changing overlap arrangement. The local stack contract supplies contact identity and ordering, not finite-thickness separation.

## Collision reasoning and validation

Each blintz rotates an outer triangle above its own disjoint triangular sector, meeting earlier packets only at the final shared boundaries. During erection, each pair of gussets and its overlay patches remains in its own corner region; `2h<s` separates opposite corner regions. The floor tips remain at z=0, while moving wall/gusset interiors remain above that plane. During corner closure, packets sweep toward their adjacent wall within those separate corner regions. Exact coincident layers are expected at packet contacts. Finite-thickness collisions, friction and locking are outside this zero-thickness argument.

The regression suite checks seven parameters (bounds, boundary-near and interior), nine actions and 41 samples per action: **2,583 whole-sheet frames**. It checks every face's pairwise distances and nondegeneracy, shared vertex identity, complete affected-face coverage, continuity across all actions, supported-domain clearance, final tips and wall heights, and invalid-input rejection. An additional three-parameter sweep tests 19 interior frames/action for proper transverse triangle penetrations. The latter deliberately excludes exact contacts/coplanar overlap and is sampled evidence, not a continuous general collision proof.

Reproduce from the PR branch:

```sh
npm ci
npm test -- tests/masu-motion.test.ts
node --import tsx scripts/t003-masu-spike.ts
node --import tsx scripts/t003-masu-demo.ts /tmp/foldlens-t003-demo.html
npm run typecheck
npm test
npm run build
python3 scripts/check_template.py
git diff --check
```

Observed on 2026-11-21 after integrating `main` at `cb38822`: all **64 tests in five files passed**, the production build/typecheck passed, the original spike and standalone demo generator ran successfully, and template/whitespace checks passed. The first full-suite attempt inside the sandbox could not bind loopback; the rerun with loopback permission passed.

Open the generated standalone HTML to compare all three proportions and inspect every action with Back/Replay/Next, motion samples and top/side/oblique views. It requires no server or network. Browser interaction/visual inspection was unavailable in the agent environment and is explicitly not claimed as passed.

## Integration gate

T003 publishes this recipe-local contract for review; it deliberately does not widen the current synthetic-only HTTP schemas or claim the real compiler is installed. T005 can build a compiler against these pure functions and domain fixtures; T006 must implement all three operation kinds and preserve local layer identity. The integration owner must approve and merge this contract before those workers start, then coordinate the production `RecipeDefinition`/`CompiledTutorial` union and provider catalog changes. T008 enables live generation only after both implementations exist. The initial PR's endpoint-only code remains historical spike evidence; **use `sampleMasuMotion` and its final state for the completed construction**, not `masuFoldedLayout`.
