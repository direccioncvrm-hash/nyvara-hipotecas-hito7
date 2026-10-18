import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {profileSummary} from '../lib/whatsapp-ai.js';

const cookieName = '__Host-nyvara';
const digest = value => createHash('sha256').update(value).digest('hex');
const cookie = (value, age) => `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
export async function dashboard(req, env, command) {
  const headers = {'Cache-Control':'no-store', 'Content-Type':'application/json; charset=utf-8', 'X-Content-Type-Options':'nosniff'};
  const result = (status, body, extra={}) => ({status, body, headers:{...headers,...extra}});
  const secret = env.NYVARA_ADMIN_PASSWORD;
  if (!secret || secret.length < 32) return result(503,{error:'Acceso pendiente de configuración.'});
  const method = req.method;
  if (!['GET','POST','DELETE'].includes(method)) return result(405,{error:'Método no permitido.'});
  if (method !== 'GET') {
    let origin;
    try { origin = new URL(env.TWILIO_WEBHOOK_URL).origin; } catch { return result(503,{error:'Configuración pendiente.'}); }
    if (req.headers.origin !== origin) return result(403,{error:'Origen no permitido.'});
  }
  const raw = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1) || '';
  const sessionKey = `nyvara:admin:session:${digest(secret)}:${digest(raw)}`;
  if (method === 'DELETE') {
    if (/^[a-f0-9]{64}$/.test(raw)) await command(['DEL',sessionKey]);
    return result(200,{ok:true},{'Set-Cookie':cookie('',0)});
  }
  if (method === 'POST') {
    // One bounded global login bucket; no reliance on spoofable IP headers.
    const attempts = await command(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n",1,'nyvara:admin:login']);
    if (attempts > 10) return result(429,{error:'Espera un minuto antes de intentar de nuevo.'});
    let body = req.body;
    if (typeof body === 'string') { try { body=JSON.parse(body); } catch { body=null; } }
    const password = body?.password;
    if (typeof password !== 'string' || password.length > 512 || !timingSafeEqual(Buffer.from(digest(password)),Buffer.from(digest(secret)))) return result(401,{error:'Contraseña incorrecta.'});
    const token = randomBytes(32).toString('hex');
    await command(['SET',`nyvara:admin:session:${digest(secret)}:${digest(token)}`,'1','EX',1800]);
    return result(200,{ok:true},{'Set-Cookie':cookie(token,1800)});
  }
  if (!/^[a-f0-9]{64}$/.test(raw) || await command(['GET',sessionKey]) !== '1') return result(401,{error:'Inicia sesión para consultar las fichas.'});
  const senders = [...new Set((env.NYVARA_TEST_SENDERS || '').split(/[\s,;]+/).filter(x=>/^whatsapp:\+\d{8,15}$/.test(x)))];
  if (!senders.length) return result(200,{fichas:[]});
  const values = await command(['MGET',...senders.map(x=>`nyvara:hipotecas:7b:${digest(x)}:state`)]);
  if (!Array.isArray(values)) throw Error('storage_invalid');
  const fichas = values.flatMap((value,index)=>{
    if (!value) return [];
    const state = JSON.parse(value);
    if (!state.product && !Object.keys(state.profile || {}).length) return [];
    return [{contacto:`Prueba ${index+1} · termina en ${senders[index].slice(-4)}`, resumen:profileSummary(state), pausada:!!state.paused, solicitaAtencion:!!state.handoffRequested}];
  });
  return result(200,{fichas});
}

export default async function handler(req,res) {
  let response;
  try {
    const env=process.env;
    const command=async args=>{
      const url=env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
      const token=env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
      if (!url?.startsWith('https://') || !token) throw Error('storage_configuration');
      const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(2000)});
      if (!r.ok) throw Error('storage_unavailable');
      const data=await r.json();
      if(data.error) throw Error('storage_unavailable');
      return data.result;
    };
    response=await dashboard(req,env,command);
  } catch { response={status:503,headers:{'Cache-Control':'no-store','Content-Type':'application/json'},body:{error:'No pudimos consultar las fichas. Intenta de nuevo.'}}; }
  for(const [key,value] of Object.entries(response.headers)) res.setHeader(key,value);
  res.statusCode=response.status;
  res.end(JSON.stringify(response.body));
}
