import { createElement } from "react";
import { it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMasu } from "../src/geometry/compiler.js";
import { sampleStep, Playback } from "../src/client/rendering/motion.js";
import { FoldDiagram } from "../src/client/rendering/FoldDiagram.js";
import { syntheticTutorial } from "../src/shared/fixtures.js";
const t = compileMasu({
  recipeId: "masu-box",
  parameters: { wallHeightFraction: 0.1 },
  objectLabel: "Fixture",
  approximationNotes: ["No image"],
});
it("restores exact endpoints through reverse and replay, without mutating saved states", () => {
  const copy = structuredClone(t);
  for (let repeat = 0; repeat < 3; repeat++)
    for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1, 0]) {
      expect(sampleStep(t, i, 0)).toEqual(t.states[i]);
      sampleStep(t, i, 0.4);
      expect(sampleStep(t, i, 1)).toEqual(t.states[i + 1]);
    }
  expect(t).toEqual(copy);
});
it("uses rigid hinge rotation, not vertex interpolation", () => {
  const frame = sampleStep(syntheticTutorial, 0, 0.5);
  const a = frame.vertices[0].position,
    d = frame.vertices[3].position;
  expect(Math.hypot(...d.map((n, i) => n - a[i]))).toBeCloseTo(1, 10);
});
it("rejects invalid playback and unsupported motions", () => {
  expect(() => sampleStep(t, 99, 0)).toThrow();
  expect(() => sampleStep(t, 0, NaN)).toThrow();
  const invalid = structuredClone(syntheticTutorial);
  Object.assign(invalid.steps[0].operation, { type: "sink" });
  expect(() => sampleStep(invalid, 0, 0.5)).toThrow(/Unsupported/);
});
it("invalidates old completion on navigation and replay", () => {
  const p = new Playback();
  const old = p.loadStep(0, 9);
  const fresh = p.loadStep(1, 9);
  expect(p.advance(old, 1)).toBe(false);
  expect(p.advance(fresh, 0.5)).toBe(true);
  const replay = p.replay();
  expect(p.progress).toBe(0);
  expect(p.advance(fresh, 1)).toBe(false);
  expect(p.advance(replay, 1)).toBe(true);
  p.cancel();
  expect(p.advance(replay, 1)).toBe(false);
});
it("renders fixed diagrams with actual landmarks, creases and movement arrows", () => {
  for (let i = 0; i < 9; i++) {
    const svg = renderToStaticMarkup(
      createElement(FoldDiagram, { tutorial: t, index: i }),
    );
    expect(svg).toContain("Fixed teaching diagram");
    expect(svg).toContain("stroke-dasharray");
    expect(svg).toContain("marker-end");
    expect(svg).not.toMatch(/NaN|undefined/);
    for (const id of t.steps[i].highlightLandmarkIds) expect(svg).toContain(id);
  }
});
