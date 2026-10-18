import {inbox,poller} from './inbox.js';
const $=id=>document.getElementById(id);
let expires, generation=0, active=false, loading=false, mutating=false, fichas=[], signature='';
const automatic=poller(()=>run(refresh),()=>active && !document.hidden && !mutating);
function clear(){ generation++;active=false;automatic.stop();fichas=[];signature='';$('pending-count').textContent='0'; $('cards').replaceChildren();$('private').hidden=true;$('login').hidden=false;clearTimeout(expires); }
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
    if(signature!==next){signature=next;render();}
    $('updated').textContent='Última actualización: '+new Date().toLocaleTimeString('es-MX');
    $('status').textContent='Panel actualizado. No se han enviado avisos externos.';
  } finally {loading=false;}
}
function render(){
  const view=inbox(fichas,$('pending-only').checked);
  $('pending-count').textContent=String(view.pending);
  $('cards').replaceChildren();
  if(!view.visible.length){const empty=document.createElement('p');empty.textContent=$('pending-only').checked?'No hay solicitudes pendientes.':'No hay fichas activas de los números autorizados.';$('cards').append(empty);}
  for(const ficha of view.visible){
    const card=document.createElement('article');card.className='panel wa-card'+(ficha.solicitaAtencion?' wa-pending':'');
    const title=document.createElement('h2');title.textContent=ficha.contacto;
    const state=document.createElement('p');state.textContent=ficha.atendiendo?'Arturo está atendiendo · IA pausada':ficha.pausada?'IA pausada': 'IA disponible';
    if(ficha.solicitaAtencion)state.textContent+=' · Solicitud de atención registrada (sin aviso enviado)';
    const summary=document.createElement('pre');summary.textContent=ficha.resumen;
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
    card.append(title,state,summary,actions);$('cards').append(card);
  }
}
async function run(action){try{await action();}catch(e){$('status').textContent=e.message;}}
$('login').addEventListener('submit',event=>{event.preventDefault();const password=$('password').value;$('password').value='';run(async()=>{await request('POST',{password});active=true;automatic.start();expires=setTimeout(()=>{clear();$('status').textContent='La sesión terminó. Vuelve a entrar.';},1800000);await refresh();});});
$('refresh').onclick=()=>run(refresh);
$('pending-only').onchange=render;
document.addEventListener('visibilitychange',()=>{if(active && !document.hidden)run(refresh);});
$('logout').onclick=()=>run(async()=>{clear();await request('DELETE');$('status').textContent='Sesión cerrada.';});
// Start locked on every visit; credentials and profile data are never persisted in browser storage.
clear();
