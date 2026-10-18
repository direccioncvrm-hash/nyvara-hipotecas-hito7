import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inbox,poller} from '../dist/inbox.js';
test('pending count includes human-owned requests until explicitly resolved, filtering does not mutate data',()=>{
 const data=[{id:1,solicitaAtencion:false},{id:2,solicitaAtencion:true,atendiendo:true},{id:3,solicitaAtencion:true}];
 assert.deepEqual(inbox(data).visible.map(x=>x.id),[2,3,1]);
 assert.equal(inbox(data,true).pending,2);assert.equal(inbox(data,true).visible.length,2);
 assert.deepEqual(data.map(x=>x.id),[1,2,3]);
 assert.equal(inbox(data.map(x=>({...x,solicitaAtencion:false})),true).visible.length,0);
});
test('polling skips hidden tabs, waits for completion and cannot restart after logout during request',async()=>{
 const jobs=new Map();let id=0,calls=0,visible=false,finish;
 const timers={setTimeout(fn){jobs.set(++id,fn);return id;},clearTimeout(id){jobs.delete(id);}};
 const tick=()=>{const [key,fn]=jobs.entries().next().value;jobs.delete(key);return fn();};
 const p=poller(()=>{calls++;return new Promise(r=>finish=r);},()=>visible,30000,timers);
 p.start();await tick();assert.equal(calls,0);assert.equal(jobs.size,1);
 visible=true;const pending=tick();assert.equal(calls,1);assert.equal(jobs.size,0);
 p.stop();finish();await pending;assert.equal(jobs.size,0);
 p.start();p.start();assert.equal(jobs.size,1);p.stop();assert.equal(jobs.size,0);
});
