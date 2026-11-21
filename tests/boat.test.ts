import { describe, expect, it } from 'vitest';
import { boatState, boatStepIds } from '../src/recipes/boat.js';
import { compileBoat, BoatTutorialSchema } from '../src/geometry/boat-compiler.js';
import { sampleStep } from '../src/client/rendering/motion.js';
import { liveCompiler } from '../src/geometry/live-compiler.js';
import { GenerationResponseSchema } from '../src/shared/generation.js';
import { generate } from '../src/server/generation.js';
import { OllamaAnalysisProvider } from '../src/server/providers/ollama.js';
const input=(w=0.26)=>({recipeId:'basic-boat',parameters:{hullWidthFraction:w},objectLabel:'Kayak',approximationNotes:['Pointed V hull; no cockpit.']});
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
const image={mimeType:'image/png' as const,width:1,height:1,base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC'};
describe('basic boat construction',()=>{
  it.each([0.24,0.26,0.30])('preserves the whole square and every rigid face through all folds at %s',w=>{
    const parameters={hullWidthFraction:w}, flat=boatState(parameters,0,0);
    let area=0;
    for(const f of flat.faces){const points=f.vertices.map(id=>flat.vertices.find(v=>v.id===id)!.position); area+=Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;}
    expect(area).toBeCloseTo(1,10);
    for(let step=0;step<4;step++) for(let k=0;k<=20;k++){
      const frame=boatState(parameters,step,k/20);
      for(const f of flat.faces)for(const a of f.vertices)for(const b of f.vertices){
        const before=distance(flat.vertices.find(v=>v.id===a)!.position,flat.vertices.find(v=>v.id===b)!.position);
        const after=distance(frame.vertices.find(v=>v.id===a)!.position,frame.vertices.find(v=>v.id===b)!.position);
        expect(after).toBeCloseTo(before,9);
      }
      expect(frame.vertices.every(v=>v.position.every(Number.isFinite))).toBe(true);
    }
    for(let step=1;step<4;step++){
      const before=boatState(parameters,step-1,1),after=boatState(parameters,step,0);
      before.vertices.forEach((v,i)=>expect(distance(v.position,after.vertices[i].position)).toBeLessThan(1e-10));
    }
    const end=boatState(parameters,3,1); expect(Math.max(...end.vertices.map(v=>v.position[2]))).toBeGreaterThan(0.19);
    const length=Math.max(...end.vertices.map(v=>v.position[0]))-Math.min(...end.vertices.map(v=>v.position[0]));
    const width=Math.max(...end.vertices.map(v=>v.position[1]))-Math.min(...end.vertices.map(v=>v.position[1]));
    expect(length/width).toBeGreaterThan(4);
  });
  it('compiles exactly four steps with final-preview identity and repeatable Back/Replay',()=>{
    const t=compileBoat(input()); expect(t.steps.map(s=>s.id)).toEqual(boatStepIds);
    expect(GenerationResponseSchema.parse({ok:true,tutorial:t}).ok).toBe(true);
    for(let i=0;i<4;i++){
      const mid=sampleStep(t,i,0.4); sampleStep(t,3,1);
      expect(sampleStep(t,i,0.4)).toEqual(mid);
      expect(sampleStep(t,i,0)).toEqual(t.states[i]); expect(sampleStep(t,i,1)).toEqual(t.states[i+1]);
    }
    expect(t.finalStateId).toBe(t.states.at(-1)!.id);
    const bad=structuredClone(t);bad.states[4].vertices[0].position[2]+=0.01;
    expect(BoatTutorialSchema.safeParse(bad).success).toBe(false);
    expect(compileBoat(input(0.24)).states.at(-1)).not.toEqual(compileBoat(input(0.30)).states.at(-1));
    for(const w of [0.1,0.31,NaN,Infinity])expect(()=>compileBoat(input(w))).toThrow();
  });
  it('selects and compiles a boat through the actual adapter and generation pipeline',async()=>{
    const proposal={contractVersion:'1',...input(),features:{shape:'elongated',aspectRatio:5}};
    let sent:Record<string,any>={};
    const provider=new OllamaAnalysisProvider({fetch:async(_url,init)=>{sent=JSON.parse(init!.body as string);return new Response(JSON.stringify({model:'qwen3-vl:4b',done:true,message:{role:'assistant',content:JSON.stringify(proposal)}}));}});
    const t=await generate(image,{provider},new AbortController().signal);
    expect(t.recipeId).toBe('basic-boat');expect(t.steps).toHaveLength(4);
    expect(liveCompiler.recipes.map(r=>r.id)).toEqual(['masu-box','basic-boat']);
    expect(JSON.stringify(sent.format)).toContain('basic-boat');expect(JSON.stringify(sent.format)).toContain('masu-box');
  });
});
