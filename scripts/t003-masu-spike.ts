import {
  masuBoxDimensions,
  masuFlatNet,
  masuFoldedLayout,
  masuNorthWestCornerCompatibility,
  masuNorthWallEdgeLengths,
  masuNorthWallMotion,
  masuBoxParameterSamples,
} from '../src/recipes/masu-box.js';

const paperEdge = 1;
const samples = masuBoxParameterSamples.map(parameters => parameters.wallHeightFraction);
const expectedWallEdges = (baseSide: number, wallHeight: number) => [baseSide, wallHeight, baseSide, wallHeight];
const close = (a: number, b: number) => Math.abs(a - b) < 1e-10;

for (const wallHeightFraction of samples) {
  const dimensions = masuBoxDimensions(paperEdge, { wallHeightFraction });
  const net = masuFlatNet(dimensions);
  const foldedLayout = masuFoldedLayout(dimensions, net);
  const netAreaCorrect = close(net.area, paperEdge ** 2);
  const netInsideSheet = net.vertices.every(vertex => vertex.x >= -1e-10 && vertex.x <= paperEdge + 1e-10 &&
    vertex.y >= -1e-10 && vertex.y <= paperEdge + 1e-10);
  const motionSamples = [0, 0.25, 0.5, 0.75, 1].map(t => masuNorthWallMotion(dimensions, t));
  const expected = expectedWallEdges(dimensions.baseSide, dimensions.wallHeight);
  const rigidThroughout = motionSamples.every(motion => masuNorthWallEdgeLengths(motion)
    .every((length, index) => close(length, expected[index])));
  const axisFixed = motionSamples.every(motion => close(motion.fixedAxis[0].y, dimensions.baseSide / 2) &&
    close(motion.fixedAxis[1].y, dimensions.baseSide / 2) && close(motion.fixedAxis[0].z, 0) && close(motion.fixedAxis[1].z, 0));
  const upright = motionSamples.at(-1)!;
  const endpointIsCorrect = close(upright.movingVertices[2].z, dimensions.wallHeight) &&
    close(upright.movingVertices[2].y, dimensions.baseSide / 2);
  const corner = masuNorthWestCornerCompatibility(dimensions);
  const independentWallsRequireCompoundCollapse = close(corner.mismatch, Math.SQRT2 * dimensions.wallHeight) &&
    corner.mismatch > 0;
  if (net.faces.length !== 29 || !netAreaCorrect || !netInsideSheet ||
      !rigidThroughout || !axisFixed || !endpointIsCorrect || !independentWallsRequireCompoundCollapse ||
      !foldedLayout.edgeLengthPreserved || !foldedLayout.everyFaceNondegenerate ||
      !foldedLayout.tipTrianglesTileFloor || !foldedLayout.wallBandPairsCoincide || !foldedLayout.cornerLayerGroupsCoincide) {
    throw new Error(`Hinge invariant failed at wallHeightFraction=${wallHeightFraction}`);
  }
  console.log(JSON.stringify({
    wallHeightFraction,
    dimensions,
    flatNet: { faces: net.faces.length, edges: net.edges.length,
      candidateCreases: net.edges.filter(edge => edge.kind === 'candidate-crease').length,
      boundaryEdges: net.edges.filter(edge => edge.kind === 'boundary').length,
      area: net.area, paperArea: paperEdge ** 2 },
    motionDegrees: motionSamples.map(motion => motion.angleDegrees),
    uprightWallVertices: upright.movingVertices,
    uprightEdgeLengths: masuNorthWallEdgeLengths(upright),
    naiveNorthWestCorner: { ...corner, independentWallsRequireCompoundCollapse },
    finalLayoutChecks: {
      edgeLengthPreserved: foldedLayout.edgeLengthPreserved,
      everyFaceNondegenerate: foldedLayout.everyFaceNondegenerate,
      tipTrianglesTileFloor: foldedLayout.tipTrianglesTileFloor,
      wallBandPairsCoincide: foldedLayout.wallBandPairsCoincide,
      cornerLayerGroupsCoincide: foldedLayout.cornerLayerGroupsCoincide,
    },
    checks: { positiveBase: dimensions.baseSide > 0, flatNetArea: netAreaCorrect, netInsideSheet,
      fixedHingeAxis: axisFixed, rigidWallThroughout: rigidThroughout, uprightEndpoint: endpointIsCorrect },
  }));
}

for (const wallHeightFraction of [0, 1 / (2 * Math.SQRT2)]) {
  let rejected = false;
  try { masuBoxDimensions(paperEdge, { wallHeightFraction }); }
  catch (error) { if (error instanceof Error) rejected = true; }
  if (!rejected) throw new Error(`Degenerate boundary accepted: ${wallHeightFraction}`);
  console.log(JSON.stringify({ wallHeightFraction, checks: { degenerateBoundaryRejected: true } }));
}
