export interface Crop { x: number; y: number; width: number; height: number }
export function cropPixels(imageWidth: number, imageHeight: number, crop: Crop) {
  if (![imageWidth, imageHeight, ...Object.values(crop)].every(Number.isFinite) ||
      imageWidth <= 0 || imageHeight <= 0 || crop.x < 0 || crop.y < 0 ||
      crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > 100 || crop.y + crop.height > 100) {
    throw new Error('Invalid crop');
  }
  const x = imageWidth * crop.x / 100, y = imageHeight * crop.y / 100;
  const width = imageWidth * crop.width / 100, height = imageHeight * crop.height / 100;
  const scale = Math.min(1, 1024 / Math.max(width, height));
  return { x, y, width, height, outputWidth: Math.max(1, Math.round(width * scale)), outputHeight: Math.max(1, Math.round(height * scale)) };
}

export type CropHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se';
/** Deltas are percentages of the displayed image, independent of its pixel size. */
export function adjustCrop(crop: Crop, handle: CropHandle, dx: number, dy: number): Crop {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  // Round to avoid floating-point sums slightly exceeding the contract's 100% boundary.
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  if (handle === 'move') return { ...crop,
    x: clamp(round(crop.x + dx), 0, 100 - crop.width),
    y: clamp(round(crop.y + dy), 0, 100 - crop.height) };
  let left = crop.x, top = crop.y, right = crop.x + crop.width, bottom = crop.y + crop.height;
  if (handle.includes('w')) left = clamp(left + dx, 0, right - 1);
  else right = clamp(right + dx, left + 1, 100);
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - 1);
  else bottom = clamp(bottom + dy, top + 1, 100);
  left = round(left); top = round(top); right = round(right); bottom = round(bottom);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
