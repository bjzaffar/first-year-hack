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
