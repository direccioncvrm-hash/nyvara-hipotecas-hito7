import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advance,initialState} from '../lib/whatsapp-ai.js';
const empty=async()=>({product:'sin_cambio',handoff:false,updates:[],skip:false,answer:''});
const start=()=>({...initialState(),product:'Compra de vivienda',profile:{ciudad:'Puebla',estado:'Puebla',precio:'2000000'}});
async function offered(){const a=await advance(start(),'respuesta confusa',{},empty);assert.equal(a.state.helpAttempts.count,1);assert.match(a.reply,/enganche/);const b=await advance(a.state,'otra respuesta confusa',{},empty);assert.equal(b.state.helpOffer.field,'enganche');assert.ok(!b.state.handoffRequested);return b.state;}
test('two unresolved turns ask consent; yes records contextual request and pauses without promising delivery',async()=>{
 const state=await offered();const result=await advance(state,'Sí, por favor',{},()=>{throw Error('no AI needed');});
 assert.equal(result.state.paused,true);assert.equal(result.state.handoffRequested,true);assert.equal(result.state.handoffReason.field,'enganche');assert.match(result.reply,/Aún no se envía/);assert.ok(!result.state.helpOffer);
});
test('no declines without interpreting the reply as a mortgage field; ambiguous replies stay in consent',async()=>{
 const state=await offered();const uncertain=await advance(state,'tal vez',{},empty);assert.ok(uncertain.state.helpOffer);assert.ok(!uncertain.state.handoffRequested);
 const no=await advance(state,'NO',{},empty);assert.ok(!no.state.helpOffer);assert.ok(!no.state.handoffRequested);assert.deepEqual(no.state.profile,state.profile);
});
test('unknown and omission do not count; successful answer resets counter for next question',async()=>{
 const state=(await advance(start(),'confuso',{},empty)).state;
 const unknown=await advance(state,'no sé',{},empty);assert.ok(unknown.state.skipped.includes('enganche'));assert.ok(!unknown.state.helpAttempts);
 const success=await advance(state,'diez por ciento',{},empty);assert.equal(success.state.profile.enganche,'10%');assert.ok(!success.state.helpAttempts);
 const next=await advance(success.state,'confuso',{},empty);assert.equal(next.state.helpAttempts.field,'actividad');assert.equal(next.state.helpAttempts.count,1);
});
test('technical failure, invalid extraction, questions and acknowledgments never increment counter',async()=>{
 const state=(await advance(start(),'confuso',{},empty)).state;
 await assert.rejects(advance(state,'texto',{},async()=>{throw Error('ai_unavailable');}));assert.equal(state.helpAttempts.count,1);
 for(const input of ['¿Qué es enganche?','gracias']){const r=await advance(state,input,{},empty);assert.equal(r.state.helpAttempts.count,1);}
 const bad=await advance(state,'texto',{},async()=>({...await empty(),updates:[{key:'enganche',value:'10%',evidence:'inventado'}]}));assert.equal(bad.state.helpAttempts.count,1);
});
test('control commands, deletion and human ownership take precedence over help offers',async()=>{
 const state=await offered();const ficha=await advance(state,'FICHA',{},empty);assert.ok(ficha.state.helpOffer);
 const deleted=await advance(state,'BORRAR',{},empty);assert.deepEqual(deleted.state,initialState());
 const owned=await advance({...state,humanActive:true,paused:true},'SÍ',{},()=>{throw Error('no model');});assert.equal(owned.reply,'');assert.equal(owned.state.paused,true);
});
