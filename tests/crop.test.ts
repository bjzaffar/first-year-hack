import { expect, test } from 'vitest';
import { adjustCrop, cropPixels } from '../src/client/crop.js';
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

const selection = { x: 20, y: 30, width: 40, height: 50 };
test('moving the crop preserves its size and stops at image boundaries', () => {
  expect(adjustCrop(selection, 'move', 10, -10)).toEqual({ x: 30, y: 20, width: 40, height: 50 });
  expect(adjustCrop(selection, 'move', 200, -200)).toEqual({ x: 60, y: 0, width: 40, height: 50 });
});
test.each([
  ['nw', { x: 25, y: 35, width: 35, height: 45 }],
  ['ne', { x: 20, y: 35, width: 45, height: 45 }],
  ['sw', { x: 25, y: 30, width: 35, height: 55 }],
  ['se', { x: 20, y: 30, width: 45, height: 55 }],
] as const)('resizing %s anchors the opposite corner', (handle, expected) => {
  expect(adjustCrop(selection, handle, 5, 5)).toEqual(expected);
});
test('corners cannot cross or escape the image', () => {
  expect(adjustCrop(selection, 'nw', 200, 200)).toEqual({ x: 59, y: 79, width: 1, height: 1 });
  expect(adjustCrop(selection, 'se', -200, -200)).toEqual({ x: 20, y: 30, width: 1, height: 1 });
  expect(adjustCrop(selection, 'nw', -200, -200)).toEqual({ x: 0, y: 0, width: 60, height: 80 });
  expect(adjustCrop(selection, 'se', 200, 200)).toEqual({ x: 20, y: 30, width: 80, height: 70 });
});
test('fractional pointer movements remain valid for pixel export at every boundary', () => {
  for (let i = 1; i < 100; i++) {
    const resized = adjustCrop(selection, 'se', i / 3, i / 7);
    const moved = adjustCrop(resized, 'move', 200, 200);
    expect(() => cropPixels(4032, 3024, moved)).not.toThrow();
  }
});
