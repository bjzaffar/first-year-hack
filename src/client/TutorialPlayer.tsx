import { useState, useCallback, useRef, useEffect } from 'react';
import type { CompiledTutorial } from '../shared/schemas.js';

export function TutorialPlayer({
  tutorial,
  onFinish,
  onBack,
}: {
  tutorial: CompiledTutorial;
  onFinish: () => void;
  onBack: () => void;
}) {
  const steps = tutorial.steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const currentStep = steps[stepIndex];
  const totalSteps = steps.length;

  const replay = useCallback(() => {
    if (!currentStep || isAnimating) return;
    setIsAnimating(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsAnimating(false);
      timerRef.current = null;
    }, currentStep.animation.durationMs);
  }, [currentStep, isAnimating]);

  const next = useCallback(() => {
    if (isAnimating || stepIndex >= totalSteps - 1) return;
    setStepIndex(prev => prev + 1);
    setIsAnimating(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, [isAnimating, stepIndex, totalSteps]);

  const back = useCallback(() => {
    if (isAnimating || stepIndex <= 0) return;
    setStepIndex(prev => prev - 1);
    setIsAnimating(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, [isAnimating, stepIndex]);

  const isLast = stepIndex === totalSteps - 1;

  return (
    <section className="tutorial-section">
      <h2>Folding tutorial</h2>
      <div className="step-header">
        <span className="step-number">Step {stepIndex + 1} of {totalSteps}</span>
        <span className="component-label">Sheet: {currentStep.sheetId}</span>
      </div>
      <div className="tutorial-layout">
        <div className="diagram-slot" aria-label="Fold diagram">
          <span className="slot-label">Diagram slot</span>
          {isAnimating && <div className="animating-indicator" aria-hidden="true" />}
        </div>
        <div className="instruction-slot">
          <p className="instruction-text">{currentStep.instruction}</p>
          <p className="highlights">
            Highlighted corners: {currentStep.highlightLandmarkIds.join(', ')}
          </p>
        </div>
      </div>
      <div className="tutorial-controls">
        <button className="secondary" onClick={back} disabled={stepIndex === 0 || isAnimating}>
          Back
        </button>
        <button className="secondary" onClick={replay} disabled={isAnimating}>
          Replay
        </button>
        <button onClick={next} disabled={isAnimating || isLast}>
          {isLast ? 'Finish' : 'Next'}
        </button>
        {isLast && (
          <button className="finish" onClick={onFinish} disabled={isAnimating}>
            Complete
          </button>
        )}
      </div>
    </section>
  );
}
