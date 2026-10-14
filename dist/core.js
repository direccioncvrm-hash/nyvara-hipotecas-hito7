import {allFields,fieldsFor,greeting,REFINANCE} from './questions.js';
import {requestContact,stopped} from './handoff.js';
import {parseMoney,parseCreditDate,isPurchaseIntent} from './input.js';
import {cancelFollowup,isStopRequest,markInterest} from './followup.js';
export const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const aliases={credito:'credito','monto del prestamo':'credito',prestamo:'credito','precio de vivienda':'precio',precio:'precio',ciudad:'ciudad',estado:'estado',enganche:'enganche',actividad:'actividad','actividad laboral':'actividad',ingreso:'ingreso','ingreso mensual':'ingreso',conyuge:'conyuge','sumar ingresos':'conyuge',infonavit:'infonavit','cotizacion infonavit':'infonavit'};
export function createProspect(id,name){return {id,name,product:null,profile:{},skipped:[],messages:[{role:'assistant',text:greeting}],status:'Nuevo',notes:[]};}
Object.assign(aliases,{'institucion':'institucion','banco':'institucion','fecha':'fechaCredito','fecha del credito':'fechaCredito','fecha de contratacion':'fechaCredito','valor':'valor','valor del inmueble':'valor','saldo':'saldo','saldo pendiente':'saldo','mensualidad':'mensualidad','al corriente':'alCorriente','objetivo':'objetivo','liquidez':'liquidez'});
export function nextField(p){return fieldsFor(p).find(f=>!p.profile[f.key]&&!p.skipped.includes(f.key));}
export function validate(key,raw){
 const f=allFields.find(f=>f.key===key);if(!f)throw Error('Campo desconocido.');
 const value=raw.trim();if(!value||value.length>300)throw Error('Escribe un dato de 1 a 300 caracteres.');
 if(['ciudad','estado'].includes(key)&&isPurchaseIntent(value))throw Error('Esa frase indica que quieres comprar. Escribe solo el nombre de la ciudad o estado.');
 if(key==='enganche'&&/%|por\s+ciento/i.test(value)){
  const match=normalize(value).match(/^(?:el\s+)?(.+?)\s*(?:%|por ciento)(?:\s+de enganche)?$/);
  const percentage=match?parseMoney(match[1]):NaN;
  if(!Number.isFinite(percentage)||percentage<0||percentage>100)throw Error('Indica un porcentaje entre 0% y 100%, por ejemplo 10% o diez por ciento.');
  return String(percentage)+'%';
 }
 if(f.type==='money'){
  const n=parseMoney(value);
  if(!Number.isFinite(n))throw Error('No pude identificar un solo monto. Puedes escribir 3000000, 3 millones o tres millones.');
  if(!Number.isFinite(n)||n<0||n>1e11||(key!=='enganche'&&n===0))throw Error('Revisa el monto: debe ser positivo (el enganche puede ser cero).');
  return String(n);
 }
 if(f.type==='creditDate'){
  return parseCreditDate(value);
 }
 if(f.type==='objective'){
  if(!['mejorar condiciones','liquidez','ambos'].includes(normalize(value)))throw Error('Elige mejorar condiciones, liquidez o ambos.');
  return normalize(value);
 }
 if(f.type==='activity'&&!['asalariado','independiente','ambos'].includes(normalize(value)))throw Error('Elige asalariado, independiente o ambos.');
 if(f.type==='yesno'&&!['si','no','por confirmar'].includes(normalize(value)))throw Error('Responde sí, no o por confirmar.');
 return value;
}
export function edit(p,key,value){if(p.crmCapturedAt)throw Error('Hito 7 cerrado: la ficha permanece como evidencia.');const result=structuredClone(p);result.profile[key]=validate(key,value);result.skipped=result.skipped.filter(k=>k!==key);return result;}
export function receive(p,text,now=new Date().toISOString()){
 const r=structuredClone(p);const input=text.trim();if(!input)return r;
 r.messages.push({role:'user',text:input});
 if(stopped(r))return r;
 cancelFollowup(r,'El cliente respondió',now);
 const reply=t=>{r.messages.push({role:'assistant',text:t});return r;};
 const n=normalize(input);
 if(isPurchaseIntent(input)){
  if(r.product&&r.product!== 'Compra de vivienda')return reply('Este perfil es de cambio de hipoteca. Para compra, inicia otro prospecto y así conservamos separados los datos.');
  r.product='Compra de vivienda';if(!r.contact)r.status=nextField(r)?'Perfil en curso':'Perfil reunido';
  return reply('Con gusto te ayudamos con la compra. '+(nextField(r)?.question||'Ya tenemos tu perfil. Puedes elegir «Solicitar contacto».'));
 }
 if(isStopRequest(input)){r.followup={...(r.followup||{}),cancelled:true,cancelledAt:r.followup?.cancelledAt||now,pending:[],reason:'El cliente pidió detener los mensajes'};return reply('Entendido. Detuve los recordatorios de esta consulta.');}
 if(markInterest(r,input,now))return reply('Gracias por querer avanzar. Arturo revisará la información disponible y lo que hace falta para tu caso. Puedes elegir «Solicitar contacto» para indicarle cómo y cuándo prefieres hablar. En esta demo quedó un aviso interno simulado, no enviado.');
 if(n==='3'||/^(?:quiero |quisiera |necesito )?(?:hablar con arturo|que me contacten|una cita)|^contactame\b/.test(n)){
  const requested=requestContact(r,{immediate:/ahora|urgente|inmediata/.test(n),note:input},now);
  requested.messages.push({role:'assistant',text:'Registré tu solicitud de atención con el perfil disponible. Completa el medio y horario en “Solicitar contacto”. Está pendiente de confirmación; esta demo no envía avisos reales.'});return requested;
 }
 if(!r.product){
  if(n==='2'||/cambio de hipoteca|cambiar.*hipoteca/.test(n)){r.product=REFINANCE;r.status='Perfil en curso';return reply('Revisaremos tu hipoteca actual. La liquidez adicional está sujeta a evaluación y aprobación. '+nextField(r).question);}
  if(n==='1'||/compr|vivienda/.test(n)||input.includes(':')){r.product='Compra de vivienda';r.status='Perfil en curso';}
  else return reply('Elige 1 para compra, 2 para cambio de hipoteca o 3 para hablar con Arturo.');
  if(n==='1'||n==='comprar una vivienda'||n==='compra de vivienda')return reply(nextField(r).question);
 }
 if(['no se','omitir','no lo se'].includes(n)){
  const f=nextField(r);if(f)r.skipped.push(f.key);
  return reply(nextField(r)?.question||'Gracias por compartir la información disponible. ¿Cómo y cuándo prefieres que Arturo te contacte? Puedes indicarlo en «Solicitar contacto». Tu solicitud quedará pendiente de confirmación.');
 }
 // Recognize an explicit contribution answer plus a follow-up question.
 // Do not infer an answer from a hypothetical question or uncertain statement.
 const pending=nextField(r);
 if(pending?.key==='saldo'&&!input.includes(':')){
  const duration=n.match(/^(?:(?:me )?faltan |(?:me )?quedan )?(\d{1,3}|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte)\s+(anos?|mes(?:es)?)[.!]?$/);
  if(duration){
   const note='Plazo restante informado: '+input.trim();
   r.notes=r.notes.filter(note=>!note.startsWith('Plazo restante informado: '));
   r.notes.push(note);
   return reply('Gracias, guardé «'+input.trim()+'» como plazo restante en las notas de tu ficha. ¿Cuánto dinero debes todavía de la hipoteca, aproximadamente en pesos? Si no conoces ese saldo, puedes responder «no sé» y continuar.');
  }
 }
 if(pending?.key==='infonavit'&&!input.includes(':')){
  const answer=n.match(/^(si\s+cotizo|no\s+cotizo)(?:\s+en\s+infonavit)?\s*(?:[,.;!?¿]|$)/);
  const question=/como\s+(?:puede|pueden|puedes)\s+(?:apoyarme|ayudarme)|que\s+(?:apoyo|opciones|beneficios)/.test(n);
  if(answer&&!/\b(tendria|podria|cotizara|cotizase)\b/.test(n)){
   r.profile.infonavit=answer[1].startsWith('si')?'Sí':'No';
   if(!nextField(r)&&!r.contact)r.status='Perfil reunido';
   if(question)r.notes.push(input);
   return reply(`Gracias, anoté que ${r.profile.infonavit==='Sí'?'sí':'no'} cotizas en Infonavit. `+
    (question?'Arturo puede revisar contigo qué opciones corresponden a tu caso y qué información hace falta para continuar. Cotizar por sí solo no confirma elegibilidad ni aprobación. Dejé tu pregunta en la ficha para que la retome. ':'')+
    (nextField(r)?.question||'¿Cómo y cuándo prefieres que Arturo te contacte? Completa «Solicitar contacto»; quedará pendiente de confirmación.'));
  }
  if(question)return reply('Arturo puede revisar tu caso y orientarte sobre las opciones y la información necesaria. Para completar este dato, ¿actualmente cotizas en Infonavit? Puedes responder sí, no o por confirmar.');
 }
 let entries=[];
 if(input.includes(':')){
  for(const part of input.split(/[;\n]/).filter(s=>s.trim())){
   const colon=part.indexOf(':');const key=aliases[normalize(part.slice(0,colon))];
   if(colon<0||!key||!(fieldsFor(r).some(f=>f.key===key)||(key==='credito'&&r.product!==REFINANCE)))return reply('No pude identificar todos los campos de este producto. Usa las etiquetas de la ficha, separadas por punto y coma. No cambié la ficha.');
   entries.push([key,part.slice(colon+1)]);
  }
 }else{
  const f=nextField(r);
  if(!f)return reply('Puedes corregir la ficha a la derecha o escribir una etiqueta, por ejemplo: Enganche: 300000.');
  if(input.length>100||/[?!¿]/.test(input)||(f.type!=='money'&&/\by\b/.test(n)))return reply('Este recorrido es guiado. Para varios datos usa etiquetas separadas por punto y coma, o responde solo al dato pendiente: '+f.question);
  entries=[[f.key,input]];
 }
 try{
  const updates=Object.fromEntries(entries.map(([k,v])=>[k,validate(k,v)]));
  Object.assign(r.profile,updates);r.skipped=r.skipped.filter(k=>!(k in updates));
  if(!nextField(r)&&!r.contact)r.status='Perfil reunido';
  return reply('Ficha actualizada. '+(nextField(r)?.question||'Gracias, ya reunimos tu perfil inicial. ¿Cómo y cuándo prefieres que Arturo te contacte? Completa «Solicitar contacto»; quedará pendiente de confirmación.'));
 }catch(e){return reply(e.message+' No cambié los datos anteriores.');}
}
export function summary(p){return ['NYVARA · DEMO CON DATOS FICTICIOS',p.name,p.product||'Producto pendiente','Estado: '+p.status,'Responsable: '+(stopped(p)?'Arturo':'NYVARA'),...fieldsFor(p).map(f=>`${f.label}: ${p.profile[f.key]||'Pendiente'}`),...(p.product!==REFINANCE&&p.profile.credito?['Crédito informado por el cliente: '+p.profile.credito]:[]),'Interés: '+(p.interest?.level||'por confirmar'),...(p.interest?['Evidencia: '+p.interest.evidence]:[]),...(p.contact?['Solicitud: pendiente de confirmación','Medio: '+(p.contact.channel||'Pendiente'),'Contacto de prueba: '+(p.contact.detail||'Pendiente'),'Preferencia: '+(p.contact.immediate?'Lo antes posible':p.contact.when||'Pendiente'),'Zona: '+(p.contact.zone||'Pendiente')]:[]),...(p.crmCapturedAt?['Captura en CRM declarada por Arturo: '+p.crmCapturedAt+' (sin verificación externa)']:[]),'IA y WhatsApp sin conectar. Sin cita confirmada.',...(p.notes.length?['Notas: '+p.notes.join(' | ')]:[])].join('\n');}







