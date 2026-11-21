import { z } from 'zod';
import { CameraSchema, GeometryStateSchema } from '../shared/schemas.js';
import { BoatParametersSchema, boatState, boatStepIds, boatInstructions, boatLimitations } from '../recipes/boat.js';
const id=z.string().min(1);
const inputSchema=z.strictObject({ recipeId:z.literal('basic-boat'), parameters:BoatParametersSchema,
  objectLabel:z.string().min(1).max(2000), approximationNotes:z.array(z.string().min(1).max(2000)).min(1) });
const axes=[['v-4-left','v-4-right'],['v-2-left','v-2-right'],['v-3-left','v-3-right'],['v-3-left','v-3-right']] as const;
function stepsFor(parameters:z.infer<typeof BoatParametersSchema>) {
  const instructions=boatInstructions(parameters);
  return boatStepIds.map((id,index)=> {
    const before=boatState(parameters,index,0);
    const middle=boatState(parameters,index,0.5);
    const moving=new Set(before.vertices.filter((v,i)=>v.position.some((p,j)=>Math.abs(p-middle.vertices[i].position[j])>1e-8)).map(v=>v.id));
    return { id,index,sheetId:'paper-1' as const,componentId:'hull' as const,
      operation:{kind:'boat-hinge' as const, axisLandmarkIds:[...axes[index]], angleDegrees:index<2?180:55},
      affectedFaceIds:before.faces.filter(f=>f.vertices.some(v=>moving.has(v))).map(f=>f.id),
      prerequisites:index?[boatStepIds[index-1]]:[], beforeStateId:`boat-state-${index}`, afterStateId:`boat-state-${index+1}`,
      animation:{durationMs:1800}, camera:{position:[1,-1,1.5],target:[0,0,0]},
      diagramCamera:{position:index<2?[0,0,3]:[1,-1,1.6],target:[0,0,0]},
      highlightLandmarkIds:[...axes[index],index===0?'v-6-tip':index===1?'v-0-tip':index===2?'v-4-left':'v-2-right'], instruction:instructions[index] };
  });
}
export const BoatTutorialSchema=z.strictObject({
  contractVersion:z.literal('boat-1'),id:z.literal('boat-tutorial'),recipeId:z.literal('basic-boat'),recipeVersion:z.literal('0.1.0'),
  parameters:BoatParametersSchema,synthetic:z.literal(false),
  materials:z.strictObject({sheets:z.tuple([z.strictObject({id:z.literal('paper-1'),componentId:z.literal('hull'),format:z.literal('square')})]),sameSize:z.literal(true)}),
  estimatedMinutes:z.null(),approximationNotes:z.array(z.string().min(1)).min(1),
  states:z.array(GeometryStateSchema).length(5),finalStateId:z.literal('boat-state-4'),
  steps:z.array(z.strictObject({ id:z.enum(boatStepIds),index:z.number().int(),sheetId:z.literal('paper-1'),componentId:z.literal('hull'),
    operation:z.strictObject({kind:z.literal('boat-hinge'),axisLandmarkIds:z.tuple([id,id]),angleDegrees:z.number().finite()}),
    affectedFaceIds:z.array(id).min(1),prerequisites:z.array(id),beforeStateId:id,afterStateId:id,
    animation:z.strictObject({durationMs:z.number().positive()}),camera:CameraSchema,diagramCamera:CameraSchema,
    highlightLandmarkIds:z.array(id).min(1),instruction:z.string().min(1) })).length(4),
}).superRefine((t,ctx)=> {
  const fail=(message:string)=>ctx.addIssue({code:'custom',message});
  const expected=[boatState(t.parameters,0,0,'boat-state-0'),...boatStepIds.map((_,i)=>boatState(t.parameters,i,1,`boat-state-${i+1}`))];
  if(JSON.stringify(t.states)!==JSON.stringify(expected)) fail('Boat geometry differs from authored states');
  if(JSON.stringify(t.steps)!==JSON.stringify(stepsFor(t.parameters))) fail('Boat sequence differs from authored steps');
});
export type BoatTutorial=z.infer<typeof BoatTutorialSchema>;
export function compileBoat(input:unknown):BoatTutorial {
  const a=inputSchema.parse(input);
  return BoatTutorialSchema.parse({contractVersion:'boat-1',id:'boat-tutorial',recipeId:'basic-boat',recipeVersion:'0.1.0',synthetic:false,
    parameters:a.parameters,materials:{sheets:[{id:'paper-1',componentId:'hull',format:'square'}],sameSize:true},estimatedMinutes:null,
    approximationNotes:[...a.approximationNotes,...boatLimitations],
    states:[boatState(a.parameters,0,0,'boat-state-0'),...boatStepIds.map((_,i)=>boatState(a.parameters,i,1,`boat-state-${i+1}`))],
    steps:stepsFor(a.parameters),finalStateId:'boat-state-4'});
}
