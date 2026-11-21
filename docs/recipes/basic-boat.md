# Basic pointed boat (T008 owner-approved addition)

This original minimal construction produces a pointed, open V-hull from one square sheet. It is a basic boat/kayak approximation, with no deck, cockpit or paddle. No external diagrams or instructions were copied. Physical folding, shape retention and flotation are unverified; it is not claimed to be watertight.

Place the unit square as a diamond, with vertices `(±1/√2, 0)` and `(0, ±1/√2)`. Let `w = hullWidthFraction` in [0.24, 0.30]. Fold the north tip 180° around `y=w`, then the south tip around `y=-w`. Raise the positive-y half of the folded packet 55° around the long x-axis, then raise its negative-y half 55°. All layers fold together at the keel. The open angle is 70°; reinforcing the crease is needed to retain the V shape.

The entire square is partitioned at `y=-2w,-w,0,w,2w`. The ±2w creases become coincident with the keel after the tip folds. All six panels retain their initial dimensions; vertices shared by adjacent panels remain shared throughout. The selected domain ensures tip flaps do not cross the opposite tip-fold axis. Each operation is a rigid hinge; there is no vertex interpolation, cutting, added geometry or independent preview rescaling.

`src/recipes/boat.ts` defines the net, instructions and sampler. `src/geometry/boat-compiler.ts` validates the four-step sequence and five exact geometry states. The final preview is `boat-state-4`. Narrower w produces a narrower hull; photo analysis chooses a supported value. The fixed side angle is authored, not a model-supplied operation.

Run `npm test -- tests/boat.test.ts` for area conservation, rigid distances at 252 sampled frames, finite coordinates, step continuity, pointed aspect ratio, repeatable navigation, invalid domain/output rejection and real-adapter contract integration. Full application checks remain `npm run typecheck`, `npm test`, `npm run build` and `python3 scripts/check_template.py`.
