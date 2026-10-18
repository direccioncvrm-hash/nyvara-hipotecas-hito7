const $=id=>document.getElementById(id);
let expires;
function clear(){ $('cards').replaceChildren();$('private').hidden=true;$('login').hidden=false;clearTimeout(expires); }
async function request(method='GET',body){
  const r=await fetch('/api/fichas',{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  const data=await r.json();
  if(!r.ok){if(r.status===401)clear();throw Error(data.error || 'No se pudo completar la solicitud.');}return data;
}
async function refresh(){
  $('cards').replaceChildren();
  const data=await request();$('login').hidden=true;$('private').hidden=false;
  for(const ficha of data.fichas){
    const card=document.createElement('article');card.className='panel wa-card';
    const title=document.createElement('h2');title.textContent=ficha.contacto;
    const state=document.createElement('p');state.textContent=ficha.atendiendo?'Arturo está atendiendo · IA pausada':ficha.pausada?'IA pausada': 'IA disponible';
    if(ficha.solicitaAtencion)state.textContent+=' · Solicitud de atención registrada (sin aviso enviado)';
    const summary=document.createElement('pre');summary.textContent=ficha.resumen;
    const actions=document.createElement('div');actions.className='quick';
    for(const [action,label,disabled] of [['take','Tomar atención',ficha.atendiendo],['return','Devolver a NYVARA',!ficha.pausada],['resolve','Marcar solicitud atendida',!ficha.solicitaAtencion]]){
      const button=document.createElement('button');button.textContent=label;button.disabled=disabled;
      button.onclick=()=>run(async()=>{
        if(!window.confirm(`${label}: se cambiará el estado de esta ficha. No se enviará un mensaje al cliente. ¿Continuar?`))return;
        for(const b of actions.children)b.disabled=true;
        try{await request('PATCH',{id:ficha.id,revision:ficha.revision,action});await refresh();}
        catch(error){for(const b of actions.children)b.disabled=false;throw error;}
      });actions.append(button);
    }
    card.append(title,state,summary,actions);$('cards').append(card);
  }
  $('status').textContent=data.fichas.length?`${data.fichas.length} ficha(s) consultada(s).`:'No hay fichas activas de los números de prueba autorizados.';
}
async function run(action){try{await action();}catch(e){$('status').textContent=e.message;}}
$('login').addEventListener('submit',event=>{event.preventDefault();const password=$('password').value;$('password').value='';run(async()=>{await request('POST',{password});expires=setTimeout(()=>{clear();$('status').textContent='La sesión terminó. Vuelve a entrar.';},1800000);await refresh();});});
$('refresh').onclick=()=>run(refresh);
$('logout').onclick=()=>run(async()=>{clear();await request('DELETE');$('status').textContent='Sesión cerrada.';});
// Start locked on every visit; credentials and profile data are never persisted in browser storage.
clear();
