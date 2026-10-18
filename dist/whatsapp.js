import {totals,ageGroup,ageLabels,displayDate,nextAction} from './dashboard-view.js';
import {inbox,poller} from './inbox.js';
const $=id=>document.getElementById(id);
let expires, generation=0, active=false, loading=false, mutating=false, fichas=[], signature='';
const automatic=poller(()=>run(refresh),()=>active && !document.hidden && !mutating);
function clear(){ generation++;active=false;automatic.stop();fichas=[];signature='';$('metrics').replaceChildren();$('pending-count').textContent='0'; $('cards').replaceChildren();$('private').hidden=true;$('login').hidden=false;clearTimeout(expires); }
async function request(method='GET',body){
  const r=await fetch('/api/fichas',{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000),headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  const data=await r.json();
  if(!r.ok){if(r.status===401)clear();throw Error(data.error || 'No se pudo completar la solicitud.');}return data;
}
async function refresh(){
  if(loading || mutating)return;
  const mine=generation;loading=true;
  try {
    const data=await request();if(mine!==generation)return;
    fichas=data.fichas;$('login').hidden=true;$('private').hidden=false;
    const next=JSON.stringify(fichas);
    if(signature!==next){signature=next;render();}else{updateTimes();}
    $('updated').textContent='Última actualización: '+new Date().toLocaleTimeString('es-MX');
    $('status').textContent='Panel actualizado. No se han enviado avisos externos.';
  } finally {loading=false;}
}
function render(){
  const view=inbox(fichas,$('pending-only').checked);
  $('pending-count').textContent=String(view.pending);
  $('metrics').replaceChildren();
  const labels=['Clientes recibidos','Solo inicio','Ficha en proceso','Ficha completa','Solicitan atención','Arturo atendiendo'];
  totals(fichas).forEach((value,i)=>{const tile=document.createElement('div');tile.className='metric';const number=document.createElement('strong');number.textContent=value;const label=document.createElement('span');label.textContent=labels[i];tile.append(number,label);$('metrics').append(tile);});
  const visible=view.visible.filter(f=>(!$('stage-filter').value || f.stage===$('stage-filter').value) && (!$('time-filter').value || ageGroup(f.lastCustomerMessageAt)===$('time-filter').value));
  $('cards').replaceChildren();
  if(!visible.length){const empty=document.createElement('p');empty.textContent='No hay fichas que coincidan con los filtros.';$('cards').append(empty);}
  for(const ficha of visible){
    const card=document.createElement('article');card.className='panel wa-card'+(ficha.solicitaAtencion?' wa-pending':'');
    const title=document.createElement('h2');title.textContent=ficha.contacto;
    const state=document.createElement('p');state.textContent=ficha.atendiendo?'Arturo está atendiendo · IA pausada':ficha.pausada?'IA pausada': 'IA disponible';
    if(ficha.solicitaAtencion)state.textContent+=' · Solicitud de atención registrada (sin aviso enviado)';
    const meta=document.createElement('p');meta.className='wa-meta';meta.textContent='Primer contacto: '+displayDate(ficha.firstContactAt)+' · Último mensaje: '+displayDate(ficha.lastCustomerMessageAt)+' (hora de Ciudad de México)';
    const age=document.createElement('p');age.dataset.last=ficha.lastCustomerMessageAt||'';age.textContent=ageLabels[ageGroup(ficha.lastCustomerMessageAt)];
    const progress=document.createElement('p');progress.textContent=({inicio:'Solo inicio',proceso:'Ficha en proceso',completa:'Ficha completa'})[ficha.stage]+' · '+ficha.filled+'/'+ficha.total+' datos · Siguiente acción: '+nextAction(ficha);
    const details=document.createElement('details');const caption=document.createElement('summary');caption.textContent='Ver ficha';const summary=document.createElement('pre');summary.textContent=ficha.resumen;details.append(caption,summary);
    const actions=document.createElement('div');actions.className='quick';
    for(const [action,label,disabled] of [['take','Tomar atención',ficha.atendiendo],['return','Devolver a NYVARA',!ficha.pausada],['resolve','Marcar solicitud atendida',!ficha.solicitaAtencion]]){
      const button=document.createElement('button');button.textContent=label;button.disabled=disabled;
      button.onclick=()=>run(async()=>{
        if(!window.confirm(`${label}: se cambiará el estado de esta ficha. No se enviará un mensaje al cliente. ¿Continuar?`))return;
        mutating=true;const mine=++generation;for(const b of actions.children)b.disabled=true;
        try{await request('PATCH',{id:ficha.id,revision:ficha.revision,action});mutating=false;if(mine===generation)await refresh();}
        catch(error){for(const b of actions.children)b.disabled=false;throw error;}finally{mutating=false;}
      });actions.append(button);
    }
    card.append(title,state,progress,meta,age,details,actions);$('cards').append(card);
  }
}
function updateTimes(){if($('time-filter').value){render();return;}for(const node of document.querySelectorAll('[data-last]'))node.textContent=ageLabels[ageGroup(node.dataset.last)];}
async function run(action){try{await action();}catch(e){$('status').textContent=e.message;}}
$('login').addEventListener('submit',event=>{event.preventDefault();const password=$('password').value;$('password').value='';run(async()=>{await request('POST',{password});active=true;automatic.start();expires=setTimeout(()=>{clear();$('status').textContent='La sesión terminó. Vuelve a entrar.';},1800000);await refresh();});});
$('refresh').onclick=()=>run(refresh);
$('pending-only').onchange=render;
$('stage-filter').onchange=render;$('time-filter').onchange=render;
document.addEventListener('visibilitychange',()=>{if(active && !document.hidden)run(refresh);});
$('logout').onclick=()=>run(async()=>{clear();await request('DELETE');$('status').textContent='Sesión cerrada.';});
// Start locked on every visit; credentials and profile data are never persisted in browser storage.
clear();
