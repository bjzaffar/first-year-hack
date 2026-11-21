import { describe, expect, it } from 'vitest';
import { masuBoxDimensions, masuFlatNet } from '../src/recipes/masu-box.js';
import { MasuMotionParametersSchema, MasuMotionRequestSchema, masuMotionContract, masuMotionFixtures,
  masuMotionStepIds, sampleMasuMotion } from '../src/recipes/masu-motion.js';

type V = readonly number[];
const sub = (a: V, b: V) => a.map((v, i) => v - b[i]);
const dot = (a: V, b: V) => a.reduce((v, x, i) => v + x * b[i], 0);
const cross = (a: V, b: V) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const distance = (a: V, b: V) => Math.hypot(...sub(a,b));
// Proper transverse penetration only. Contact, coplanar stacking and finite paper thickness are separate concerns.
function pierces(a: V, b: V, triangle: V[]) {
  const [p,q,r] = triangle, direction = sub(b,a), e1 = sub(q,p), e2 = sub(r,p);
  const h = cross(direction,e2), determinant = dot(e1,h), eps = 1e-8;
  if (Math.abs(determinant) < eps) return false;
  const relative = sub(a,p), u = dot(relative,h)/determinant;
  const k = cross(relative,e1), v = dot(direction,k)/determinant, t = dot(e2,k)/determinant;
  return u > eps && v > eps && u+v < 1-eps && t > eps && t < 1-eps;
}

describe('T003 whole-sheet coupled construction', () => {
  it('rejects invalid parameters, unknown actions, and extrapolated motion', () => {
    for (const h of [0, 0.05999, 0.16001, NaN, Infinity]) expect(MasuMotionParametersSchema.safeParse({wallHeightFraction:h}).success).toBe(false);
    expect(MasuMotionParametersSchema.safeParse({wallHeightFraction:0.1, execute:'anything'}).success).toBe(false);
    for (const progress of [-1, 1.1, NaN]) expect(() => sampleMasuMotion({wallHeightFraction:0.1}, 'raise-walls-together', progress)).toThrow();
    expect(MasuMotionRequestSchema.safeParse({parameters:{wallHeightFraction:0.1},step:'squash',progress:0}).success).toBe(false);
  });
  for (const wallHeightFraction of [0.06, 0.060001, 0.08, 0.1, 0.12, 0.159999, 0.16]) {
    it(`preserves connected rigid panels, continuity and volume at h=${wallHeightFraction}`, () => {
      const parameters = { wallHeightFraction }, dims = masuBoxDimensions(1,parameters), net = masuFlatNet(dims);
      const flat = new Map(net.vertices.map(v=>[v.id,[v.u,v.v,0]]));
      let previous = sampleMasuMotion(parameters,masuMotionStepIds[0],0);
      for (const [stepIndex,step] of masuMotionStepIds.entries()) {
        const start = sampleMasuMotion(parameters,step,0);
        start.vertices.forEach((v,i)=>expect(distance(v.position,previous.vertices[i].position)).toBeLessThan(1e-10));
        for (let frame=0;frame<=40;frame++) {
          const state=sampleMasuMotion(parameters,step,frame/40), vertices=new Map(state.vertices.map(v=>[v.id,v.position]));
          expect(vertices.size).toBe(net.vertices.length);
          state.vertices.forEach(v=>expect(v.position.every(Number.isFinite)).toBe(true));
          for (const face of net.faces) {
            const pts=face.vertexIds.map(id=>vertices.get(id)!);
            // All pairwise distances (including quad diagonals), not only polygon edges.
            for (let a=0;a<pts.length;a++) for(let b=a+1;b<pts.length;b++)
              expect(Math.abs(distance(pts[a],pts[b])-distance(flat.get(face.vertexIds[a])!,flat.get(face.vertexIds[b])!))).toBeLessThan(1e-9);
            expect(Math.hypot(...cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])))).toBeGreaterThan(1e-8);
          }
          // The contract must name every face that actually moves, so a renderer cannot leave attached layers behind.
          const startMap=new Map(start.vertices.map(v=>[v.id,v.position]));
          for (const face of net.faces) if(face.vertexIds.some(id=>distance(vertices.get(id)!,startMap.get(id)!)>1e-9))
            expect(masuMotionContract.steps[stepIndex].affectedFaceIds).toContain(face.id);
        }
        previous=sampleMasuMotion(parameters,step,1);
      }
      const end=new Map(previous.vertices.map(v=>[v.id,v.position]));
      expect(2*dims.wallHeight).toBeLessThan(dims.baseSide);
      expect(dims.nominalVolume).toBeGreaterThan(0);
      for(const side of ['n','e','s','w']) expect(distance(end.get(`paper-${side}`)!,[0,0,0])).toBeLessThan(1e-10);
      for(const corner of ['nw','ne','se','sw']) expect(end.get(`outer-${corner}`)![2]).toBeCloseTo(dims.wallHeight,10);
    });
  }
  it('has no sampled transverse face penetrations during any whole-sheet motion', () => {
    for(const fixture of masuMotionFixtures) for(const step of masuMotionStepIds) for(let frame=1;frame<20;frame++) {
      const state=sampleMasuMotion(fixture.parameters,step,frame/20), vertices=new Map(state.vertices.map(v=>[v.id,v.position]));
      const triangles=state.faces.flatMap(face=>face.vertexIds.slice(1,-1).map((_,i)=>({
        face:face.id, pts:[face.vertexIds[0],face.vertexIds[i+1],face.vertexIds[i+2]].map(id=>vertices.get(id)!),
      })));
      for(let i=0;i<triangles.length;i++) for(let j=i+1;j<triangles.length;j++) {
        const a=triangles[i],b=triangles[j]; if(a.face===b.face) continue;
        for(let k=0;k<3;k++) {
          expect(pierces(a.pts[k],a.pts[(k+1)%3],b.pts),`${step} ${frame}: ${a.face} -> ${b.face}`).toBe(false);
          expect(pierces(b.pts[k],b.pts[(k+1)%3],a.pts),`${step} ${frame}: ${b.face} -> ${a.face}`).toBe(false);
        }
      }
    }
  });
});
