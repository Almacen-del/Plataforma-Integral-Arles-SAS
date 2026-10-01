import {evaluateFormula,FormulaError,matrix,parseFormula,formulaReferences,formulaIdentifiers} from './sheet-formula-engine.js';
import {literal,formatNumber,validateCustomFormat,range,position,address} from './sheet-model.js';
import {dataRowVisible,outlineHidden} from './sheet-data-rules.js';
const books=new WeakMap(),byId=new Map(),runtimes=new WeakMap();
const encode=v=>v instanceof Error?{formulaError:v.message}:Array.isArray(v)?v.map(encode):v;
const decode=v=>v?.formulaError?new FormulaError(v.formulaError):Array.isArray(v)?v.map(decode):v;
const outward=v=>v instanceof Error?v.message:v;
export function bindWorkbook(book){for(const s of book.sheets){books.set(s,book);byId.set(s.id,book);}return book;}
export function invalidateCalculation(sheet){runtimes.delete(books.get(sheet)||byId.get(sheet.id)||sheet);}
const owner=s=>books.get(s)||byId.get(s.id)||{sheets:[s],active:0,names:s.names||[]};
export const workbookFor=sheet=>books.get(sheet)||byId.get(sheet.id);
function runtime(book,{force=false,override}={}){
 const all=book.sheets.map(s=>s.id===override?.id?override:s),memo=new Map(),spills=new Map(),visiting=new Set(),emptyReads=new Map(),namedLambdas=new Map();let operations=0,lambdaDepth=0;
 const key=(s,r)=>s.id+'!'+r,find=(s,name)=>name?all.find(v=>v.name.toLowerCase()===name.toLowerCase()):s;
 const pick=(s,name)=>{const t=find(s,name);if(!t)throw new FormulaError('#¡REF!');return t;};
 const raw=(s,r,name)=>{position(r);return String(pick(s,name).cells[r]?.raw||'');};
 const eligible=s=>Object.keys(s.cells).filter(r=>String(s.cells[r]?.raw).startsWith('='));
 const checkArray=(s,ref,result)=>{
  const a=matrix(result),[r,c]=position(ref),w=Math.max(...a.map(row=>row.length)),h=a.length;if(!w||!h||a.some(row=>row.length!==w))return new FormulaError('#CALC!');
  if(r+h>100||c+w>26)return new FormulaError('#¡DESBORDAMIENTO!');
  const refs=a.flatMap((row,i)=>row.map((_,j)=>address(r+i,c+j)));if(refs.some(id=>id!==ref&&(s.cells[id]?.raw||spills.has(key(s,id))&&spills.get(key(s,id)).anchor!==ref))||(s.merges||[]).some(m=>range(m).some(id=>refs.includes(id))))return new FormulaError('#¡DESBORDAMIENTO!');
  for(let i=0;i<h;i++)for(let j=0;j<w;j++)spills.set(key(s,address(r+i,c+j)),{anchor:ref,result:a[i][j]});return a;
 };
 const resolveName=(s,name,stack)=>{
  const names=book.names||[],entry=names.find(n=>n.scope===s.id&&n.name.toUpperCase()===name)||names.find(n=>!n.scope&&n.name.toUpperCase()===name);
  if(!entry)throw new FormulaError('#¿NOMBRE?');const marker='name:'+entry.id,cacheKey=s.id+':'+entry.id;if(namedLambdas.has(cacheKey))return namedLambdas.get(cacheKey);if(stack.has(marker))throw new FormulaError('#CIRCULAR!');
  const result=evaluateFormula(entry.refersTo,{...context(s,'A1',new Set(stack).add(marker)),allowLambda:true});if(typeof result==='function'&&result.formulaLambda)namedLambdas.set(cacheKey,result);return result;
 };
 const context=(s,ref,stack,trace)=>({currentRef:ref,sheetName:s.name,sheets:all.map(s=>s.name),trace,tick:()=>{if(++operations>100000)throw new FormulaError('#LÍMITE!');},enterLambda:()=>{if(lambdaDepth>=100)throw new FormulaError('#LÍMITE!');lambdaDepth++;},leaveLambda:()=>lambdaDepth--,
  read:(r,name)=>solve(pick(s,name),r,stack),raw:(r,name)=>{const t=pick(s,name);return t.protected&&t.cells[r]?.hiddenFormula?'':raw(s,r,name);},name:n=>resolveName(s,n,stack),
  isBlank:(r,name)=>{const t=pick(s,name);return !t.cells[r]?.raw&&!spills.has(key(t,r));},
  visible:(r,name,hidden)=>{const t=pick(s,name),row=position(r)[0];if(hidden&&(t.hiddenRows?.includes(row)||outlineHidden(t,row)))return false;return dataRowVisible(t,row,id=>outward(solve(t,id,stack)),address,range);},
  spill:(r,name)=>{const t=pick(s,name),v=solve(t,r,stack,true);return Array.isArray(v)?v:new FormulaError('#¡REF!');},
format:(v,code)=>{const token=code.toLowerCase(),dates={'dd/mm/yyyy':'short','dd/mm/aaaa':'short','dd/mm/yy':'short-year','dd/mm/aa':'short-year','dd-mm-yyyy':'dash','dd-mm-aaaa':'dash','yyyy-mm-dd':'iso','aaaa-mm-dd':'iso','d "de" mmmm "de" yyyy':'long','d "de" mmmm "de" aaaa':'long','dddd, d "de" mmmm "de" yyyy':'weekday','dddd, d "de" mmmm "de" aaaa':'weekday'},times={'h:mm':'hm','hh:mm':'hm','h:mm:ss':'hms','hh:mm:ss':'hms','h:mm:ss am/pm':'ampm','[h]:mm:ss':'elapsed'};if(dates[token])return formatNumber(v,{format:'date-short',dateType:dates[token]});if(times[token]){const result=formatNumber(v,{format:'time',timeType:times[token]});return /^h:|^\[h\]:/.test(token)?result.replace(/^0(?=\d:)/,''):result;}try{validateCustomFormat(code);}catch{throw new FormulaError('#NO.COMPATIBLE!');}return formatNumber(v,{format:'custom',customCode:code});}
 });
 const solve=(s,ref,stack=new Set(),array=false)=>{
  try{position(ref);}catch{return new FormulaError('#¡REF!');}const id=key(s,ref),cell=s.cells[ref],raw=String(cell?.raw||'');
  if(memo.has(id)){const v=memo.get(id);return array?v:Array.isArray(v)?v[0][0]:v;}
  if(cell?.textValue)return raw.startsWith("'")?raw.slice(1):raw;
  if(!raw.startsWith('=')){if(!raw&&spills.has(id))return spills.get(id).result;if(!raw&&stack.size){const readers=emptyReads.get(id)||new Set();for(const item of stack)if(!item.startsWith('name:'))readers.add(item);emptyReads.set(id,readers);}return literal(raw);}
  if(stack.has(id)||visiting.has(id))return new FormulaError('#CIRCULAR!');if(stack.size>150)return new FormulaError('#LÍMITE!');
  visiting.add(id);const next=new Set(stack).add(id),cached=s.calculatedValues?.[ref];let result;
  if(!force&&book.calculation?.mode==='manual'&&cached?.formula===raw)result=decode(cached.result);
  else result=evaluateFormula(raw,context(s,ref,next));
  if(Array.isArray(result))result=checkArray(s,ref,result);
  if(!force&&book.calculation?.mode==='manual'&&cached?.formula!==raw){s.calculatedValues||={};s.calculatedValues[ref]={formula:raw,result:encode(result)};}
  visiting.delete(id);memo.set(id,result);return array?result:Array.isArray(result)?result[0][0]:result;
 };
 const prepare=()=>{
  // Compute array anchors first so references to derived cells see their values.
  const formulas=all.flatMap(s=>eligible(s).map(r=>[s,r]));
  for(const [s,r] of formulas)if(/(?:SEQUENCE|SECUENCIA|FILTER|FILTRAR|UNIQUE|UNICOS|SORT|ORDENAR|STACK|APILAR|TRANSPOSE|TRANSPONER|TEXTSPLIT|DIVIDIRTEXTO|TAKE|TOMAR|DROP|EXCLUIR|TOCOL|TOROW|EXPAND|WRAP|RANDARRAY|MATRIZALEAT|CHOOSECOLS|CHOOSEROWS|[#{}])/i.test(s.cells[r].raw))solve(s,r);
  for(const [s,r] of formulas)solve(s,r);
  // A name or lambda may generate an array after an earlier formula read its blank destination.
  for(let pass=0;pass<formulas.length;pass++){const invalid=new Set();for(const [id,readers] of emptyReads)if(spills.has(id)){for(const reader of readers)invalid.add(reader);emptyReads.delete(id);}if(!invalid.size)break;for(const id of invalid)memo.delete(id);for(const [id,item] of spills)if(invalid.has(id.split('!')[0]+'!'+item.anchor))spills.delete(id);for(const [s,r] of formulas)if(invalid.has(key(s,r)))solve(s,r);}
  return api;
 };
 const api={solve,prepare,spills,memo,context,all};return api;
}
export function prepareCalculation(book){bindWorkbook(book);const r=runtime(book);runtimes.set(book,r);r.prepare();return r;}
export function calculatedValue(sheet,ref){
 const book=owner(sheet),mounted=book.sheets.some(s=>s===sheet),r=(mounted?runtimes.get(book):null)||runtime(book,{override:sheet});if(!runtimes.has(book)||!mounted)r.prepare();return outward(r.solve(sheet,ref));
}
export function spillOwner(sheet,ref){const book=owner(sheet),r=runtimes.get(book)||runtime(book,{override:sheet}).prepare();return r.spills.get(sheet.id+'!'+ref)?.anchor;}
export function recalculateWorkbook(book,onlySheet=null){
 bindWorkbook(book);const r=runtime(book,{force:true}).prepare();for(const s of book.sheets)if(!onlySheet||s.id===onlySheet){s.calculatedValues={};for(const [ref,cell] of Object.entries(s.cells))if(String(cell.raw).startsWith('='))s.calculatedValues[ref]={formula:cell.raw,result:encode(r.solve(s,ref,new Set(),true))};}return prepareCalculation(book);
}
export function evaluateCellSteps(book,sheet,ref){bindWorkbook(book);const r=runtime(book,{force:true}).prepare(),trace=[];const result=evaluateFormula(sheet.cells[ref]?.raw||'',r.context(sheet,ref,new Set([sheet.id+'!'+ref]),trace));return {trace,result:outward(result)};}
export function previewFormula(book,sheet,ref,formula){const s={...sheet,cells:{...sheet.cells,[ref]:{...sheet.cells[ref],raw:formula,textValue:false}}};const r=runtime(book,{force:true,override:s}).prepare();return outward(r.solve(s,ref,new Set(),true));}
export function dataRuleValue(sheet,ref,formula){const r=runtime(owner(sheet),{force:true,override:sheet});return evaluateFormula(formula,r.context(sheet,ref,new Set()));}
export function defineName(book,{id,name,scope='',refersTo,comment=''}){
 name=String(name).trim();if(!/^[A-ZÁÉÍÓÚÑ_][A-ZÁÉÍÓÚÑ_0-9.]*$/i.test(name)||/^[A-Z]+\d+$/i.test(name)||/^(R|C|TRUE|FALSE|VERDADERO|FALSO)$/i.test(name))throw Error('Usa un nombre sin espacios y que no sea una referencia de celda.');
 if(scope&&!book.sheets.some(s=>s.id===scope))throw Error('Ámbito de nombre inválido.');if((book.names||[]).some(n=>n.id!==id&&n.scope===scope&&n.name.toUpperCase()===name.toUpperCase()))throw Error('Ya existe ese nombre en el ámbito elegido.');
 refersTo=String(refersTo).trim();if(!refersTo.startsWith('='))refersTo='='+refersTo;parseFormula(refersTo);const entry={id:id||crypto.randomUUID(),name,scope,refersTo,comment:String(comment).slice(0,500)};book.names||=[];const i=book.names.findIndex(n=>n.id===id);if(i<0)book.names.push(entry);else book.names[i]=entry;bindWorkbook(book);runtimes.delete(book);return entry;
}
export function dependencies(book,sheet,ref,reverse=false){
 const targets=[],seen=new Set();const visit=(s,formula)=>{for(const item of formulaReferences(formula)){const t=item.sheet?book.sheets.find(s=>s.name.toLowerCase()===item.sheet.toLowerCase()):s;if(!t)continue;for(const r of range(item.ref)){const id=t.id+'!'+r;if(!seen.has(id)){seen.add(id);targets.push({sheetId:t.id,sheetName:t.name,ref:r});}}}
  const names=formulaIdentifiers(formula).map(name=>(book.names||[]).find(n=>n.scope===s.id&&n.name.toUpperCase()===name)||(book.names||[]).find(n=>!n.scope&&n.name.toUpperCase()===name)).filter(Boolean);for(const n of names){const marker='name:'+n.id;if(!seen.has(marker)){seen.add(marker);visit(n.scope?book.sheets.find(s=>s.id===n.scope)||s:s,n.refersTo);}}
 };
 if(!reverse){visit(sheet,sheet.cells[ref]?.raw||'');return targets;}
 for(const s of book.sheets)for(const [r,c] of Object.entries(s.cells))if(String(c.raw).startsWith('=')){const refs=dependencies(book,s,r);if(refs.some(t=>t.sheetId===sheet.id&&t.ref===ref))targets.push({sheetId:s.id,sheetName:s.name,ref:r});}return targets;
}
