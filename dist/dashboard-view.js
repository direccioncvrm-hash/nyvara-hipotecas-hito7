import {fieldsFor} from './questions.js';
export function describeProfile(state){
 const fields=state.product?fieldsFor(state):[];
 const filled=fields.filter(f=>state.profile?.[f.key]!==undefined && state.profile[f.key]!==null && state.profile[f.key]!=='').length;
 const stage=!state.product && !Object.keys(state.profile||{}).length?'inicio':fields.length && filled===fields.length?'completa':'proceso';
 return {stage,filled,total:fields.length,firstContactAt:state.firstContactAt||null,lastCustomerMessageAt:state.lastCustomerMessageAt||null};
}
export function ageGroup(value,now=Date.now()){
 const date=Date.parse(value);if(!Number.isFinite(date)||date>now)return 'sin-registro';
 const hours=(now-date)/3600000;return hours<2?'menos-2':hours<24?'2-24':hours<48?'24-48':'mas-48';
}
export const ageLabels={'sin-registro':'Tiempo sin registro','menos-2':'Menos de 2 horas','2-24':'De 2 a 24 horas','24-48':'De 24 a 48 horas','mas-48':'48 horas o más'};
export function totals(fichas){return [fichas.length,...['inicio','proceso','completa'].map(s=>fichas.filter(f=>f.stage===s).length),fichas.filter(f=>f.solicitaAtencion).length,fichas.filter(f=>f.atendiendo).length];}
export function nextAction(f){return f.atendiendo?'Continuar atención de Arturo':f.solicitaAtencion?'Revisar solicitud de atención':f.pausada?'Revisar pausa antes de retomar':f.stage==='completa'?'Revisar ficha; no implica aprobación':f.stage==='inicio'?'Esperar respuesta inicial':'Completar datos pendientes';}
export function displayDate(value){return value && Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Mexico_City'}).format(new Date(value)):'Sin registro previo';}
