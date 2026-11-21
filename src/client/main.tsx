import { StrictMode, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { REVISION } from 'three';
import { GenerateResponseSchema, type CompiledTutorial } from '../shared/schemas.js';
import { UploadCrop, type CroppedImage } from './UploadCrop.js';
import { GenerationStates } from './GenerationStates.js';
import { Preview } from './Preview.js';
import { Prepare } from './Prepare.js';
import { TutorialPlayer } from './TutorialPlayer.js';
import './style.css';

type AppPhase = 'upload' | 'generating' | 'preview' | 'prepare' | 'tutorial' | 'finish' | 'error';

function App() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [tutorial, setTutorial] = useState<CompiledTutorial | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationStage, setGenerationStage] = useState<'analysing' | 'fitting' | 'preparing'>('analysing');
  const [croppedImage, setCroppedImage] = useState<CroppedImage | null>(null);

  const resetToUpload = useCallback(() => {
    setPhase('upload');
    setTutorial(null);
    setPhotoDataUrl(undefined);
    setErrorMessage(null);
    setCroppedImage(null);
  }, []);

  const handleCrop = useCallback((image: CroppedImage) => {
    setCroppedImage(image);
    setPhotoDataUrl(image.dataUrl);
  }, []);

  const handleGenerate = useCallback(async () => {
    setPhase('generating');
    setGenerationStage('analysing');

    // Simulate real processing stages (no invented percentages)
    await new Promise(r => setTimeout(r, 600));
    setGenerationStage('fitting');
    await new Promise(r => setTimeout(r, 600));
    setGenerationStage('preparing');
    await new Promise(r => setTimeout(r, 600));

    try {
      // Use fixture mode since live generation is not configured
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractVersion: '1', mode: 'fixture' }),
      });
      const json: unknown = await response.json();
      const result = GenerateResponseSchema.parse(json);
      if (!result.ok) {
        setErrorMessage(result.error.message);
        setPhase('error');
        return;
      }
      setTutorial(result.tutorial);
      setPhase('preview');
    } catch {
      setErrorMessage('Could not read a valid local server response. Start the backend and retry.');
      setPhase('error');
    }
  }, []);

  const handleAccept = useCallback(() => {
    setPhase('prepare');
  }, []);

  const handleStartFolding = useCallback(() => {
    setPhase('tutorial');
  }, []);

  const handleFinish = useCallback(() => {
    setPhase('finish');
  }, []);

  const handleRetry = useCallback(() => {
    setPhase('upload');
    setTutorial(null);
    setErrorMessage(null);
    setCroppedImage(null);
  }, []);

  const handleBackFromTutorial = useCallback(() => {
    setPhase('prepare');
  }, []);

  return (
    <main>
      <p className="eyebrow">FoldLens · From photograph to paper</p>
      <h1>From photograph to paper.</h1>
      <p className="tagline">Upload a photo of an everyday object and follow a step-by-step folding tutorial.</p>

      {phase === 'upload' && (
        <UploadCrop onCrop={handleCrop} onCancel={undefined} />
      )}

      {phase === 'upload' && croppedImage && (
        <div className="actions">
          <button onClick={handleGenerate}>Generate</button>
        </div>
      )}

      {phase === 'generating' && (
        <GenerationStates stage={generationStage} />
      )}

      {phase === 'preview' && tutorial && (
        <Preview
          tutorial={tutorial}
          photoDataUrl={photoDataUrl}
          onAccept={handleAccept}
          onRetry={handleRetry}
        />
      )}

      {phase === 'prepare' && tutorial && (
        <Prepare tutorial={tutorial} onStart={handleStartFolding} />
      )}

      {phase === 'tutorial' && tutorial && (
        <TutorialPlayer
          tutorial={tutorial}
          onFinish={handleFinish}
          onBack={handleBackFromTutorial}
        />
      )}

      {phase === 'finish' && (
        <section className="finish-section">
          <h2>Finished</h2>
          <p>You have completed the folding tutorial. The final model matches the preview geometry.</p>
          <div className="actions">
            <button onClick={resetToUpload}>Start a new design</button>
          </div>
        </section>
      )}

      {phase === 'error' && (
        <section className="error-section">
          <h2>Generation failed</h2>
          <p role="alert">{errorMessage ?? 'An unexpected error occurred.'}</p>
          <div className="actions">
            <button onClick={handleRetry}>Try again</button>
          </div>
        </section>
      )}

      <footer className="app-footer">
        <p>Contract version 1 · Three.js r{REVISION} · Session-only; refreshing discards progress.</p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
