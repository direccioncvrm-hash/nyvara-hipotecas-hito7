import {fieldsFor,REFINANCE} from './questions.js';
import {requestContact,takeAttention,captureCRM,stopped} from './handoff.js';
import {createProspect,receive,edit,nextField,summary} from './core.js';
import {load,save,KEY} from './storage.js';
import {scheduleFollowup,advanceClock,orderedProspects} from './followup.js';
const $=s=>document.querySelector(s);let data,blocked=false,editing;
const fresh=()=>{const p=createProspect(crypto.randomUUID(),'Prospecto demo 01');return {version:1,clock:new Date().toISOString(),selected:p.id,prospects:[p]};};
const notice=t=>{$('#notice').textContent=t;};
try{data=load(localStorage)||fresh();}catch{data=fresh();blocked=true;notice('No pudimos leer los datos guardados. No los reemplazamos. Recarga para reintentar o restablece la demo si ya no los necesitas.');}
data.clock=data.clock||new Date().toISOString();
function transact(fn){if(blocked){notice('El guardado está bloqueado para proteger los datos anteriores. Recarga o restablece la demo.');return false;}const draft=structuredClone(data);try{fn(draft);}catch(e){notice(e.message);return false;}try{save(localStorage,draft);data=draft;notice('');render();return true;}catch{notice('No se pudo guardar. El cambio no se aplicó; conservamos la ficha anterior. Puedes reintentar.');return false;}}
const current=()=>data.prospects.find(p=>p.id===data.selected);
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function render(){const p=current();renderFollowup(p);const fields=fieldsFor(p);$('#count').textContent=data.prospects.length;$('#person').textContent=p.name;$('#state').textContent=p.status;$('#product').textContent=p.product||'Por elegir';$('#list').replaceChildren();const q=$('#search').value.toLowerCase();
 for(const item of orderedProspects(data.prospects).filter(p=>(p.name+' '+(p.profile.ciudad||'')).toLowerCase().includes(q))){const b=element('button','prospect'+(p.id===item.id?' active':''));b.setAttribute('aria-pressed',p.id===item.id);b.append(element('strong','',item.name),element('span','',item.product||'Consulta nueva'),element('span','',(item.profile.ciudad||'Ubicación pendiente')+' · '+item.status));b.onclick=()=>{if(transact(d=>d.selected=item.id))openConversation();};$('#list').append(b);}
 $('#messages').replaceChildren();for(const m of p.messages){const b=element('div','bubble '+m.role);b.append(element('div','author',m.role==='user'?'PROSPECTO · PRUEBA':'NYVARA · RECORRIDO GUIADO'),element('div','body',m.text));$('#messages').append(b);}$('#messages').scrollTop=$('#messages').scrollHeight;
 $('#fields').replaceChildren();for(const f of fields){const row=element('div','field');const content=element('div');let value=p.profile[f.key];if(value&&f.type==='money')value=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(value));content.append(element('small','',f.label),element('strong',value?'':'pending',value||'Pendiente'));const button=element('button','',value?'Editar':'Agregar');button.setAttribute('aria-label',(value?'Editar ':'Agregar ')+f.label);button.disabled=!!p.crmCapturedAt;button.onclick=()=>{editing=f.key;$('#edit-title').textContent=f.label;$('#edit-value').value=p.profile[f.key]||'';$('#edit-error').textContent='';$('#editor').showModal();$('#edit-value').focus();};row.append(content,button);$('#fields').append(row);}
 const n=fields.filter(f=>p.profile[f.key]).length;$('#completion').textContent=`${n} de ${fields.length} datos reunidos · puedes omitir datos`;$('#meter').style.width=n/fields.length*100+'%';$('#next').textContent=p.product?(nextField(p)?.label||'Revisar y copiar el perfil'):'Elegir un producto';
 $('#buy').disabled=!!p.product||stopped(p);$('#refinance').disabled=!!p.product||stopped(p);$('#skip').disabled=!p.product||!nextField(p)||stopped(p);$('#contact').disabled=stopped(p);
 $('#owner').textContent=stopped(p)?'Arturo Aguirre':'NYVARA · recorrido guiado';
 $('#profile-title').textContent=p.product===REFINANCE?'Ficha de cambio de hipoteca':'Ficha de compra';
 $('#handoff-banner').hidden=!stopped(p);$('#handoff-banner').textContent=p.crmCapturedAt?'Hito 7 cerrado. Captura en CRM declarada por Arturo; no verificada externamente. NYVARA no retomará la conversación.':'Arturo tiene la atención. NYVARA no responderá a nuevos mensajes ni generará recordatorios. Pendiente de captura manual en CRM.';
 $('#take').disabled=stopped(p);$('#crm').disabled=!p.takenAt||!!p.crmCapturedAt;
 $('#contact-summary').textContent=p.contact?`${p.contact.status} · ${p.contact.channel||'Medio pendiente'} · ${p.contact.immediate?'Lo antes posible':p.contact.when||'Horario pendiente'} · ${p.contact.zone||'Zona pendiente'} · ${p.contact.detail||'Contacto pendiente'}`:'Aún no hay solicitud. Puedes pedir atención con una ficha parcial.';
 $('#alerts').replaceChildren();for(const a of p.alerts||[])$('#alerts').append(element('div','alert-item',a.text));
 if(stopped(p))$('#next').textContent=p.crmCapturedAt?'Hito 7 cerrado':'Arturo: atender y capturar manualmente en CRM';
}
function openConversation(){document.querySelector(".workspace").dataset.view="conversation";document.querySelector("#message").focus();}
function send(text){const wasPending=!!nextField(current());if(transact(d=>{const i=d.prospects.findIndex(p=>p.id===d.selected);d.prospects[i]=receive(d.prospects[i],text,d.clock);})){$('#message').value='';const p=current();if(wasPending&&p.product&&!nextField(p)&&!p.contact&&!stopped(p))openContact();}}
$('#send').onsubmit=e=>{e.preventDefault();send($('#message').value);};$('#buy').onclick=()=>send('1');$('#refinance').onclick=()=>send('2');$('#skip').onclick=()=>send('No sé');
$('#new').onclick=()=>{if(transact(d=>{const p=createProspect(crypto.randomUUID(),'Prospecto demo '+String(d.prospects.length+1).padStart(2,'0'));d.prospects.push(p);d.selected=p.id;}))openConversation();};$('#search').oninput=render;
$('#edit-form').onsubmit=e=>{e.preventDefault();try{const result=edit(current(),editing,$('#edit-value').value);if(transact(d=>{d.prospects[d.prospects.findIndex(p=>p.id===d.selected)]=result;}))$('#editor').close();}catch(err){$('#edit-error').textContent=err.message;}};
$('#cancel').onclick=()=>$('#editor').close();$('#copy').onclick=async()=>{const text=summary(current());try{await navigator.clipboard.writeText(text);notice('Ficha copiada. Es un resumen de prueba, no una captura en CRM.');}catch{$('#copy-text').value=text;$('#copy-dialog').showModal();$('#copy-text').select();}};$('#close-copy').onclick=()=>$('#copy-dialog').close();
$('#reset').onclick=()=>{if(confirm('¿Eliminar únicamente las conversaciones de esta demo y comenzar de nuevo?')){try{const replacement=fresh();save(localStorage,replacement);data=replacement;blocked=false;notice('Demo restablecida.');render();}catch{notice('No se pudo restablecer. Los datos anteriores se conservan.');}}};
function updateCurrent(fn){return transact(d=>{const i=d.prospects.findIndex(p=>p.id===d.selected);d.prospects[i]=fn(d.prospects[i]);});}
$('#take').onclick=()=>updateCurrent(p=>takeAttention(p,data.clock));$('#crm').onclick=()=>updateCurrent(p=>captureCRM(p,data.clock));
function openContact(){const c=current().contact||{};$('#channel').value=c.channel||'WhatsApp';$('#contact-detail').value=c.detail||'';$('#when').value=c.when||'';$('#zone').value=c.zone||'';$('#immediate').checked=!!c.immediate;$('#contact-error').textContent='';$('#contact-dialog').showModal();}
$('#contact').onclick=openContact;
$('#cancel-contact').onclick=()=>$('#contact-dialog').close();
$('#contact-form').onsubmit=e=>{e.preventDefault();try{const request={channel:$('#channel').value,detail:$('#contact-detail').value,when:$('#when').value,zone:$('#zone').value,immediate:$('#immediate').checked};const result=requestContact(current(),request,data.clock);if(updateCurrent(()=>result)){$('#contact-dialog').close();notice('Solicitud registrada en la demo, pendiente de confirmación. Aviso simulado; no se envió por WhatsApp.');}}catch(err){$('#contact-error').textContent=err.message;}};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{$('.workspace').dataset.view=b.dataset.tab;};render();




function formatTime(at,zone='America/Mexico_City'){return new Intl.DateTimeFormat('es-MX',{timeZone:zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(at));}
function renderFollowup(p){
 const f=p.followup;const zone=f?.zone||'America/Mexico_City';
 $('#clock-label').textContent=formatTime(data.clock)+' · Ciudad de México';
 $('#interest-label').textContent=p.interest?'Interés alto':'Interés por confirmar';
 $('#interest-evidence').textContent=p.interest?'Evidencia: «'+p.interest.evidence+'»':'';
 $('#configure-followup').disabled=!!(stopped(p)||p.contact||f?.startedAt||f?.cancelled);
 $('#followup-state').textContent=f?.cancelled?'Cancelado · '+f.reason+(f.cancelledAt?' · '+formatTime(f.cancelledAt,zone):' · Hora no registrada en la versión anterior'):f?.startedAt?(f.pending.length?`Programado · ${f.events.length}/2 intentos simulados · ${f.zone}`:f.reason):p.contact||stopped(p)?'Atención solicitada o tomada: no se programan recordatorios.':'Sin programar. Requiere permiso y zona del cliente.';
 $('#followup-events').replaceChildren();
 for(const at of f?.pending||[])$('#followup-events').append(element('div','followup-event','Pendiente: '+formatTime(at,zone)+' · '+zone));
 for(const event of f?.events||[])$('#followup-events').append(element('div','followup-event',event.text+' · '+formatTime(event.at,zone)));
 $('#advance-next').disabled=!data.prospects.some(p=>p.followup?.pending?.length&&!p.followup.cancelled);
}
$('#configure-followup').onclick=()=>{$('#followup-consent').checked=false;$('#followup-zone').value='';$('#followup-error').textContent='';$('#followup-dialog').showModal();};
$('#close-followup').onclick=()=>$('#followup-dialog').close();
$('#followup-form').onsubmit=e=>{e.preventDefault();try{const p=scheduleFollowup(current(),{consent:$('#followup-consent').checked,zone:$('#followup-zone').value,from:$('#followup-from').value,to:$('#followup-to').value},data.clock);if(updateCurrent(()=>p))$('#followup-dialog').close();}catch(err){$('#followup-error').textContent=err.message;}};
function advance(hours){transact(d=>Object.assign(d,advanceClock(d,hours)));}
$('#advance2').onclick=()=>advance(2);$('#advance24').onclick=()=>advance(24);
$('#advance-next').onclick=()=>{const pending=data.prospects.flatMap(p=>p.followup?.cancelled?[]:p.followup?.pending||[]).map(Date.parse);if(pending.length)advance(Math.max(1/60,(Math.min(...pending)-Date.parse(data.clock))/3600000));};

