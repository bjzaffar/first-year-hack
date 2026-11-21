import { useEffect, useRef, useState } from 'react';
import { cropPixels, type Crop } from './crop.js';

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
        onCrop({ dataUrl: canvas.toDataURL(mime, 0.92), mimeType: mime,
          width: canvas.width, height: canvas.height, sourceUrl: source, crop });
        setBusy(false);
      } catch { fail(); }
    };
    img.src = source;
  }

  return <section className="upload-section">
    <h2>Upload and crop a photograph</h2>
    <p>Choose an image, then adjust the crop to isolate one object.</p>
    <div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => {
      e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file);
    }}>
      <button onClick={() => input.current?.click()}>Choose image</button>
      <span>or drop a JPEG, PNG, or WebP here (up to 10 MB)</span>
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => {
      const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = '';
    }} />
    {busy && <p role="status">Preparing image…</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {source && <>
      <div style={{ position: 'relative', width: 'fit-content', maxWidth: '100%' }}>
        <img src={source} alt="Source photograph with selected crop" style={{ display: 'block', maxWidth: '100%', maxHeight: 360 }} />
        <div aria-hidden="true" style={{ position: 'absolute', border: '2px solid #a85c30', boxSizing: 'border-box', pointerEvents: 'none',
          left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }} />
      </div>
      <fieldset disabled={busy}><legend>Crop rectangle (percent of image)</legend>
        {(['x', 'y', 'width', 'height'] as const).map(key => <label key={key} style={{ display: 'block' }}>
          {key} <input type="range" aria-label={`Crop ${key}`} min={key === 'width' || key === 'height' ? 1 : 0}
            max={key === 'x' ? 100 - crop.width : key === 'y' ? 100 - crop.height : key === 'width' ? 100 - crop.x : 100 - crop.y}
            value={crop[key]} onChange={e => { onInvalidate(); setCrop({ ...crop, [key]: Number(e.target.value) }); }} /> {crop[key]}%
        </label>)}
        <button onClick={confirm}>Confirm crop</button>
      </fieldset>
    </>}
  </section>;
}
