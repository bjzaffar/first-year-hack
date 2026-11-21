import { useState } from "react";
import { FoldScene } from "./rendering/FoldScene.js";
import { FoldDiagram } from "./rendering/FoldDiagram.js";
import type { RenderTutorial } from "./rendering/motion.js";

/** loadStep is controlled by the index prop of FoldScene; replayKey restarts it.
 * onComplete/onError end playback. Each new index restores its saved before state. */
export function TutorialPlayer({
  tutorial,
  onFinish,
  onBack,
}: {
  tutorial: RenderTutorial;
  onFinish: () => void;
  onBack: () => void;
}) {
  const [index, setIndex] = useState(0),
    [replayKey, setReplayKey] = useState(0),
    [playing, setPlaying] = useState(true);
  const [renderFailed, setRenderFailed] = useState(false);
  const step = tutorial.steps[index];
  const loadStep = (next: number) => {
    setPlaying(true);
    setRenderFailed(false);
    setIndex(next);
  };
  return (
    <section className="tutorial-section">
      <h2>Folding tutorial</h2>
      <div className="step-header">
        <span>
          Step {index + 1} of {tutorial.steps.length}
        </span>
        <span>
          Sheet: {step.sheetId} · Component: {step.componentId}
        </span>
      </div>
      <div className="tutorial-layout">
        <FoldScene
          tutorial={tutorial}
          index={index}
          replayKey={replayKey}
          onComplete={() => setPlaying(false)}
          onError={() => { setPlaying(false); setRenderFailed(true); }}
        />
        <FoldDiagram tutorial={tutorial} index={index} />
      </div>
      <p>{step.instruction}</p>
      <p className="caption">
        Dots mark relevant corners. Dashed lines mark creases; arrows show where
        corners move.
      </p>
      <p aria-live="polite">
        {renderFailed ? "3D playback is unavailable. Use the diagram, or Replay to retry the 3D view." : playing ? "Playing fold…" : "Ready for the next step."}
      </p>
      <div className="tutorial-controls">
        <button className="secondary" onClick={onBack}>
          Materials
        </button>
        <button
          disabled={index === 0 || playing}
          onClick={() => loadStep(index - 1)}
        >
          Back
        </button>
        <button
          disabled={playing}
          onClick={() => {
            setPlaying(true);
            setRenderFailed(false);
            setReplayKey((k) => k + 1);
          }}
        >
          Replay
        </button>
        {index < tutorial.steps.length - 1 ? (
          <button disabled={playing} onClick={() => loadStep(index + 1)}>
            Next
          </button>
        ) : (
          <button disabled={playing} onClick={onFinish}>
            Complete
          </button>
        )}
      </div>
    </section>
  );
}
