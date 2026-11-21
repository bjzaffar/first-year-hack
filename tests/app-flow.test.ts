// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { App } from "../src/client/App.js";
vi.mock("../src/client/PaperBackground.js", () => ({
  PaperBackground: () => null,
}));
vi.mock("../src/client/UploadCrop.js", () => ({
  UploadCrop: ({ onCrop }: { onCrop: (image: unknown) => void }) =>
    createElement(
      "button",
      {
        onClick: () =>
          onCrop({
            dataUrl: "data:image/png;base64,aGVsbG8=",
            mimeType: "image/png",
            base64: "aGVsbG8=",
            width: 1,
            height: 1,
          }),
      },
      "Use test crop",
    ),
}));
// GPU behavior is exercised separately in fold-scene.test.ts. This test checks shell integration.
vi.mock("../src/client/rendering/FoldScene.js", () => ({
  FoldScene: () => createElement("div", null, "3D view"),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("takes an uploaded crop through the full nine-step box sample, with honest labelling", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const click = async (text: string) => {
    const button = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === text,
    );
    expect(button).toBeDefined();
    await act(() => button!.click());
  };
  try {
    await act(() => root.render(createElement(App)));
    await click("Use test crop");
    await click("Load box sample tutorial");
    expect(host.textContent).toContain("no photograph was analysed");
    expect(host.textContent).toContain("Not measured");
    await click("Accept and start folding");
    expect(host.textContent).toContain("1 square sheet");
    await click("Start folding");
    expect(host.textContent).toContain("Step 1 of 9");
    expect(host.querySelector('svg[role="img"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
