import { writeFileSync } from 'node:fs';
import { masuMotionContract, masuMotionStepIds, sampleMasuMotion } from '../src/shared/masu-contract.js';

const samples = [0.06, 0.1, 0.16];
const data = samples.map(wallHeightFraction => masuMotionStepIds.map(step =>
  Array.from({length:41}, (_,i)=>sampleMasuMotion({wallHeightFraction},step,i/40))));
const output = process.argv[2] ?? '/tmp/foldlens-t003-demo.html';
writeFileSync(output, `<!doctype html><html lang="en"><meta charset="utf-8"><title>T003 complete sheet motion</title>
<style>body{font:17px system-ui;background:#faf7ef;color:#243f39;max-width:1000px;margin:32px auto;padding:0 20px}button,select{font:inherit;margin:6px;padding:8px}svg{width:100%;height:480px;background:#fffdf8;border:1px solid #ddd}p{line-height:1.5}.note{color:#745234}label{display:inline-block}input{width:240px}</style>
<h1>Adjustable box: whole-sheet feasibility</h1><p class="note">Authored digital prototype, one square sheet. No physical fold check or paper-thickness simulation. This is not live photo generation.</p>
<label>Wall height / paper edge <select id="sample">${samples.map((h,i)=>`<option value="${i}">${h}</option>`).join('')}</select></label>
<label>View <select id="view"><option value="3d">Oblique</option><option value="top">Top</option><option value="side">Side</option></select></label>
<svg viewBox="0 0 900 480" role="img" aria-label="All 29 panels of one square sheet"><g id="paper"></g></svg>
<h2 id="step"></h2><p id="instruction"></p><p id="status"></p>
<button id="back">Back</button><button id="replay">Replay</button><button id="next">Next</button>
<label>Motion <input id="progress" type="range" min="0" max="40" value="0"></label>
<p>Blue: floor; green: walls; orange: corner gussets; cream: folded rim packets. White circles identify the four moving outer corner landmarks. Exact contact layers share coordinates; no display offsets enter the model.</p>
<script>
const data=${JSON.stringify(data)},steps=${JSON.stringify(masuMotionContract.steps)};
let step=0,frame=0,sample=0,timer; const el=id=>document.getElementById(id);
function stop(){clearInterval(timer)}
function render(){
 const state=data[sample][step][frame],points=Object.fromEntries(state.vertices.map(v=>[v.id,v.position]));
 const project=p=>el('view').value==='top'?[450+440*p[0],240-440*p[1],p[2]]:el('view').value==='side'?[450+440*p[0],370-440*p[2],p[1]]:[450+350*(p[0]-p[1]),330+150*(p[0]+p[1])-370*p[2],p[0]+p[1]+p[2]];
 const colors={'floor':'#a9cce1','wall':'#a8c8a9','corner-gusset':'#e6ab77','rim-flap':'#efe0a5','rim-tip':'#f5eaca'};
 el('paper').innerHTML=state.faces.map(f=>({f,pts:f.vertexIds.map(id=>project(points[id]))})).sort((a,b)=>a.pts.reduce((s,p)=>s+p[2],0)/a.pts.length-b.pts.reduce((s,p)=>s+p[2],0)/b.pts.length).map(({f,pts})=>'<polygon points="'+pts.map(p=>p.slice(0,2).join(',')).join(' ')+'" fill="'+colors[f.role]+'" fill-opacity=".85" stroke="#3c5149" stroke-width="1"><title>'+f.id+'</title></polygon>').join('')+state.vertices.filter(v=>v.id.startsWith('outer-')).map(v=>{const p=project(v.position);return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="white" stroke="#243f39"><title>'+v.id+'</title></circle>'}).join('');
 el('step').textContent=(step+1)+' / '+steps.length+' — '+steps[step].id;el('instruction').textContent=steps[step].instruction;
 el('progress').value=frame;el('status').textContent=frame===40?'Saved endpoint; Next starts the following action.':'Sample '+frame+' / 40 of the exact authored motion.';
 el('back').disabled=step===0;el('next').disabled=step===steps.length-1;
}
el('back').onclick=()=>{stop();step=Math.max(0,step-1);frame=40;render()};
el('next').onclick=()=>{stop();step=Math.min(steps.length-1,step+1);frame=0;render()};
el('replay').onclick=()=>{stop();frame=0;render();timer=setInterval(()=>{frame++;render();if(frame===40)stop()},70)};
el('progress').oninput=e=>{stop();frame=Number(e.target.value);render()};
el('sample').onchange=e=>{stop();sample=Number(e.target.value);render()};el('view').onchange=render;render();
</script></html>`);
console.log(`Wrote ${output}: three parameter instances, nine complete actions, 41 frames/action; no external assets.`);
