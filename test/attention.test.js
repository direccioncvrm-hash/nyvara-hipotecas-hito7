import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {dashboard} from '../api/fichas.js';
import {changeAttention,ATTENTION} from '../lib/whatsapp-attention.js';
import {advance,initialState} from '../lib/whatsapp-ai.js';
test('human ownership blocks customer resume and model calls, preserves deletion rights',async()=>{
 const original={...initialState(),product:'Compra de vivienda',profile:{ciudad:'Puebla'},handoffRequested:true};
 const taken=changeAttention(original,'take');
 const model=()=>{throw Error('must not call AI');};
 for(const message of ['CONTINUAR','HOLA','Gano 40000','QUIERO HABLAR CON ARTURO']){
  const turn=await advance(taken,message,{},model);assert.equal(turn.state.paused,true);assert.equal(turn.state.humanActive,true);assert.deepEqual(turn.state.profile,original.profile);
 }
 assert.match((await advance(taken,'FICHA',{},model)).reply,/Puebla/);
 assert.deepEqual((await advance(taken,'BORRAR',{},model)).state,initialState());
 const resolved=changeAttention(taken,'resolve');assert.equal(resolved.handoffRequested,false);assert.equal(resolved.paused,true);assert.equal(resolved.humanActive,true);
 const returned=changeAttention(resolved,'return');assert.equal(returned.paused,false);assert.equal(returned.humanActive,false);assert.deepEqual(returned.profile,original.profile);assert.deepEqual(returned.history,[]);assert.equal(original.paused,false);
});
test('attention API checks authentication, origin, allowlist, revisions and concurrency outcomes',async()=>{
 const env={NYVARA_ADMIN_PASSWORD:'a'.repeat(40),TWILIO_WEBHOOK_URL:'https://example.com/api/whatsapp',NYVARA_TEST_SENDERS:'whatsapp:+15550000001'};
 const hash=(v,algo='sha256')=>createHash(algo).update(v).digest('hex');
 const raw=JSON.stringify({...initialState(),product:'Compra de vivienda',profile:{ciudad:'Puebla'}});
 const id=hash(env.NYVARA_TEST_SENDERS),revision=hash(raw,'sha1');
 let outcome='ok',mutations=0;
 const command=async args=>{
  if(args[0]==='GET')return args[1].includes(':session:')?'1':raw;
  if(args[0]==='EVAL'){mutations++;assert.equal(args[1],ATTENTION);assert.equal(args[3],`nyvara:hipotecas:7b:${id}:lock`);assert.equal(args[6],revision);assert.equal(JSON.parse(args[7]).humanActive,true);return outcome;}
  throw Error('unexpected command');
 };
 const req={method:'PATCH',headers:{origin:'https://example.com',cookie:'__Host-nyvara='+'c'.repeat(64)},body:{action:'take',id,revision}};
 assert.equal((await dashboard({...req,headers:{origin:'https://example.com'}},env,command)).status,401);
 assert.equal((await dashboard({...req,headers:{...req.headers,origin:'https://evil.com'}},env,command)).status,403);
 assert.equal((await dashboard({...req,body:{...req.body,id:'other'}},env,command)).status,404);
 assert.equal((await dashboard({...req,body:{...req.body,revision:'0'.repeat(40)}},env,command)).status,409);
 assert.equal(mutations,0);
 assert.equal((await dashboard(req,env,command)).status,200);
 for(const value of ['busy','stale','missing']){outcome=value;assert.equal((await dashboard(req,env,command)).status,value==='missing'?404:409);}
});
