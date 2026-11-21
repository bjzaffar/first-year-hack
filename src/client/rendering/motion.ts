import { masuOperations } from "../../shared/masu-contract.js";
import { Vector3 } from "three";
import type { CompiledTutorial, GeometryState } from "../../shared/schemas.js";
import { type MasuTutorial, masuState } from "../../geometry/compiler.js";
export type RenderTutorial = CompiledTutorial | MasuTutorial;
export function sampleStep(
  tutorial: RenderTutorial,
  index: number,
  progress: number,
): GeometryState {
  if (
    !Number.isInteger(index) ||
    !tutorial.steps[index] ||
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 1
  )
    throw new Error("Invalid playback position");
  const step = tutorial.steps[index];
  const before = tutorial.states.find((s) => s.id === step.beforeStateId)!;
  const after = tutorial.states.find((s) => s.id === step.afterStateId)!;
  if (tutorial.contractVersion === "masu-1") {
    const s = tutorial.steps[index];
    if (JSON.stringify(s.operation) !== JSON.stringify(masuOperations[index]))
      throw new Error("Unsupported fold motion");
    if (progress === 0) return structuredClone(before);
    if (progress === 1) return structuredClone(after);
    return masuState(tutorial.parameters, s.id, progress);
  }
  const operation = tutorial.steps[index].operation;
  if (operation.type !== "hinge") throw new Error("Unsupported fold motion");
  if (progress === 0) return structuredClone(before);
  if (progress === 1) return structuredClone(after);
  const position = (id: string) =>
    new Vector3(
      ...before.vertices.find(
        (v) => v.id === before.landmarks.find((l) => l.id === id)!.vertexId,
      )!.position,
    );
  const a = position(operation.axisLandmarkIds[0]),
    b = position(operation.axisLandmarkIds[1]);
  const axis = b.sub(a).normalize();
  const moving = new Set(
    before.faces
      .filter((f) => operation.affectedFaceIds.includes(f.id))
      .flatMap((f) => f.vertices),
  );
  return {
    ...structuredClone(before),
    vertices: before.vertices.map((v) => ({
      ...v,
      position: moving.has(v.id)
        ? new Vector3(...v.position)
            .sub(a)
            .applyAxisAngle(
              axis,
              ((operation.angleDegrees * Math.PI) / 180) * progress,
            )
            .add(a)
            .toArray()
        : [...v.position],
    })),
  };
}
/** Generation token invalidates stale animation callbacks on load/replay/dispose. */
export class Playback {
  index = 0;
  progress = 0;
  private generation = 0;
  loadStep(index: number, count: number) {
    if (!Number.isInteger(index) || index < 0 || index >= count)
      throw new RangeError("Invalid step");
    this.index = index;
    this.progress = 0;
    return ++this.generation;
  }
  replay() {
    this.progress = 0;
    return ++this.generation;
  }
  advance(token: number, progress: number) {
    if (token !== this.generation) return false;
    this.progress = Math.min(1, Math.max(0, progress));
    return true;
  }
  cancel() {
    this.generation++;
  }
}
