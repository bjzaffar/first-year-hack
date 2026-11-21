import { GenerateRequestSchema } from '../shared/schemas.js';
import { GenerationResponseSchema } from '../shared/generation.js';
import type { CroppedImage } from './UploadCrop.js';

export class GenerationFailure extends Error {
  constructor(message: string, readonly retryable: boolean) { super(message); }
}

export async function generateTutorial(crop: CroppedImage, signal: AbortSignal) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(crop.dataUrl);
  const body = GenerateRequestSchema.safeParse({ contractVersion: '1', mode: 'live', image: {
    mimeType: match?.[1], base64: match?.[2], width: crop.width, height: crop.height,
  } });
  if (!body.success) throw new GenerationFailure('This crop could not be sent. Confirm a valid crop up to 1024 pixels per side.', false);
  let response: Response;
  try {
    response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.data), signal, cache: 'no-store' });
  } catch {
    throw new GenerationFailure(signal.aborted ? 'Generation was cancelled or timed out. Your crop is saved for retry.' : 'Cannot reach the local server. Start FoldLens, then retry with this crop.', true);
  }
  let result: ReturnType<typeof GenerationResponseSchema.parse>;
  try { result = GenerationResponseSchema.parse(await response.json()); }
  catch { throw new GenerationFailure(signal.aborted ? 'Generation timed out. Your crop is saved for retry.' : 'The server returned an incomplete or invalid tutorial. Retry with this crop.', true); }
  if (!result.ok) throw new GenerationFailure(result.error.message, result.error.retryable);
  if (!response.ok || !['masu-1', 'boat-1'].includes(result.tutorial.contractVersion) || result.tutorial.synthetic)
    throw new GenerationFailure('The server did not return a live tutorial. No sample has been substituted.', true);
  return result.tutorial;
}
