import {advance, initialState, isControl} from './whatsapp-ai.js';
import {normalize} from '../dist/core.js';
import {recordContact} from './contact-dates.js';

export const temporaryFailure = 'No pude completar esta respuesta. Espera unos segundos y vuelve a enviar tu mensaje. Puedes escribir FICHA para revisar lo guardado.';
export function twiml(text) {
  const safe = String(text).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  return [200,'text/xml; charset=utf-8',`<?xml version="1.0" encoding="UTF-8"?><Response>${safe?`<Message>${safe}</Message>`:''}</Response>`];
}

export async function processMessage(params, env, store, model) {
  const receivedAt=new Date().toISOString();
  const input = params.Body.trim();
  if (Number(params.NumMedia || 0)>0) return twiml('Esta prueba solo recibe texto. No envíes documentos ni datos reales; describe tu caso con información ficticia.');
  if (!input || input.length>1200) return twiml('Escribe un mensaje de texto de 1 a 1200 caracteres para esta prueba.');
  let turn;
  try {
    turn = await store.begin(params.From, params.MessageSid, !isControl(input));
    if (turn.kind==='cached') return twiml('');
    if (turn.kind==='busy') return twiml('Estoy atendiendo tu mensaje anterior. Espera su respuesta y vuelve a enviar este mensaje.');
    if (turn.kind==='limited') return twiml('Llegamos al límite diario de esta prueba. Puedes consultar FICHA, BORRAR los datos o pedir HABLAR CON ARTURO.');
    if (turn.kind!=='ready') throw Error('storage_invalid');
    const state = turn.value ? JSON.parse(turn.value) : initialState();
    if (state.version!==1 || !state.profile || !Array.isArray(state.history) || !Array.isArray(state.skipped)) throw Error('storage_invalid');
    const result = await advance(state,input,env,model);
    // Always disclose the test scope on the first substantive interaction as well.
    if (!state.history.length && !isControl(input)) result.reply = 'DEMO con datos ficticios. Contexto conservado 7 días; escribe BORRAR para eliminar la ficha activa.\n'+result.reply;
    if (normalize(input)!=='borrar') {
      recordContact(state,result.state,!turn.value || (!state.history.length && !state.product && !Object.keys(state.profile).length),receivedAt);
      result.state.history=[...state.history,{role:'user',text:input},{role:'assistant',text:result.reply}].slice(-12);
    }
    await store.commit(turn,result.state,result.reply);
    return twiml(result.reply);
  } catch (error) {
    // Do not log raw requests, credentials, phone numbers or model/provider bodies.
    const known = ['storage_configuration','storage_unavailable','storage_invalid','storage_commit','ai_configuration','ai_unavailable','ai_incomplete','ai_invalid'];
    console.warn('NYVARA_WHATSAPP_FAILURE', known.includes(error?.message)?error.message:'turn_failed');
    if (turn?.kind==='ready') {try {await store.release(turn);} catch { /* lease expires */ }}
    return twiml(temporaryFailure);
  }
}
