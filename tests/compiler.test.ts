import { describe, it, expect } from "vitest";
import {
  compileMasu,
  MasuTutorialSchema,
  finalState,
} from "../src/geometry/compiler.js";
import { masuMotionFixtures } from "../src/shared/masu-contract.js";
const input = (h: number) => ({
  recipeId: "masu-box",
  parameters: { wallHeightFraction: h },
  objectLabel: "Bowl",
  approximationNotes: ["Simplified square bowl"],
});
describe("production box compilation", () => {
  it.each([0.06, 0.06001, 0.08, 0.1, 0.13, 0.15999, 0.16])(
    "compiles deterministic continuous valid geometry at %s",
    (h) => {
      const t = compileMasu(input(h));
      expect(t).toEqual(compileMasu(input(h)));
      expect(MasuTutorialSchema.safeParse(t).success).toBe(true);
      expect(finalState(t)).toBe(t.states.at(-1));
      expect(t.materials.sheets).toHaveLength(1);
      expect(t.estimatedMinutes).toBeNull();
      const initial = new Map(
        t.states[0].vertices.map((v) => [v.id, v.position]),
      );
      for (const state of t.states) {
        const vertices = new Map(state.vertices.map((v) => [v.id, v.position]));
        for (const face of state.faces) {
          for (const a of face.vertices)
            for (const b of face.vertices) {
              const p = vertices.get(a)!,
                q = vertices.get(b)!,
                r = initial.get(a)!,
                s = initial.get(b)!;
              expect(Math.hypot(...p.map((n, i) => n - q[i]))).toBeCloseTo(
                Math.hypot(...r.map((n, i) => n - s[i])),
                9,
              );
            }
          const [a, b, c] = face.vertices.map((id) => vertices.get(id)!);
          const u = b.map((v, i) => v - a[i]),
            v = c.map((v, i) => v - a[i]);
          expect(
            Math.hypot(
              u[1] * v[2] - u[2] * v[1],
              u[2] * v[0] - u[0] * v[2],
              u[0] * v[1] - u[1] * v[0],
            ),
          ).toBeGreaterThan(1e-10);
        }
      }
    },
  );
  it("matches all merged fixtures and varies geometry with input", () => {
    for (const fixture of masuMotionFixtures) {
      const t = compileMasu(input(fixture.parameters.wallHeightFraction));
      t.states.forEach((s, i) =>
        expect(s.vertices).toEqual(fixture.states[i].vertices),
      );
    }
    expect(finalState(compileMasu(input(0.06))).vertices).not.toEqual(
      finalState(compileMasu(input(0.16))).vertices,
    );
  });
  it.each([NaN, Infinity, -Infinity, 0, 0.059, 0.161, 1])(
    "rejects out of domain %s",
    (h) => expect(() => compileMasu(input(h))).toThrow(),
  );
  it("rejects unknown parameters, recipes and corrupted sequence/motion/highlights", () => {
    expect(() => compileMasu({ ...input(0.1), recipeId: "boat" })).toThrow();
    expect(() =>
      compileMasu({
        ...input(0.1),
        parameters: { wallHeightFraction: 0.1, code: "x" },
      }),
    ).toThrow();
    expect(MasuTutorialSchema.safeParse({...compileMasu(input(0.1)), states: []}).success).toBe(false);
    for (const mutate of [
      (t: ReturnType<typeof compileMasu>) => { t.states[4].vertices[0].position[0] += 0.1; },
      (t: ReturnType<typeof compileMasu>) => {
        t.steps[1].beforeStateId = "bad";
      },
      (t: ReturnType<typeof compileMasu>) => {
        t.steps[0].highlightLandmarkIds = ["missing"];
      },
      (t: ReturnType<typeof compileMasu>) => {
        t.steps[0].operation = {
          kind: "coupled-walls",
          solver: "masu-inward-v1",
          wallAngleDegrees: 90,
        };
      },
    ]) {
      const t = compileMasu(input(0.1));
      mutate(t);
      expect(MasuTutorialSchema.safeParse(t).success).toBe(false);
    }
  });
});
