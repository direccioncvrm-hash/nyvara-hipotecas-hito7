import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {evaluateWebhook} from '../api/whatsapp.js';
const env={TWILIO_AUTH_TOKEN:'fictional-test-secret',TWILIO_WEBHOOK_URL:'https://example.com/api/whatsapp',TWILIO_ACCOUNT_SID:'ACtest',NYVARA_TEST_SENDERS:'whatsapp:+15555550100'};
const form={AccountSid:'ACtest',From:'whatsapp:+15555550100',Body:'Hola <&>',MessageSid:'SM'+'1'.repeat(32),NewFutureField:'included'};
function headers(p=form){return {'content-type':'application/x-www-form-urlencoded','x-twilio-signature':createHmac('sha1',env.TWILIO_AUTH_TOKEN).update(env.TWILIO_WEBHOOK_URL+Object.keys(p).sort().map(k=>k+p[k]).join('')).digest('base64')};}
test('signed authorized form returns fixed TwiML without reflecting user data',()=>{
 for(const body of [form,new URLSearchParams(form).toString()]){
  const r=evaluateWebhook('POST',headers(),body,env);assert.equal(r[0],200);assert.match(r[2],/<Message>/);assert.ok(!r[2].includes(form.Body));
 }
});
test('rejects forged, altered, wrong-account and wrong-url requests',()=>{
 assert.equal(evaluateWebhook('POST',{},form,env)[0],415);
 assert.equal(evaluateWebhook('POST',{'content-type':'application/x-www-form-urlencoded'},form,env)[0],403);
 assert.equal(evaluateWebhook('POST',headers(),{...form,Body:'altered'},env)[0],403);
 assert.equal(evaluateWebhook('POST',headers(),form,{...env,TWILIO_WEBHOOK_URL:env.TWILIO_WEBHOOK_URL+'/'} )[0],403);
 const wrong={...form,AccountSid:'other'};assert.equal(evaluateWebhook('POST',headers(wrong),wrong,env)[0],403);
});
test('fails closed before configuration and silently ignores unapproved senders',()=>{
 assert.equal(evaluateWebhook('POST',headers(),form,{})[0],503);
 const other={...form,From:'whatsapp:+15555550199'};
 assert.deepEqual(evaluateWebhook('POST',headers(other),other,env),[200,'text/xml','<Response/>']);
 assert.equal(evaluateWebhook('POST',headers(),new URLSearchParams(form)+'&Body=extra',env)[0],400);
 assert.equal(evaluateWebhook('DELETE',{},null,env)[0],405);
 assert.equal(evaluateWebhook('GET',{},null,{})[0],200);
});
