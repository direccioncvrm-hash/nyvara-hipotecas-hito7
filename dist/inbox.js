export function inbox(fichas, pendingOnly=false) {
  const pending=fichas.filter(f=>f.solicitaAtencion).length;
  const visible=fichas.filter(f=>!pendingOnly || f.solicitaAtencion).sort((a,b)=>Number(b.solicitaAtencion)-Number(a.solicitaAtencion));
  return {pending,visible};
}
// Schedule after completion: never overlap automatic requests or run while hidden.
export function poller(work,visible,delay=30000,timers=globalThis){
  let timer,version=0;
  function stop(){version++;timers.clearTimeout(timer);}
  function start(){stop();const mine=version;const tick=async()=>{
    if(mine!==version)return;
    try{if(visible())await work();}finally{if(mine===version)timer=timers.setTimeout(tick,delay);}
  };timer=timers.setTimeout(tick,delay);}
  return {start,stop};
}
