import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advance,initialState} from '../lib/whatsapp-ai.js';
import {REFINANCE,fieldsFor} from '../dist/questions.js';
function pending(key){
 const s={...initialState(),product:key==='alCorriente'?REFINANCE:'Compra de vivienda'};
 for(const f of fieldsFor(s)){if(f.key===key)break;s.profile[f.key]='dato previo';}
 return s;
}
const never=async()=>{throw Error('Model must not interpret an exact yes/no');};
test('SI, accents, case and punctuation are deterministic for every yesno field',async()=>{
 for(const key of ['conyuge','infonavit','alCorriente'])for(const input of ['SI','sí','Sï',' si ','Sí.','NO','No!','por confirmar']){
  const before=pending(key);const r=await advance(before,input,{},never);
  assert.equal(r.state.profile[key],/no/i.test(input)?'no':input==='por confirmar'?'por confirmar':'sí');
  for(const [k,v] of Object.entries(before.profile))assert.equal(r.state.profile[k],v);
  assert.ok(!r.state.helpAttempts);assert.ok(!r.state.handoffRequested);
 }
});
test('yes after a prior failed attempt completes Infonavit and clears help counter',async()=>{
 const s=pending('infonavit');s.helpAttempts={field:'infonavit',count:1};
 const r=await advance(s,'SI',{},never);
 assert.equal(r.state.profile.infonavit,'sí');assert.ok(!r.state.helpAttempts);
 assert.match(r.reply,/Ya reunimos/);
});
test('help consent and human pause take precedence over yesno data',async()=>{
 const s=pending('infonavit');s.helpOffer={field:'infonavit'};
 const yes=await advance(s,'SI',{},never);assert.ok(yes.state.paused);assert.equal(yes.state.profile.infonavit,undefined);
 const no=await advance(s,'NO',{},never);assert.equal(no.state.profile.infonavit,undefined);assert.ok(!no.state.handoffRequested);
 const paused=await advance({...pending('infonavit'),paused:true,humanActive:true},'SI',{},never);
 assert.equal(paused.reply,'');assert.equal(paused.state.profile.infonavit,undefined);
});
test('questions or compound answers are not forced into affirmative values',async()=>{
 let called=0;
 for(const text of ['¿Sí?','sí, pero no cotizo','si cotizara']){
  const r=await advance(pending('infonavit'),text,{},async()=>{called++;return {product:'sin_cambio',updates:[],handoff:false,skip:false,answer:''};});
  assert.equal(r.state.profile.infonavit,undefined);
 }
 assert.equal(called,3);
});
