import { useState, useCallback, useEffect, useRef } from "react";
import { generateTutorial, GenerationFailure } from "./generate.js";
import type { RenderTutorial } from "./rendering/motion.js";
import { FoldScene } from "./rendering/FoldScene.js";
import { UploadCrop, type CroppedImage } from "./UploadCrop.js";
import { GenerationStates } from "./GenerationStates.js";
import { Preview } from "./Preview.js";
import { Prepare } from "./Prepare.js";
import { TutorialPlayer } from "./TutorialPlayer.js";
import { PaperBackground } from "./PaperBackground.js";

type AppPhase =
  | "upload"
  | "generating"
  | "preview"
  | "prepare"
  | "tutorial"
  | "finish"
  | "error";

export function App() {
  const [phase, setPhase] = useState<AppPhase>("upload");
  const [tutorial, setTutorial] = useState<RenderTutorial | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<CroppedImage | null>(null);
  const [retryable, setRetryable] = useState(true);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);

  const resetToUpload = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setPhase("upload");
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
    if (!croppedImage || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 65_000);
    setTutorial(null);
    setErrorMessage(null);
    setPhase("generating");
    try {
      const generated = await generateTutorial(croppedImage, controller.signal);
      if (request.current !== controller) return;
      setTutorial(generated);
      setPhase("preview");
    } catch (cause) {
      if (request.current !== controller) return;
      setRetryable(cause instanceof GenerationFailure ? cause.retryable : true);
      setErrorMessage(
        cause instanceof GenerationFailure ? cause.message : "Could not generate a tutorial. Your crop is saved for retry.",
      );
      setPhase("error");
    } finally {
      clearTimeout(timer);
      if (request.current === controller) request.current = null;
    }
  }, [croppedImage]);

  const handleAccept = useCallback(() => {
    setPhase("prepare");
  }, []);

  const handleStartFolding = useCallback(() => {
    setPhase("tutorial");
  }, []);

  const handleFinish = useCallback(() => {
    setPhase("finish");
  }, []);

  const handleRetry = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setPhase("upload");
    setTutorial(null);
    setErrorMessage(null);
  }, []);

  const handleBackFromTutorial = useCallback(() => {
    setPhase("prepare");
  }, []);

  return (
    <>
      <PaperBackground />
      <main>
        <header className="studio-header">
          <a className="wordmark" href="/" aria-label="FoldLens home">
            <span aria-hidden="true" className="fold-mark">
              ◇
            </span>{" "}
            FoldLens<span className="wordmark-dot">.</span>
          </a>
          <span className="studio-caption">A little wonder, made by hand.</span>
        </header>
        <div className="intro">
          <p className="eyebrow">THE PAPER STUDIO</p>
          <h1>
            See the ordinary.
            <br />
            <em>Fold something extraordinary.</em>
          </h1>
          <p className="tagline">
            A photograph, a square of paper, a new perspective.
            <br />
            Explore the art of origami, one fold at a time.
          </p>
        </div>
        <nav className="journey" aria-label="Folding journey">
          {["Choose an object", "Meet your model", "Make it yours"].map(
            (label, index) => {
              const active =
                phase === "upload" || phase === "error"
                  ? 0
                  : phase === "preview" || phase === "generating"
                    ? 1
                    : 2;
              return (
                <span
                  key={label}
                  className={active === index ? "current" : ""}
                  aria-current={active === index ? "step" : undefined}
                >
                  <small>0{index + 1}</small>
                  {label}
                </span>
              );
            },
          )}
        </nav>
        <p className="sample-notice" role="note">
          <span aria-hidden="true">○</span> Local photo generation · Your crop
          shapes a tray or pointed boat approximation. Review its simplifications
          before folding. <a href="/fixtures/masu">Tray sample</a>{" · "}<a href="/fixtures/boat">Boat sample</a>
        </p>

        {phase === "upload" && (
          <UploadCrop
            onCrop={handleCrop}
            onInvalidate={() => setCroppedImage(null)}
            initialImage={croppedImage}
          />
        )}

        {phase === "upload" && croppedImage && (
          <div className="actions">
            <button onClick={handleGenerate}>Generate from photograph</button>
          </div>
        )}

        {phase === "generating" && <><GenerationStates /><div className="actions"><button className="secondary" onClick={handleRetry}>Cancel and adjust crop</button></div></>}

        {phase === "preview" && tutorial && (
          <Preview
            tutorial={tutorial}
            photoDataUrl={photoDataUrl}
            onAccept={handleAccept}
            onRetry={handleRetry}
            onNewImage={resetToUpload}
          />
        )}

        {phase === "prepare" && tutorial && (
          <Prepare tutorial={tutorial} onStart={handleStartFolding} />
        )}

        {phase === "tutorial" && tutorial && (
          <TutorialPlayer
            tutorial={tutorial}
            onFinish={handleFinish}
            onBack={handleBackFromTutorial}
          />
        )}

        {phase === "finish" && (
          <section className="finish-section">
            <h2>Finished</h2>
            {tutorial && <FoldScene tutorial={tutorial} />}
            <p>
              You have completed the folding tutorial. The final model matches
              the preview geometry.
            </p>
            <div className="actions">
              <button onClick={resetToUpload}>Start a new design</button>
            </div>
          </section>
        )}

        {phase === "error" && (
          <section className="error-section">
            <h2>Generation failed</h2>
            <p role="alert">
              {errorMessage ?? "An unexpected error occurred."}
            </p>
            <div className="actions">
              {retryable && <button onClick={handleGenerate}>Retry with this crop</button>}
              <button onClick={handleRetry}>Adjust crop</button>
              <button onClick={resetToUpload}>Choose another image</button>
            </div>
          </section>
        )}

        <footer className="app-footer">
          <span className="footer-brand">FoldLens</span>
          <p>Made of paper. Shaped by curiosity.</p>
          <small>Your progress lives in this session.</small>
        </footer>
      </main>
    </>
  );
}
