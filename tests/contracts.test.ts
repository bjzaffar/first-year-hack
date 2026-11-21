import { describe, expect, it } from 'vitest';
import { CompiledTutorialSchema, FoldOperationSchema, GenerateRequestSchema, GenerateResponseSchema, ObjectAnalysisSchema, RecipeDefinitionSchema } from '../src/shared/schemas.js';
import { invalidRequestFixture, malformedAnalysisFixture, syntheticAnalysis, syntheticRecipe, syntheticTutorial, unavailableError } from '../src/shared/fixtures.js';

describe('version 1 contracts', () => {
  it('accepts labelled deterministic tutorial, analysis, recipe and error fixtures', () => {
    expect(CompiledTutorialSchema.parse(syntheticTutorial).synthetic).toBe(true);
    expect(ObjectAnalysisSchema.parse(syntheticAnalysis)).toEqual(syntheticAnalysis);
    expect(RecipeDefinitionSchema.parse(syntheticRecipe)).toEqual(syntheticRecipe);
    expect(GenerateResponseSchema.parse({ ok: false, error: unavailableError }).ok).toBe(false);
  });
  it('rejects unknown recipes, operations, executable fields and malformed images', () => {
    expect(ObjectAnalysisSchema.safeParse(malformedAnalysisFixture).success).toBe(false);
    expect(FoldOperationSchema.safeParse({ ...syntheticRecipe.operations[0], type: 'sink' }).success).toBe(false);
    expect(ObjectAnalysisSchema.safeParse({ ...syntheticAnalysis, formula: 'eval(...)' }).success).toBe(false);
    expect(GenerateRequestSchema.safeParse(invalidRequestFixture).success).toBe(false);
    expect(GenerateRequestSchema.safeParse({ contractVersion: '2', mode: 'fixture' }).success).toBe(false);
  });
  it.each([NaN, Infinity, -Infinity, 14, 76])('rejects invalid parameter %s', angleDegrees => {
    expect(ObjectAnalysisSchema.safeParse({ ...syntheticAnalysis, parameters: { angleDegrees } }).success).toBe(false);
  });
  it('rejects broken state, face, sheet and landmark references', () => {
    for (const mutate of [
      (t: typeof syntheticTutorial) => { t.finalStateId = 'missing'; },
      (t: typeof syntheticTutorial) => { t.steps[0].beforeStateId = 'missing'; },
      (t: typeof syntheticTutorial) => { t.steps[0].highlightLandmarkIds = ['missing']; },
      (t: typeof syntheticTutorial) => { t.steps[0].operation.affectedFaceIds = ['missing']; },
      (t: typeof syntheticTutorial) => { t.states[0].faces[0].vertices[0] = 'missing'; },
      (t: typeof syntheticTutorial) => { t.states[0].faces[0].sheetId = 'missing'; },
      (t: typeof syntheticTutorial) => { t.steps[0].operation.prerequisites = ['future']; },
      (t: typeof syntheticTutorial) => { t.states.push(t.states[0]); },
    ]) {
      const t = structuredClone(syntheticTutorial); mutate(t);
      expect(CompiledTutorialSchema.safeParse(t).success).toBe(false);
    }
  });
  it('keeps the hinge axis fixed and triangle edge lengths unchanged in the fixture', () => {
    const [before, after] = syntheticTutorial.states;
    for (const face of before.faces) {
      for (let i = 0; i < face.vertices.length; i++) {
        const a = face.vertices[i], b = face.vertices[(i + 1) % face.vertices.length];
        const distance = (s: typeof before) => {
          const va = s.vertices.find(v => v.id === a)!.position, vb = s.vertices.find(v => v.id === b)!.position;
          return Math.hypot(...va.map((n, j) => n - vb[j]));
        };
        expect(distance(after)).toBeCloseTo(distance(before), 12);
      }
    }
    expect(after.vertices.slice(0, 3)).toEqual(before.vertices.slice(0, 3));
    expect(syntheticTutorial.steps.at(-1)?.afterStateId).toBe(syntheticTutorial.finalStateId);
  });
});
