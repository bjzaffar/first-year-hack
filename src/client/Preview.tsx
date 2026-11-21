import type { RenderTutorial } from "./rendering/motion.js";
import { FoldScene } from "./rendering/FoldScene.js";
import { FoldDiagram } from "./rendering/FoldDiagram.js";
import { useState } from "react";

export function Preview({
  tutorial,
  photoDataUrl,
  onAccept,
  onRetry,
  onNewImage,
}: {
  tutorial: RenderTutorial;
  photoDataUrl?: string;
  onAccept: () => void;
  onRetry: () => void;
  onNewImage?: () => void;
}) {
  const [renderFailed, setRenderFailed] = useState(false);
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
          <FoldScene tutorial={tutorial} onError={() => setRenderFailed(true)} />
          {renderFailed && <FoldDiagram tutorial={tutorial} index={tutorial.steps.length - 1} final />}
          <p className="caption">Generated origami geometry</p>
        </div>
      </div>
      <div className="preview-details">
        <dl>
          <dt>Sheets required</dt>
          <dd>
            {sheetCount} square sheet{sheetCount > 1 ? "s" : ""}
          </dd>
          <dt>Estimated folding time</dt>
          <dd>
            {estimatedMinutes === null
              ? "Not measured"
              : `${estimatedMinutes} minutes`}
          </dd>
          {tutorial.synthetic && (
            <dd className="synthetic-note">
              This is a synthetic fixture, not a live generation result.
            </dd>
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
        <button className="secondary" onClick={onRetry}>
          Return to crop
        </button>
        {onNewImage && <button className="secondary" onClick={onNewImage}>Choose another image</button>}
      </div>
    </section>
  );
}
