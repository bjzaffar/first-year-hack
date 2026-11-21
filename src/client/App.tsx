import { useState, useCallback } from "react";
import { createBoxSample } from "./rendering/box-sample.js";
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

  const resetToUpload = useCallback(() => {
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
    setPhase("generating");
    try {
      setTutorial(createBoxSample());
      setPhase("preview");
    } catch {
      setErrorMessage(
        "Could not prepare the box sample. Please reload and retry.",
      );
      setPhase("error");
    }
  }, []);

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
          <span aria-hidden="true">○</span> Studio preview · Explore the
          nine-step box sample. Your photograph stays local and does not change
          this sample.
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
            <button onClick={handleGenerate}>Load box sample tutorial</button>
          </div>
        )}

        {phase === "generating" && <GenerationStates />}

        {phase === "preview" && tutorial && (
          <Preview
            tutorial={tutorial}
            photoDataUrl={photoDataUrl}
            onAccept={handleAccept}
            onRetry={handleRetry}
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
              <button onClick={handleGenerate}>
                Retry box sample tutorial
              </button>
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
