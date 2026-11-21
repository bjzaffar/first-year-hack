import { useCallback, useState } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DIMENSION = 1024;

export interface CroppedImage {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

export function UploadCrop({ onCrop, onCancel }: { onCrop: (image: CroppedImage) => void; onCancel?: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are accepted.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image exceeds 10 MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setPreviewUrl(reader.result as string);
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onCrop({ dataUrl: canvas.toDataURL(file.type, 0.92), mimeType: file.type, width: canvas.width, height: canvas.height });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, [onCrop]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
  }, [handleFile]);

  return (
    <section className="upload-section">
      <h2>Upload a photograph</h2>
      <p className="hint">Drag and drop an image here, or choose a file. The result will be a simplified paper interpretation.</p>
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click(); }}
      >
        <span className="drop-icon">+</span>
        <span>Drop an image or click to choose</span>
      </div>
      <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} hidden />
      {error && <p className="error" role="alert">{error}</p>}
      {previewUrl && (
        <div className="preview-container">
          <img src={previewUrl} alt="Cropped preview" />
          <p className="caption">Object isolated. Click "Generate" to continue, or choose another image.</p>
        </div>
      )}
      <div className="actions">
        {onCancel && <button onClick={onCancel}>Cancel</button>}
      </div>
    </section>
  );
}
