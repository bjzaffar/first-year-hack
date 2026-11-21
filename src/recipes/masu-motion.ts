import { z } from 'zod';
import { masuBoxDimensions, masuFlatNet, type Point3 } from './masu-box.js';

/** Conservative geometric domain; physical retention and paper thickness are untested. */
export const MasuMotionParametersSchema = z.strictObject({ wallHeightFraction: z.number().finite().min(0.06).max(0.16) });
export type MasuMotionParameters = z.infer<typeof MasuMotionParametersSchema>;
export const masuMotionStepIds = ['blintz-north', 'blintz-east', 'blintz-south', 'blintz-west',
  'raise-walls-together', 'lay-gusset-nw', 'lay-gusset-ne', 'lay-gusset-se', 'lay-gusset-sw'] as const;
export const MasuMotionRequestSchema = z.strictObject({
  parameters: MasuMotionParametersSchema,
  step: z.enum(masuMotionStepIds), progress: z.number().finite().min(0).max(1),
});
export type MasuMotionStepId = typeof masuMotionStepIds[number];
const sides = ['north', 'east', 'south', 'west'] as const;
const corners = ['nw', 'ne', 'se', 'sw'] as const;
const signs: Record<string, [number, number]> = { nw: [-1, 1], ne: [1, 1], se: [1, -1], sw: [-1, -1] };
const flapCorners: Record<string, string> = { 'flap-nw':'nw', 'flap-wn':'nw', 'flap-ne':'ne', 'flap-en':'ne',
  'flap-es':'se', 'flap-se':'se', 'flap-sw':'sw', 'flap-ws':'sw' };

/** Entire sheet, shared vertices, no per-face tearing or interpolated vertex motion. Unit paper edge. */
export function sampleMasuMotion(parameters: MasuMotionParameters, step: MasuMotionStepId, progress: number) {
  MasuMotionRequestSchema.parse({ parameters, step, progress });
  const dimensions = masuBoxDimensions(1, parameters);
  const net = masuFlatNet(dimensions);
  const { baseSide: s, wallHeight: h } = dimensions;
  const q = 1 / (2 * Math.SQRT2);
  const index = masuMotionStepIds.indexOf(step);
  const theta = index < 4 ? 0 : (index === 4 ? progress : 1) * Math.PI / 2;
  const c = Math.cos(theta), sn = Math.sin(theta);
  // Intersection of two spheres with the diagonal symmetry plane. This is the inward branch.
  // D·(h cos(theta),0,h sin(theta)) = h²; |D|² = 2h².
  const dz = h * sn * (2 + Math.SQRT2 * c) / (1 + sn * sn);
  // Algebraically equivalent to (h - dz*sin(theta))/cos(theta), without endpoint division.
  const d = h * (c - Math.SQRT2 * sn * sn) / (1 + sn * sn);
  const vertices = net.vertices.map(vertex => {
    let p: Point3 = { x: vertex.u, y: vertex.v, z: 0 };
    if (index < 4) {
      // The outer triangles have disjoint interiors. Rotate each complete packet over its q-edge.
      for (let side = 0; side < 4; side++) {
        const amount = side < index ? 1 : side === index ? progress : 0;
        const angle = amount * Math.PI;
        const horizontal = side === 1 || side === 3;
        const sign = side < 2 ? 1 : -1;
        const coordinate = horizontal ? vertex.u : vertex.v;
        const distance = sign * coordinate - q;
        if (distance <= 1e-12) continue;
        const moved = sign * (q + distance * Math.cos(angle));
        p = horizontal ? { x: moved, y: vertex.v, z: distance * Math.sin(angle) }
          : { x: vertex.u, y: moved, z: distance * Math.sin(angle) };
      }
    } else {
      const baseCorner = /^base-(nw|ne|se|sw)$/.exec(vertex.id)?.[1];
      const top = /^corner-(nw|ne|se|sw)-in-(north|east|south|west)$/.exec(vertex.id);
      const outer = /^outer-(nw|ne|se|sw)$/.exec(vertex.id)?.[1];
      const corner = baseCorner ?? top?.[1] ?? outer ?? flapCorners[vertex.id];
      if (corner) {
        const [sx, sy] = signs[corner];
        p = { x: sx * s / 2, y: sy * s / 2, z: 0 };
        if (top) {
          p.z = h * sn;
          if (top[2] === 'east' || top[2] === 'west') p.x += sx * h * c;
          else p.y += sy * h * c;
        } else if (outer) {
          p = { x: p.x + sx * d, y: p.y + sy * d, z: dz };
          if (index > 4) {
            const foldIndex = 5 + corners.indexOf(outer as typeof corners[number]);
            const amount = index > foldIndex ? 1 : index === foldIndex ? progress : 0;
            const angle = (1 - amount) * Math.PI / 4;
            p = { x: sx * (s / 2 - h * Math.cos(angle)), y: sy * (s / 2 - h * Math.sin(angle)), z: h };
          }
        }
      } else if (vertex.id.startsWith('paper-')) p = { x: 0, y: 0, z: 0 };
      else throw new Error(`Missing motion landmark ${vertex.id}`);
    }
    return { id: vertex.id, position: [p.x, p.y, p.z] as [number, number, number] };
  });
  return { id: `${step}-${progress}`, vertices, faces: net.faces, edges: net.edges };
}

export const masuMotionInstructions: Record<MasuMotionStepId, string> = {
  'blintz-north': 'Bring the north paper tip to the centre, folding the whole outer triangle over its straight base. Flatten the packet without opening its two corner patches.',
  'blintz-east': 'Bring the east paper tip to the same centre. Flatten this second triangular packet.',
  'blintz-south': 'Bring the south paper tip to the centre. Keep the earlier tips flat.',
  'blintz-west': 'Bring the west paper tip to the centre. All four tips now meet on the future floor.',
  'raise-walls-together': 'Keep the four tips flat on the floor and lift all four walls together along the marked floor edges. Guide all four diagonal corner packets upward and inward as the walls rise; do not raise one wall independently.',
  'lay-gusset-nw': 'Swing the northwest four-layer triangular packet against the inside north wall. Keep its vertical corner edge fixed.',
  'lay-gusset-ne': 'Swing the northeast packet against the inside north wall. The two corner packets must remain separate.',
  'lay-gusset-se': 'Swing the southeast packet against the inside south wall. Keep the floor tips in place.',
  'lay-gusset-sw': 'Swing the southwest packet against the inside south wall. The top stays open; crease the walls and corners to retain the shape.',
};

/** Recipe-local handoff, deliberately separate from the live API's compiler-owned registry. */
export const masuMotionContract = {
  recipeId: 'masu-box', recipeVersion: '0.1.0', paperEdge: 1, sheetId: 'paper-1', componentId: 'box',
  parameterBounds: { wallHeightFraction: { min: 0.06, max: 0.16 } },
  steps: masuMotionStepIds.map((id, index) => ({ id, prerequisites: index ? [masuMotionStepIds[index - 1]] : [],
    kind: index < 4 ? 'packet-hinge' : index === 4 ? 'coupled-walls' : 'corner-hinge',
    instruction: masuMotionInstructions[id],
    affectedFaceIds: masuFlatNet(masuBoxDimensions(1, { wallHeightFraction: 0.1 })).faces.filter(face => {
      if (index < 4) return face.id === `rim-band-${sides[index]}` || face.id === `rim-tip-${sides[index]}` ||
        (face.id.startsWith('rim-corner-') && face.vertexIds.some(v => {
          const maps = [['flap-nw','flap-ne'], ['flap-en','flap-es'], ['flap-se','flap-sw'], ['flap-ws','flap-wn']];
          return maps[index].includes(v);
        }));
      if (index === 4) return face.role !== 'floor' && face.role !== 'rim-tip';
      return face.vertexIds.includes(`outer-${corners[index - 5]}`);
    }).map(face => face.id),
  })),
} as const;
export const masuMotionFixtures = [0.06, 0.1, 0.16].map(wallHeightFraction => ({
  parameters: { wallHeightFraction },
  states: [sampleMasuMotion({ wallHeightFraction }, masuMotionStepIds[0], 0),
    ...masuMotionStepIds.map(step => sampleMasuMotion({ wallHeightFraction }, step, 1))],
}));

const idSchema = z.string().regex(/^[a-z][a-z0-9-]*$/);
export const MasuOperationSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('packet-hinge'), axisLandmarkIds: z.tuple([idSchema,idSchema]), angleDegrees: z.literal(180) }),
  z.strictObject({ kind: z.literal('coupled-walls'), solver: z.literal('masu-inward-v1'), wallAngleDegrees: z.literal(90) }),
  z.strictObject({ kind: z.literal('corner-hinge'), axisLandmarkIds: z.tuple([idSchema,idSchema]), angleMagnitudeDegrees: z.literal(45) }),
]);
export const masuOperations = masuMotionStepIds.map((_,i) => MasuOperationSchema.parse(i < 4 ? {
  kind: 'packet-hinge', axisLandmarkIds: [
    ['outer-nw','outer-ne'], ['outer-ne','outer-se'], ['outer-se','outer-sw'], ['outer-sw','outer-nw'],
  ][i], angleDegrees: 180,
} : i === 4 ? {kind:'coupled-walls',solver:'masu-inward-v1',wallAngleDegrees:90} : {
  kind:'corner-hinge',axisLandmarkIds:[`base-${corners[i-5]}`, `corner-${corners[i-5]}-in-${i<7?'north':'south'}`],angleMagnitudeDegrees:45,
}));

/** Coincident four-layer corner stacks, negative to positive along gusset-a's ordered vertex normal.
 * Layer identity is retained at exact contact; display offsets must never alter these coordinates.
 */
export const masuCornerLayerStacks = Object.fromEntries(corners.map(corner => {
  const net = masuFlatNet(masuBoxDimensions(1, {wallHeightFraction:0.1}));
  const a = net.faces.find(f=>f.id===`gusset-${corner}-a`)!;
  const b = net.faces.find(f=>f.id===`gusset-${corner}-b`)!;
  const patches = net.faces.filter(f=>f.id.startsWith('rim-corner-')&&f.vertexIds.includes(`outer-${corner}`));
  const patchA = patches.find(f=>f.vertexIds.some(v=>v.startsWith('corner-')&&a.vertexIds.includes(v)))!;
  const patchB = patches.find(f=>f.vertexIds.some(v=>v.startsWith('corner-')&&b.vertexIds.includes(v)))!;
  return [corner,[patchB.id,b.id,a.id,patchA.id]];
}));
