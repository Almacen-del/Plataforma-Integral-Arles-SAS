// Shared by the server and the plugin. AI output is data, never executable code.
export const AI_PLUGIN_GUID='asc.{A84E4B20-45E2-4EA5-971A-7609E99ED842}';
export const AI_LIMITS={question:2000,text:12000,cells:200,slides:5};
export function normalizeHistory(value){
 if(value===undefined)return [];
 if(!Array.isArray(value))throw Object.assign(Error('Historial inválido.'),{status:400});
 const result=[];let remaining=12000;
 for(const item of value.slice(-12).reverse()){
  if(!item||!['user','assistant'].includes(item.role)||typeof item.content!=='string')throw Object.assign(Error('Historial inválido.'),{status:400});
  const content=item.content.slice(0,Math.min(4000,remaining));if(!content)break;
  result.unshift({role:item.role,content});remaining-=content.length;
 }
 return result;
}
const invalid=message=>{throw Object.assign(new Error(message),{status:400});};
const string=(value,max)=>typeof value==='string'?value.slice(0,max):'';
export function cellPosition(address){
 const match=/^([A-Z]{1,3})([1-9][0-9]{0,6})$/.exec(String(address));if(!match)return null;
 let col=0;for(const char of match[1])col=col*26+char.charCodeAt(0)-64;
 const row=Number(match[2]);return col<=16384&&row<=1048576?{col,row}:null;
}
export function cellInRange(address,range){
 const parts=String(range).replaceAll('$','').split(':');if(parts.length>2)return false;
 const a=cellPosition(parts[0]),b=cellPosition(parts[1]||parts[0]),p=cellPosition(address);
 return !!(a&&b&&p&&p.col>=a.col&&p.col<=b.col&&p.row>=a.row&&p.row<=b.row);
}
export function normalizeContext(type,input){
 if(!input||input.type!==type)invalid('No se pudo leer el contexto del editor.');
 if(type==='word'||type==='pdf')return {type,text:string(input.text,AI_LIMITS.text),selectedText:string(input.selectedText,8000),truncated:!!input.truncated};
 if(type==='cell'){
  const range=string(input.range,40).replaceAll('$','');
  if(!cellInRange(range.split(':')[0],range)||!Array.isArray(input.cells)||input.cells.length>AI_LIMITS.cells)invalid('Selecciona un rango de hasta 200 celdas.');
  return {type,sheet:string(input.sheet,150),range,cells:input.cells.map(c=>{
   if(!cellInRange(c.address,range))invalid('La selección contiene una dirección inválida.');
   return {address:c.address,value:typeof c.value==='number'||typeof c.value==='boolean'?c.value:string(c.value,1000),formula:string(c.formula,1000)};
  })};
 }
 if(type==='slide')return {type,slide:Number.isInteger(input.slide)?input.slide:0,text:string(input.text,AI_LIMITS.text),truncated:!!input.truncated};
 invalid('Este asistente admite Word, Excel y PowerPoint.');
}
export function validateProposal(type,value,context){
 if(value===null||value===undefined)return null;
 if(type==='word'){
  if(typeof value.text!=='string'||!value.text.trim()||value.text.length>8000)invalid('La propuesta de texto está vacía o es demasiado larga.');
  return {text:value.text};
 }
 if(type==='cell'){
  if(!Array.isArray(value.cells)||!value.cells.length||value.cells.length>AI_LIMITS.cells)invalid('La propuesta de celdas no es válida.');
  const seen=new Set();return {cells:value.cells.map(c=>{
   if(!c||!cellInRange(c.address,context.range)||seen.has(c.address))invalid('La IA propuso celdas fuera de la selección o duplicadas.');seen.add(c.address);
   if(typeof c.formula==='string'&&c.formula){
    if(c.formula.length>1000||!c.formula.startsWith('=')||/[\[\]\x00-\x1f]|https?:|WEBSERVICE\s*\(|HYPERLINK\s*\(|RTD\s*\(|DDE\s*\(/i.test(c.formula))invalid('La fórmula contiene una referencia externa o no es compatible.');
    return {address:c.address,formula:c.formula};
   }
   if(!['string','number','boolean'].includes(typeof c.value)||typeof c.value==='number'&&!Number.isFinite(c.value)||String(c.value).length>1000)invalid('El valor de una celda no es válido.');
   return {address:c.address,value:c.value};
  })};
 }
 if(type==='slide'){
  if(!Array.isArray(value.slides)||!value.slides.length||value.slides.length>AI_LIMITS.slides)invalid('La propuesta debe contener entre una y cinco diapositivas.');
  return {slides:value.slides.map(s=>{
   if(typeof s.title!=='string'||!s.title.trim()||s.title.length>160||!Array.isArray(s.bullets)||s.bullets.length>6||s.bullets.some(b=>typeof b!=='string'||!b.trim()||b.length>350))invalid('El contenido de la diapositiva no es válido.');
   return {title:s.title,bullets:s.bullets};
  })};
 }
 invalid('Propuesta no compatible.');
}
