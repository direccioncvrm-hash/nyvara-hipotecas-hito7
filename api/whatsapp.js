import {createHmac,timingSafeEqual} from 'node:crypto';

// Connectivity-only checkpoint. No AI calls, storage, or outbound REST requests.
export function evaluateWebhook(method,headers,body,env){
  if(method==='GET')return [200,'text/plain; charset=utf-8','NYVARA Hito 7B: receptor de prueba. IA y memoria pendientes.'];
  if(method!=='POST')return [405,'text/plain','Method not allowed'];
  const {TWILIO_AUTH_TOKEN:token,TWILIO_WEBHOOK_URL:url,TWILIO_ACCOUNT_SID:account,NYVARA_TEST_SENDERS:senders}=env;
  if(!token||!url||!account||!senders)return [503,'text/plain','Receptor pendiente de configuración'];
  if(!String(headers['content-type']||'').startsWith('application/x-www-form-urlencoded'))return [415,'text/plain','Unsupported media type'];
  let params;
  if(typeof body==='string'||Buffer.isBuffer(body)){
    const form=new URLSearchParams(String(body));
    if(new Set(form.keys()).size!==[...form.keys()].length)return [400,'text/plain','Duplicate fields'];
    params=Object.fromEntries(form);
  }else params=body;
  if(!params||typeof params!=='object'||Object.values(params).some(v=>typeof v!=='string'))return [400,'text/plain','Invalid form'];
  // Standard Twilio form signature: canonical configured URL + all sorted fields.
  const payload=url+Object.keys(params).sort().map(k=>k+params[k]).join('');
  const expected=createHmac('sha1',token).update(payload).digest('base64');
  const provided=headers['x-twilio-signature'];
  if(typeof provided!=='string'||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return [403,'text/plain','Forbidden'];
  if(params.AccountSid!==account)return [403,'text/plain','Forbidden'];
  const allowed=senders.split(',').map(s=>s.trim()).filter(Boolean);
  if(!allowed.includes(params.From))return [200,'text/xml','<Response/>'];
  if(!/^SM[0-9a-f]{32}$/i.test(params.MessageSid||'')||typeof params.Body!=='string')return [400,'text/plain','Invalid message'];
  return [200,'text/xml; charset=utf-8','<?xml version="1.0" encoding="UTF-8"?><Response><Message>NYVARA Hipotecas: conexión de prueba recibida. WhatsApp ya llega al nuevo receptor. La IA y el guardado de fichas todavía no están activados. Usa solo datos ficticios.</Message></Response>'];
}

export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const [status,type,text]=evaluateWebhook(req.method,req.headers,req.body,process.env);
  if(status===405)res.setHeader('Allow','GET, POST');
  res.status(status).setHeader('Content-Type',type);
  res.end(text);
}

