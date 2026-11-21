import { useState } from "react";
import { createBoxSample } from "./box-sample.js";
import { Preview } from "../Preview.js";
import { TutorialPlayer } from "../TutorialPlayer.js";
/** Explicit offline fixture route; never presented as analysis of an uploaded photograph. */
import { compileBoat } from '../../geometry/boat-compiler.js';
import type { RenderTutorial } from './motion.js';
export function FixtureWalkthrough({ boat = false }: { boat?: boolean }) {
  const [tutorial] = useState<RenderTutorial>(() => boat ? compileBoat({ recipeId: 'basic-boat', parameters: { hullWidthFraction: 0.26 }, objectLabel: 'Boat sample', approximationNotes: ['Fixed boat sample: no photograph was analysed.'] }) : createBoxSample());
  const [phase, setPhase] = useState("preview");
  return (
    <main>
      <h1>{boat ? 'Boat' : 'Box'} recipe demonstration</h1>
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
