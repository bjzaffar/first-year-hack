import { useState } from "react";
import { createBoxSample } from "./box-sample.js";
import { Preview } from "../Preview.js";
import { TutorialPlayer } from "../TutorialPlayer.js";
/** Explicit offline fixture route; never presented as analysis of an uploaded photograph. */
export function FixtureWalkthrough() {
  const [tutorial] = useState(createBoxSample);
  const [phase, setPhase] = useState("preview");
  return (
    <main>
      <h1>Box recipe demonstration</h1>
      <p>Offline fixture · one square sheet · physical folding unverified</p>
      {phase === "preview" ? (
        <Preview
          tutorial={tutorial}
          onAccept={() => setPhase("tutorial")}
          onRetry={() => location.assign("/")}
        />
      ) : phase === "tutorial" ? (
        <TutorialPlayer
          tutorial={tutorial}
          onBack={() => setPhase("preview")}
          onFinish={() => setPhase("finish")}
        />
      ) : (
        <>
          <h2>Finished</h2>
          <Preview
            tutorial={tutorial}
            onAccept={() => setPhase("tutorial")}
            onRetry={() => location.assign("/")}
          />
        </>
      )}
    </main>
  );
}
