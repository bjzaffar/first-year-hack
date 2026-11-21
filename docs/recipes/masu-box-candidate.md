# T003 candidate: generalized one-sheet Masu box

Status: **experimental geometry spike; not a registered recipe**. The wall motion is validated in isolation. The corner and rim-flap motions are not yet specified as continuous, collision-checked states.

## Provenance and scope

The Masu is identified as a traditional model by Hans Dybkjær's [Masu Box instructions](https://www.origamiforblinde.dk/en/models/masu.html), whose page is licensed CC BY 4.0. That page provides a one-square-sheet folding sequence including pre-creases, opening, corner-pocket formation and tucking a flap into the bottom. Attribute the page and retain its license terms if adapting its wording or diagrams. No text or diagrams from it are copied here. The traditional design's original author is not identified.

V'Ann Cornelius and Arnold Tubis, “On the Effective Use of Origami in the Mathematics Classroom,” *Origami 4* (2009), [DOI 10.1201/B10653-49](https://doi.org/10.1201/B10653-49), Figure 5, show a generalized Masu crease pattern and boxes of differing proportions from equal-size square sheets. The figure labels paper edge `l`, box-face edge `s`, height `h`, and gives `s + 2h = l√2/2`. This specification records the equation and derives its consequences; it does not reproduce the figure. The publisher's figure/text license has not been established, so do not copy its diagram.

## Candidate domain and crease coordinates

Let the starting square be `[0,l] × [0,l]`. Rotate and center coordinates:

```text
u = (x + y - l) / √2
v = (x - y) / √2
R = l / √2
```

The square sheet becomes the diamond `|u| + |v| ≤ R`. The candidate box has a centered square floor of side `s` and wall height `h`; the source relation gives:

```text
s + 2h = R
s = R - 2h
0 < h < R/2       (equivalently, 0 < h/l < 1/(2√2))
```

For a selected `h`, set `q = R/2`. The candidate crease net partitions the sheet as follows:

- Floor: square `[-s/2,s/2] × [-s/2,s/2]` in `(u,v)`.
- Four wall panels: the four `s × h` strips between the floor and the centered square `[-q,q]²`.
- Four corner gussets: the `h × h` squares in the corners of `[-q,q]²`, each divided by its diagonal.
- Four rim flaps: the four triangles between each side of `[-q,q]²` and the corresponding diamond edge. Each has base `R` and altitude `R/2`.

This partition is area-consistent: the center square has area `R²`, and the four outer triangles total `R²`; together they equal the source square's area `l² = 2R²`. It is an authored planar partition inferred from the dimension relation, not a transcription or verification of Figure 5's complete crease pattern. Internal subdivisions required by the authored fold sequence may still be missing. It is not yet evidence that this net folds into the documented Masu box.

The local mesh identifiers are stable within the spike: sheet `paper-1`; floor `floor`; walls `wall-north`, `wall-east`, `wall-south`, `wall-west`; corner triangles `gusset-{ne,nw,se,sw}-{a,b}`; rim flaps `rim-flap-{north,east,south,west}`; floor landmarks `base-nw`, `base-ne`, `base-se`, `base-sw`; and outer-square landmarks `outer-nw`, `outer-ne`, `outer-se`, `outer-sw`. `MasuFlatNetSchema` checks unique IDs, face references, nonzero face areas, edge incidence, connected disk topology, square-sheet boundary, and total area. It emits internal edges as `candidate-crease` and boundary edges as `boundary`; all assignments remain `U` because the full fold sequence has not been proven. It does not assign mountain/valley signs or layer order.

The mathematical domain keeps both `s` and `h` positive. It is not a proven physical interval: near either limit, the floor or wall degenerates. The prototype exercises three interior values at `l=1`:

| `h/l` | `s/l` | `s²h/l³` (ideal volume) |
|---:|---:|---:|
| 0.10 | 0.507107 | 0.025716 |
| 0.15 | 0.407107 | 0.024860 |
| 0.20 | 0.307107 | 0.018863 |

These are analytic dimension instances, not complete folded-box meshes. The theoretical endpoints `h/l=0` and `h/l=1/(2√2)` are rejected as degenerate.

## Candidate operation plan

The source folding sequence and the generalized crease layout identify the needed actions, but their correspondence has not been demonstrated yet. This ordered plan is a hypothesis to verify before promoting any operation to a shared contract:

1. Pre-crease the square and turn it to the working orientation.
2. Fold the four corners to the center to establish the layered starting packet.
3. Pre-crease and reopen opposite edge packets in both axes; open the two selected corners.
4. Raise opposing wall panels about their floor edges.
5. Raise the remaining walls while each corner gusset folds inward along its diagonal; keep the two resulting triangular layers inside the corner.
6. Fold each rim flap over the wall and into the cavity until its tip lands at the prescribed floor landmark.
7. Repeat the corner and rim-flap closure at the opposite end; check the open top and final floor/wall arrangement.

Only action 4's north-wall hinge is currently represented by an executable motion. Its axis is `base-nw`→`base-ne`, its moving face is `wall-north`, and its target is 90°. Required corner operations must explicitly move both gusset triangles around `base-corner`→`outer-corner`, choose the inward branch, and state the order in which those triangles lie against the two adjacent walls. Required rim-flap operations need all crease lines, submotion axes, final tip landmarks, and a consistent stack order where flaps overlap. Those additional crease lines are not yet present in the candidate panel partition. Mountain/valley signs and before/after geometry states for either compound action remain unknown. The T002 `FoldOperationSchema` admits a single hinge only. Do not add placeholder operations to that shared schema or expose this candidate to the model until these contracts have been checked.

## Prototype and evidence

The isolated prototype is [masu-box.ts](../../src/recipes/masu-box.ts), driven by [t003-masu-spike.ts](../../scripts/t003-masu-spike.ts):

- `MasuBoxCandidateParametersSchema` checks `0 < h/l < 1/(2√2)`.
- `MasuFlatNetSchema` validates the proposed 17-face flat partition of one square sheet.
- `MasuNetEdgeSchema` exports stable face-adjacency edges as candidate crease or sheet boundary records.
- `masuBoxDimensions` calculates `s`, `h`, and idealized `s²h`.
- `MasuWallHingeOperationSchema` specifies the north-wall hinge axis and 0°→90° target.
- `masuNorthWallMotion` returns flat, intermediate, or upright vertices for that wall; `masuNorthWallEdgeLengths` checks rigidity.
- `masuNorthWestCornerCompatibility` measures the landmark mismatch produced by the tempting but invalid independent-walls-first construction. At a corner, the shared flat landmark `outer-nw` is predicted at `(-s/2, q, h)` by the west-wall-attached triangle and `(-q, s/2, h)` by the north-wall-attached triangle, where `q=s/2+h`. Their separation is `√2 h` for every positive wall height. This proves those two isolated 90° wall motions cannot be composed while keeping that gusset landmark intact. It does not rule out a coupled corner collapse; that coupled path remains to be derived.

Observed command: `npx tsx scripts/t003-masu-spike.ts` passed for the three interior samples, including the 0°/45°/90° motion values, shared hinge axis, upright endpoint and unchanged moving-face edge lengths. The two degenerate endpoints were rejected. `npm run typecheck` passed. These checks cover one wall only. They do not check any gusset, flap, overlap, complete volume mesh, or complete tutorial state continuity.

No physical fold was checked. Rabbit Ear was screened against the current gap using its [official repository](https://github.com/rabbit-ear/rabbit-ear) on 2026-11-21. The project describes FOLD graph modification, math, SVG/WebGL rendering and origami-related calculations, but not authored sequential tutorial planning or a proof for this candidate's compound motion. It is not a useful dependency for the missing construction evidence, so it was not installed or adopted. Its repository is GPL-3.0; any later adoption would need a distribution/licensing review before adding it to the app.

## Handoff gate

Before T003 can publish production schemas/fixtures or mark T005/T006 ready, derive the per-face crease graph and layer order for steps 1–7, encode each compound motion as ordered supported submotions, and inspect the moving layers and resulting geometry at both parameter limits and an interior value. The independent-wall construction fails the shared-landmark check above, so it cannot stand in for this derivation. The exact assignments must be confirmed against a paper prototype or a documented, appropriately licensed construction. Until then the candidate remains outside `RecipeIdSchema` and downstream work stays blocked.
