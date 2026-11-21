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
- **Uncertainty / limitations:** An isolated math/geometry prototype now covers three interior dimensions and one 0°→90° wall hinge, but no physical paper fold or complete box-state prototype was performed. A new analytic check rejects the naive sequence of raising adjacent walls independently: it puts their shared `outer-nw` paper landmark `√2h` apart. This demonstrates that a coupled gusset collapse is required; it does not establish whether such a coupled path is collision-free. The samples are not complete `GeometryState` fixtures. The authored planar partition has not been matched to the source crease pattern, and may omit crease subdivisions. Gusset/flap collision, final assembled volume, and physical foldability remain unverified. The candidate and operation gap are documented in [the Masu feasibility spec](recipes/masu-box-candidate.md). A separate tray-carton kinematics paper describes inward-moving gussets captured by a folded double wall, illustrating the compound-motion issue ([Matthews, tray-carton kinematics](https://purehost.bath.ac.uk/ws/portalfiles/portal/303430/Matthews_CAD_2010_42_3_257.pdf), 2010). Rigid-foldability research also cautions that a set of crease lines alone is not evidence that a complete motion is valid ([Abel et al., *Rigid Origami Vertices*](https://erikdemaine.org/papers/RigidOrigami_JoCG/paper.pdf), 2016).
- **Result / follow-up:** The generalized Masu has an analytic candidate domain and an area-consistent planar partition, but no complete foldable recipe has been established. The wall hinge prototype passed its geometric invariants; gusset and rim-flap motions remain unverified, so no production recipe/operation contracts were published. Continue by matching the full crease pattern, deriving the face/layer graph and validating the complete sequence, including boundary and interior values, before publishing shared schemas/fixtures. Until then, the recipe is unverified and T005/T006 are not ready. Rabbit Ear's official repository was screened; it was not adopted because it offers no tutorial-sequence evidence for this gap. Its GPL-3.0 license is recorded in [the Masu feasibility spec](recipes/masu-box-candidate.md).

## Chosen direction

TBD — reference the user's scope decision and docs/brief.md.

## Open risks and fallback options

TBD
