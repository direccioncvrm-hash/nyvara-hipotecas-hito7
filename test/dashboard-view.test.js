import {test} from 'node:test';
import assert from 'node:assert/strict';
import {describeProfile,ageGroup,totals,displayDate} from '../dist/dashboard-view.js';
import {recordContact} from '../lib/contact-dates.js';
import {fields} from '../dist/questions.js';
test('first contact persists, legacy dates remain unknown and reset starts a new contact',()=>{
 let next={};recordContact({},next,true,'2026-10-18T12:00:00Z');assert.equal(next.firstContactAt,'2026-10-18T12:00:00Z');
 const later={};recordContact(next,later,false,'2026-10-19T12:00:00Z');assert.equal(later.firstContactAt,next.firstContactAt);assert.equal(later.lastCustomerMessageAt,'2026-10-19T12:00:00Z');
 const legacy={};recordContact({},legacy,false,'2026-10-19T12:00:00Z');assert.equal(legacy.firstContactAt,null);
 const reset={};recordContact({},reset,true,'2026-10-20T12:00:00Z');assert.equal(reset.firstContactAt,'2026-10-20T12:00:00Z');
});
test('time boundaries never overlap and unknown dates are not guessed',()=>{
 const now=Date.parse('2026-10-18T12:00:00Z');const ago=h=>new Date(now-h*3600000).toISOString();
 assert.equal(ageGroup(ago(1.99),now),'menos-2');assert.equal(ageGroup(ago(2),now),'2-24');assert.equal(ageGroup(ago(24),now),'24-48');assert.equal(ageGroup(ago(48),now),'mas-48');assert.equal(ageGroup(null,now),'sin-registro');assert.equal(ageGroup(ago(-1),now),'sin-registro');assert.equal(displayDate(null),'Sin registro previo');
});
test('greetings are initial, skipped fields are incomplete, totals distinguish overlapping attention',()=>{
 const initial=describeProfile({profile:{}});assert.equal(initial.stage,'inicio');
 const partial=describeProfile({product:'Compra de vivienda',profile:{ciudad:'Puebla'},skipped:fields.map(f=>f.key)});assert.equal(partial.stage,'proceso');assert.equal(partial.filled,1);
 const full=describeProfile({product:'Compra de vivienda',profile:Object.fromEntries(fields.map(f=>[f.key,'dato']))});assert.equal(full.stage,'completa');
 assert.deepEqual(totals([initial,{...partial,solicitaAtencion:true,atendiendo:true},full]),[3,1,1,1,1,1]);
});
