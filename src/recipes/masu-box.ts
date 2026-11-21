import { z } from 'zod';

/**
 * T003 feasibility spike only. This candidate is not registered for generation:
 * the corner pocket/collapse and flap-wrap sequence still needs a checked model.
 */
const finite = z.number().finite();
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const closeTo = (a: number, b: number, scale: number) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(scale) * 1e-9);
export const MasuBoxCandidateParametersSchema = z.strictObject({
  /** Wall height divided by the starting square's edge length. */
  wallHeightFraction: finite.positive().refine(
    value => value < 1 / (2 * Math.SQRT2),
    'Wall height must leave a positive box-face edge',
  ),
});
export type MasuBoxCandidateParameters = z.infer<typeof MasuBoxCandidateParametersSchema>;
export const masuBoxParameterSamples = [0.1, 0.15, 0.2].map(wallHeightFraction =>
  MasuBoxCandidateParametersSchema.parse({ wallHeightFraction }),
);

export const MasuWallHingeOperationSchema = z.strictObject({
  id: z.literal('raise-north-wall'),
  kind: z.literal('hinge'),
  movingFaceId: z.literal('wall-north'),
  axisLandmarkIds: z.tuple([z.literal('base-nw'), z.literal('base-ne')]),
  fromAngleDegrees: z.literal(0),
  toAngleDegrees: z.literal(90),
});
export type MasuWallHingeOperation = z.infer<typeof MasuWallHingeOperationSchema>;

export const masuWallHingeOperation: MasuWallHingeOperation = MasuWallHingeOperationSchema.parse({
  id: 'raise-north-wall', kind: 'hinge', movingFaceId: 'wall-north',
  axisLandmarkIds: ['base-nw', 'base-ne'], fromAngleDegrees: 0, toAngleDegrees: 90,
});

export interface MasuBoxDimensions {
  paperEdge: number;
  wallHeight: number;
  baseSide: number;
  nominalVolume: number;
}

/** Figure 5 relation in Cornelius & Tubis: baseSide + 2*wallHeight = paperEdge/sqrt(2). */
export function masuBoxDimensions(paperEdge: number, parameters: MasuBoxCandidateParameters): MasuBoxDimensions {
  if (!Number.isFinite(paperEdge) || paperEdge <= 0) throw new RangeError('Paper edge must be positive and finite');
  const { wallHeightFraction } = MasuBoxCandidateParametersSchema.parse(parameters);
  const wallHeight = paperEdge * wallHeightFraction;
  const baseSide = paperEdge / Math.SQRT2 - 2 * wallHeight;
  if (!(baseSide > 0)) throw new RangeError('Parameters leave no positive box-face edge');
  return { paperEdge, wallHeight, baseSide, nominalVolume: baseSide ** 2 * wallHeight };
}

export interface Point3 { x: number; y: number; z: number }

export interface MasuNetVertex extends Point3 {
  id: string;
  u: number;
  v: number;
}

export interface MasuNetFace {
  id: string;
  role: 'floor' | 'wall' | 'corner-gusset' | 'rim-flap';
  vertexIds: readonly string[];
}

export interface MasuNetEdge {
  id: string;
  vertexIds: readonly [string, string];
  faceIds: readonly string[];
  kind: 'boundary' | 'candidate-crease';
  assignment: 'U';
}

export const MasuNetVertexSchema = z.strictObject({ id, u: finite, v: finite, x: finite, y: finite, z: finite });
export const MasuNetFaceSchema = z.strictObject({
  id, role: z.enum(['floor', 'wall', 'corner-gusset', 'rim-flap']), vertexIds: z.array(id).min(3),
});
export const MasuNetEdgeSchema = z.strictObject({
  id, vertexIds: z.tuple([id, id]), faceIds: z.array(id).min(1).max(2),
  kind: z.enum(['boundary', 'candidate-crease']), assignment: z.literal('U'),
});
export const MasuFlatNetSchema = z.strictObject({
  sheetId: z.literal('paper-1'), paperEdge: finite.positive(),
  vertices: z.array(MasuNetVertexSchema).min(3), faces: z.array(MasuNetFaceSchema).min(1),
  edges: z.array(MasuNetEdgeSchema).min(1), area: finite.positive(),
}).superRefine((net, ctx) => {
  const vertexMap = new Map(net.vertices.map(vertex => [vertex.id, vertex]));
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (vertexMap.size !== net.vertices.length || new Set(net.faces.map(face => face.id)).size !== net.faces.length) {
    fail('Net vertex and face IDs must be unique');
  }
  for (const vertex of net.vertices) {
    if (vertex.x < -1e-9 || vertex.x > net.paperEdge + 1e-9 || vertex.y < -1e-9 || vertex.y > net.paperEdge + 1e-9) {
      fail('Net vertex lies outside the square sheet');
    }
  }
  let faceArea = 0;
  const edgeUse = new Map<string, { count: number; a: MasuNetVertex; b: MasuNetVertex; faces: string[] }>();
  for (const face of net.faces) {
    const points = face.vertexIds.map(vertexId => vertexMap.get(vertexId));
    if (points.some(point => !point) || new Set(face.vertexIds).size !== face.vertexIds.length) {
      fail(`Face ${face.id} has invalid vertex references`);
      continue;
    }
    let twiceArea = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!, b = points[(i + 1) % points.length]!;
      twiceArea += a.x * b.y - b.x * a.y;
      const key = [a.id, b.id].sort().join('|');
      const current = edgeUse.get(key);
      edgeUse.set(key, { count: (current?.count ?? 0) + 1, a, b, faces: [...(current?.faces ?? []), face.id] });
    }
    const area = Math.abs(twiceArea) / 2;
    if (area <= 1e-12) fail(`Face ${face.id} is degenerate`);
    faceArea += area;
  }
  if (Math.abs(faceArea - net.paperEdge ** 2) > Math.max(1e-9, net.paperEdge ** 2 * 1e-9)) {
    fail('Net faces do not account for the square sheet area');
  }
  if (Math.abs(net.area - faceArea) > Math.max(1e-9, faceArea * 1e-9)) fail('Declared net area does not match face area');
  const declaredEdges = new Map(net.edges.map(edge => [edge.id, edge]));
  if (declaredEdges.size !== net.edges.length) fail('Net edge IDs must be unique');
  for (const [key, actual] of edgeUse) {
    const expectedId = `edge-${key.replaceAll('|', '-')}`;
    const declared = declaredEdges.get(expectedId);
    const faceIds = [...actual.faces].sort();
    const vertexIds = [actual.a.id, actual.b.id].sort();
    if (!declared || declared.faceIds.join('|') !== faceIds.join('|') ||
      declared.vertexIds.join('|') !== vertexIds.join('|') ||
      declared.kind !== (faceIds.length === 1 ? 'boundary' : 'candidate-crease')) {
      fail(`Net edge contract does not match face adjacency: ${expectedId}`);
    }
  }
  if (declaredEdges.size !== edgeUse.size) fail('Net includes undeclared face edges');
  let boundaryLength = 0;
  for (const edge of edgeUse.values()) {
    if (edge.count > 2) fail('Net edge is shared by more than two faces');
    if (edge.count !== 1) continue;
    const onSheetBoundary =
      (closeTo(edge.a.x, 0, net.paperEdge) && closeTo(edge.b.x, 0, net.paperEdge)) ||
      (closeTo(edge.a.x, net.paperEdge, net.paperEdge) && closeTo(edge.b.x, net.paperEdge, net.paperEdge)) ||
      (closeTo(edge.a.y, 0, net.paperEdge) && closeTo(edge.b.y, 0, net.paperEdge)) ||
      (closeTo(edge.a.y, net.paperEdge, net.paperEdge) && closeTo(edge.b.y, net.paperEdge, net.paperEdge));
    if (!onSheetBoundary) fail(`Net has an interior boundary edge: ${edge.a.id}–${edge.b.id}`);
    boundaryLength += Math.hypot(edge.a.x - edge.b.x, edge.a.y - edge.b.y);
  }
  if (Math.abs(boundaryLength - 4 * net.paperEdge) > Math.max(1e-9, 4 * net.paperEdge * 1e-9)) {
    fail('Net boundary does not match the square sheet perimeter');
  }
  const faceAdjacency = new Map(net.faces.map(face => [face.id, new Set<string>()]));
  for (const edge of edgeUse.values()) {
    if (edge.faces.length === 2) {
      faceAdjacency.get(edge.faces[0])?.add(edge.faces[1]);
      faceAdjacency.get(edge.faces[1])?.add(edge.faces[0]);
    }
  }
  const visited = new Set<string>();
  const pending = net.faces[0] ? [net.faces[0].id] : [];
  while (pending.length) {
    const current = pending.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    pending.push(...(faceAdjacency.get(current) ?? []));
  }
  if (visited.size !== net.faces.length) fail('Net face graph is disconnected');
  if (net.vertices.length - edgeUse.size + net.faces.length !== 1) fail('Net face graph is not a topological disk');
});
export type MasuFlatNet = z.infer<typeof MasuFlatNetSchema>;

/** Build a candidate flat panel partition in the rotated (u,v) frame; it is not yet a verified Masu crease pattern. */
export function masuFlatNet(dimensions: MasuBoxDimensions): MasuFlatNet {
  const l = dimensions.paperEdge, s = dimensions.baseSide;
  const R = l / Math.SQRT2, q = R / 2;
  const points: Record<string, readonly [number, number]> = {
    'base-nw': [-s / 2, s / 2], 'base-ne': [s / 2, s / 2],
    'base-se': [s / 2, -s / 2], 'base-sw': [-s / 2, -s / 2],
    'outer-nw': [-q, q], 'outer-ne': [q, q],
    'outer-se': [q, -q], 'outer-sw': [-q, -q],
    'corner-nw-in-west': [-s / 2 - dimensions.wallHeight, s / 2],
    'corner-nw-in-north': [-s / 2, s / 2 + dimensions.wallHeight],
    'corner-ne-in-east': [s / 2 + dimensions.wallHeight, s / 2],
    'corner-ne-in-north': [s / 2, s / 2 + dimensions.wallHeight],
    'corner-se-in-east': [s / 2 + dimensions.wallHeight, -s / 2],
    'corner-se-in-south': [s / 2, -s / 2 - dimensions.wallHeight],
    'corner-sw-in-west': [-s / 2 - dimensions.wallHeight, -s / 2],
    'corner-sw-in-south': [-s / 2, -s / 2 - dimensions.wallHeight],
    'paper-n': [0, R], 'paper-e': [R, 0], 'paper-s': [0, -R], 'paper-w': [-R, 0],
  };
  const vertices: MasuNetVertex[] = Object.entries(points).map(([id, [u, v]]) => ({
    id, u, v, x: l / 2 + (u + v) / Math.SQRT2, y: l / 2 + (u - v) / Math.SQRT2, z: 0,
  }));
  const byId = new Map(vertices.map(vertex => [vertex.id, vertex]));
  const face = (faceId: string, role: MasuNetFace['role'], vertexIds: string[]): MasuNetFace => ({
    id: faceId, role, vertexIds: vertexIds.map(vertexId => {
      const vertex = byId.get(vertexId);
      if (!vertex) throw new Error(`Unknown Masu net vertex: ${vertexId}`);
      return vertexId;
    }),
  });
  const faces: MasuNetFace[] = [
    face('floor', 'floor', ['base-nw', 'base-ne', 'base-se', 'base-sw']),
    face('wall-north', 'wall', ['base-nw', 'base-ne', 'corner-ne-in-north', 'corner-nw-in-north']),
    face('wall-east', 'wall', ['base-ne', 'base-se', 'corner-se-in-east', 'corner-ne-in-east']),
    face('wall-south', 'wall', ['base-se', 'base-sw', 'corner-sw-in-south', 'corner-se-in-south']),
    face('wall-west', 'wall', ['base-sw', 'base-nw', 'corner-nw-in-west', 'corner-sw-in-west']),
    face('gusset-ne-a', 'corner-gusset', ['base-ne', 'corner-ne-in-east', 'outer-ne']),
    face('gusset-ne-b', 'corner-gusset', ['base-ne', 'outer-ne', 'corner-ne-in-north']),
    face('gusset-nw-a', 'corner-gusset', ['base-nw', 'corner-nw-in-north', 'outer-nw']),
    face('gusset-nw-b', 'corner-gusset', ['base-nw', 'outer-nw', 'corner-nw-in-west']),
    face('gusset-se-a', 'corner-gusset', ['base-se', 'corner-se-in-south', 'outer-se']),
    face('gusset-se-b', 'corner-gusset', ['base-se', 'outer-se', 'corner-se-in-east']),
    face('gusset-sw-a', 'corner-gusset', ['base-sw', 'corner-sw-in-west', 'outer-sw']),
    face('gusset-sw-b', 'corner-gusset', ['base-sw', 'outer-sw', 'corner-sw-in-south']),
    face('rim-flap-north', 'rim-flap', ['outer-nw', 'corner-nw-in-north', 'corner-ne-in-north', 'outer-ne', 'paper-n']),
    face('rim-flap-east', 'rim-flap', ['outer-ne', 'corner-ne-in-east', 'corner-se-in-east', 'outer-se', 'paper-e']),
    face('rim-flap-south', 'rim-flap', ['outer-se', 'corner-se-in-south', 'corner-sw-in-south', 'outer-sw', 'paper-s']),
    face('rim-flap-west', 'rim-flap', ['outer-sw', 'corner-sw-in-west', 'corner-nw-in-west', 'outer-nw', 'paper-w']),
  ];
  const edgeMap = new Map<string, { vertexIds: [string, string]; faceIds: string[] }>();
  for (const currentFace of faces) {
    for (let i = 0; i < currentFace.vertexIds.length; i++) {
      const a = currentFace.vertexIds[i], b = currentFace.vertexIds[(i + 1) % currentFace.vertexIds.length];
      const vertexIds = [a, b].sort() as [string, string];
      const key = vertexIds.join('|');
      const current = edgeMap.get(key);
      edgeMap.set(key, { vertexIds, faceIds: [...(current?.faceIds ?? []), currentFace.id].sort() });
    }
  }
  const edges: MasuNetEdge[] = [...edgeMap].map(([key, edge]) => ({
    id: `edge-${key.replaceAll('|', '-')}`, vertexIds: edge.vertexIds, faceIds: edge.faceIds,
    kind: edge.faceIds.length === 1 ? 'boundary' : 'candidate-crease', assignment: 'U',
  }));
  const area = faces.reduce((total, current) => {
    let twiceArea = 0;
    const faceVertices = current.vertexIds.map(vertexId => byId.get(vertexId)!);
    for (let i = 0; i < faceVertices.length; i++) {
      const a = faceVertices[i], b = faceVertices[(i + 1) % faceVertices.length];
      twiceArea += a.x * b.y - b.x * a.y;
    }
    return total + Math.abs(twiceArea) / 2;
  }, 0);
  return MasuFlatNetSchema.parse({ sheetId: 'paper-1', paperEdge: l, vertices, faces, edges, area });
}

export interface NorthWallMotion {
  operation: MasuWallHingeOperation;
  angleDegrees: number;
  fixedAxis: readonly [Point3, Point3];
  movingVertices: readonly [Point3, Point3, Point3, Point3];
}

/** Rotate one rectangular wall about its shared base edge. t=0 is flat; t=1 is upright. */
export function masuNorthWallMotion(dimensions: MasuBoxDimensions, t: number): NorthWallMotion {
  if (!Number.isFinite(t) || t < 0 || t > 1) throw new RangeError('Motion progress must be within [0, 1]');
  const { baseSide: s, wallHeight: h } = dimensions;
  const angle = t * Math.PI / 2;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const rotate = (x: number, y: number, z: number): Point3 => {
    const relativeY = y - s / 2;
    return { x, y: s / 2 + relativeY * cos - z * sin, z: relativeY * sin + z * cos };
  };
  return {
    operation: masuWallHingeOperation,
    angleDegrees: t * 90,
    fixedAxis: [{ x: -s / 2, y: s / 2, z: 0 }, { x: s / 2, y: s / 2, z: 0 }],
    movingVertices: [
      rotate(-s / 2, s / 2, 0), rotate(s / 2, s / 2, 0),
      rotate(s / 2, s / 2 + h, 0), rotate(-s / 2, s / 2 + h, 0),
    ],
  };
}

/** Lengths of the four moving-face edges, useful for the reproducible hinge spike. */
export function masuNorthWallEdgeLengths(motion: NorthWallMotion): readonly number[] {
  const v = motion.movingVertices;
  return [0, 1, 2, 3].map(i => {
    const a = v[i], b = v[(i + 1) % 4];
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  });
}
