import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { GeometryState } from "../../shared/schemas.js";
import { sampleStep, Playback, type RenderTutorial } from "./motion.js";

export function FoldScene({
  tutorial,
  index,
  replayKey = 0,
  onComplete,
  onError,
}: {
  tutorial: RenderTutorial;
  index?: number;
  replayKey?: number;
  onComplete?: () => void;
  onError?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    callbacks = useRef({ onComplete, onError });
  callbacks.current = { onComplete, onError };
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer | undefined,
      controls: OrbitControls | undefined,
      request = 0,
      disposed = false;
    const playback = new Playback();
    const token = playback.loadStep(index ?? 0, tutorial.steps.length);
    const scene = new THREE.Scene(),
      group = new THREE.Group();
    scene.add(group);
    const clear = () => {
      for (const child of [...group.children]) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
        group.remove(child);
      }
    };
    const fail = (
      cause: unknown,
      stage: "initialization" | "playback" | "context",
    ) => {
      if (disposed) return;
      cancelAnimationFrame(request);
      const detail = cause instanceof Error ? cause.message : String(cause);
      setError(
        stage === "context"
          ? "The 3D graphics context was lost. Reload to retry; the diagram remains available."
          : stage === "initialization"
            ? `Could not start the 3D view: ${detail}. The diagram remains available.`
            : `Could not play this fold: ${detail}. The diagram remains available.`,
      );
      callbacks.current.onError?.();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      fail(new Error("Graphics context lost"), "context");
    };
    try {
      setError(null);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      renderer.domElement.addEventListener("webglcontextlost", lost);
      const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
      camera.up.set(0, 0, 1);
      const spec =
        index === undefined
          ? {
              position: [1, -1, 1.3] as [number, number, number],
              target: [0, 0, 0] as [number, number, number],
            }
          : tutorial.steps[index].camera;
      camera.position.set(...spec.position);
      camera.lookAt(...spec.target);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(...spec.target);
      controls.enablePan = false;
      controls.minDistance = 0.8;
      controls.maxDistance = 6;
      controls.update();
      scene.add(new THREE.HemisphereLight(0xffffff, 0xa89c84, 3));
      const light = new THREE.DirectionalLight(0xffffff, 2);
      light.position.set(1, -2, 4);
      scene.add(light);
      const draw = (state: GeometryState) => {
        clear();
        const vertices = new Map(state.vertices.map((v) => [v.id, v.position]));
        state.faces.forEach((face, i) => {
          const coords: number[] = [];
          for (let j = 1; j < face.vertices.length - 1; j++)
            for (const id of [
              face.vertices[0],
              face.vertices[j],
              face.vertices[j + 1],
            ])
              coords.push(...vertices.get(id)!);
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(coords, 3),
          );
          geometry.computeVertexNormals();
          const material = new THREE.MeshStandardMaterial({
            color: face.layer ? 0xe6cbaa : 0xf9e9cc,
            side: THREE.DoubleSide,
            roughness: 0.9,
            polygonOffset: true,
            polygonOffsetFactor: -(face.layer + 1),
            polygonOffsetUnits: -(face.layer + 1),
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.renderOrder = face.layer;
          mesh.name = face.id;
          group.add(mesh);
          const edge = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({
              color: 0x82705d,
              transparent: true,
              opacity: 0.5,
            }),
          );
          edge.renderOrder = i;
          group.add(edge);
        });
        if (index !== undefined)
          for (const id of tutorial.steps[index].highlightLandmarkIds) {
            const p = vertices.get(
              state.landmarks.find((l) => l.id === id)!.vertexId,
            )!;
            const dot = new THREE.Mesh(
              new THREE.SphereGeometry(0.009, 8, 8),
              new THREE.MeshBasicMaterial({
                color: 0xb14d32,
                depthTest: false,
              }),
            );
            dot.position.set(...p);
            dot.renderOrder = 100;
            group.add(dot);
          }
      };
      let start: number | undefined;
      let completed = false;
      const tick = (now: number) => {
        if (disposed) return;
        try {
          const width = container.clientWidth || 400,
            height = 360;
          renderer!.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          start ??= now;
          const progress =
            index === undefined
              ? 1
              : Math.max(
                  0,
                  Math.min(
                    1,
                    (now - start) / tutorial.steps[index].animation.durationMs,
                  ),
                );
          if (!playback.advance(token, progress)) return;
          if (!completed) {
            draw(
              index === undefined
                ? tutorial.states.find((s) => s.id === tutorial.finalStateId)!
                : sampleStep(tutorial, index, progress),
            );
            if (progress === 1) {
              completed = true;
              callbacks.current.onComplete?.();
            }
          }
          controls!.update();
          renderer!.render(scene, camera);
          request = requestAnimationFrame(tick);
        } catch (cause) {
          fail(cause, "playback");
        }
      };
      request = requestAnimationFrame(tick);
    } catch (cause) {
      fail(cause, "initialization");
    }
    return () => {
      disposed = true;
      playback.cancel();
      cancelAnimationFrame(request);
      controls?.dispose();
      clear();
      if (renderer) {
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [tutorial, index, replayKey]);
  return (
    <div className="fold-scene">
      <div
        ref={host}
        aria-label={
          index === undefined
            ? "Rotatable final origami preview"
            : "Animated fold"
        }
        style={{ width: "100%", height: error ? 0 : 360, overflow: "hidden" }}
      />
      {error && <p role="alert">{error}</p>}
      {!error && <p className="caption">Drag to rotate · Scroll to zoom</p>}
    </div>
  );
}
