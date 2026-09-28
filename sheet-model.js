export const ROWS=100,COLS=26;
export const address=(r,c)=>String.fromCharCode(65+c)+(r+1);
export function position(ref){const m=/^\$?([A-Z])\$?([1-9]\d*)$/.exec(String(ref).toUpperCase());if(!m||+m[2]>ROWS)throw Error('Referencia fuera del área de diseño (A1:Z100).');return [+m[2]-1,m[1].charCodeAt(0)-65];}
export function range(ref){const parts=String(ref).toUpperCase().split(':');if(parts.length>2)throw Error('Escribe una celda o un rango, por ejemplo B2:D8.');const a=position(parts[0]),b=position(parts[1]||parts[0]),out=[];for(let r=Math.min(a[0],b[0]);r<=Math.max(a[0],b[0]);r++)for(let c=Math.min(a[1],b[1]);c<=Math.max(a[1],b[1]);c++)out.push(address(r,c));return out;}
export const newSheet=(name='Hoja 1')=>({id:crypto.randomUUID(),name,cells:{},freeze:false,grid:true,showFormulas:false,protected:false,page:{size:'A4',orientation:'portrait'},rules:[]});
export const newBook=()=>({version:1,id:crypto.randomUUID(),name:'Libro sin título',sheets:[newSheet()],active:0});
export function literal(value){const s=String(value??'');if(s.startsWith("'"))return s.slice(1);if(/^-?(?:0|[1-9]\d*)(?:[.,]\d+)?$/.test(s.trim()))return Number(s.trim().replace(',','.'));return s;}
export function value(sheet,ref,stack=new Set()){
 const raw=String(sheet.cells[ref]?.raw??'');if(!raw.startsWith('='))return literal(raw);
 if(stack.has(ref))return '#CIRCULAR!';if(stack.size>150)return '#LÍMITE!';const next=new Set(stack).add(ref);
 try{return calculate(raw.slice(1),id=>{position(id);const v=value(sheet,id,next);if(typeof v==='string'&&v.startsWith('#'))throw Error(v);return v;});}catch(e){return e.message.startsWith('#')?e.message:'#FÓRMULA!';}
}
function calculate(input,read){
 const tokens=input.toUpperCase().match(/\$?[A-Z]\$?[1-9]\d*|[A-ZÁÉÍÓÚÑ_]+|(?:\d+(?:[.,]\d+)?|\.\d+)|[+\-*/^()%:;]/g)||[];
 if(tokens.join('')!==input.toUpperCase().replace(/\s/g,''))throw Error('#FÓRMULA!');let i=0;
 const num=v=>{if(v==='')return 0;if(typeof v!=='number')throw Error('#¡VALOR!');return v;};
 const primary=()=>{let t=tokens[i++],v;if(t==='+'||t==='-')return (t==='-'?-1:1)*num(primary());
  if(t==='('){v=expression();if(tokens[i++]!==')')throw Error('#FÓRMULA!');}
  else if(/^\$?[A-Z]\$?[1-9]\d*$/.test(t||''))v=read(t.replaceAll('$',''));
  else if(/^\d|^\./.test(t||''))v=Number(t.replace(',','.'));
  else if(tokens[i]==='('){i++;const args=[];if(tokens[i]!==')')do{if(/^\$?[A-Z]\$?[1-9]\d*$/.test(tokens[i]||'')&&tokens[i+1]===':'){const start=tokens[i];i+=2;args.push(...range(start+':'+tokens[i++]).map(read));}else args.push(expression());if(tokens[i]!==';')break;i++;}while(true);if(tokens[i++]!==')')throw Error('#FÓRMULA!');const numbers=args.filter(x=>typeof x==='number');const sum=numbers.reduce((a,b)=>a+b,0);const functions={SUMA:()=>sum,SUM:()=>sum,PROMEDIO:()=>{if(!numbers.length)throw Error('#¡DIV/0!');return sum/numbers.length;},MIN:()=>numbers.length?Math.min(...numbers):0,MAX:()=>numbers.length?Math.max(...numbers):0,CONTAR:()=>numbers.length,CONTARA:()=>args.filter(x=>x!=='').length};if(!functions[t])throw Error('#¿NOMBRE?');v=functions[t]();}
  else throw Error('#FÓRMULA!');while(tokens[i]==='%'){i++;v=num(v)/100;}return v;};
 const power=()=>{let a=primary();if(tokens[i]==='^'){i++;a=num(a)**num(power());}return a;};
 const product=()=>{let a=power();while(['*','/'].includes(tokens[i])){const op=tokens[i++],b=num(power());if(op==='/'&&b===0)throw Error('#¡DIV/0!');a=op==='*'?num(a)*b:num(a)/b;}return a;};
 const expression=()=>{let a=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],b=num(product());a=op==='+'?num(a)+b:num(a)-b;}return a;};
 const result=expression();if(i!==tokens.length)throw Error('#FÓRMULA!');if(typeof result==='number'&&!Number.isFinite(result))throw Error('#¡NUM!');return result;
}
export function display(sheet,ref){const cell=sheet.cells[ref]||{},v=value(sheet,ref);if(sheet.showFormulas&&String(cell.raw).startsWith('='))return cell.raw;if(typeof v!=='number')return String(v);const f=cell.format||'general';if(f==='percent')return new Intl.NumberFormat('es-CO',{style:'percent',maximumFractionDigits:2}).format(v);if(f==='currency')return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:2,maximumFractionDigits:2}).format(v);if(f==='number')return new Intl.NumberFormat('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);return String(Math.round(v*1e10)/1e10).replace('.',',');}
export function writeCells(sheet,changes){if(sheet.protected)throw Error('Desactiva Proteger hoja para editar.');for(const [ref,raw] of Object.entries(changes)){position(ref);if(String(raw).length>4000)throw Error('El contenido de una celda supera 4.000 caracteres.');for(const rule of sheet.rules||[]){if(!range(rule.range).includes(ref))continue;if(rule.type==='number'&&raw!==''&&typeof literal(raw)!=='number'&&!String(raw).startsWith('='))throw Error(ref+': escribe un número.');}}
 const candidate={...sheet,cells:{...sheet.cells}};for(const [ref,raw] of Object.entries(changes))candidate.cells[ref]={...sheet.cells[ref],raw:String(raw)};
 for(const rule of sheet.rules||[])for(const ref of range(rule.range)){if(Object.hasOwn(changes,ref)&&changes[ref]!==''&&rule.type==='number'&&typeof value(candidate,ref)!=='number')throw Error(ref+': la fórmula debe devolver un número.');}
 sheet.cells=candidate.cells;
}
export function paste(sheet,start,text){const [r,c]=position(start),rows=text.replace(/\r/g,'').replace(/\n$/,'').split('\n').map(x=>x.split('\t'));if(r+rows.length>ROWS||rows.some(x=>c+x.length>COLS))throw Error('El pegado excede A1:Z100. No se pegó ninguna celda.');const changes={};rows.forEach((row,dr)=>row.forEach((v,dc)=>changes[address(r+dr,c+dc)]=v));writeCells(sheet,changes);return Object.keys(changes);}
