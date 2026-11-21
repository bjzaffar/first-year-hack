import { useId } from "react";
import { OrthographicCamera, Vector3 } from "three";
import type { RenderTutorial } from "./motion.js";
export function FoldDiagram({
  tutorial,
  index,
  final = false,
}: {
  tutorial: RenderTutorial;
  index: number;
  final?: boolean;
}) {
  const marker = useId().replaceAll(":", "");
  const step = tutorial.steps[index],
    before = tutorial.states.find((s) => s.id === step.beforeStateId)!,
    after = tutorial.states.find((s) => s.id === step.afterStateId)!;
  const camera = new OrthographicCamera(-0.85, 0.85, 0.85, -0.85, 0.01, 100);
  camera.up.set(0, 0, 1);
  if (
    step.diagramCamera.position[0] === 0 &&
    step.diagramCamera.position[1] === 0
  )
    camera.up.set(0, 1, 0);
  camera.position.set(...step.diagramCamera.position);
  camera.lookAt(...step.diagramCamera.target);
  camera.updateMatrixWorld();
  const project = (p: number[]) => {
    const v = new Vector3(...p).project(camera);
    return [(v.x + 1) * 200, (1 - v.y) * 200];
  };
  const points = new Map(
    (final ? after : before).vertices.map((v) => [v.id, project(v.position)]),
  );
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={final ? 'Final origami geometry diagram' : `Fixed teaching diagram: ${step.id}`}
      width="400"
      height="400"
      style={{ display: "block", width: "100%", height: 360, minWidth: 0 }}
    >
      <defs>
        <marker
          id={marker}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#a44e38" />
        </marker>
      </defs>
      {before.faces.map((f) => (
        <polygon
          key={f.id}
          points={f.vertices.map((id) => points.get(id)!.join(",")).join(" ")}
          fill="#f4e5cf"
          stroke="none"
        />
      ))}
      {before.edges.map((e) => (
        <line
          key={e.id}
          x1={points.get(e.vertices[0])![0]}
          y1={points.get(e.vertices[0])![1]}
          x2={points.get(e.vertices[1])![0]}
          y2={points.get(e.vertices[1])![1]}
          stroke="#776b59"
          strokeWidth="1"
          strokeDasharray={e.assignment === "B" ? undefined : "4 4"}
        />
      ))}
      {step.highlightLandmarkIds.map((id) => {
        const vertexId = before.landmarks.find((l) => l.id === id)!.vertexId;
        const a = points.get(vertexId)!,
          b = project(after.vertices.find((v) => v.id === vertexId)!.position);
        return (
          <g key={id}>
            <circle cx={a[0]} cy={a[1]} r="4" fill="#a44e38" />
            <title>{id}</title>
            {Math.hypot(a[0] - b[0], a[1] - b[1]) > 3 && (
              <path
                d={`M${a} Q${(a[0] + b[0]) / 2 + 18},${(a[1] + b[1]) / 2 - 18} ${b}`}
                fill="none"
                stroke="#a44e38"
                strokeWidth="2"
                markerEnd={`url(#${marker})`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
