# Research and feasibility

Status: UNSET. Research the actual event and candidate ideas before selecting implementation.

For each material finding record: question, source URL, date checked, evidence, implication, uncertainty, and follow-up experiment/issue. Separate evidence from assumptions; prefer official technical documentation. Do not paste secrets or large copyrighted source extracts.

## Event constraints

TBD

## Candidate approaches and tradeoffs

TBD — compare feasibility, demo value, time, dependencies, and cost.

## Feasibility spikes

TBD — time-box uncertain integrations; define a pass/fail result and fallback.

### T003 — first adjustable open-container recipe (2026-11-21)

- **Question:** Can the traditional one-sheet Masu box provide a beginner sequence and a bounded, photo-dependent geometry parameter without inventing unsupported folds?
- **Source / provenance:** Hans Dybkjær's [Masu Box instructions](https://www.origamiforblinde.dk/en/models/masu.html) identify the model as traditional and the page as CC BY 4.0. They describe one square sheet and a sequence involving a blintz, pre-creases, opening, pushing in diagonal creases to form pockets, and folding a flap into the base. The page gives no original designer for the traditional model. Cornelius and Tubis, [“On the Effective Use of Origami in the Mathematics Classroom”](https://doi.org/10.1201/B10653-49), *Origami 4* (2009), Figure 5, show a generalized Masu crease pattern and several boxes folded from equal-size squares. No diagrams or instruction text were copied into this repository; the chapter's formula is recorded below as a factual source with attribution.
- **Check date / evidence:** 2026-11-21. Figure 5 gives `s + 2h = l√2/2`, where `l` is the square sheet edge, `s` the box-face edge and `h` the box height. Positive dimensions imply `0 < h < l/(2√2)` and `s = l/√2 - 2h`. For normalized `l=1`, `h=0.10` gives `s≈0.5071`, and `h=0.20` gives `s≈0.3071`; both are nondegenerate analytic dimension instances. This is enough to establish a candidate coupled parameter relation, but not the full crease coordinates, layer order, or valid animated motion. The local T002 contract admits only the synthetic hinge recipe and a single `hinge` operation; it has no operation for opening/reversing a folded layer, inward squash folds, or capturing a corner flap.
- **Implication:** The generalized Masu is a better recipe candidate than the fixed 2:1 example, and its dimension equation supplies a candidate positive domain. Do not register it as a live recipe or mark T005/T006 ready until an authored crease construction and complete fold sequence are encoded and checked at boundary/interior values. The source relation alone does not establish collision-free geometry or a practical paper domain.
- **Uncertainty / limitations:** The prototype now covers three interior dimensions, one 0°→90° wall hinge, and a rigid-panel final layout. Each face preserves its edge lengths; four rim-tip triangles tile the floor, central bands overlay the walls, and the two gussets plus two corner patches coincide at each corner. No continuous coupled fold path or intermediate collision test has been performed, and no physical paper fold was checked. A separate analytic check rejects raising adjacent walls independently: their shared `outer-nw` landmark separates by `√2h`, so the corner must collapse as a coupled motion. The candidate and remaining operation work are documented in [the Masu feasibility spec](recipes/masu-box-candidate.md). A tray-carton kinematics paper describes inward-moving gussets captured by a folded double wall, illustrating the compound-motion issue ([Matthews, tray-carton kinematics](https://purehost.bath.ac.uk/ws/portalfiles/portal/303430/Matthews_CAD_2010_42_3_257.pdf), 2010). Rigid-foldability research also cautions that a crease set alone does not establish a valid motion ([Abel et al., *Rigid Origami Vertices*](https://erikdemaine.org/papers/RigidOrigami_JoCG/paper.pdf), 2016).
- **Result / follow-up:** The source dimension relation and revised 29-face net yield a mathematically consistent candidate endpoint across the sample range. This reduces the risk from a flat-partition mismatch, but the operation sequence is not yet validated through that endpoint. Handoff work: encode the coupled corner collapse and rim tuck as supported operations; sample their complete motions for collision and layer order at interior and near-boundary values; confirm the authored net against the documented construction or a physical prototype; then publish recipe fixtures/contracts and unblock T005/T006. Rabbit Ear was screened and not adopted because it does not supply this sequential evidence; its GPL-3.0 implications are recorded in the recipe spec.

## Chosen direction

TBD — reference the user's scope decision and docs/brief.md.

## Open risks and fallback options

TBD
