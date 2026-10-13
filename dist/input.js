const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export const isPurchaseIntent=s=>/^(?:hola[,! ]*\s*)?(?:(?:quiero|quisiera|deseo|me interesa)\s+)?comprar\s+(?:una\s+)?(?:vivienda|casa)[.!]*$/.test(clean(s));
const units=['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidos','veintitres','veinticuatro','veinticinco','veintiseis','veintisiete','veintiocho','veintinueve'];
const tens={treinta:30,cuarenta:40,cincuenta:50,sesenta:60,setenta:70,ochenta:80,noventa:90};
const hundreds={cien:100,ciento:100,doscientos:200,trescientos:300,cuatrocientos:400,quinientos:500,seiscientos:600,setecientos:700,ochocientos:800,novecientos:900};
function small(s){
 if(/^(\d+(?:,\d{3})*(?:\.\d+)?)$/.test(s))return Number(s.replaceAll(',',''));
 if(s==='un'||s==='una')return 1;
 if(units.includes(s))return units.indexOf(s);
 if(tens[s])return tens[s];
 const t=s.match(/^(\w+) y (\w+)$/);if(t&&tens[t[1]]&&units.indexOf(t[2])>0&&units.indexOf(t[2])<10)return tens[t[1]]+units.indexOf(t[2]);
 const h=s.split(' ');if(hundreds[h[0]]){if(h.length===1)return hundreds[h[0]];const remainder=small(h.slice(1).join(' '));if(remainder>0&&remainder<100&&h[0]!=='cien')return hundreds[h[0]]+remainder;}
 return NaN;
}
function thousands(s){const m=s.match(/^(?:(.+) )?mil(?: (.+))?$/);if(!m)return small(s);const a=m[1]?small(m[1]):1,b=m[2]?small(m[2]):0;return a>0&&a<1000&&b>=0&&b<1000?a*1000+b:NaN;}
export function parseMoney(raw){
 const s=clean(raw).replace(/^\$\s*/,'').replace(/\s*(?:de pesos|pesos|mxn)$/,'').trim();
 const m=s.match(/^(.+) (?:millon|millones)(?: (.+))?$/);
 if(!m)return thousands(s);
 const a=small(m[1]),b=m[2]==='y medio'?500000:m[2]?thousands(m[2]):0;
 return a>0&&a<100000&&b>=0&&b<1000000?a*1000000+b:NaN;
}
export function parseCreditDate(raw){
 const s=clean(raw);const approx=/\baproximad[oa]\b/.test(s);const v=s.replace(/\s*\(?aproximad[oa]\)?$/,'');
 const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
 let m=v.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/);
 if(!m){const words=v.match(/^(\w+) (?:de |del )?(\d{4})$/);if(words){const month=words[1]==='setiembre'?9:months.indexOf(words[1])+1;if(month)m=['',String(month),words[2]];}}
 if(!m||Number(m[2])<1900||Number(m[2])*12+Number(m[1])>new Date().getFullYear()*12+new Date().getMonth()+1)throw Error('Indica mes y año, por ejemplo marzo 2015 o 03/2015. No debe ser una fecha futura.');
 return m[1].padStart(2,'0')+'/'+m[2]+(approx?' aproximado':'');
}
