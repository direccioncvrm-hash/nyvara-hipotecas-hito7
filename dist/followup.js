// Local simulation only: no networking, timers or background delivery.
const formatters=new Map();
export function localParts(at,zone){
 if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}));
 const p=Object.fromEntries(formatters.get(zone).formatToParts(new Date(at)).map(p=>[p.type,p.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,minute:Number(p.hour)*60+Number(p.minute)};
}
const minuteValue=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?Number(s.slice(0,2))*60+Number(s.slice(3)):NaN;
function findAllowed(start,zone,from,to,condition=()=>true){
 const initial=Math.ceil(start/60000)*60000;
 for(let i=0;i<60*72;i++){const t=initial+i*60000,p=localParts(t,zone);if(p.minute>=from&&p.minute<to&&condition(p))return t;}
 throw Error('No se encontró un horario disponible para simular.');
}
export function cancelFollowup(p,reason,at){if(p.followup&&!p.followup.cancelled)p.followup={...p.followup,cancelled:true,reason,cancelledAt:at||null,pending:[]};}
export function scheduleFollowup(p,{consent,zone,from='09:00',to='19:00'},now){
 if(p.takenAt||p.crmCapturedAt||p.contact)throw Error('El prospecto ya solicitó atención o está a cargo de Arturo. No se programan recordatorios.');
 if(p.followup?.startedAt||p.followup?.cancelled)throw Error('Esta consulta ya tuvo seguimiento o fue cancelada. No se reinicia automáticamente. Crea otro prospecto para una nueva prueba.');
 if(consent!==true)throw Error('Primero registra el permiso del cliente de prueba.');
 if(!zone)throw Error('Selecciona la zona horaria del cliente antes de programar.');
 const at=Date.parse(now);if(!Number.isFinite(at))throw Error('Reloj de prueba inválido.');
 try{localParts(at,zone);}catch{throw Error('La zona horaria no es válida.');}
 const a=minuteValue(from),b=minuteValue(to);if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b)throw Error('Indica un horario válido dentro del mismo día, por ejemplo 09:00–19:00.');
 const first=findAllowed(at+2*3600000,zone,a,b);
 const day=localParts(first,zone);
 const nextDate=new Date(Date.parse(day.date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 const second=findAllowed(first+60000,zone,a,b,x=>x.date>=nextDate&&(x.date>nextDate||x.minute>=day.minute));
 const r=structuredClone(p);
 r.followup={consent:true,zone,from,to,startedAt:now,pending:[new Date(first).toISOString(),new Date(second).toISOString()],events:[],cancelled:false,reason:''};
 r.messages.push({role:'assistant',text:'¿Te parece bien que te enviemos hasta dos recordatorios por WhatsApp para retomar esta consulta? En esta demo solo se simulan.'},{role:'user',text:`Sí, autorizo la simulación de hasta dos recordatorios. Horario elegido: ${from}–${to}, zona ${zone}.`});
 return r;
}
export function advanceClock(data,hours){
 if(!Number.isFinite(hours)||hours<=0||hours>24*32)throw Error('Avance de reloj inválido.');
 const r=structuredClone(data);const t=Date.parse(r.clock)+hours*3600000;if(!Number.isFinite(t))throw Error('Reloj inválido.');r.clock=new Date(t).toISOString();
 for(const p of r.prospects){const f=p.followup;if(!f)continue;
  if(p.takenAt||p.crmCapturedAt||p.contact){cancelFollowup(p,'Atención humana o contacto solicitado',r.clock);continue;}
  if(f.cancelled||!f.consent||!f.zone)continue;
  const due=f.pending.filter(at=>Date.parse(at)<=t);f.pending=f.pending.filter(at=>Date.parse(at)>t);
  for(const at of due){if(f.events.length>=2)break;f.events.push({at,text:`Recordatorio ${f.events.length+1} de 2 · simulado, no enviado`,observedAt:r.clock});}
  if(f.events.length>=2){f.pending=[];f.reason='Dos intentos completados. Seguimiento pausado.';}
 }
 return r;
}
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function isStopRequest(text){return /\b(?:stop|baja)\b|no (?:me )?(?:escribas|escriban|contacten|mandes|manden)|no quiero (?:mas )?(?:mensajes|recordatorios)|deten(?:er)? (?:los )?(?:mensajes|recordatorios)|cancelar (?:el )?seguimiento/.test(norm(text));}
export function markInterest(p,text,at){
 const n=norm(text);
 if(!/(?:que|cual|como)/.test(n)||!/(?:informacion|datos|documentos|necesit|requier)/.test(n)||!/(?:avanzar|agilizar|continuar|siguiente paso|iniciar (?:el|mi) tramite)/.test(n)||/no (?:quiero|me interesa|deseo) (?:avanzar|continuar)/.test(n))return false;
 if(!p.interest){p.interest={level:'Alto',evidence:text,at};p.alerts=p.alerts||[];p.alerts.push({kind:'interest',at,text:'Interés alto · aviso simulado, no enviado',evidence:text});}
 return true;
}
// Money never affects attention priority. Free-text appointment preferences
// remain explicitly unconfirmed and are ordered by request time within their group.
export function priority(p){return p.takenAt||p.crmCapturedAt?4:p.contact?.immediate?0:p.contact?1:p.followup?.pending?.length?2:3;}
export function orderedProspects(list){return [...list].sort((a,b)=>priority(a)-priority(b)||(priority(a)===1?String(a.contact.requestedAt).localeCompare(String(b.contact.requestedAt)):0));}

