import {allFields as fields} from './questions.js';
import {isPurchaseIntent} from './input.js';
export const KEY='nyvara-hito7-local-v1';
export function save(storage,data){storage.setItem(KEY,JSON.stringify(data));}
export function load(storage){
 const raw=storage.getItem(KEY);if(raw===null)return null;
 const data=JSON.parse(raw);
 if(data.clock!==undefined&&!Number.isFinite(Date.parse(data.clock)))throw Error('Reloj guardado inválido.');
 if(data.version!==1||!Array.isArray(data.prospects)||!data.prospects.length)throw Error('Formato de datos no compatible.');
 const ids=new Set();
 for(const p of data.prospects){
  if(typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||typeof p.status!=='string'||!p.profile||typeof p.profile!=='object'||!Array.isArray(p.messages)||!Array.isArray(p.skipped)||!Array.isArray(p.notes))throw Error('No pudimos validar las conversaciones guardadas.');
  ids.add(p.id);
  if(p.interest&&(!['Alto'].includes(p.interest.level)||typeof p.interest.evidence!=='string'))throw Error('Evidencia de interés inválida.');
  const f=p.followup;
  if(f&&(!Array.isArray(f.pending)||f.pending.some(at=>!Number.isFinite(Date.parse(at)))||(f.startedAt&&(!Array.isArray(f.events)||f.events.length>2||f.events.some(e=>typeof e.text!=='string'||!Number.isFinite(Date.parse(e.at)))||typeof f.zone!=='string'))))throw Error('Seguimiento guardado inválido.');
  if(f?.zone){try{new Intl.DateTimeFormat('es',{timeZone:f.zone});}catch{throw Error('Zona guardada inválida.');}}
  if((p.takenAt!==undefined&&typeof p.takenAt!=='string')||(p.crmCapturedAt!==undefined&&(typeof p.crmCapturedAt!=='string'||!p.takenAt))||(p.contact!==undefined&&(!p.contact||typeof p.contact!=='object'||typeof p.contact.channel!=='string'))||(p.alerts!==undefined&&(!Array.isArray(p.alerts)||p.alerts.some(a=>!a||typeof a.text!=='string'))))throw Error('Estado de atención inválido.');
  if(p.messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.text!=='string')||p.notes.some(n=>typeof n!=='string')||Object.entries(p.profile).some(([k,v])=>!fields.some(f=>f.key===k)||typeof v!=='string'))throw Error('La ficha guardada contiene datos inválidos.');
 }
 if(!ids.has(data.selected))throw Error('Prospecto seleccionado inválido.');
 // Repair only the exact purchase-intent phrase misfiled by the prior demo.
 // Preserve the conversation and every other field.
 for(const p of data.prospects){if(!p.crmCapturedAt&&p.product==='Compra de vivienda'&&typeof p.profile.ciudad==='string'&&isPurchaseIntent(p.profile.ciudad)){
  delete p.profile.ciudad;p.skipped=p.skipped.filter(k=>k!=='ciudad');
  p.notes.push('Corrección de la demo: la intención de comprar se guardó como ciudad; ciudad pendiente de confirmar.');
 }}
 return data;
}

