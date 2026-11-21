import { useEffect, useRef, useState } from 'react';
import { cropPixels, type Crop } from './crop.js';
import { CropSelection } from './CropSelection.js';

export interface CroppedImage {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  sourceUrl: string;
  crop: Crop;
}

export function UploadCrop({ onCrop, onInvalidate, initialImage }: {
  onCrop: (image: CroppedImage) => void;
  onInvalidate: () => void;
  initialImage: CroppedImage | null;
}) {
  const [source, setSource] = useState(initialImage?.sourceUrl ?? '');
  const [mime, setMime] = useState(initialImage?.mimeType ?? 'image/png');
  const [crop, setCrop] = useState<Crop>(initialImage?.crop ?? { x: 0, y: 0, width: 100, height: 100 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { version.current++; }, []);

  function handleFile(file: File) {
    const request = ++version.current;
    onInvalidate();
    setSource('');
    setBusy(false);
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.'); return;
    }
    if (file.size > 10 * 1024 * 1024) { setError('Image exceeds 10 MB. Choose a smaller file.'); return; }
    setBusy(true);
    const fail = () => {
      if (request !== version.current) return;
      setBusy(false); setError('Could not read this image. Choose a valid image file.');
    };
    const reader = new FileReader();
    reader.onerror = fail;
    reader.onabort = fail;
    reader.onload = () => {
      const img = new Image();
      img.onerror = fail;
      img.onload = () => {
        if (request !== version.current) return;
        setSource(String(reader.result)); setMime(file.type);
        setCrop({ x: 0, y: 0, width: 100, height: 100 }); setBusy(false);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function confirm() {
    const request = ++version.current;
    setBusy(true); setError('');
    const img = new Image();
    const fail = () => {
      if (request !== version.current) return;
      setBusy(false); onInvalidate(); setError('Could not prepare the crop. Choose another image or retry.');
    };
    img.onerror = fail;
    img.onload = () => {
      if (request !== version.current) return;
      try {
        const rect = cropPixels(img.naturalWidth, img.naturalHeight, crop);
        const canvas = document.createElement('canvas');
        canvas.width = rect.outputWidth; canvas.height = rect.outputHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL(mime, 0.92);
        // Some browsers fall back to PNG when WebP encoding is unavailable.
        const encodedMime = dataUrl.slice(5, dataUrl.indexOf(';'));
        onCrop({ dataUrl, mimeType: encodedMime,
          width: canvas.width, height: canvas.height, sourceUrl: source, crop });
        setBusy(false);
      } catch { fail(); }
    };
    img.src = source;
  }

  return <section className="upload-section">
    <p className="section-kicker">01 / BEGIN WITH SOMETHING FAMILIAR</p>
    <h2>What will you fold?</h2>
    <p>Choose a photograph of an object that catches your eye.</p>
    <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => {
      e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file);
    }}>
      <svg className="paper-illustration" viewBox="0 0 160 120" fill="none" aria-hidden="true"><path d="M32 81 66 22l58 29-33 59Z" fill="#e8e1d2"/><path d="m32 81 58-19 34-11-58-29Z" fill="#fdfbf5" stroke="#c8bdab"/><path d="m32 81 58-19 1 48Z" fill="#e0d7c5" stroke="#c8bdab"/><path d="m90 62 34-11-33 59Z" fill="#f2ecdf" stroke="#c8bdab"/><path d="m66 22 24 40" stroke="#c8bdab" strokeDasharray="3 4"/></svg>
      <p className="drop-title">Every fold starts with a little inspiration.</p>
      <button onClick={() => input.current?.click()}>Choose a photograph <span aria-hidden="true">↗</span></button>
      <span>or drop it here · JPG, PNG, WebP · up to 10 MB</span>
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => {
      const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = '';
    }} />
    {busy && <p role="status">Preparing image…</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {source && <>
      <CropSelection key={source} source={source} crop={crop} disabled={busy}
        onChange={next => { onInvalidate(); setCrop(next); }} />
      <div className="actions crop-actions">
        <button disabled={busy} onClick={confirm}>Confirm crop</button>
        <button disabled={busy} onClick={() => { onInvalidate(); setCrop({ x: 0, y: 0, width: 100, height: 100 }); }}>Reset crop</button>
      </div>
    </>}
  </section>;
}
