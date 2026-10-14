export const greeting=`¡Hola! 👋 Soy NYVARA, el asistente inteligente de Arturo Aguirre, impulsado por inteligencia artificial. Te ayudo a explorar opciones para tu vivienda y a coordinar una asesoría personalizada con Arturo.

Nuestra asesoría y gestión son gratuitas y tenemos cobertura nacional.

¿Qué te gustaría hacer?
1. Comprar una vivienda.
2. Cambiar tu hipoteca, con posibilidad de liquidez adicional.
3. Hablar directamente con Arturo.

Puedes elegir una opción o contarme lo que necesitas.`;
export const fields=[
 ['ciudad','Ciudad','¿En qué ciudad te gustaría comprar?'],
 ['estado','Estado','¿En qué estado se encuentra esa ciudad?'],
 ['precio','Precio de vivienda','¿Cuál es el precio aproximado de la vivienda? Es distinto del préstamo que necesitas.','money'],
 ['enganche','Enganche','¿Cuánto tienes contemplado aportar de enganche? Si aún no lo sabes, podemos revisarlo contigo.','money'],
 ['actividad','Actividad laboral','¿Eres asalariado, independiente o ambos?','activity'],
 ['ingreso','Ingreso mensual','¿Cuál es tu ingreso mensual aproximado? Puedes compartir un rango.'],
 ['conyuge','Sumar ingresos','¿Te interesaría sumar ingresos con tu cónyuge?','yesno'],
 ['infonavit','Cotización Infonavit','¿Cotizas en Infonavit? Arturo puede revisar opciones de Apoyo Infonavit o Cofinavit; dependen de evaluación.','yesno']
].map(([key,label,question,type='text'])=>({key,label,question,type}));

export const refinanceFields=[
 ['institucion','Institución actual','¿Con qué institución tienes tu hipoteca? Puede ser un banco, Infonavit o Fovissste.'],
 ['fechaCredito','Fecha de contratación','¿En qué mes y año adquiriste tu crédito? Ejemplo: 03/2021; puede ser aproximado.','creditDate'],
 ['ciudad','Ciudad','¿En qué ciudad está el inmueble?'],
 ['estado','Estado','¿En qué estado se encuentra?'],
 ['valor','Valor actual del inmueble','¿Cuál es el valor actual estimado de tu vivienda?','money'],
 ['saldo','Saldo pendiente en pesos','¿Cuánto dinero debes todavía de tu hipoteca, aproximadamente en pesos? Si no conoces el saldo, puedes responder «no sé».','money'],
 ['mensualidad','Mensualidad actual','¿Cuánto pagas al mes actualmente?','money'],
 ['alCorriente','Pagos al corriente','¿Estás al corriente en tus pagos?','yesno'],
 ['objetivo','Objetivo del cambio','¿Buscas mejorar condiciones, liquidez o ambos?','objective'],
 ['liquidez','Liquidez deseada','¿Qué importe de liquidez adicional te gustaría solicitar? Está sujeto a evaluación y aprobación.','money'],
 ['actividad','Actividad laboral','¿Eres asalariado, independiente o ambos?','activity'],
 ['ingreso','Ingreso mensual','¿Cuál es tu ingreso mensual aproximado? Puedes compartir un rango.']
].map(([key,label,question,type='text'])=>({key,label,question,type}));
export const allFields=[{key:'credito',label:'Crédito informado por el cliente',type:'money'},...fields,...refinanceFields.filter(f=>!fields.some(a=>a.key===f.key))];
export const REFINANCE='Cambio de hipoteca más liquidez';
export function fieldsFor(p){return p.product===REFINANCE?refinanceFields.filter(f=>f.key!=='liquidez'||p.profile.objetivo!=='mejorar condiciones'):fields;}

