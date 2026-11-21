import { z } from 'zod';
import { GeometryStateSchema, type GeometryState } from '../shared/schemas.js';

// Original minimal V-hull construction: fold two opposing tips inward, then
// raise both sides along the long diagonal. It is not a watertight canoe claim.
export const BoatParametersSchema = z.strictObject({ hullWidthFraction: z.number().finite().min(0.24).max(0.30) });
export type BoatParameters = z.infer<typeof BoatParametersSchema>;
export const boatStepIds = ['fold-north-tip', 'fold-south-tip', 'raise-port-side', 'raise-starboard-side'] as const;
export const boatLimitations = [
  'Basic pointed V-hull approximation; no deck, paddle, cockpit or curved hull.',
  'Physical folding, shape retention and flotation have not been tested. This is not a watertight boat.',
  'Folding time has not been measured.',
];
export const boatRecipe = {
  id: 'basic-boat' as const, version: '0.1.0' as const, synthetic: false as const,
  parameterBounds: { hullWidthFraction: { min: 0.24, max: 0.30 } }, limitations: boatLimitations,
};
const R = Math.SQRT1_2;
const ANGLE = 55 * Math.PI / 180;

/** Partition the entire unit square at all authored creases before playback.
 * ±2w are the creases carried onto the keel by the folded tip layers. */
function net(parameters: BoatParameters) {
  const w = parameters.hullWidthFraction;
  const levels = [-R, -2*w, -w, 0, w, 2*w, R];
  const vertices = levels.flatMap((y, i) => i === 0 || i === 6
    ? [{ id: `v-${i}-tip`, position: [0, y, 0] as [number, number, number] }]
    : [{ id: `v-${i}-left`, position: [-(R-Math.abs(y)), y, 0] as [number, number, number] },
      { id: `v-${i}-right`, position: [R-Math.abs(y), y, 0] as [number, number, number] }]);
  const at = (i: number, side: string) => i === 0 || i === 6 ? `v-${i}-tip` : `v-${i}-${side}`;
  const faces = levels.slice(1).map((_, i) => ({ id: `panel-${i}`, sheetId: 'paper-1', layer: i < 2 || i >= 4 ? 1 : 0,
    vertices: [...new Set([at(i, 'left'), at(i, 'right'), at(i+1, 'right'), at(i+1, 'left')])] }));
  const edges = new Map<string, { id: string; vertices: [string,string]; assignment: 'B' | 'U'; count: number }>();
  for (const face of faces) for (let i=0; i<face.vertices.length; i++) {
    const pair = [face.vertices[i], face.vertices[(i+1)%face.vertices.length]].sort() as [string,string];
    const key=pair.join('-'); const existing=edges.get(key);
    if (existing) { existing.assignment='U'; existing.count++; }
    else edges.set(key, { id: `edge-${key}`, vertices:pair, assignment:'B', count:1 });
  }
  return { vertices, faces, edges: [...edges.values()].map(({count: _count,...edge})=>edge) };
}

export function boatState(parameters: BoatParameters, index: number, progress: number, id='boat-motion'): GeometryState {
  BoatParametersSchema.parse(parameters);
  if (!Number.isInteger(index) || index<0 || index>3 || !Number.isFinite(progress) || progress<0 || progress>1) throw new RangeError('Invalid boat playback');
  const mesh=net(parameters), w=parameters.hullWidthFraction;
  const vertices=mesh.vertices.map(v=> {
    const [x,y]=v.position;
    let yy=y, z=0;
    if (index<2) {
      if (y>w) { const a=Math.PI*(index===0?progress:1); yy=w+(y-w)*Math.cos(a); z=(y-w)*Math.sin(a); }
      if (y< -w && index===1) { const a=Math.PI*progress; yy=-w+(y+w)*Math.cos(a); z=-(y+w)*Math.sin(a); }
    } else {
      yy=y>w?2*w-y:y< -w?-2*w-y:y;
      const amount=yy>=0?(index===2?progress:1):(index===3?progress:0);
      z=Math.abs(yy)*Math.sin(ANGLE*amount); yy*=Math.cos(ANGLE*amount);
    }
    return { id:v.id, position:[x,yy,Math.abs(z)<1e-14?0:z] as [number,number,number] };
  });
  return GeometryStateSchema.parse({id,vertices,faces:mesh.faces,edges:mesh.edges,
    landmarks:vertices.map(v=>({id:v.id,vertexId:v.id}))});
}
export function boatInstructions(parameters: BoatParameters) {
  const percent=(parameters.hullWidthFraction*100).toFixed(0);
  return [
    `Place one square as a diamond, with the long boat axis running left to right. Fold the north tip inward along the marked line ${percent}% of a sheet edge from the centre.`,
    'Fold the south tip inward along the opposite marked line. Flatten both overlapping tip layers; keep the left and right pointed ends in place.',
    'Fold the north half of the packet upward along the long centre crease, including every overlapping layer. Stop at the shown 55-degree angle; this forms the port side.',
    'Raise the south half by the same angle, creasing all its layers along the keel. Leave the 70-degree V-shaped opening between the sides and reinforce the folds to form the pointed hull.',
  ];
}
