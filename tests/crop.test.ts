import { expect, test } from 'vitest';
import { cropPixels } from '../src/client/crop.js';
test('exports the selected rectangle and bounds its resolution', () => {
  expect(cropPixels(4000, 2000, { x: 25, y: 10, width: 50, height: 50 })).toEqual({
    x: 1000, y: 200, width: 2000, height: 1000, outputWidth: 1024, outputHeight: 512,
  });
});
test('keeps small crops at native size', () => {
  expect(cropPixels(100, 80, { x: 0, y: 0, width: 50, height: 50 }).outputWidth).toBe(50);
});
test('rejects empty, out-of-bounds and nonfinite crops', () => {
  for (const crop of [{ x: 90, y: 0, width: 20, height: 50 }, { x: 0, y: 0, width: 0, height: 1 }, { x: NaN, y: 0, width: 1, height: 1 }]) {
    expect(() => cropPixels(100, 100, crop)).toThrow();
  }
});
