import { z } from 'zod';

export const CONTRACT_VERSION = '1' as const;
const id = z.string().regex(/^[a-z][a-z0-9_-]*$/).max(80);
const text = z.string().min(1).max(2000);
const finite = z.number().finite();
export const Vec3Schema = z.tuple([finite, finite, finite]);
const ids = z.array(id).min(1).refine(v => new Set(v).size === v.length, 'IDs must be unique');
const version = z.literal(CONTRACT_VERSION);
// Only a synthetic recipe is registered. T003 must publish real recipe IDs and domains.
export const RecipeIdSchema = z.enum(['synthetic-hinge']);
export const ParametersSchema = z.strictObject({ angleDegrees: finite.min(15).max(75) });
export const CameraSchema = z.strictObject({ position: Vec3Schema, target: Vec3Schema });
export const GeometryStateSchema = z.strictObject({
  id,
  vertices: z.array(z.strictObject({ id, position: Vec3Schema })).min(3),
  edges: z.array(z.strictObject({ id, vertices: z.tuple([id, id]), assignment: z.enum(['B', 'M', 'V', 'F', 'U']) })),
  faces: z.array(z.strictObject({ id, sheetId: id, vertices: ids.min(3), layer: z.number().int() })).min(1),
  landmarks: z.array(z.strictObject({ id, vertexId: id })),
}).superRefine((s, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  for (const items of [s.vertices, s.edges, s.faces, s.landmarks]) {
    if (new Set(items.map(i => i.id)).size !== items.length) fail('Duplicate geometry ID');
  }
  const vertices = new Set(s.vertices.map(v => v.id));
  for (const edge of s.edges) {
    if (edge.vertices[0] === edge.vertices[1] || edge.vertices.some(v => !vertices.has(v))) fail('Invalid edge vertices');
  }
  for (const face of s.faces) if (face.vertices.some(v => !vertices.has(v))) fail('Invalid face vertex');
  for (const landmark of s.landmarks) if (!vertices.has(landmark.vertexId)) fail('Invalid landmark vertex');
});
export const FoldOperationSchema = z.strictObject({
  id, type: z.literal('hinge'), sheetId: id, componentId: id,
  affectedFaceIds: ids, prerequisites: z.array(id),
  axisLandmarkIds: z.tuple([id, id]).refine(v => v[0] !== v[1]),
  angleDegrees: finite.min(-180).max(180),
  preconditions: z.array(text).min(1), postconditions: z.array(text).min(1),
});
export const ObjectAnalysisSchema = z.strictObject({
  contractVersion: version, objectLabel: text,
  features: z.strictObject({ aspectRatio: finite.positive(), shape: z.enum(['container', 'elongated', 'other']) }),
  recipeId: RecipeIdSchema, parameters: ParametersSchema, approximationNotes: z.array(text).min(1),
});
const sheet = z.strictObject({ id, componentId: id, format: z.literal('square') });
export const RecipeDefinitionSchema = z.strictObject({
  contractVersion: version, id: RecipeIdSchema, version: z.string().regex(/^\d+\.\d+\.\d+$/),
  synthetic: z.boolean(),
  provenance: z.strictObject({ author: text, source: text, permission: text }),
  sheets: z.array(sheet).min(1).max(4),
  parameterBounds: z.strictObject({ angleDegrees: z.strictObject({ min: finite, max: finite }) }),
  initialState: GeometryStateSchema, operations: z.array(FoldOperationSchema).min(1),
  instructionTemplates: z.record(id, text), limitations: z.array(text).min(1),
}).superRefine((r, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const { min, max } = r.parameterBounds.angleDegrees;
  if (min > max || min < 15 || max > 75) fail('Invalid parameter bounds');
  if (new Set(r.sheets.map(s => s.id)).size !== r.sheets.length) fail('Duplicate sheet ID');
  const seen = new Set<string>();
  for (const op of r.operations) {
    if (seen.has(op.id) || op.prerequisites.some(p => !seen.has(p))) fail('Invalid operation order');
    if (!r.sheets.some(s => s.id === op.sheetId && s.componentId === op.componentId)) fail('Invalid operation sheet/component');
    if (!r.instructionTemplates[op.id]) fail('Missing instruction template');
    seen.add(op.id);
  }
});
export const TutorialStepSchema = z.strictObject({
  id, index: z.number().int().nonnegative(), sheetId: id, componentId: id,
  operation: FoldOperationSchema, beforeStateId: id, afterStateId: id,
  animation: z.strictObject({ kind: z.literal('hinge'), durationMs: z.number().int().min(100).max(10000) }),
  camera: CameraSchema, diagramCamera: CameraSchema, highlightLandmarkIds: ids,
  instruction: text,
});
export const CompiledTutorialSchema = z.strictObject({
  contractVersion: version, id, recipeId: RecipeIdSchema, recipeVersion: text,
  synthetic: z.boolean(), parameters: ParametersSchema,
  materials: z.strictObject({ sheets: z.array(sheet).min(1).max(4), sameSize: z.literal(true) }),
  estimatedMinutes: finite.positive(), approximationNotes: z.array(text).min(1),
  states: z.array(GeometryStateSchema).min(2), steps: z.array(TutorialStepSchema).min(1), finalStateId: id,
}).superRefine((t, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const states = new Map(t.states.map(s => [s.id, s]));
  if (states.size !== t.states.length) fail('Duplicate state ID');
  if (new Set(t.materials.sheets.map(s => s.id)).size !== t.materials.sheets.length) fail('Duplicate sheet ID');
  if (!states.has(t.finalStateId) || t.steps.at(-1)?.afterStateId !== t.finalStateId) fail('Invalid final state');
  const seen = new Set<string>();
  const stepIds = new Set<string>();
  t.steps.forEach((step, i) => {
    const before = states.get(step.beforeStateId), after = states.get(step.afterStateId);
    if (!before || !after) fail('Missing step state');
    if (step.index !== i || stepIds.has(step.id)) fail('Invalid step order/ID');
    stepIds.add(step.id);
    if (i > 0 && t.steps[i - 1].afterStateId !== step.beforeStateId) fail('Discontinuous steps');
    if (seen.has(step.operation.id) || step.operation.prerequisites.some(p => !seen.has(p))) fail('Invalid operation prerequisites');
    seen.add(step.operation.id);
    if (step.sheetId !== step.operation.sheetId || step.componentId !== step.operation.componentId ||
      !t.materials.sheets.some(s => s.id === step.sheetId && s.componentId === step.componentId)) fail('Invalid sheet/component reference');
    for (const state of [before, after]) {
      if (!state) continue;
      if (step.operation.affectedFaceIds.some(f => !state.faces.some(face => face.id === f && face.sheetId === step.sheetId))) fail('Invalid affected face');
      if ([...step.highlightLandmarkIds, ...step.operation.axisLandmarkIds].some(l => !state.landmarks.some(lm => lm.id === l))) fail('Invalid landmark reference');
    }
  });
  for (const state of t.states) {
    if (state.faces.some(f => !t.materials.sheets.some(s => s.id === f.sheetId))) fail('Unknown geometry sheet');
  }
});
export const GenerationErrorSchema = z.strictObject({
  contractVersion: version,
  code: z.enum(['INVALID_REQUEST', 'PAYLOAD_TOO_LARGE', 'MODEL_UNAVAILABLE', 'INVALID_MODEL_RESPONSE', 'INVALID_PARAMETERS', 'GENERATION_TIMEOUT', 'NO_VALID_RECIPE', 'NOT_FOUND', 'INTERNAL_ERROR']),
  message: text, retryable: z.boolean(),
});
export const GenerateRequestSchema = z.discriminatedUnion('mode', [
  z.strictObject({ contractVersion: version, mode: z.literal('fixture') }),
  z.strictObject({ contractVersion: version, mode: z.literal('live'), image: z.strictObject({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    base64: z.string().min(4).max(13981016).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    width: z.number().int().min(1).max(1024), height: z.number().int().min(1).max(1024),
  }).refine(i => (i.base64.length / 4) * 3 - (i.base64.endsWith('==') ? 2 : i.base64.endsWith('=') ? 1 : 0) <= 10 * 1024 * 1024, 'Image exceeds 10 MiB') }),
]);
export const GenerateResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), tutorial: CompiledTutorialSchema }),
  z.strictObject({ ok: z.literal(false), error: GenerationErrorSchema }),
]);
export const HealthSchema = z.strictObject({
  contractVersion: version, backend: z.literal('ready'),
  model: z.literal('not_configured'), compiler: z.literal('not_configured'),
  generationReady: z.literal(false), fixtureAvailable: z.literal(true),
});
export type ObjectAnalysis = z.infer<typeof ObjectAnalysisSchema>;
export type RecipeDefinition = z.infer<typeof RecipeDefinitionSchema>;
export type FoldOperation = z.infer<typeof FoldOperationSchema>;
export type TutorialStep = z.infer<typeof TutorialStepSchema>;
export type CompiledTutorial = z.infer<typeof CompiledTutorialSchema>;
export type GenerationError = z.infer<typeof GenerationErrorSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
export type GeometryState = z.infer<typeof GeometryStateSchema>;
