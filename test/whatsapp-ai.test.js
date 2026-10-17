import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {advance, extractTurn, initialState, isControl} from '../lib/whatsapp-ai.js';
import {processMessage, twiml} from '../lib/whatsapp-service.js';
import {createStore, BEGIN, COMMIT, RELEASE, TTL} from '../lib/whatsapp-store.js';
import {handleRequest} from '../api/whatsapp.js';

const turn = overrides=>({product:'sin_cambio',handoff:false,updates:[],skip:false,answer:'',...overrides});
const state = ()=>({...initialState(),product:'Compra de vivienda',profile:{ciudad:'Xalapa',estado:'Veracruz',precio:'2000000'}});
const message = (body, sid='1', from='whatsapp:+15555550100')=>({From:from,MessageSid:'SM'+sid.repeat(32),Body:body});
test('reported live sequence: full price sentence, repeated price, mistaken down payment and explicit correction',async()=>{
  const noModel=()=>{throw Error('simple monetary answer must not depend on model');};
  let s={...initialState(),product:'Compra de vivienda',profile:{ciudad:'Xalapa',estado:'Veracruz'}};
  let r=await advance(s,'La vivienda cuesta dos millones de pesos.',{},noModel);
  assert.equal(r.state.profile.precio,'2000000');assert.match(r.reply,/aportar de enganche/);
  assert.ok(!r.reply.includes('no pude validar'));
  r=await advance(r.state,'El precio es 2 MILLONES',{},noModel);
  assert.equal(r.state.profile.enganche,undefined);assert.match(r.reply,/enganche/);
  r=await advance(r.state,'2,000,000',{},noModel);
  assert.equal(r.state.profile.enganche,'2000000');assert.match(r.reply,/asalariado/);
  r=await advance(r.state,'Corrijo: mi enganche es diez por ciento.',{},noModel);
  assert.equal(r.state.profile.enganche,'10%');assert.equal(r.state.profile.precio,'2000000');
});
test('only server follow-up is shown on data answers and stale identical fields do not cause errors',async()=>{
  const r=await advance(state(),'Soy asalariado',{},async()=>turn({updates:[
    {key:'ciudad',value:'Xalapa',evidence:'old'},
    {key:'actividad',value:'asalariado',evidence:'asalariado'}
  ],answer:'Gracias. ¿Cuánto darías? ¿Quieres ayuda?'}));
  assert.ok(!r.reply.includes('Gracias'));assert.ok(!r.reply.includes('no pude validar'));
  assert.equal((r.reply.match(/¿/g)||[]).length,1);assert.match(r.reply,/enganche/);
});
test('hypothetical amount does not trigger deterministic write and model question is suppressed',async()=>{
  let called=false;
  const r=await advance(state(),'¿Y si aportara diez por ciento?',{},async()=>{called=true;return turn({answer:'Depende de evaluación. ¿Cuánto quieres aportar?'});});
  assert.equal(called,true);assert.equal(r.state.profile.enganche,undefined);
  assert.ok(!r.reply.includes('¿Cuánto quieres aportar?'));assert.match(r.reply,/Depende de evaluación/);
});
function memory() {
  const states=new Map(), done=new Set(), locks=new Set();
  return {states,done,locks,
    async begin(from,sid) {
      if(done.has(sid))return {kind:'cached'};
      if(locks.has(from))return {kind:'busy'};
      locks.add(from);return {kind:'ready',from,sid,value:states.get(from)};
    },
    async commit(t,s) {states.set(t.from,JSON.stringify(s));done.add(t.sid);locks.delete(t.from);},
    async release(t) {locks.delete(t.from);}
  };
}

test('natural-language down payment preserved as percentage with source evidence',async()=>{
  for(const input of ['10%','diez por ciento']) {
    const r=await advance(state(),input,{},async()=>turn({updates:[{key:'enganche',value:'10%',evidence:input}]}));
    assert.equal(r.state.profile.enganche,'10%');assert.match(r.reply,/asalariado/);
    assert.equal(r.state.profile.precio,'2000000');
  }
});
test('rejects invented amount, missing evidence, invalid percentage and unknown fields',async()=>{
  for(const update of [
    {key:'enganche',value:'90%',evidence:'10%'},
    {key:'enganche',value:'10%',evidence:'not present'},
    {key:'enganche',value:'101%',evidence:'101%'},
    {key:'credito',value:'1000',evidence:'1000'}, null
  ]) {
    const r=await advance(state(),'10% 101% 1000',{},async()=>turn({updates:[update]}));
    assert.equal(r.state.profile.enganche,undefined);assert.match(r.reply,/no pude validar/);
  }
});
test('unknown down payment is omitted, never set to zero; product switch preserves existing data',async()=>{
  const r=await advance(state(),'no sé',{},async()=>turn({skip:true}));
  assert.equal(r.state.profile.enganche,undefined);assert.ok(r.state.skipped.includes('enganche'));
  const switched=await advance(state(),'cambiar hipoteca',{},async()=>turn({product:'cambio'}));
  assert.deepEqual(switched.state,state());assert.match(switched.reply,/BORRAR/);
});
test('handoff persists pause; no AI calls while paused; explicit resume and deletion',async()=>{
  const forbidden=()=>{throw Error('must not call model');};
  let r=await advance(state(),'quiero hablar con Arturo',{},forbidden);
  assert.equal(r.state.paused,true);assert.equal(r.state.handoffRequested,true);
  assert.match(r.reply,/no se envía un aviso/);
  r=await advance(r.state,'quiero comprar',{},forbidden);assert.equal(r.reply,'');
  r=await advance(r.state,'CONTINUAR',{},forbidden);assert.equal(r.state.paused,false);
  r=await advance(r.state,'BORRAR',{},forbidden);assert.deepEqual(r.state,initialState());
  for(const text of ['STOP','BORRAR','FICHA','HOLA','hablar con Arturo']) assert.equal(isControl(text),true);
});
test('service persists across requests, isolates senders and avoids repeated model calls on duplicate SID',async()=>{
  const store=memory();let calls=0;
  const model=async(s,input)=>{calls++;return turn({product:'compra',updates:[{key:'ciudad',value:input,evidence:input}]});};
  await processMessage(message('Xalapa'),{},store,model);
  const duplicate=await processMessage(message('Xalapa'),{},store,model);
  assert.equal(calls,1);assert.ok(!duplicate[2].includes('<Message>'));
  const ficha=await processMessage(message('FICHA','2'),{},store,model);
  assert.match(ficha[2],/Xalapa/);assert.equal(calls,1);
  const other=await processMessage(message('FICHA','3','whatsapp:+15555550199'),{},store,model);
  assert.ok(!other[2].includes('Xalapa'));
  await processMessage(message('BORRAR','4'),{},store,model);
  const erased=await processMessage(message('FICHA','5'),{},store,model);
  assert.ok(!erased[2].includes('Xalapa'));
});
test('AI timeout leaves previous state intact and clears lock; concurrent message gets explicit retry',async()=>{
  const store=memory();const params=message('Xalapa');
  const fail=await processMessage(params,{},store,async()=>{throw Error('timeout with private payload');});
  assert.match(fail[2],/vuelve a enviar/);assert.ok(!fail[2].includes('private'));
  assert.equal(store.states.size,0);assert.equal(store.locks.size,0);
  store.locks.add(params.From);
  const busy=await processMessage(params,{},store,()=>{throw Error('must not run');});
  assert.match(busy[2],/mensaje anterior/);
});
test('failed persistence never claims success and retry does not partially mutate state',async()=>{
  const store=memory();store.commit=async()=>{throw Error('database failure');};
  const r=await processMessage(message('Xalapa'),{},store,async()=>turn({product:'compra'}));
  assert.match(r[2],/No pude completar/);assert.equal(store.states.size,0);
});
test('media and long text do not call storage or AI; XML escapes all user/model text',async()=>{
  for(const p of [{...message('foto'),NumMedia:'1'},message('a'.repeat(1201)),message('')]) {
    const r=await processMessage(p,{},null,()=>{throw Error('must not run');});assert.equal(r[0],200);
  }
  assert.match(twiml('<script>&"\u0000')[2],/&lt;script&gt;&amp;&quot;/);
  assert.ok(!twiml('<script>')[2].includes('<script>'));
});
test('Responses request uses schema, no stored response, bounded output, no credentials in input',async()=>{
  let request;
  const model=await extractTurn(state(),'10%',{OPENAI_API_KEY:'fake-secret'},async(url,opts)=>{
    request=JSON.parse(opts.body);assert.equal(url,'https://api.openai.com/v1/responses');assert.ok(opts.signal);
    return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(turn())}]}]})};
  });
  assert.equal(request.store,false);assert.equal(request.text.format.strict,true);assert.equal(request.max_output_tokens,650);
  assert.ok(!JSON.stringify(request).includes('fake-secret'));assert.equal(model.product,'sin_cambio');
  for(const payload of [{status:'incomplete'}, {status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'no'}]}]}]) {
    await assert.rejects(extractTurn(state(),'10%',{OPENAI_API_KEY:'fake'},async()=>({ok:true,json:async()=>payload})));
  }
});
test('Redis REST adapter uses atomic scripts, TTL, non-plaintext sender keys and lease fencing',async()=>{
  const commands=[];
  const store=createStore({KV_REST_API_URL:'https://example.com',KV_REST_API_TOKEN:'fake'},async(url,opts)=>{
    const cmd=JSON.parse(opts.body);commands.push(cmd);
    return {ok:true,json:async()=>({result:cmd[1]===BEGIN?['ready','']:1})};
  });
  const t=await store.begin('whatsapp:+15555550100','SMabc',true,new Date('2026-10-17T12:00:00Z'));
  await store.commit(t,initialState(),'reply');await store.release(t);
  assert.ok(!JSON.stringify(commands).includes('+15555550100'));
  assert.equal(commands[0][0],'EVAL');assert.equal(commands[0].at(-1),'1');
  assert.equal(commands[1][1],COMMIT);assert.equal(commands[1].at(-1),TTL);assert.equal(commands[2][1],RELEASE);
  const bad=createStore({KV_REST_API_URL:'https://example.com',KV_REST_API_TOKEN:'fake'},async()=>({ok:true,json:async()=>({result:0})}));
  await assert.rejects(bad.commit(t,initialState(),''),/storage_commit/);
});
test('activated webhook authenticates before accessing storage; disabled mode remains connectivity test',async()=>{
  const env={TWILIO_AUTH_TOKEN:'test',TWILIO_ACCOUNT_SID:'ACtest',TWILIO_WEBHOOK_URL:'https://example.com/api/whatsapp',NYVARA_TEST_SENDERS:'whatsapp:+15555550100',NYVARA_AI_ENABLED:'true'};
  const p={...message('hola'),AccountSid:'ACtest'};
  const sign=body=>({'content-type':'application/x-www-form-urlencoded','x-twilio-signature':createHmac('sha1',env.TWILIO_AUTH_TOKEN).update(env.TWILIO_WEBHOOK_URL+Object.keys(body).sort().map(k=>k+body[k]).join('')).digest('base64')});
  const store=memory();
  assert.equal((await handleRequest('POST',sign(p),{...p,Body:'tampered'},env,{store}))[0],403);
  assert.equal(store.states.size,0);
  const unknown={...p,From:'whatsapp:+15555550199'};
  assert.ok(!(await handleRequest('POST',sign(unknown),unknown,env,{store}))[2].includes('<Message>'));
  const r=await handleRequest('POST',sign(p),new URLSearchParams(p).toString(),env,{store});
  assert.match(r[2],/asistente de IA/);assert.equal(store.states.size,1);
  const off=await handleRequest('POST',sign(p),p,{...env,NYVARA_AI_ENABLED:'false'});
  assert.match(off[2],/conexión de prueba recibida/);
});

test('refinance full sentences: property value, outstanding balance and monthly payment',async()=>{
  let s={...initialState(),product:'Cambio de hipoteca más liquidez',profile:{institucion:'BBVA',fechaCredito:'03/2021',ciudad:'Puebla',estado:'Puebla'}};
  const noModel=()=>{throw Error('must parse affirmative amount directly');};
  for (const [text,key,expected] of [
    ['El valor actual de mi vivienda es de tres millones de pesos.','valor','3000000'],
    ['Debo un millón de pesos.','saldo','1000000'],
    ['Pago quince mil pesos al mes.','mensualidad','15000'],
    ['Corrijo: mi saldo pendiente es de novecientos mil pesos.','saldo','900000']
  ]) {
    const r=await advance(s,text,{},noModel);s=r.state;
    assert.equal(s.profile[key],expected);assert.ok(!r.reply.includes('no pude validar'));
  }
  assert.equal(s.profile.valor,'3000000');assert.equal(s.profile.mensualidad,'15000');
});
test('refinance hypothetical and ambiguous money sentences do not bypass model',async()=>{
  const s={...initialState(),product:'Cambio de hipoteca más liquidez',profile:{}};
  for(const text of ['Si debo un millón de pesos, ¿qué pasa?','Debo un millón o dos millones','Pago quince mil pesos y debo un millón']) {
    let called=false;
    const r=await advance(s,text,{},async()=>{called=true;return turn();});
    assert.ok(called);assert.deepEqual(r.state.profile,{});
  }
});
