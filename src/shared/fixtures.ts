import { CompiledTutorialSchema, GenerationErrorSchema, ObjectAnalysisSchema, RecipeDefinitionSchema, type FoldOperation, type GeometryState } from './schemas.js';

const operation: FoldOperation = {
  id: 'fold-1', type: 'hinge', sheetId: 'sheet-1', componentId: 'component-1',
  affectedFaceIds: ['face-moving'], prerequisites: [], axisLandmarkIds: ['axis-a', 'axis-b'],
  angleDegrees: 45,
  preconditions: ['Synthetic square lies in the XY plane.'],
  postconditions: ['Moving triangle is rotated 45 degrees about the diagonal.'],
};
const initial: GeometryState = {
  id: 'state-before',
  vertices: [
    { id: 'v-a', position: [0, 0, 0] }, { id: 'v-b', position: [1, 0, 0] },
    { id: 'v-c', position: [1, 1, 0] }, { id: 'v-d', position: [0, 1, 0] },
  ],
  edges: [
    { id: 'e-ab', vertices: ['v-a', 'v-b'], assignment: 'B' },
    { id: 'e-bc', vertices: ['v-b', 'v-c'], assignment: 'B' },
    { id: 'e-cd', vertices: ['v-c', 'v-d'], assignment: 'B' },
    { id: 'e-da', vertices: ['v-d', 'v-a'], assignment: 'B' },
    { id: 'e-ac', vertices: ['v-a', 'v-c'], assignment: 'V' },
  ],
  faces: [
    { id: 'face-fixed', sheetId: 'sheet-1', vertices: ['v-a', 'v-b', 'v-c'], layer: 0 },
    { id: 'face-moving', sheetId: 'sheet-1', vertices: ['v-a', 'v-c', 'v-d'], layer: 1 },
  ],
  landmarks: [{ id: 'axis-a', vertexId: 'v-a' }, { id: 'axis-b', vertexId: 'v-c' }, { id: 'corner-d', vertexId: 'v-d' }],
};
// Analytic diagonal-axis rotation; a fixture, not the runtime geometry compiler.
const after: GeometryState = {
  ...structuredClone(initial), id: 'state-after',
  vertices: initial.vertices.map(v => v.id === 'v-d'
    ? { ...v, position: [(1 - Math.SQRT1_2) / 2, (1 + Math.SQRT1_2) / 2, 0.5] } : structuredClone(v)),
};
const instruction = 'Synthetic example: lift corner D around diagonal A–C. Stop at 45 degrees; this is a renderer fixture, not a complete origami model.';
const sheets = [{ id: 'sheet-1', componentId: 'component-1', format: 'square' as const }];
export const syntheticRecipe = RecipeDefinitionSchema.parse({
  contractVersion: '1', id: 'synthetic-hinge', version: '0.1.0', synthetic: true,
  provenance: { author: 'FoldLens contributors', source: 'Original synthetic mathematical fixture', permission: 'Original project content; no external tutorial assets' },
  sheets, parameterBounds: { angleDegrees: { min: 15, max: 75 } },
  initialState: initial, operations: [operation], instructionTemplates: { 'fold-1': instruction },
  limitations: ['Not a volumetric recipe or a physical foldability claim. Only the 45-degree instance is supplied.'],
});
export const syntheticAnalysis = ObjectAnalysisSchema.parse({
  contractVersion: '1', objectLabel: 'Synthetic example (no image analysed)',
  features: { aspectRatio: 1, shape: 'other' }, recipeId: 'synthetic-hinge', parameters: { angleDegrees: 45 },
  approximationNotes: ['No photograph or vision model was used.'],
});
export const syntheticTutorial = CompiledTutorialSchema.parse({
  contractVersion: '1', id: 'synthetic-tutorial', recipeId: 'synthetic-hinge', recipeVersion: '0.1.0',
  synthetic: true, parameters: { angleDegrees: 45 }, materials: { sheets, sameSize: true },
  estimatedMinutes: 1, approximationNotes: ['Synthetic development fixture. Not a generated design or complete folding tutorial.'],
  states: [initial, after], finalStateId: 'state-after',
  steps: [{ id: 'step-1', index: 0, sheetId: 'sheet-1', componentId: 'component-1', operation,
    beforeStateId: 'state-before', afterStateId: 'state-after',
    animation: { kind: 'hinge', durationMs: 1200 },
    camera: { position: [2, 2, 3], target: [0.5, 0.5, 0] },
    diagramCamera: { position: [0.5, 0.5, 3], target: [0.5, 0.5, 0] },
    highlightLandmarkIds: ['corner-d', 'axis-a', 'axis-b'], instruction }],
});
export const unavailableError = GenerationErrorSchema.parse({
  contractVersion: '1', code: 'MODEL_UNAVAILABLE', retryable: true,
  message: 'Live generation is not configured. Use the explicitly labelled synthetic fixture for development.',
});
export const malformedAnalysisFixture = { ...syntheticAnalysis, recipeId: 'unsupported-recipe' };
export const invalidRequestFixture = { contractVersion: '1', mode: 'live', image: { mimeType: 'text/plain', base64: 'not-an-image' } };
