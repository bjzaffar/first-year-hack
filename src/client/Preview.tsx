import type { CompiledTutorial } from '../shared/schemas.js';

export function Preview({
  tutorial,
  photoDataUrl,
  onAccept,
  onRetry,
}: {
  tutorial: CompiledTutorial;
  photoDataUrl?: string;
  onAccept: () => void;
  onRetry: () => void;
}) {
  const sheetCount = tutorial.materials.sheets.length;
  const estimatedMinutes = tutorial.estimatedMinutes;

  return (
    <section className="preview-section">
      <h2>Preview</h2>
      <div className="preview-layout">
        {photoDataUrl && (
          <div className="photo-side">
            <img src={photoDataUrl} alt="Uploaded photograph" />
            <p className="caption">Your photograph</p>
          </div>
        )}
        <div className="model-side">
          <div className="model-placeholder" aria-label="Origami model preview">
            <span className="model-label">3D preview slot</span>
          </div>
          <p className="caption">Generated origami geometry</p>
        </div>
      </div>
      <div className="preview-details">
        <dl>
          <dt>Sheets required</dt>
          <dd>{sheetCount} square sheet{sheetCount > 1 ? 's' : ''}</dd>
          <dt>Estimated folding time</dt>
          <dd>{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''}</dd>
          {tutorial.synthetic && (
            <dd className="synthetic-note">This is a synthetic fixture, not a live generation result.</dd>
          )}
        </dl>
        {tutorial.approximationNotes.length > 0 && (
          <div className="approximation-notes">
            <h3>Simplifications</h3>
            <ul>
              {tutorial.approximationNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="actions">
        <button onClick={onAccept}>Accept and start folding</button>
        <button className="secondary" onClick={onRetry}>Retry with another image</button>
      </div>
    </section>
  );
}
