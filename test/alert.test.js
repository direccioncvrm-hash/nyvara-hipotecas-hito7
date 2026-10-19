import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sendAlert} from '../lib/whatsapp-alert.js';
import {processMessage} from '../lib/whatsapp-service.js';
import {initialState} from '../lib/whatsapp-ai.js';
const client='whatsapp:+5211111111111';
const env={NYVARA_ALERT_TO:'whatsapp:+5222222222222',TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32),TWILIO_AUTH_TOKEN:'test-secret',TWILIO_WEBHOOK_URL:'https://example.com/api/whatsapp'};
test('alert posts only masked contact and protected panel link; acceptance is not delivery',async()=>{
 const r=await sendAlert(env,client,async(url,options)=>{
 assert.match(url,/api.twilio.com/);assert.equal(options.redirect,'error');
 const body=new URLSearchParams(options.body);
 assert.equal(body.get('To'),env.NYVARA_ALERT_TO);assert.equal(body.get('From'),'whatsapp:+14155238886');
 assert.match(body.get('Body'),/1111/);assert.match(body.get('Body'),/https:\/\/example.com\/whatsapp.html/);
 assert.ok(!body.get('Body').includes(client));
 return {ok:true,json:async()=>({sid:'SM'+'b'.repeat(32),status:'queued'})};});
 assert.equal(r.status,'accepted');
});
test('configuration, rejected and ambiguous outcomes never claim success or retry',async()=>{
 assert.equal((await sendAlert({...env,NYVARA_ALERT_TO:client},client,()=>{throw Error('must not call');})).status,'configuration');
 for(const status of [400,401,429,500]){
 let calls=0;const r=await sendAlert(env,client,async()=>{calls++;return {ok:false,status,json:async()=>({code:63016})};});
 assert.equal(r.status,status>=500?'unknown':'rejected');assert.equal(calls,1);
 }
 assert.equal((await sendAlert(env,client,async()=>{throw Error('timeout');})).status,'unknown');
});
function fixture(){let value=initialState();const seen=new Set();let fail=false;const saved=[];return {
 saved,get value(){return value;},set fail(x){fail=x;},
 begin:async(from,sid)=>seen.has(sid)?{kind:'cached'}:{kind:'ready',sid,value:JSON.stringify(value)},
 commit:async(turn,state)=>{if(fail)throw Error('storage_commit');value=state;seen.add(turn.sid);},
 release:async()=>{},saveAlert:async(id,outcome)=>saved.push({id,outcome})};}
const params=sid=>({From:client,MessageSid:'SM'+String(sid).padStart(32,'0'),Body:'HABLAR CON ARTURO'});
test('commit precedes alert, duplicates and an already pending request never resend',async()=>{
 const store=fixture();let calls=0;
 const notify=async()=>{calls++;assert.equal(store.value.handoffRequested,true);return {status:'accepted'};};
 await processMessage(params(1),env,store,null,notify);
 await processMessage(params(1),env,store,null,notify);
 await processMessage(params(2),env,store,null,notify);
 assert.equal(calls,1);assert.equal(store.saved.length,1);
 assert.equal(store.value.alertId,params(1).MessageSid);
});
test('failed commit sends nothing; notification failure preserves recorded request',async()=>{
 const store=fixture();store.fail=true;let calls=0;
 await processMessage(params(1),env,store,null,async()=>{calls++;});assert.equal(calls,0);
 store.fail=false;
 const r=await processMessage(params(1),env,store,null,async()=>({status:'unknown'}));
 assert.equal(store.value.handoffRequested,true);assert.equal(store.saved[0].outcome.status,'unknown');
 assert.match(r[2],/no confirma entrega/);
});
test('NO to a help offer produces no external alert',async()=>{
 const store=fixture();await store.commit({sid:'seed'},{...initialState(),product:'Compra de vivienda',helpOffer:{field:'ciudad'}});
 let calls=0;await processMessage({...params(1),Body:'NO'},env,store,null,async()=>{calls++;});
 assert.equal(calls,0);assert.ok(!store.value.handoffRequested);
});
