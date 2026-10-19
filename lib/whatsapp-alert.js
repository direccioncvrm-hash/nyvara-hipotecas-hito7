// One bounded attempt after the request has been durably committed.
// No automatic retry: a timeout may mean Twilio accepted the message.
export async function sendAlert(env, client, fetcher=fetch) {
  const to=env.NYVARA_ALERT_TO?.trim();
  const from=env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const account=env.TWILIO_ACCOUNT_SID;
  let panel;
  try {const url=new URL(env.TWILIO_WEBHOOK_URL);if(url.protocol!=='https:')throw Error();panel=url.origin+'/whatsapp.html';} catch{return {status:'configuration'};}
  if(!/^whatsapp:\+\d{8,15}$/.test(to || '') || !/^whatsapp:\+\d{8,15}$/.test(from) || to===client || to===from || !/^AC[0-9a-f]{32}$/i.test(account || '') || !env.TWILIO_AUTH_TOKEN)return {status:'configuration'};
  const body=new URLSearchParams({To:to,From:from,Body:`NYVARA · Prueba: hay una nueva solicitud de atención. Contacto terminado en ${client.slice(-4)}. Revisa la ficha en el panel protegido: ${panel} No se ha agendado una cita.`});
  try {
    const response=await fetcher(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`,{method:'POST',redirect:'error',headers:{Authorization:'Basic '+Buffer.from(account+':'+env.TWILIO_AUTH_TOKEN).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),signal:AbortSignal.timeout(2000)});
    let data;try{data=await response.json();}catch{return {status:'unknown'};}
    if(!response.ok)return {status:response.status>=500?'unknown':'rejected',code:Number.isInteger(data.code)?data.code:null};
    if(!/^SM[0-9a-f]{32}$/i.test(data.sid || ''))return {status:'unknown'};
    return {status:['failed','undelivered','canceled'].includes(data.status)?'rejected':'accepted',sid:data.sid};
  }catch{return {status:'unknown'};}
}
