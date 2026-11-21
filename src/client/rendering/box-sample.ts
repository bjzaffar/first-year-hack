import { compileMasu } from "../../geometry/compiler.js";
/** Shared explicitly labelled demonstration for both entry points. No image input or inference. */
export function createBoxSample() {
  return compileMasu({
    recipeId: "masu-box",
    parameters: { wallHeightFraction: 0.1 },
    objectLabel: "Box sample",
    approximationNotes: [
      "Fixed box sample: no photograph was analysed. Your uploaded image does not change this design.",
    ],
  });
}
