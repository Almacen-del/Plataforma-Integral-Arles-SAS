import {outlineHidden} from './sheet-data-rules.js';
import {ROWS,COLS,range,position,address,rowPassesFilters,writable} from './sheet-model.js';
export const PX_PER_MM=96/25.4;
export const papers={A3:[297,420],A4:[210,297],A5:[148,210],B4:[250,353],B5:[176,250],Carta:[215.9,279.4],Oficio:[215.9,355.6],Tabloide:[279.4,431.8]};
export const themePresets={
 arles:{name:'Arles',colors:['#21804a','#3987be','#e8a135','#9255aa','#cc5555','#49a69a'],bodyFont:'Arial',headingFont:'Arial',effect:'plain'},
 office:{name:'Office',colors:['#4472c4','#ed7d31','#a5a5a5','#ffc000','#5b9bd5','#70ad47'],bodyFont:'Calibri',headingFont:'Calibri',effect:'subtle'},
 gray:{name:'Gris',colors:['#475569','#64748b','#94a3b8','#334155','#a8a29e','#78716c'],bodyFont:'Arial',headingFont:'Georgia',effect:'plain'}
};
export function validateTheme(t){
 if(!t.name?.trim()||t.name.length>60||!Array.isArray(t.colors)||t.colors.length!==6||t.colors.some(c=>!/^#[0-9a-f]{6}$/i.test(c)))throw Error('Revisa el nombre y los seis colores del tema.');
 if(!['Arial','Calibri','Georgia','Verdana','Courier New'].includes(t.bodyFont)||!['Arial','Calibri','Georgia','Verdana','Courier New'].includes(t.headingFont)||!['plain','subtle','shadow'].includes(t.effect))throw Error('Fuente o efecto del tema inválido.');
 return structuredClone(t);
}
export function themeCell(cell,theme=themePresets.arles){return {...cell,font:cell.themeFont?theme[cell.themeFont==='heading'?'headingFont':'bodyFont']:cell.font||theme.bodyFont,...(cell.themeFill!=null?{fill:theme.colors[cell.themeFill]}:{}),...(cell.themeColor!=null?{color:theme.colors[cell.themeColor]}:{})};}
export function overrideThemeFormat(cell,updates){
 const next={...cell,...updates};for(const [key,binding] of [['fill','themeFill'],['color','themeColor'],['font','themeFont']])if(Object.hasOwn(updates,key)&&!Object.hasOwn(updates,binding))delete next[binding];return next;
}
export function titleIndices(text,axis){
 if(!String(text||'').trim())return [];
 const s=String(text).trim().replaceAll('$','').toUpperCase(),match=axis==='row'?/^([1-9]\d*)(?::([1-9]\d*))?$/.exec(s):/^([A-Z])(?::([A-Z]))?$/.exec(s);
 if(!match)throw Error(axis==='row'?'Repite filas con un formato como 1:3.':'Repite columnas con un formato como A:B.');
 const a=axis==='row'?+match[1]-1:match[1].charCodeAt(0)-65,b=axis==='row'?+(match[2]||match[1])-1:(match[2]||match[1]).charCodeAt(0)-65,limit=axis==='row'?ROWS:COLS;
 if(b<a||b>=limit)throw Error('Los títulos deben estar dentro de la hoja y en orden.');
 return Array.from({length:b-a+1},(_,i)=>a+i);
}
export function pageSettings(page={}){
 const p={size:'A4',orientation:'portrait',margin:15,headerDistance:5,footerDistance:5,scale:100,scaleMode:'percent',fitWidth:0,fitHeight:0,printGrid:false,printHeadings:false,centerHorizontal:false,centerVertical:false,repeatRows:'',repeatColumns:'',order:'down',firstPage:1,header:'',footer:'',blackWhite:false,...page};
 p.margins={top:p.margin,right:p.margin,bottom:p.margin,left:p.margin,...page.margins};
 if(!papers[p.size]||!['portrait','landscape'].includes(p.orientation)||!['percent','fit'].includes(p.scaleMode)||!['down','over'].includes(p.order))throw Error('Configuración de página inválida.');
 for(const v of Object.values(p.margins))if(!Number.isFinite(v)||v<0||v>100)throw Error('Usa márgenes entre 0 y 100 mm.');
 for(const key of ['headerDistance','footerDistance'])if(!Number.isFinite(p[key])||p[key]<0||p[key]>50)throw Error('La distancia de encabezado y pie debe estar entre 0 y 50 mm.');
 if(!Number.isFinite(p.scale)||p.scale<10||p.scale>400)throw Error('Usa una escala entre 10 y 400 %.');
 for(const key of ['fitWidth','fitHeight'])if(!Number.isInteger(p[key])||p[key]<0||p[key]>100)throw Error('Usa de 1 a 100 páginas, o Automático.');
 if(!Number.isInteger(p.firstPage)||p.firstPage<1||p.firstPage>9999)throw Error('Revisa el primer número de página.');
 titleIndices(p.repeatRows,'row');titleIndices(p.repeatColumns,'column');
 const [w,h]=p.orientation==='landscape'?[...papers[p.size]].reverse():papers[p.size];
 if(w-p.margins.left-p.margins.right<20||h-p.margins.top-p.margins.bottom<20)throw Error('Los márgenes no dejan suficiente área de impresión.');
 if(p.header&&p.margins.top<p.headerDistance+5||p.footer&&p.margins.bottom<p.footerDistance+5)throw Error('Aumenta el margen para que el encabezado o pie no se superponga con las celdas.');
 return p;
}
export function normalizeAreas(areas,sheet){
 const normalized=areas.map(a=>{const refs=range(String(a).trim().toUpperCase());return refs[0]+':'+refs.at(-1);});
 const occupied=new Set();
 for(const a of normalized){const refs=range(a);if(refs.some(r=>occupied.has(r)))throw Error('Las áreas de impresión no pueden superponerse.');refs.forEach(r=>occupied.add(r));
  for(const m of sheet.merges||[]){const merged=range(m),hits=merged.filter(r=>refs.includes(r));if(hits.length&&hits.length!==merged.length)throw Error('El área corta una celda combinada. Incluye la combinación completa.');}
 }
 return normalized;
}
const colWidth=(s,c)=>s.columnWidths?.[c]||s.defaultWidth||112,rowHeight=(s,r)=>s.rowHeights?.[r]||27;
const prefix=(count,size)=>{const out=[0];for(let i=0;i<count;i++)out.push(out.at(-1)+size(i));return out;};
export function usedArea(sheet){
 const points=Object.entries(sheet.cells).filter(([,c])=>c.raw||Object.keys(c).some(k=>!['raw','note','locked','hiddenFormula'].includes(k))).map(([r])=>position(r));
 for(const m of sheet.merges||[])points.push(...[range(m)[0],range(m).at(-1)].map(position));
 const xp=prefix(COLS,c=>((sheet.hiddenColumns||[]).includes(c)||outlineHidden(sheet,c,'column'))?0:colWidth(sheet,c)),yp=prefix(ROWS,r=>((sheet.hiddenRows||[]).includes(r)||outlineHidden(sheet,r))||!rowPassesFilters(sheet,r)?0:rowHeight(sheet,r));
 for(const o of [...(sheet.insertObjects||[]),...(sheet.formControls||[]).filter(o=>o.print!==false)])if(!o.hidden)for(const [x,y] of [[o.x-43,o.y-25],[o.x+o.width-43,o.y+o.height-25]]){const ri=yp.findIndex(v=>v>y),ci=xp.findIndex(v=>v>x);points.push([ri<0?ROWS-1:Math.max(0,ri-1),ci<0?COLS-1:Math.max(0,ci-1)]);}
 if(!points.length)return null;
 return address(Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])))+':'+address(Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1])));
}
function groups(indices,sheet,axis){
 const spans=(sheet.merges||[]).map(m=>{const refs=range(m);return [position(refs[0])[axis],position(refs.at(-1))[axis]];});
 const out=[];let group=[];
 for(const i of indices){if(group.length&&!spans.some(([a,b])=>a<=group.at(-1)&&b>=i)){out.push(group);group=[];}group.push(i);}
 if(group.length)out.push(group);return out;
}
function partition(blocks,size,capacity,breaks=[]){
 const out=[];let current=[],used=0;
 for(const block of blocks){const weight=block.reduce((n,i)=>n+size(i),0);
  if(weight>capacity+.01)throw Error('Una fila, columna o combinación no cabe. Reduce la escala o usa Ajustar a páginas.');
  if(current.length&&(used+weight>capacity+.01||breaks.includes(block[0]))){out.push(current);current=[];used=0;}
  current.push(...block);used+=weight;
 }
 if(current.length)out.push(current);return out;
}
export function printPlan(sheet){
 const p=pageSettings(sheet.page),raw=sheet.printRanges?.length?sheet.printRanges:sheet.printRange?[sheet.printRange]:[usedArea(sheet)].filter(Boolean);
 if(!raw.length)throw Error('La hoja no tiene contenido para imprimir.');
 const areas=normalizeAreas(raw,sheet),paper=(p.orientation==='landscape'?[...papers[p.size]].reverse():papers[p.size]).map(n=>n*PX_PER_MM);
 const contentWidth=paper[0]-(p.margins.left+p.margins.right)*PX_PER_MM,contentHeight=paper[1]-(p.margins.top+p.margins.bottom)*PX_PER_MM;
 const visibleRow=r=>!((sheet.hiddenRows||[]).includes(r)||outlineHidden(sheet,r))&&rowPassesFilters(sheet,r),visibleCol=c=>!((sheet.hiddenColumns||[]).includes(c)||outlineHidden(sheet,c,'column'));
 const titlesR=titleIndices(p.repeatRows,'row').filter(visibleRow),titlesC=titleIndices(p.repeatColumns,'column').filter(visibleCol);
 for(const m of sheet.merges||[]){const refs=range(m),a=position(refs[0]),b=position(refs.at(-1));for(const [indices,dim] of [[titlesR,0],[titlesC,1]])if(indices.some(n=>n>=a[dim]&&n<=b[dim])&&!Array.from({length:b[dim]-a[dim]+1},(_,i)=>a[dim]+i).every(n=>indices.includes(n)||(dim===0?!visibleRow(n):!visibleCol(n))))throw Error('Los títulos repetidos cortan una combinación. Incluye todas sus filas o columnas.');}
 const xp=prefix(COLS,c=>visibleCol(c)?colWidth(sheet,c):0),yp=prefix(ROWS,r=>visibleRow(r)?rowHeight(sheet,r):0);
 const pages=[],warnings=[];
 if((sheet.insertObjects||[]).some(o=>!o.hidden&&(o.x+o.width-43>xp.at(-1)||o.y+o.height-25>yp.at(-1))))warnings.push('Hay objetos fuera del límite A1:Z100; la impresión se limita a esa cuadrícula.');
 if(p.scaleMode==='fit'&&((sheet.pageBreaks?.rows||[]).length||(sheet.pageBreaks?.columns||[]).length))warnings.push('Ajustar a páginas ignora los saltos manuales.');
 for(const area of areas){
  const refs=range(area),a=position(refs[0]),b=position(refs.at(-1)),rs=Array.from({length:b[0]-a[0]+1},(_,i)=>a[0]+i).filter(visibleRow),cs=Array.from({length:b[1]-a[1]+1},(_,i)=>a[1]+i).filter(visibleCol);
  if(!rs.length||!cs.length)continue;
  const rows=rs.filter(r=>!titlesR.includes(r)),cols=cs.filter(c=>!titlesC.includes(c)),rBlocks=groups(rows,sheet,0),cBlocks=groups(cols,sheet,1);
  const headW=p.printHeadings?43:0,headH=p.printHeadings?25:0,titleW=titlesC.reduce((n,c)=>n+colWidth(sheet,c),headW),titleH=titlesR.reduce((n,r)=>n+rowHeight(sheet,r),headH);
  const pieces=scale=>{
   const capacityW=contentWidth/scale-titleW,capacityH=contentHeight/scale-titleH;
   if(capacityW<=0||capacityH<=0)throw Error('Los títulos ocupan toda la página. Reduce la escala.');
   return {rows:partition(rBlocks,r=>rowHeight(sheet,r),capacityH,p.scaleMode==='fit'?[]:sheet.pageBreaks?.rows)||[],cols:partition(cBlocks,c=>colWidth(sheet,c),capacityW,p.scaleMode==='fit'?[]:sheet.pageBreaks?.columns)||[]};
  };
  let scale=p.scale/100,parts;
  if(p.scaleMode==='fit'){
   let low=.01,high=1;
   const fits=n=>{try{const t=pieces(n);return (!p.fitWidth||Math.max(1,t.cols.length)<=p.fitWidth)&&(!p.fitHeight||Math.max(1,t.rows.length)<=p.fitHeight);}catch{return false;}};
   if(!fits(low))throw Error('Los títulos o las combinaciones impiden ajustar a las páginas elegidas.');
   for(let i=0;i<35;i++){const mid=(low+high)/2;if(fits(mid))low=mid;else high=mid;}scale=low;
  }
  parts=pieces(scale);if(!parts.rows.length)parts.rows=[[]];if(!parts.cols.length)parts.cols=[[]];
  const pairs=p.order==='down'?parts.cols.flatMap(cols=>parts.rows.map(rows=>({rows,cols}))):parts.rows.flatMap(rows=>parts.cols.map(cols=>({rows,cols})));
  for(const pair of pairs){
   const r0=pair.rows[0]??a[0],r1=pair.rows.at(-1)??b[0],c0=pair.cols[0]??a[1],c1=pair.cols.at(-1)??b[1];
   pages.push({...pair,allRows:[...titlesR,...pair.rows],allCols:[...titlesC,...pair.cols],area,scale,x0:xp[c0],x1:xp[c1+1],y0:yp[r0],y1:yp[r1+1],titleW,titleH,headW,headH,width:titleW+pair.cols.reduce((n,c)=>n+colWidth(sheet,c),0),height:titleH+pair.rows.reduce((n,r)=>n+rowHeight(sheet,r),0)});
  }
 }
 if(!pages.length)throw Error('Las áreas elegidas solo contienen filas o columnas ocultas.');
 if(pages.length>500)throw Error('La configuración produce más de 500 páginas. Reduce las áreas o la escala.');
 pages.forEach((page,i)=>page.number=p.firstPage+i);
 return {settings:p,paper,contentWidth,contentHeight,pages,warnings};
}
export function pageBreak(sheet,ref,operation='insert'){
 writable(sheet);const [r,c]=position(range(ref)[0]),next=structuredClone(sheet.pageBreaks||{rows:[],columns:[]});
 if(operation==='reset'){sheet.pageBreaks={rows:[],columns:[]};return;}
 for(const [axis,n,dim] of [['rows',r,0],['columns',c,1]])if(n>0){
  if(operation==='insert'){if((sheet.merges||[]).some(m=>{const refs=range(m);return position(refs[0])[dim]<n&&position(refs.at(-1))[dim]>=n;}))throw Error('El salto corta una combinación. Elige su borde.');next[axis]=[...new Set([...(next[axis]||[]),n])].sort((a,b)=>a-b);}
  else next[axis]=(next[axis]||[]).filter(v=>v!==n);
 }
 if(operation==='insert'&&!r&&!c)throw Error('Selecciona una celda posterior a la primera fila o columna.');
 sheet.pageBreaks=next;
}
export function organizeObjects(sheet,ids,action){
 if(!['front','back','forward','backward','left','center','right','top','middle','bottom','distribute-x','distribute-y','group','ungroup','rotate-right','rotate-left','flip-x','flip-y'].includes(action))throw Error('Operación de organización inválida.');
 writable(sheet);const objects=sheet.insertObjects||[],chosen=objects.filter(o=>ids.includes(o.id));if(!chosen.length)throw Error('Selecciona uno o más objetos en el panel.');
 if(['front','back','forward','backward'].includes(action)){
  if(action==='front'||action==='back'){const rest=objects.filter(o=>!ids.includes(o.id));sheet.insertObjects=action==='front'?[...rest,...chosen]:[...chosen,...rest];}
  else{const next=[...objects],step=action==='forward'?1:-1,sequence=step===1?[...next].reverse():next;for(const o of sequence)if(ids.includes(o.id)){const i=next.indexOf(o),j=i+step;if(j>=0&&j<next.length&&!ids.includes(next[j].id))[next[i],next[j]]=[next[j],next[i]];}sheet.insertObjects=next;}
  return;
 }
 const left=Math.min(...chosen.map(o=>o.x)),right=Math.max(...chosen.map(o=>o.x+o.width)),top=Math.min(...chosen.map(o=>o.y)),bottom=Math.max(...chosen.map(o=>o.y+o.height));
 if(action==='group'){if(chosen.length<2)throw Error('Selecciona al menos dos objetos para agrupar.');const groupId=crypto.randomUUID();chosen.forEach(o=>o.groupId=groupId);return;}
 if(action==='ungroup'){const groups=new Set(chosen.map(o=>o.groupId).filter(Boolean));objects.filter(o=>groups.has(o.groupId)).forEach(o=>delete o.groupId);return;}
 if(action.startsWith('distribute')){
  if(chosen.length<3)throw Error('Selecciona al menos tres objetos para distribuir.');const horizontal=action==='distribute-x',key=horizontal?'x':'y',size=horizontal?'width':'height',sorted=[...chosen].sort((a,b)=>a[key]-b[key]),min=horizontal?left:top,max=horizontal?right:bottom,gap=(max-min-sorted.reduce((n,o)=>n+o[size],0))/(sorted.length-1);let at=min;for(const o of sorted){o[key]=at;at+=o[size]+gap;}return;
 }
 if(['left','center','right','top','middle','bottom'].includes(action)&&chosen.length<2)throw Error('Selecciona al menos dos objetos para alinearlos.');
 for(const o of chosen){
  if(action==='left')o.x=left;if(action==='center')o.x=(left+right-o.width)/2;if(action==='right')o.x=right-o.width;
  if(action==='top')o.y=top;if(action==='middle')o.y=(top+bottom-o.height)/2;if(action==='bottom')o.y=bottom-o.height;
  if(action==='rotate-right')o.rotation=((o.rotation||0)+90)%360;if(action==='rotate-left')o.rotation=((o.rotation||0)-90)%360;
  if(action==='flip-x')o.flipH=!o.flipH;if(action==='flip-y')o.flipV=!o.flipV;
 }
}
