// @vitest-environment happy-dom
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../src/client/App.js';
import { compileMasu } from '../src/geometry/compiler.js';
import { syntheticTutorial } from '../src/shared/fixtures.js';
import type { CroppedImage } from '../src/client/UploadCrop.js';
const crop: CroppedImage = { dataUrl: 'data:image/png;base64,aGVsbG8=', mimeType: 'image/png', width: 1, height: 1,
  sourceUrl: 'data:image/png;base64,original', crop: { x: 10, y: 10, width: 80, height: 80 } };
const tutorial = compileMasu({ recipeId: 'masu-box', parameters: { wallHeightFraction: 0.06 }, objectLabel: 'Tray', approximationNotes: ['Photo interpretation: Tray.', 'Square open container only.'] });
vi.mock('../src/client/PaperBackground.js', () => ({ PaperBackground: () => null }));
vi.mock('../src/client/UploadCrop.js', () => ({
  UploadCrop: ({ onCrop, initialImage }: { onCrop: (image: CroppedImage) => void; initialImage: CroppedImage | null }) =>
    createElement('div', null, initialImage ? `Saved crop ${initialImage.crop.width}` : 'No saved crop',
      createElement('button', { onClick: () => onCrop(crop) }, 'Use test crop')),
}));
// Real GPU sampling/navigation is covered in renderer and fold-scene tests.
vi.mock('../src/client/rendering/FoldScene.js', () => ({
  FoldScene: ({ index, replayKey, onComplete }: { index?: number; replayKey?: number; onComplete?: () => void }) => {
    useEffect(() => { onComplete?.(); }, [index, replayKey]);
    return createElement('div', null, `3D view ${index ?? 'final'} replay ${replayKey ?? 0}`);
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
const request = vi.fn<typeof fetch>();
const ok = () => new Response(JSON.stringify({ ok: true, tutorial }));
beforeEach(async () => {
  request.mockReset(); request.mockImplementation(async () => ok()); vi.stubGlobal('fetch', request);
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(() => root.render(createElement(App)));
});
afterEach(async () => { await act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
async function click(text: string) {
  const button = [...host.querySelectorAll('button')].find(b => b.textContent === text);
  expect(button, text).toBeDefined(); expect(button!.disabled).toBe(false);
  await act(() => button!.click());
}
async function generate() { await click('Use test crop'); await click('Generate from photograph'); }
it('submits only the confirmed crop and requires acceptance before the complete nine-step guide', async () => {
  await generate();
  expect(JSON.parse(request.mock.calls[0][1]!.body as string)).toEqual({ contractVersion: '1', mode: 'live', image: { mimeType: 'image/png', base64: 'aGVsbG8=', width: 1, height: 1 } });
  expect(host.textContent).toContain('Photo interpretation: Tray.');
  expect(host.textContent).not.toContain('Step 1 of 9');
  expect(host.querySelector('img')?.src).toBe(crop.dataUrl);
  await click('Accept and start folding'); await click('Start folding');
  expect(host.textContent).toContain('Step 1 of 9');
  await click('Next'); expect(host.textContent).toContain('Step 2 of 9');
  await click('Back'); expect(host.textContent).toContain('Step 1 of 9');
  await click('Replay'); expect(host.textContent).toContain('3D view 0 replay 1');
  for (let i = 1; i < 9; i++) { await click('Next'); expect(host.textContent).toContain(`Step ${i + 1} of 9`); }
  expect(host.querySelector('svg[role="img"]')).not.toBeNull();
  await click('Complete'); expect(host.textContent).toContain('Finished');
  expect(host.textContent).toContain('3D view final');
  await click('Start a new design'); expect(host.textContent).toContain('No saved crop');
  expect(request).toHaveBeenCalledTimes(1);
});
it('preserves source and selection when rejecting a preview', async () => {
  await generate(); await click('Return to crop'); expect(host.textContent).toContain('Saved crop 80');
  await click('Generate from photograph'); await click('Choose another image');
  expect(host.textContent).toContain('No saved crop');
});
it('retains the crop after model failure and retries the exact request', async () => {
  request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: { contractVersion: '1', code: 'MODEL_UNAVAILABLE', message: 'Start Ollama.', retryable: true } }), { status: 503 }));
  await generate(); expect(host.textContent).toContain('Start Ollama.');
  await click('Retry with this crop'); expect(host.textContent).toContain('Photo interpretation: Tray.');
  expect(request.mock.calls[0][1]!.body).toBe(request.mock.calls[1][1]!.body);
});
it.each([{}, { ok: true, tutorial: syntheticTutorial }, { ok: true, tutorial: { ...tutorial, states: [] } }])('rejects malformed, partial or fixture responses %#', async value => {
  request.mockResolvedValueOnce(new Response(JSON.stringify(value)));
  await generate(); expect(host.textContent).toContain('Generation failed');
  expect(host.textContent).not.toContain('Accept and start folding');
  await click('Adjust crop'); expect(host.textContent).toContain('Saved crop 80');
});
it('offers recropping for a non-retryable error and preserves crop on network failure', async () => {
  request.mockRejectedValueOnce(new Error('private network details'));
  await generate(); expect(host.textContent).toContain('Cannot reach the local server');
  request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: { contractVersion: '1', code: 'INVALID_REQUEST', message: 'Confirm a new crop.', retryable: false } }), { status: 400 }));
  await click('Retry with this crop'); expect(host.textContent).not.toContain('Retry with this crop');
  await click('Adjust crop'); expect(host.textContent).toContain('Saved crop 80');
});
it('cancels in-flight generation and ignores its stale result', async () => {
  let resolve!: (response: Response) => void;
  request.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  await generate(); expect(host.textContent).toContain('Generating your paper interpretation');
  await click('Cancel and adjust crop');
  expect(request.mock.calls[0][1]!.signal?.aborted).toBe(true);
  await act(() => resolve(ok()));
  expect(host.textContent).toContain('Saved crop 80'); expect(host.textContent).not.toContain('Accept and start folding');
});
