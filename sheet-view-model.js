import {ROWS,COLS,range,position,address,rowPassesFilters} from './sheet-model.js';
import {outlineHidden} from './sheet-data-rules.js';
import {pageSettings,printPlan,usedArea} from './sheet-layout-model.js';
export const viewModes={normal:'Normal',breaks:'Vista previa de salto de página','page-layout':'Diseño de página'};
export function viewState(sheet){const v=sheet.view||{};return {mode:viewModes[v.mode]?v.mode:'normal',zoom:Math.max(10,Math.min(400,Number(v.zoom)||100)),ruler:v.ruler!==false,freeze:v.freeze||{rows:sheet.freeze?1:0,columns:0},split:v.split||null};}
export function setView(sheet,updates){const v={...viewState(sheet),...structuredClone(updates)};if(!viewModes[v.mode]||!Number.isFinite(v.zoom)||v.zoom<10||v.zoom>400)throw Error('Usa una vista válida y un zoom entre 10 y 400 %.');for(const item of [v.freeze,v.split])if(item&&(!Number.isInteger(item.rows)||!Number.isInteger(item.columns)||item.rows<0||item.rows>=ROWS||item.columns<0||item.columns>=COLS))throw Error('Los paneles deben quedar dentro de A1:Z100.');sheet.view=v;sheet.freeze=!!v.freeze.rows;return v;}
export function freezeSpec(ref,kind='selection'){
 if(kind==='none')return {rows:0,columns:0};
 if(kind==='row')return {rows:1,columns:0};
 if(kind==='column')return {rows:0,columns:1};
 if(!['selection','range'].includes(kind))throw Error('Elige cómo inmovilizar la selección.');
 ref=String(ref).trim().toUpperCase();
 const columns=/^\$?([A-Z]):\$?([A-Z])$/.exec(ref),rows=/^([1-9]\d*):([1-9]\d*)$/.exec(ref);
 let freeze;
 if(columns)freeze={rows:0,columns:Math.max(columns[1].charCodeAt(0),columns[2].charCodeAt(0))-64};
 else if(rows){if(Math.max(+rows[1],+rows[2])>ROWS)throw Error('Referencia fuera del área de diseño (A1:Z100).');freeze={rows:Math.max(+rows[1],+rows[2]),columns:0};}
 else {
  const refs=range(ref),a=position(refs[0]),b=position(refs.at(-1)),wholeColumns=a[0]===0&&b[0]===ROWS-1,wholeRows=a[1]===0&&b[1]===COLS-1;
  if(wholeColumns&&!wholeRows)freeze={rows:0,columns:b[1]+1};
  else if(wholeRows&&!wholeColumns)freeze={rows:b[0]+1,columns:0};
  else freeze=kind==='range'?{rows:b[0]+1,columns:b[1]+1}:{rows:a[0],columns:a[1]};
  if(wholeColumns&&wholeRows)throw Error('Deja al menos una fila y una columna libres para desplazarte.');
 }
 if(freeze.rows>=ROWS||freeze.columns>=COLS)throw Error('Deja al menos una fila y una columna libres para desplazarte.');
 if(!freeze.rows&&!freeze.columns)throw Error('Selecciona una celda debajo o a la derecha del área que deseas inmovilizar, o elige «Hasta el final del rango».');
 return freeze;
}
export function freezePlan(sheet,ref,kind='selection'){
 if(kind!=='none'&&viewState(sheet).mode==='page-layout')throw Error('Inmovilizar paneles requiere vista Normal o Saltos de página.');
 const freeze=freezeSpec(ref,kind);
 for(const area of sheet.merges||[]){const refs=range(area),a=position(refs[0]),b=position(refs.at(-1));if(a[0]<freeze.rows&&b[0]>=freeze.rows||a[1]<freeze.columns&&b[1]>=freeze.columns)throw Error('La inmovilización corta una combinación de celdas. Selecciona su borde.');}
 return freeze;
}
export function freezeAt(sheet,ref,kind='selection'){return setView(sheet,{freeze:freezePlan(sheet,ref,kind),split:null});}
export function splitAt(sheet,ref){const [r,c]=position(range(ref)[0]);if(viewState(sheet).mode!=='normal')throw Error('Dividir paneles requiere la vista Normal.');return setView(sheet,{split:{rows:r||(!c?10:0),columns:c},freeze:{rows:0,columns:0}});}
export function rowVisible(sheet,r){return !(sheet.hiddenRows||[]).includes(r)&&!outlineHidden(sheet,r)&&rowPassesFilters(sheet,r);}
export function columnVisible(sheet,c){return !(sheet.hiddenColumns||[]).includes(c)&&!outlineHidden(sheet,c,'column');}
export function selectionSize(sheet,ref){const refs=range(ref),rows=[...new Set(refs.map(r=>position(r)[0]))].filter(r=>rowVisible(sheet,r)),columns=[...new Set(refs.map(r=>position(r)[1]))].filter(c=>columnVisible(sheet,c));return {width:columns.reduce((n,c)=>n+(sheet.columnWidths?.[c]||sheet.defaultWidth||112),0),height:rows.reduce((n,r)=>n+(sheet.rowHeights?.[r]||27),0)};}
export function selectionZoom(sheet,ref,width,height){const size=selectionSize(sheet,ref);if(!size.width||!size.height)throw Error('La selección solo contiene filas o columnas ocultas.');return Math.max(10,Math.min(400,Math.floor(Math.min(Math.max(1,width-55)/size.width,Math.max(1,height-35)/size.height)*100)));}
export function scrollAnchor(sheet,left,top,zoom=100){const locate=(px,count,size)=>{let at=0;for(let i=0;i<count;i++){const extent=size(i);if(extent&&px<at+extent)return {index:i,fraction:Math.max(0,(px-at)/extent)};at+=extent;}return {index:count-1,fraction:0};};return {row:locate(top*100/zoom,ROWS,r=>rowVisible(sheet,r)?sheet.rowHeights?.[r]||27:0),column:locate(left*100/zoom,COLS,c=>columnVisible(sheet,c)?sheet.columnWidths?.[c]||sheet.defaultWidth||112:0)};}
export function anchorScroll(sheet,anchor,zoom=100){const size=(count,visible,extent,part)=>{let n=0;for(let i=0;i<Math.min(count,part.index);i++)if(visible(i))n+=extent(i);if(visible(part.index))n+=extent(part.index)*part.fraction;return n*zoom/100;};return {top:size(ROWS,r=>rowVisible(sheet,r),r=>sheet.rowHeights?.[r]||27,anchor.row),left:size(COLS,c=>columnVisible(sheet,c),c=>sheet.columnWidths?.[c]||sheet.defaultWidth||112,anchor.column)};}
export function pageViewPlan(sheet){const empty=!usedArea(sheet)&&!sheet.printRange&&!sheet.printRanges?.length;return printPlan(empty?{...sheet,printRange:'A1:F12'}:sheet);}
export function pageBreakMap(sheet){const plan=pageViewPlan(sheet),map=new Map();for(const p of plan.pages)for(const r of p.rows)for(const c of p.cols)map.set(address(r,c),p.number);return {plan,map,manualRows:new Set(sheet.pageBreaks?.rows||[]),manualColumns:new Set(sheet.pageBreaks?.columns||[])};}
export function movePageBreak(sheet,axis,from,to){if(!['rows','columns'].includes(axis)||!Number.isInteger(to)||to<1||to>=(axis==='rows'?ROWS:COLS))throw Error('Elige una fila o columna posterior a la primera.');if(sheet.protected)throw Error('Desprotege la hoja para mover el salto.');if(sheet.page?.scaleMode==='fit')throw Error('Cambia la escala de impresión a porcentaje para mover saltos.');for(const area of sheet.merges||[]){const refs=range(area),dim=axis==='rows'?0:1;if(position(refs[0])[dim]<to&&position(refs.at(-1))[dim]>=to)throw Error('El salto corta una combinación.');}const before=sheet.pageBreaks?.[axis]||[],next=before.filter(n=>n!==from);sheet.pageBreaks={rows:[],columns:[],...sheet.pageBreaks,[axis]:[...new Set([...next,to])].sort((a,b)=>a-b)};}
const displayKeys=['grid','hideHeadings','hideFormulaBar','hiddenRows','hiddenColumns','columnWidths','rowHeights','defaultWidth','filters','autoFilter','advancedFilter','outline'];
const printKeys=['page','printRange','printRanges','pageBreaks'];
export function captureCustomView(sheet,name,{ref='A1',scroll={left:0,top:0},includePrint=true,includeHidden=true}={}){name=String(name).trim();if(!name||name.length>80)throw Error('Escribe un nombre de vista de hasta 80 caracteres.');range(ref);if((sheet.customViews||[]).some(v=>v.name.toLowerCase()===name.toLowerCase()))throw Error('Ya existe una vista con ese nombre.');const keys=displayKeys.filter(k=>includeHidden||!['hiddenRows','hiddenColumns','filters','autoFilter','advancedFilter','outline'].includes(k));const settings=Object.fromEntries([...keys,...(includePrint?printKeys:[])].map(k=>[k,structuredClone(sheet[k]??null)]));const entry={id:crypto.randomUUID(),sheetId:sheet.id,structureRevision:sheet.structureRevision||0,name,ref,scroll:{left:Math.max(0,Number(scroll.left)||0),top:Math.max(0,Number(scroll.top)||0)},view:structuredClone(viewState(sheet)),settings};sheet.customViews||=[];sheet.customViews.push(entry);return entry;}
export function applyCustomView(sheet,id){const entry=sheet.customViews?.find(v=>v.id===id);if(!entry||entry.sheetId!==sheet.id)throw Error('La vista no pertenece a esta hoja.');if(sheet.protected)throw Error('Desprotege la hoja para restaurar sus ajustes de filtros y formato.');if((entry.structureRevision||0)!==(sheet.structureRevision||0))throw Error('La estructura de la hoja cambió. Guarda una nueva vista con los ajustes actuales.');range(entry.ref);const validated=structuredClone(sheet);setView(validated,entry.view);if(entry.settings.page)pageSettings(entry.settings.page);for(const [key,v] of Object.entries(entry.settings)){if(![...displayKeys,...printKeys].includes(key))continue;if(v===null)delete sheet[key];else sheet[key]=structuredClone(v);}setView(sheet,entry.view);return structuredClone(entry);}
export function addViewWindow(book,sheetId){if(!book.sheets.some(s=>s.id===sheetId&&!s.hidden))throw Error('La hoja no está disponible.');book.viewWindows||=[];if(book.viewWindows.length>=4)throw Error('Se pueden abrir hasta cuatro ventanas adicionales.');const item={id:crypto.randomUUID(),sheetId,ref:'A1',zoom:100,hidden:false,scroll:{left:0,top:0}};book.viewWindows.push(item);book.windowView={...book.windowView,arrangement:'vertical'};return item;}
export function visibleWindows(book){return (book.viewWindows||[]).filter(w=>!w.hidden&&book.sheets.some(s=>s.id===w.sheetId&&!s.hidden));}
