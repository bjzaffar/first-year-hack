// @vitest-environment happy-dom
import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { FoldScene } from "../src/client/rendering/FoldScene.js";
import { FoldDiagram } from "../src/client/rendering/FoldDiagram.js";
import { createBoxSample } from "../src/client/rendering/box-sample.js";

const graphics = vi.hoisted(() => ({
  render: vi.fn(),
  dispose: vi.fn(),
  failInitialization: false,
}));
vi.mock("three", async (importOriginal) => {
  const original = await importOriginal<typeof import("three")>();
  return {
    ...original,
    WebGLRenderer: class {
      domElement = document.createElement("canvas");
      constructor() {
        if (graphics.failInitialization)
          throw new Error("WebGL context unavailable");
      }
      setPixelRatio() {}
      setSize() {}
      render = graphics.render;
      dispose = graphics.dispose;
    },
  };
});
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const tutorial = createBoxSample();
let pending = new Map<number, FrameRequestCallback>(),
  nextId = 0;
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  pending.set(++nextId, cb);
  return nextId;
});
vi.stubGlobal("cancelAnimationFrame", (id: number) => pending.delete(id));
const host = document.createElement("div");
document.body.append(host);
let root = createRoot(host);
async function frame(now: number) {
  const callbacks = [...pending.values()];
  pending.clear();
  await act(() => callbacks.forEach((cb) => cb(now)));
}
afterEach(async () => {
  await act(() => root.unmount());
  root = createRoot(host);
  pending.clear();
  graphics.failInitialization = false;
  vi.clearAllMocks();
});
it("starts at the first RAF timestamp, including timestamps earlier than performance.now", async () => {
  const complete = vi.fn(),
    error = vi.fn();
  await act(() =>
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(FoldScene, {
          tutorial,
          index: 0,
          onComplete: complete,
          onError: error,
        }),
      ),
    ),
  );
  await frame(-100); // A frame timestamp may predate effect initialization.
  expect(error).not.toHaveBeenCalled();
  expect(graphics.render).toHaveBeenCalled();
  await frame(800);
  expect(complete).not.toHaveBeenCalled();
  await frame(1700);
  expect(complete).toHaveBeenCalledTimes(1);
  await frame(1800);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(host.querySelectorAll("canvas")).toHaveLength(1);
});
it("loads/replays all nine steps and disposes old renderers without stale completion", async () => {
  const complete = vi.fn(),
    error = vi.fn();
  for (const index of [0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1, 0]) {
    await act(() =>
      root.render(
        createElement(FoldScene, {
          tutorial,
          index,
          onComplete: complete,
          onError: error,
        }),
      ),
    );
    await frame(0);
    await frame(tutorial.steps[index].animation.durationMs);
  }
  expect(complete).toHaveBeenCalledTimes(17);
  expect(error).not.toHaveBeenCalled();
  await act(() =>
    root.render(
      createElement(FoldScene, {
        tutorial,
        index: 0,
        replayKey: 1,
        onComplete: complete,
        onError: error,
      }),
    ),
  );
  await frame(0);
  expect(complete).toHaveBeenCalledTimes(17);
  await frame(1800);
  expect(complete).toHaveBeenCalledTimes(18);
  expect(graphics.dispose).toHaveBeenCalledTimes(17);
});
it("keeps a sized diagram visible and reports initialization failures without rotation hints", async () => {
  graphics.failInitialization = true;
  const error = vi.fn();
  await act(() =>
    root.render(
      createElement(
        "div",
        null,
        createElement(FoldScene, { tutorial, index: 0, onError: error }),
        createElement(FoldDiagram, { tutorial, index: 0 }),
      ),
    ),
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "WebGL context unavailable",
  );
  expect(host.textContent).not.toContain("Drag to rotate");
  expect(error).toHaveBeenCalledOnce();
  expect(host.querySelector("svg")?.style.height).toBe("360px");
  expect(host.querySelectorAll("svg polygon")).toHaveLength(29);
});
it("reports context loss and cancels pending playback", async () => {
  const complete = vi.fn(),
    error = vi.fn();
  await act(() =>
    root.render(
      createElement(FoldScene, {
        tutorial,
        index: 0,
        onComplete: complete,
        onError: error,
      }),
    ),
  );
  await frame(0);
  await act(() => {
    host
      .querySelector("canvas")!
      .dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await frame(2000);
  expect(complete).not.toHaveBeenCalled();
  expect(error).toHaveBeenCalledOnce();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "context was lost",
  );
});
