import { GenerateRequestSchema } from '../../shared/schemas.js';
import type { LiveImage } from '../../shared/interfaces.js';
import { AnalysisProviderError } from './errors.js';

// Inspect encoded file headers, not just caller-supplied MIME/dimensions. Full codec
// decoding is performed by Ollama; this does not claim to be an image sanitizer.
export function validateImage(input: LiveImage): LiveImage {
  const parsed = GenerateRequestSchema.safeParse({ contractVersion: '1', mode: 'live', image: input });
  const invalid = () => new AnalysisProviderError('INVALID_REQUEST', 'Use a valid JPEG, PNG or WebP crop up to 10 MiB and 1024 pixels per side.', false);
  if (!parsed.success || parsed.data.mode !== 'live') throw invalid();
  const image = parsed.data.image;
  const b = Buffer.from(image.base64, 'base64');
  if (b.toString('base64') !== image.base64) throw invalid();
  let width = 0, height = 0;
  try {
    if (image.mimeType === 'image/png') {
      if (!b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || b.readUInt32BE(8) !== 13 || b.toString('ascii',12,16) !== 'IHDR' || b.toString('ascii',b.length-8,b.length-4) !== 'IEND') throw invalid();
      width = b.readUInt32BE(16); height = b.readUInt32BE(20);
    } else if (image.mimeType === 'image/jpeg') {
      if (b.readUInt16BE(0) !== 0xffd8 || b.readUInt16BE(b.length-2) !== 0xffd9) throw invalid();
      let offset = 2;
      while (offset < b.length - 2) {
        if (b[offset++] !== 0xff) throw invalid();
        while (b[offset] === 0xff) offset++;
        const marker = b[offset++];
        if (marker === 0xda || marker === 0xd9) break;
        if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
        const length = b.readUInt16BE(offset);
        if (length < 2 || offset + length > b.length) throw invalid();
        if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
          if (length < 8) throw invalid();
          height = b.readUInt16BE(offset+3); width = b.readUInt16BE(offset+5); break;
        }
        offset += length;
      }
    } else {
      if (b.toString('ascii',0,4) !== 'RIFF' || b.toString('ascii',8,12) !== 'WEBP' || b.readUInt32LE(4)+8 !== b.length) throw invalid();
      const kind = b.toString('ascii',12,16);
      if (b.readUInt32LE(16) + 20 > b.length) throw invalid();
      if (kind === 'VP8X') {
        width = 1 + b.readUIntLE(24,3); height = 1 + b.readUIntLE(27,3);
      } else if (kind === 'VP8L' && b[20] === 0x2f) {
        const bits = b.readUInt32LE(21); width = (bits & 0x3fff)+1; height = ((bits >>> 14)&0x3fff)+1;
      } else if (kind === 'VP8 ' && b.subarray(23,26).equals(Buffer.from([0x9d,0x01,0x2a]))) {
        width = b.readUInt16LE(26)&0x3fff; height = b.readUInt16LE(28)&0x3fff;
      } else throw invalid();
    }
  } catch { throw invalid(); }
  if (width !== image.width || height !== image.height || width < 1 || height < 1) throw invalid();
  return image;
}
