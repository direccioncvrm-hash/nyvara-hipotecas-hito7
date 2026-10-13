export const stopped=p=>Boolean(p.takenAt||p.crmCapturedAt);
function cancel(p,reason,at){p.followup={...(p.followup||{}),cancelled:true,reason,cancelledAt:p.followup?.cancelledAt||at,pending:[]};}
export function requestContact(p,request,now=new Date().toISOString()){
 if(stopped(p))throw Error('Arturo ya tiene la atención. NYVARA no la retoma.');
 const r=structuredClone(p);
 const channel=request.channel||'';
 if(channel&&!['WhatsApp','Llamada','Correo','Videollamada','En persona'].includes(channel))throw Error('Elige un medio válido.');
 const detail=(request.detail||'').trim();
 if(channel==='Correo'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detail))throw Error('Indica un correo de prueba válido, por ejemplo prospecto@example.com.');
 if(['WhatsApp','Llamada'].includes(channel)&&!/^\+?[\d ()-]{10,20}$/.test(detail))throw Error('Indica un número ficticio de 10 a 15 dígitos.');
 if(['WhatsApp','Llamada'].includes(channel)&&![10,11,12,13,14,15].includes(detail.replace(/\D/g,'').length))throw Error('Revisa el número de prueba.');
 if(request.zone){try{new Intl.DateTimeFormat('es',{timeZone:request.zone});}catch{throw Error('Zona horaria no válida.');}}
 r.contact={channel,detail,when:(request.when||'').trim(),zone:request.zone||'',immediate:!!request.immediate,status:'Pendiente de confirmación',requestedAt:r.contact?.requestedAt||now};
 if(request.note&&!r.notes.includes(request.note))r.notes.push(request.note);
 r.status='Contacto solicitado';cancel(r,'Solicitud de atención',now);
 r.alerts=r.alerts||[];if(!r.alerts.some(a=>a.kind==='contact'))r.alerts.push({kind:'contact',text:'Solicitud de contacto · aviso simulado, no enviado',at:now});
 return r;
}
export function takeAttention(p,now=new Date().toISOString()){
 if(stopped(p))return structuredClone(p);
 const r=structuredClone(p);r.takenAt=now;r.status='Arturo atiende · CRM pendiente';cancel(r,'Arturo tomó la atención',now);return r;
}
export function captureCRM(p,now=new Date().toISOString()){
 if(!p.takenAt)throw Error('Primero toma la atención del prospecto.');
 const r=structuredClone(p);r.crmCapturedAt=r.crmCapturedAt||now;r.status='Hito 7 cerrado · CRM declarado';cancel(r,'Captura manual declarada',now);return r;
}

