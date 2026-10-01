import {ROWS,COLS} from './sheet-grid-limits.js';
import {rowPassesFilters,display,address,position} from './sheet-model.js';
import {outlineHidden} from './sheet-data-rules.js';
export function rowMetrics(sheet,filter=''){
 const hidden=new Set(sheet.hiddenRows||[]),offsets=[0],visible=[];
 for(let r=0;r<ROWS;r++){const show=!hidden.has(r)&&!outlineHidden(sheet,r)&&rowPassesFilters(sheet,r)&&(!filter||r===0||Array.from({length:COLS},(_,c)=>display(sheet,address(r,c))).join(' ').toLowerCase().includes(filter.toLowerCase()));visible.push(show);offsets.push(offsets.at(-1)+(show?sheet.rowHeights?.[r]||sheet.defaultHeight||27:0));}
 return {offsets,visible};
}
export function visibleRows(sheet,scroll,zoom,filter=''){
 if(ROWS<=200)return {rows:Array.from({length:ROWS},(_,r)=>r),metrics:null};
 const metrics=rowMetrics(sheet,filter),top=Math.max(0,scroll.scrollTop/(zoom/100)-25),bottom=top+scroll.clientHeight/(zoom/100),frozen=Math.min(sheet.view?.freeze?.rows||0,100),set=new Set(Array.from({length:frozen},(_,r)=>r));
 let from=0;while(from<ROWS&&metrics.offsets[from+1]<top)from++;let to=from;while(to<ROWS&&metrics.offsets[to]<bottom)to++;from=Math.max(frozen,from-15);to=Math.min(ROWS,to+20);
 for(const area of sheet.merges||[]){const parts=area.split(':'),a=position(parts[0]),b=position(parts[1]||parts[0]);if(a[0]<=to&&b[0]>=from)from=Math.min(from,a[0]);}
 for(let r=from;r<to;r++)set.add(r);return {rows:[...set].sort((a,b)=>a-b),metrics};
}
export function drawXlsxImages(sheet,scroll,zoom){scroll.querySelector('.sx-xlsx-images')?.remove();if(!sheet.xlsxImages?.length)return;const layer=document.createElement('div');layer.className='sx-xlsx-images';layer.style.zoom=zoom/100;const point=(value,axis)=>{const n=Math.floor(value),fraction=value-n;let sum=axis==='col'?43:25;for(let i=0;i<n;i++)sum+=axis==='col'?(sheet.hiddenColumns||[]).includes(i)?0:sheet.columnWidths?.[i]||sheet.defaultWidth||112:(sheet.hiddenRows||[]).includes(i)?0:sheet.rowHeights?.[i]||sheet.defaultHeight||27;return sum+fraction*(axis==='col'?sheet.columnWidths?.[n]||sheet.defaultWidth||112:sheet.rowHeights?.[n]||sheet.defaultHeight||27);};
 for(const object of sheet.xlsxImages){const img=document.createElement('img'),left=point(object.tl.col,'col'),top=point(object.tl.row,'row'),f=sheet.view?.freeze||{rows:0,columns:0};img.src=object.dataUrl;img.alt='Imagen del libro original';const dx=object.br?.col<=f.columns?scroll.scrollLeft/(zoom/100):0,dy=object.br?.row<=f.rows?scroll.scrollTop/(zoom/100):0;Object.assign(img.style,{position:'absolute',left:left+dx+'px',top:top+dy+'px',width:(object.ext?.width||point(object.br?.col||object.tl.col+1,'col')-left)+'px',height:(object.ext?.height||point(object.br?.row||object.tl.row+1,'row')-top)+'px'});layer.append(img);}scroll.append(layer);
}
