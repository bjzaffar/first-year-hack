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
- **Uncertainty / limitations:** No physical paper fold or complete geometry prototype was performed in this investigation. The two instances above are dimensional calculations only, not `GeometryState` fixtures or foldability checks. Consequently, no moving-layer collision, final-volume, or physical-foldability result is claimed. A separate tray-carton kinematics paper describes inward-moving gussets captured by a folded double wall, illustrating the compound-motion issue ([Matthews, tray-carton kinematics](https://purehost.bath.ac.uk/ws/portalfiles/portal/303430/Matthews_CAD_2010_42_3_257.pdf), 2010). Rigid-foldability research also cautions that a set of crease lines alone is not evidence that a complete motion is valid ([Abel et al., *Rigid Origami Vertices*](https://erikdemaine.org/papers/RigidOrigami_JoCG/paper.pdf), 2016).
- **Result / follow-up:** The parameterized construction is plausible and has an analytic dimension equation, but its exact folds and state transitions remain unproven. Continue the T003 spike by deriving and authoring the generalized Masu crease coordinates and all operations, then physically fold and verify the two sample dimensions plus bounds before publishing recipe contracts. Until then the ticket remains blocked and T005/T006 are not ready. Rabbit Ear was not evaluated or adopted.

## Chosen direction

TBD — reference the user's scope decision and docs/brief.md.

## Open risks and fallback options

TBD
