import { z } from "zod";
import {
  GeometryStateSchema,
  CameraSchema,
  type GeometryState,
} from "../shared/schemas.js";
import {
  MasuMotionParametersSchema,
  MasuOperationSchema,
  masuMotionContract,
  masuOperations,
  masuCornerLayerStacks,
  sampleMasuMotion,
  masuMotionStepIds,
} from "../shared/masu-contract.js";
import { masuBoxDimensions } from "../recipes/masu-box.js";

const id = z.string().min(1);
export const MasuAnalysisSchema = z.strictObject({
  recipeId: z.literal("masu-box"),
  parameters: MasuMotionParametersSchema,
  objectLabel: z.string().min(1).max(2000),
  approximationNotes: z.array(z.string().min(1).max(2000)).min(1),
});
export const MasuTutorialSchema = z
  .strictObject({
    contractVersion: z.literal("masu-1"),
    id,
    recipeId: z.literal("masu-box"),
    recipeVersion: z.literal("0.1.0"),
    parameters: MasuMotionParametersSchema,
    synthetic: z.literal(false),
    materials: z.strictObject({
      sheets: z.tuple([
        z.strictObject({
          id: z.literal("paper-1"),
          componentId: z.literal("box"),
          format: z.literal("square"),
        }),
      ]),
      sameSize: z.literal(true),
    }),
    estimatedMinutes: z.null(),
    approximationNotes: z.array(z.string()).min(1),
    states: z.array(GeometryStateSchema).length(10),
    finalStateId: id,
    steps: z
      .array(
        z.strictObject({
          id: z.enum(masuMotionStepIds),
          index: z.number().int(),
          sheetId: z.literal("paper-1"),
          componentId: z.literal("box"),
          operation: MasuOperationSchema,
          affectedFaceIds: z.array(id).min(1),
          prerequisites: z.array(id),
          beforeStateId: id,
          afterStateId: id,
          animation: z.strictObject({ durationMs: z.number().positive() }),
          camera: CameraSchema,
          diagramCamera: CameraSchema,
          highlightLandmarkIds: z.array(id).min(1),
          instruction: z.string().min(1),
        }),
      )
      .length(9),
  })
  .superRefine((t, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (t.states.length !== 10 || t.steps.length !== 9) return;
    if (new Set(t.states.map((s) => s.id)).size !== 10)
      fail("Duplicate states");
    if (t.finalStateId !== t.states[9].id) fail("Invalid final state");
    t.steps.forEach((step, i) => {
      const expected = masuMotionContract.steps[i];
      if (
        step.id !== expected.id ||
        step.index !== i ||
        step.beforeStateId !== t.states[i].id ||
        step.afterStateId !== t.states[i + 1].id
      )
        fail("Invalid sequence");
      if (
        JSON.stringify(step.operation) !== JSON.stringify(masuOperations[i]) ||
        JSON.stringify(step.prerequisites) !==
          JSON.stringify(expected.prerequisites) ||
        JSON.stringify(step.affectedFaceIds) !==
          JSON.stringify(expected.affectedFaceIds)
      )
        fail("Unsupported operation");
      for (const state of [t.states[i], t.states[i + 1]]) {
        if (
          step.highlightLandmarkIds.some(
            (id) => !state.landmarks.some((l) => l.id === id),
          )
        )
          fail("Unknown highlight");
        if (
          step.affectedFaceIds.some(
            (id) => !state.faces.some((f) => f.id === id),
          )
        )
          fail("Unknown face");
      }
    });
    t.states.forEach((state, i) => {
      const expected = masuState(t.parameters, masuMotionStepIds[Math.max(0, i - 1)], i === 0 ? 0 : 1, state.id);
      if (JSON.stringify(state) !== JSON.stringify(expected)) fail("Geometry differs from authored recipe state");
    });
  });
export type MasuTutorial = z.infer<typeof MasuTutorialSchema>;
export const masuLimitations = [
  "Original generalized box construction; physical folding, thickness and shape retention remain unverified.",
  "Approximates objects with a square open container; no handles or decoration.",
  "Folding time has not been measured.",
];

export function masuState(
  parameters: z.infer<typeof MasuMotionParametersSchema>,
  step: (typeof masuMotionStepIds)[number],
  progress: number,
  id = "motion",
): GeometryState {
  const frame = sampleMasuMotion(parameters, step, progress);
  return GeometryStateSchema.parse({
    id,
    vertices: frame.vertices,
    edges: frame.edges.map((e) => ({
      id: e.id,
      vertices: e.vertexIds,
      assignment: e.kind === "boundary" ? "B" : "U",
    })),
    faces: frame.faces.map((f) => ({
      id: f.id,
      sheetId: "paper-1",
      vertices: f.vertexIds,
      layer:
        Object.values(masuCornerLayerStacks)
          .find((stack) => stack.includes(f.id))
          ?.indexOf(f.id) ??
        (f.role === "rim-tip" || f.role === "rim-flap" ? 1 : 0),
    })),
    landmarks: frame.vertices.map((v) => ({ id: v.id, vertexId: v.id })),
  });
}

/** Conservative fitting policy: accept the established domain exactly; never silently clamp model output. */
export function compileMasu(input: unknown): MasuTutorial {
  const analysis = MasuAnalysisSchema.parse(input);
  const { parameters } = analysis;
  const { baseSide, wallHeight } = masuBoxDimensions(1, parameters);
  if (2 * wallHeight >= baseSide)
    throw new RangeError("Opposing corner packets overlap");
  const states = [
    masuState(parameters, "blintz-north", 0, "state-0"),
    ...masuMotionStepIds.map((step, i) =>
      masuState(parameters, step, 1, `state-${i + 1}`),
    ),
  ];
  const steps = masuMotionContract.steps.map((s, i) => {
    const operation = masuOperations[i];
    const highlightLandmarkIds =
      operation.kind === "coupled-walls"
        ? ["base-nw", "base-ne", "outer-nw", "outer-ne", "outer-se", "outer-sw"]
        : [
            ...operation.axisLandmarkIds,
            i < 4
              ? ["paper-n", "paper-e", "paper-s", "paper-w"][i]
              : `outer-${["nw", "ne", "se", "sw"][i - 5]}`,
          ];
    return {
      id: s.id,
      index: i,
      sheetId: "paper-1",
      componentId: "box",
      operation,
      affectedFaceIds: s.affectedFaceIds,
      prerequisites: s.prerequisites,
      beforeStateId: states[i].id,
      afterStateId: states[i + 1].id,
      animation: { durationMs: i === 4 ? 3000 : 1800 },
      camera: {
        position: i < 4 ? [1, -1, 2] : [1, -1, 0.9],
        target: [0, 0, wallHeight / 2],
      },
      diagramCamera: {
        position: i < 4 ? [0, 0, 3] : [1, -1, 1.5],
        target: [0, 0, 0],
      },
      highlightLandmarkIds,
      instruction:
        s.instruction +
        (i === 4
          ? ` The marked floor is ${(baseSide * 100).toFixed(1)}% of the sheet edge wide; raise the walls to ${(wallHeight * 100).toFixed(1)}% of that edge.`
          : ""),
    };
  });
  return MasuTutorialSchema.parse({
    contractVersion: "masu-1",
    id: "masu-tutorial",
    recipeId: "masu-box",
    recipeVersion: "0.1.0",
    parameters,
    synthetic: false,
    materials: {
      sheets: [{ id: "paper-1", componentId: "box", format: "square" }],
      sameSize: true,
    },
    estimatedMinutes: null,
    approximationNotes: [...analysis.approximationNotes, ...masuLimitations],
    states,
    steps,
    finalStateId: states[9].id,
  });
}
export const masuCompiler = {
  recipes: [masuMotionContract],
  compile: compileMasu,
};
export function finalState(tutorial: MasuTutorial): GeometryState {
  return tutorial.states.find((s) => s.id === tutorial.finalStateId)!;
}
