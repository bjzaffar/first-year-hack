import { StrictMode, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GenerateResponseSchema, type CompiledTutorial } from '../shared/schemas.js';
import { UploadCrop, type CroppedImage } from './UploadCrop.js';
import { GenerationStates } from './GenerationStates.js';
import { Preview } from './Preview.js';
import { Prepare } from './Prepare.js';
import { TutorialPlayer } from './TutorialPlayer.js';
import { PaperBackground } from './PaperBackground.js';
import './style.css';

type AppPhase = 'upload' | 'generating' | 'preview' | 'prepare' | 'tutorial' | 'finish' | 'error';

function App() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [tutorial, setTutorial] = useState<CompiledTutorial | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    try {
      // Use fixture mode since live generation is not configured
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractVersion: '1', mode: 'fixture' }),
      });
      const json: unknown = await response.json();
      if (!response.ok) throw new Error('Fixture request failed.');
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
  }, []);

  const handleBackFromTutorial = useCallback(() => {
    setPhase('prepare');
  }, []);

  return (
    <>
    <PaperBackground />
    <main>
      <header className="studio-header">
        <a className="wordmark" href="/" aria-label="FoldLens home"><span aria-hidden="true" className="fold-mark">◇</span> FoldLens<span className="wordmark-dot">.</span></a>
        <span className="studio-caption">A little wonder, made by hand.</span>
      </header>
      <div className="intro">
        <p className="eyebrow">THE PAPER STUDIO</p>
        <h1>See the ordinary.<br /><em>Fold something extraordinary.</em></h1>
        <p className="tagline">A photograph, a square of paper, a new perspective.<br />Explore the art of origami, one fold at a time.</p>
      </div>
      <nav className="journey" aria-label="Folding journey">
        {['Choose an object', 'Meet your model', 'Make it yours'].map((label, index) => {
          const active = phase === 'upload' || phase === 'error' ? 0 : phase === 'preview' || phase === 'generating' ? 1 : 2;
          return <span key={label} className={active === index ? 'current' : ''} aria-current={active === index ? 'step' : undefined}><small>0{index + 1}</small>{label}</span>;
        })}
      </nav>
      <p className="sample-notice" role="note"><span aria-hidden="true">○</span> Studio preview · Explore a sample tutorial. Your photograph stays local and isn’t analysed yet.</p>

      {phase === 'upload' && (
        <UploadCrop onCrop={handleCrop} onInvalidate={() => setCroppedImage(null)} initialImage={croppedImage} />
      )}

      {phase === 'upload' && croppedImage && (
        <div className="actions">
          <button onClick={handleGenerate}>Load sample tutorial</button>
        </div>
      )}

      {phase === 'generating' && (
        <GenerationStates />
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
            <button onClick={handleGenerate}>Retry sample tutorial</button>
            <button onClick={handleRetry}>Adjust crop</button>
            <button onClick={resetToUpload}>Choose another image</button>
          </div>
        </section>
      )}

      <footer className="app-footer">
        <span className="footer-brand">FoldLens</span><p>Made of paper. Shaped by curiosity.</p><small>Your progress lives in this session.</small>
      </footer>
    </main>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
