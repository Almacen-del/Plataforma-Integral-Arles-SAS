import {MAX_ROWS,MAX_COLS,columnName,columnIndex} from './sheet-grid-limits.js';

const loads=new Map();
function loadScript(path){if(!loads.has(path))loads.set(path,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=path;s.onload=resolve;s.onerror=()=>{loads.delete(path);s.remove();reject(Error('No se pudo cargar el lector XLSX. Intenta de nuevo.'));};document.head.append(s);}));return loads.get(path);}
export async function loadXlsxReader(){await Promise.all(['/public/vendor/xlsx/exceljs-4.4.0.js','/public/vendor/xlsx/ssf-0.11.2.js','/public/vendor/xlsx/jszip-3.10.1.js'].map(loadScript));}
export function checkXlsxArchive(buffer){
 const view=new DataView(buffer);if(view.byteLength<22||view.getUint32(0,true)!==0x04034b50)throw Error('El archivo no es un XLSX válido o está cifrado.');
 let end=-1;for(let i=view.byteLength-22;i>=Math.max(0,view.byteLength-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('El XLSX está incompleto.');const entries=view.getUint16(end+10,true),offset=view.getUint32(end+16,true);if(entries===65535||offset===0xffffffff)throw Error('Los archivos ZIP64 todavía no están admitidos.');
 if(entries>2000)throw Error('El XLSX contiene demasiados componentes.');let at=offset,total=0;
 for(let i=0;i<entries;i++){if(at+46>view.byteLength||view.getUint32(at,true)!==0x02014b50)throw Error('Estructura ZIP inválida.');if(view.getUint16(at+8,true)&1)throw Error('No se pueden abrir XLSX cifrados.');total+=view.getUint32(at+24,true);if(total>150*1024*1024)throw Error('El contenido descomprimido supera 150 MB.');at+=46+view.getUint16(at+28,true)+view.getUint16(at+30,true)+view.getUint16(at+32,true);}
}
const nodes=(root,name)=>Array.from(root.getElementsByTagNameNS('*',name));
const xml=text=>{const d=new DOMParser().parseFromString(text,'application/xml');if(d.getElementsByTagName('parsererror').length)throw Error('El libro contiene XML inválido.');return d;};
const dateSerial=(date,date1904)=>date.getTime()/86400000+(date1904?24107:25569);
const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
function color(c,theme,fallback='#000000'){let hex=c?.argb?.slice(-6)||c?.rgb?.slice(-6)||theme[c?.theme];if(!hex&&c?.indexed!=null)hex=['000000','FFFFFF','FF0000','00FF00','0000FF','FFFF00','FF00FF','00FFFF','000000','FFFFFF'][c.indexed];if(!hex)return fallback;let rgb=hex.match(/../g).map(v=>parseInt(v,16));if(c.tint)rgb=rgb.map(n=>Math.round(c.tint<0?n*(1+c.tint):n+(255-n)*c.tint));return '#'+rgb.map(n=>Math.max(0,Math.min(255,n)).toString(16).padStart(2,'0')).join('');}
export function importCellStyle(style={},theme=[]){
 const out={},f=style.font,a=style.alignment,p=style.protection;
 if(f){if(f.name)out.font=f.name;if(f.size)out.size=f.size;out.bold=!!f.bold;out.italic=!!f.italic;out.underline=f.underline||false;out.strike=!!f.strike;if(f.color)out.color=color(f.color,theme);}
 if(a){if(a.horizontal)out.align=({centerContinuous:'center',distributed:'justify',fill:'left'}[a.horizontal]||a.horizontal);if(a.vertical)out.valign=a.vertical==='center'?'middle':a.vertical;if(a.wrapText)out.wrap=true;if(a.shrinkToFit)out.shrink=true;if(a.indent)out.indent=a.indent;if(typeof a.textRotation==='number')out.rotation=a.textRotation;}
 if(style.fill?.type==='pattern'&&style.fill.pattern==='solid')out.fill=color(style.fill.fgColor,theme,'#ffffff');
 if(style.border){out.border={};for(const side of ['top','bottom','left','right']){const b=style.border[side];if(b?.style)out.border[side]={width:/thick/i.test(b.style)?3:/medium/i.test(b.style)?2:1,style:/double/i.test(b.style)?'double':/dot/i.test(b.style)?'dotted':/dash/i.test(b.style)?'dashed':'solid',color:color(b.color,theme)};}}
 if(p){out.locked=p.locked!==false;out.hiddenFormula=!!p.hidden;}
 if(style.numFmt&&style.numFmt!=='General'){out.xlsxNumFmt=style.numFmt;out.format='custom';out.customCode=style.numFmt;}
 return out;
}
function formulaValue(cell,date1904){let v=cell.value,raw='',result,syntax=false;
 if(v&&typeof v==='object'&&(v.formula||v.sharedFormula)){raw='='+cell.formula;result=cell.result;syntax=true;}
 else if(v instanceof Date)raw=String(dateSerial(v,date1904));
 else if(v&&typeof v==='object'&&v.richText)raw=v.richText.map(x=>x.text).join('');
 else if(v&&typeof v==='object'&&v.hyperlink)raw=String(v.text||v.hyperlink);
 else if(v&&typeof v==='object'&&v.error)raw=v.error;
 else raw=v==null?'':String(v);
 if(result instanceof Date)result=dateSerial(result,date1904);
 return {raw,...(typeof v==='string'||v?.richText||v?.hyperlink?{textValue:true}:{}),...(typeof v==='number'?{xlsxType:'number'}:{}),...(syntax?{formulaSyntax:'xlsx',xlsxCached:result??null}:{})};
}
function validation(rule,ref){const type=rule.type,formulae=rule.formulae||[],types={whole:'whole',decimal:'decimal',list:'list',date:'date',time:'time',textLength:'textLength',custom:'custom'},ops={between:'between',notBetween:'notbetween',equal:'eq',notEqual:'ne',greaterThan:'gt',lessThan:'lt',greaterThanOrEqual:'ge',lessThanOrEqual:'le'};
 if(!types[type])return null;let src=formulae[0];const entry={id:crypto.randomUUID(),range:ref,type:types[type],op:ops[rule.operator]||'between',ignoreBlank:rule.allowBlank!==false,inCell:true,showError:!!rule.showErrorMessage,errorTitle:rule.errorTitle||'',errorMessage:rule.error||'',inputTitle:rule.promptTitle||'',inputMessage:rule.prompt||''};
 if(type==='list'){if(typeof src==='string'&&src.startsWith('"'))entry.items=src.slice(1,-1).split(',');else{entry.source='='+String(src||'').replace(/^=/,'');entry.items=[];}}else if(type==='custom')entry.formula='='+String(src).replace(/^=/,'');else{entry.a=src instanceof Date?String(dateSerial(src,false)):String(src??'');entry.b=String(formulae[1]??'');}return entry;
}
export async function readXlsx(file,progress=()=>{}){
 if(!/\.xlsx$/i.test(file.name))throw Error('Selecciona un archivo .xlsx. Los formatos XLS y XLSM todavía no se importan.');if(file.size>25*1024*1024)throw Error('Usa un XLSX de hasta 25 MB.');
 progress('Cargando el lector XLSX…');await loadXlsxReader();const buffer=await file.arrayBuffer();checkXlsxArchive(buffer);const zip=await window.JSZip.loadAsync(buffer);
 if(!zip.file('xl/workbook.xml'))throw Error('El archivo no contiene un libro XLSX.');
 const original=await zip.file('xl/workbook.xml').async('string'),meta=xml(original),warnings=[];if(zip.file('xl/vbaProject.bin'))throw Error('Este archivo contiene macros. Abre una versión XLSX sin macros.');
 const unsupported=Object.keys(zip.files).filter(n=>/^xl\/(charts|pivotTables|slicers|externalLinks)\/[^/]+\.xml$/.test(n));if(unsupported.length)warnings.push('Contiene gráficos, tablas dinámicas, segmentaciones o vínculos externos que se conservarán en el original; su edición todavía no está disponible.');
 const theme=[];if(zip.file('xl/theme/theme1.xml')){const scheme=nodes(xml(await zip.file('xl/theme/theme1.xml').async('string')),'clrScheme')[0],colors=new Map(Array.from(scheme?.children||[]).map(n=>[n.localName,n.firstElementChild?.getAttribute('lastClr')||n.firstElementChild?.getAttribute('val')]));for(const name of ['lt1','dk1','lt2','dk2','accent1','accent2','accent3','accent4','accent5','accent6','hlink','folHlink'])theme.push(colors.get(name));}
 progress('Leyendo hojas, estilos y fórmulas…');const source=new window.ExcelJS.Workbook();await source.xlsx.load(buffer);if(!source.worksheets.length||source.worksheets.length>50)throw Error('Usa un libro con entre 1 y 50 hojas.');
 const book={version:1,id:crypto.randomUUID(),name:file.name.replace(/\.xlsx$/i,''),sheets:[],active:0,names:[],xlsxTables:[],xlsxImport:{fileName:file.name,warnings,date1904:!!source.properties.date1904,importedAt:new Date().toISOString(),summary:{cells:0,formulas:0,merges:0,validations:0,images:0}}};
 let stored=0;
 for(const ws of source.worksheets){
  if(ws.rowCount>MAX_ROWS||ws.columnCount>MAX_COLS)throw Error('La hoja «'+ws.name+'» supera 100.000 filas o 256 columnas. No se importó parcialmente.');
  const s={id:crypto.randomUUID(),name:ws.name,cells:{},rowCount:Math.max(100,ws.rowCount),columnCount:Math.max(26,ws.columnCount),merges:[...(ws.model.merges||[])],hidden:ws.state!=='visible',xlsxState:ws.state,grid:ws.views?.[0]?.showGridLines!==false,protected:!!ws.model.sheetProtection?.sheet,rules:[],columnWidths:{},rowHeights:{},hiddenRows:[],hiddenColumns:[],xlsxImages:[],page:{size:'A4',orientation:ws.pageSetup.orientation||'portrait',margins:Object.fromEntries(['top','right','bottom','left'].map(k=>[k,(ws.pageSetup.margins?.[k]??0.7)*25.4])),scale:ws.pageSetup.scale||100},xlsxPageSetup:structuredClone(ws.pageSetup)};
  s.defaultWidth=64;s.defaultHeight=(ws.properties.defaultRowHeight||15)*96/72;
  for(const column of ws.columns||[]){if(column.width)s.columnWidths[column.number-1]=column.width*7+5;if(column.hidden)s.hiddenColumns.push(column.number-1);}
  for(const row of ws.model.rows||[]){if(row.height)s.rowHeights[row.number-1]=row.height*96/72;if(row.hidden)s.hiddenRows.push(row.number-1);for(const cm of row.cells||[]){if(++stored>500000)throw Error('El XLSX supera 500.000 celdas guardadas. No se importó parcialmente.');const c=ws.getCell(cm.address);if(c.type===window.ExcelJS.ValueType.Merge)continue;const cell={...importCellStyle(c.style,theme),...formulaValue(c,book.xlsxImport.date1904)};if(cell.raw!==''||Object.keys(cell).length>1)s.cells[c.address]=cell;if(c.note)cell.note=typeof c.note==='string'?c.note:(c.note.texts||[]).map(n=>n.text).join('');if(cell.raw!=='')book.xlsxImport.summary.cells++;if(cell.formulaSyntax)book.xlsxImport.summary.formulas++;}}
  // Read grouped OOXML validations instead of duplicating a rule for every validated cell.
  const grouped=new Map();for(const [ref,rule] of Object.entries(ws.dataValidations.model||{})){const key=JSON.stringify(rule);if(!grouped.has(key))grouped.set(key,{rule,refs:[]});grouped.get(key).refs.push(ref);}
  for(const {rule,refs} of grouped.values()){for(let i=0;i<refs.length;i++){let j=i;const start=/^([A-Z]+)(\d+)$/.exec(refs[i]);if(start)while(j+1<refs.length&&refs[j+1]===start[1]+(+start[2]+j-i+1))j++;const v=validation(rule,refs[i]+(j>i?':'+refs[j]:''));if(v)s.rules.push(v);i=j;}}
  for(const t of Object.values(ws.tables||{})){const tm=t.table;book.xlsxTables.push({name:tm.name,sheetId:s.id,sheetName:s.name,ref:tm.ref||tm.tableRef,headers:tm.headerRow!==false,columns:tm.columns.map(c=>c.name)});}
  const af=ws.autoFilter;if(typeof af==='string')s.autoFilter=af.replaceAll('$','');else if(af?.from&&af?.to)s.autoFilter=af.from+':'+af.to;
  const v=ws.views?.[0];if(v){s.view={mode:'normal',zoom:v.zoomScale||100,freeze:{rows:v.ySplit||0,columns:v.xSplit||0},split:null};s.freeze=!!(v.ySplit||v.xSplit);}
  for(const image of ws.getImages()){const data=source.getImage(image.imageId);if(!['png','jpeg','jpg','gif'].includes(data.extension)){warnings.push('Una imagen utiliza un formato que el navegador no muestra. Se conserva en el original.');continue;}const bytes=new Uint8Array(data.buffer);s.xlsxImages.push({dataUrl:'data:image/'+(data.extension==='jpg'?'jpeg':data.extension)+';base64,'+base64(bytes),tl:{col:image.range.tl.col,row:image.range.tl.row},br:image.range.br?{col:image.range.br.col,row:image.range.br.row}:null,ext:image.range.ext?{...image.range.ext}:null});book.xlsxImport.summary.images++;}
  if(ws.model.conditionalFormattings?.length)warnings.push('«'+ws.name+'» contiene reglas de formato condicional que requieren verificación adicional. Se conservan en el archivo original.');
  s.xlsxConditional=structuredClone(ws.model.conditionalFormattings||[]);
  book.xlsxImport.summary.merges+=s.merges.length;book.xlsxImport.summary.validations+=s.rules.length;book.sheets.push(s);progress('Leída: '+ws.name);
 }
 for(const n of nodes(meta,'definedName')){const name=n.getAttribute('name');if(name.startsWith('_xlnm.'))continue;const scope=n.hasAttribute('localSheetId')?book.sheets[Number(n.getAttribute('localSheetId'))]?.id||'':'';book.names.push({id:crypto.randomUUID(),name,scope,refersTo:'='+n.textContent,formulaSyntax:'xlsx'});}
 if(book.sheets.every(s=>s.hidden))throw Error('El libro no contiene hojas visibles.');book.active=Math.max(0,book.sheets.findIndex(s=>!s.hidden));
 const calc=nodes(meta,'calcPr')[0];book.calculation={mode:calc?.getAttribute('calcMode')==='manual'?'manual':'auto'};
 for(const s of book.sheets){s.calculatedValues={};for(const [ref,c] of Object.entries(s.cells))if(c.formulaSyntax)s.calculatedValues[ref]={formula:c.raw,result:c.xlsxCached};}
 warnings.push('La importación conserva el original y las fórmulas. La equivalencia visual y funcional completa con Excel se verifica por separado.');
 return {book,original:file};
}

export function xlsxFormula(raw,book){
 let output='',quote='';for(let i=0;i<raw.length;i++){const c=raw[i];if(quote){output+=c;if(c===quote){if(raw[i+1]===quote)output+=raw[++i];else quote='';}}else if(c==='"'||c==="'"){quote=c;output+=c;}else output+=c===','?';':c;}
 return output.replace(/\b([A-Z_][A-Z0-9_.]*)\[([^\]]*)\]/gi,(all,name,part)=>{const table=(book.xlsxTables||[]).find(t=>t.name.toLowerCase()===name.toLowerCase());if(!table||!table.ref)return all;const pair=table.ref.replaceAll('$','').split(':'),a=/^([A-Z]+)(\d+)$/.exec(pair[0]),b=/^([A-Z]+)(\d+)$/.exec(pair[1]||pair[0]);if(!a||!b)return all;let c0=columnIndex(a[1]),c1=columnIndex(b[1]),r0=+a[2]+(table.headers&&part!=='#All'?1:0),r1=+b[2];if(part&&part!=='#All'&&part!=='#Data'){const c=table.columns.indexOf(part);if(c<0)return all;c0=c1=c0+c;}return "'"+table.sheetName.replaceAll("'","''")+"'!"+columnName(c0)+r0+':'+columnName(c1)+r1;});
}

const database=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('arles-sheet-xlsx',1);r.onupgradeneeded=()=>{r.result.createObjectStore('drafts');r.result.createObjectStore('originals');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export async function saveXlsxDraft(book,original){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction(['drafts','originals'],'readwrite');tx.objectStore('drafts').put(book,'active');tx.objectStore('drafts').put(book,book.id);if(original)tx.objectStore('originals').put(original,book.id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
export async function readXlsxDraft(){const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get('active');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function xlsxOriginal(id){const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('originals').objectStore('originals').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
