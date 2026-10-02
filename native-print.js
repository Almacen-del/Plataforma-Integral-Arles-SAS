import {sectionSettings,pageLabel} from './native-word-sections.js';
function splitLongText(d,node,height,limit){
 if(node.nodeType!==1||node.querySelector('img,table,ul,ol')||!node.textContent.trim())return [node];
 const text=node.textContent,count=Math.ceil(height/limit),walker=d.createTreeWalker(node,4),leaves=[];while(walker.nextNode())leaves.push(walker.currentNode);
 const boundary=offset=>{for(const leaf of leaves){if(offset<=leaf.length)return [leaf,offset];offset-=leaf.length;}return [leaves.at(-1),leaves.at(-1).length];};
 const out=[];let start=0;for(let i=1;i<=count;i++){let end=i===count?text.length:Math.round(text.length*i/count);if(i<count){const space=text.lastIndexOf(' ',end);if(space>start)end=space+1;else if(/[\uDC00-\uDFFF]/.test(text[end]||''))end++;}if(end<=start)continue;const range=d.createRange();range.setStart(...boundary(start));range.setEnd(...boundary(end));const part=node.cloneNode(false);part.append(range.cloneContents());if(start)part.style.marginTop='0';if(end<text.length)part.style.marginBottom='0';out.push(part);start=end;}
 if(out.map(n=>n.textContent).join('')!==text)throw Error('No se pudo dividir el párrafo sin alterar el texto.');return out;
}

function composeUnequalColumns(d,w,width,height,weights,gap,rule){
 const available=width-gap*(weights.length-1),total=weights.reduce((a,b)=>a+b,0),sizes=weights.map(v=>available*v/total),limit=height-6;
 const content=[...d.body.children].filter(n=>!n.matches('.source-print-header,.source-print-footer')),queue=content.slice();content.forEach(n=>n.remove());d.body.style.width=width+'px';
 let cols=[],index=0,grid;const nextPage=()=>{grid=d.createElement('div');grid.dataset.printColumns='true';grid.style.cssText='display:flex;align-items:flex-start;gap:'+gap+'px;width:'+width+'px;break-inside:avoid';if(cols.length)grid.style.breakBefore='page';cols=sizes.map((size,i)=>{const col=d.createElement('div');col.style.cssText='display:flow-root;flex:none;box-sizing:border-box;width:'+size+'px';col.dataset.printColumn=String(i);if(i&&rule&&!rule.includes('none'))col.style.borderLeft=rule;grid.append(col);return col;});index=0;d.body.append(grid);};
 const advance=()=>{if(index+1<cols.length)index++;else nextPage();};nextPage();let iterations=0;
 while(queue.length){if(++iterations>10000)throw Error('El documento supera la capacidad de composición por columnas.');const node=queue.shift(),col=cols[index];if(['page','column'].includes(node.style.breakBefore)){if(col.childNodes.length||index){if(node.style.breakBefore==='page')nextPage();else advance();}node.style.breakBefore='auto';queue.unshift(node);continue;}
  const target=cols[index],empty=!target.childNodes.length;target.append(node);const size=target.getBoundingClientRect().height;
  if(size<=limit)continue;node.remove();if(!empty){advance();queue.unshift(node);continue;}
  // Measure an oversized block at this column's actual width before splitting.
  target.append(node);const h=node.getBoundingClientRect().height;let pieces=splitLongText(d,node,h,limit*.75);node.remove();
  if(pieces.length===1&&['OL','UL'].includes(node.tagName)&&node.children.length>1)pieces=[...node.children].map((li,i)=>{const list=node.cloneNode(false);if(node.tagName==='OL')list.start=(node.start||1)+i;list.append(li.cloneNode(true));return list;});
  if(pieces.length===1&&node.tagName==='TABLE'&&node.tBodies[0]?.rows.length>1){pieces=[...node.tBodies[0].rows].map(row=>{if([...row.cells].some(c=>c.rowSpan>1))throw Error('Una tabla con celdas combinadas no cabe en las columnas configuradas.');const table=node.cloneNode(false);if(node.tHead)table.append(node.tHead.cloneNode(true));const body=d.createElement('tbody');body.append(row.cloneNode(true));table.append(body);return table;});}
  if(pieces.length===1)throw Error('Un bloque no cabe en el ancho o alto de una columna. Ajusta el objeto antes de imprimir.');queue.unshift(...pieces);
 }
}
// Paged.js runs locally inside an isolated preview; document data never leaves the browser.
export async function renderPrintFrame(frame,html,context={}){
 const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(Error('No se pudo abrir la vista de impresión.'));});frame.srcdoc=html;await loaded;
 if(!frame.isConnected)throw Error('Vista cerrada.');const d=frame.contentDocument,w=frame.contentWindow;
 const sectionTemplates=[...d.querySelectorAll('template[data-print-section]')];if(sectionTemplates.length)return composeSections(frame,sectionTemplates.map(t=>t.content.textContent));
 const config=sectionSettings(JSON.parse(d.body.dataset.sectionConfig||'{}')),regions={};for(const template of d.querySelectorAll('template[data-source-region]')){regions[template.dataset.sourceRegion]=template.innerHTML;template.remove();}
 d.querySelectorAll('script').forEach(n=>n.remove());
 await Promise.all([...d.images].map(img=>img.decode().catch(()=>{})));await d.fonts.ready;
 const script=d.createElement('script');script.src='/public/vendor/paged-0.4.3.js';await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(Error('No se pudo cargar el motor de impresión.'));d.head.append(script);});
 const sourceStyle=w.getComputedStyle(d.body),columns=Number(sourceStyle.columnCount),gap=sourceStyle.columnGap,rule=sourceStyle.columnRule;
 d.body.style.setProperty('column-count','auto','important');
 const width=Number(d.body.dataset.printWidth)*96/25.4,unequal=config.page.columnWidths.length===columns&&columns>1,weights=config.page.columnWidths,totalWeight=weights.reduce((a,b)=>a+b,0);const smallest=unequal?(width-(columns-1)*parseFloat(gap))*Math.min(...weights)/totalWeight:0;
 if(width)d.body.style.width=(unequal?smallest:columns>1?(width-(columns-1)*parseFloat(gap))/columns:width)+'px';
 const usable=Number(d.body.dataset.printHeight)*96/25.4;
 // Browser table fragmentation may retain text in invisible overflow columns.
 // Divide oversized rows at block boundaries before paginating; never edit the source.
 for(const row of [...d.querySelectorAll('tr')])if(usable&&row.getBoundingClientRect().height>usable){
  const cells=[...row.cells];if(cells.some(c=>c.rowSpan>1))throw Error('Una fila combinada supera una página. Reduce su altura para imprimir sin recortes.');
  for(const cell of cells)for(const child of [...cell.children]){const h=child.getBoundingClientRect().height;if(h>usable*.7){const parts=splitLongText(d,child,h,usable*.6);if(parts.length>1)child.replaceWith(...parts);}}
  const groups=cells.map(cell=>{const chunks=[[]];let height=0;for(const child of cell.childNodes){const h=child.nodeType===1?child.getBoundingClientRect().height+(parseFloat(w.getComputedStyle(child).marginTop)||0)+(parseFloat(w.getComputedStyle(child).marginBottom)||0):0;if(h>usable*.85)throw Error('Un bloque dentro de una celda supera una página. Divide ese párrafo para imprimir sin recortes.');if(height+h>usable*.75&&chunks.at(-1).length){chunks.push([]);height=0;}chunks.at(-1).push(child);height+=h;}return chunks;});
  const count=Math.max(...groups.map(g=>g.length));if(count===1){row.style.height='auto';continue;}const fragments=d.createDocumentFragment();for(let i=0;i<count;i++){const part=row.cloneNode(false);part.style.height='auto';part.style.breakInside='avoid';cells.forEach((cell,j)=>{const copy=cell.cloneNode(false);copy.rowSpan=1;for(const n of groups[j][i]||[])copy.append(n.cloneNode(true));if(i)copy.style.borderTop='0';if(i<count-1)copy.style.borderBottom='0';part.append(copy);});fragments.append(part);}row.replaceWith(fragments);
 }
 for(const table of d.querySelectorAll('table')){const previous=table.previousElementSibling;if(previous&&!previous.style.breakAfter&&previous.textContent.trim().length<120&&(previous.matches('h1,h2,h3,h4,h5,h6')||previous.querySelector('strong,b')))previous.style.breakAfter='avoid';}
 if(columns>1)for(const p of [...d.body.querySelectorAll('p')]){if(p.closest('table,.source-print-header,.source-print-footer'))continue;const height=p.getBoundingClientRect().height;if(height>usable*.6){const parts=splitLongText(d,p,height,usable*.5);if(parts.length>1)p.replaceWith(...parts);}}
 if(unequal)composeUnequalColumns(d,w,width,usable,weights,parseFloat(gap),rule);
 const stableText=node=>{const copy=node.cloneNode(true);copy.querySelectorAll('[data-word-page],[data-word-pages]').forEach(n=>n.textContent='');return copy.textContent.replace(/\s+/g,'');};
 const expected=[];for(const p of d.body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li')){if(p.closest('.source-print-header,.source-print-footer')||p.querySelector('p,li'))continue;const id=String(expected.length);p.dataset.printText=id;expected.push(stableText(p));}
 const first=[...d.body.children].find(n=>!n.matches('.source-print-header,.source-print-footer'));if(first?.style.breakBefore==='page')first.style.breakBefore='auto';
 if(columns>1&&!unequal){const block=d.createElement('div');block.style.columnCount=String(columns);block.style.columnGap=gap;block.style.columnRule=rule;block.append(...d.body.childNodes);d.body.append(block);}

 for(const node of d.body.querySelectorAll('[style]')){for(const [prop,key] of [['breakBefore','printBefore'],['breakAfter','printAfter'],['breakInside','printInside']])if(node.style[prop])node.dataset[key]=node.style[prop];}
 const base=d.createElement('style');base.textContent='body{column-count:auto!important;column-width:auto!important}[data-print-before=page]{break-before:page}[data-print-before=column]{break-before:column}[data-print-after=avoid]{break-after:avoid}[data-print-inside=avoid]{break-inside:avoid}';d.head.append(base);
 if(width)d.body.style.width=width+'px';
 const tableHeads=new Map();for(const [i,table] of [...d.querySelectorAll('table')].entries())if(table.tHead&&!table.closest('.source-print-header,.source-print-footer')){table.dataset.printTable=String(i);tableHeads.set(String(i),table.tHead.cloneNode(true));}
 class RepeatTableHeads extends w.PagedModule.Handler{layout(rendered){for(const table of rendered.querySelectorAll('table[data-print-table][data-split-from]'))if(!table.tHead&&tableHeads.has(table.dataset.printTable))table.prepend(tableHeads.get(table.dataset.printTable).cloneNode(true));}}
 w.PagedModule.registerHandlers(RepeatTableHeads);
 const preview=new w.PagedModule.Previewer();const result=await preview.preview();d.body.style.width='';if(!frame.isConnected)throw Error('Vista cerrada.');
 // Field values must follow the composed page, not the cached value in the DOCX.
 const pages=[...d.querySelectorAll('.pagedjs_page')];pages.forEach((page,i)=>{const number=(config.start??context.numberStart??1)+i;page.dataset.printNumber=String(number);if(Object.keys(regions).length){const type=config.titlePage&&i===0?'first':config.evenAndOdd&&number%2===0?'even':'default';for(const kind of ['header','footer']){const box=page.querySelector('.pagedjs_margin-'+(kind==='header'?'top':'bottom')+'-center .pagedjs_margin-content');if(box){const region=d.createElement('div');region.className='source-print-'+kind;region.innerHTML=regions[kind+'-'+type]||'';box.replaceChildren(region);}}}page.querySelectorAll('[data-word-page]').forEach(n=>n.textContent=pageLabel(number,config.format));page.querySelectorAll('[data-word-pages]').forEach(n=>n.textContent=String(pages.length));});
 await Promise.all([...d.images].map(img=>img.decode().catch(()=>{})));
 const clipped=[];for(const page of pages){const area=page.querySelector('.pagedjs_area').getBoundingClientRect(),walker=d.createTreeWalker(page.querySelector('.pagedjs_page_content'),w.NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode;if(!n.textContent.trim()||n.parentElement.closest('.source-print-header,.source-print-footer'))continue;const range=d.createRange();range.selectNodeContents(n);if([...range.getClientRects()].some(r=>r.width&&r.height&&(r.left<area.left-3||r.right>area.right+3||r.top<area.top-3||r.bottom>area.bottom+3)))clipped.push(n.textContent.slice(0,60));}}
 if(clipped.length)throw Error('Hay '+clipped.length+' fragmentos fuera del área imprimible. Ajusta las tablas o márgenes; no se imprimirá contenido recortado.');
 const missing=[];expected.forEach((text,i)=>{const fragments=[...d.querySelectorAll('.pagedjs_page_content [data-print-text="'+i+'"]')].map(stableText);const actual=fragments.join('');if(text&&actual!==text&&!(fragments.length&&fragments.every(x=>x===text)))missing.push(i);});
 if(missing.length)throw Error('La composición no conservó '+missing.length+' bloques de texto. No se habilitó la impresión; el documento sigue intacto.');
 const style=d.createElement('style');style.dataset.pagedjsIgnore='true';style.textContent='body{column-count:auto!important;column-width:auto!important} @media screen{body{background:#e9efeb}.pagedjs_pages{display:flex;flex-direction:column;align-items:center;gap:22px;padding:20px}.pagedjs_page{background:white;box-shadow:0 2px 10px #1233;flex:none}}@media print{body{background:white}.pagedjs_pages{display:block;padding:0;zoom:1!important}.pagedjs_page{margin:0!important;box-shadow:none!important;break-after:page}}';d.head.append(style);
 return {pages:result.total,document:d,config};
}

// Continuous sections may share the existing flow when their page rules agree.
// Different geometry, running regions or numbering need a separate page context.
function groupContinuousSections(documents){
 const groups=[];let last;
 for(const html of documents){const doc=new DOMParser().parseFromString(html,'text/html'),config=sectionSettings(JSON.parse(doc.body.dataset.sectionConfig||'{}'));
  const signature=JSON.stringify({page:config.page,titlePage:config.titlePage,evenAndOdd:config.evenAndOdd,format:config.format,regions:[...doc.querySelectorAll('template[data-source-region]')].map(n=>[n.dataset.sourceRegion,n.innerHTML])});
  if(last&&config.type==='continuous'&&config.start===null&&!config.titlePage&&signature===last.signature){for(const n of [...doc.body.childNodes])if(n.nodeType!==1||!n.matches('template[data-source-region],.source-print-header,.source-print-footer'))last.doc.body.append(n);}
  else{last={doc,signature};groups.push(last);}
 }
 return groups.map(g=>'<!doctype html>'+g.doc.documentElement.outerHTML);
}
// Compose each section at its own geometry, then retain those dimensions in a single print document.
async function composeSections(frame,documents){
 const d=frame.contentDocument,owner=frame.ownerDocument,container=d.createElement('div');container.className='pagedjs_pages';let count=0,number=1;const styles=[],stages=[];
 try{for(const [index,html] of groupContinuousSections(documents).entries()){
  const parsed=new DOMParser().parseFromString(html,'text/html'),config=sectionSettings(JSON.parse(parsed.body.dataset.sectionConfig||'{}')),parity=config.type==='evenPage'?0:config.type==='oddPage'?1:null;
  if(count&&parity!==null&&(count+1)%2!==parity){const blank=container.lastElementChild.cloneNode(true);blank.dataset.printBlank='true';blank.dataset.printNumber=String(number++);blank.querySelectorAll('.pagedjs_page_content,.pagedjs_margin-content').forEach(n=>n.replaceChildren());container.append(blank);count++;}
  const stage=owner.createElement('iframe');stage.style.cssText='position:fixed;left:-30000px;top:0;width:1400px;height:1100px;border:0';stage.setAttribute('sandbox','allow-scripts allow-same-origin');owner.body.append(stage);stages.push(stage);const result=await renderPrintFrame(stage,html,{pageOffset:count,numberStart:number});const source=result.document;
  if(!index)for(const style of source.querySelectorAll('style'))styles.push(style.cloneNode(true));
  for(const page of source.querySelectorAll('.pagedjs_page')){const clone=page.cloneNode(true),computed=stage.contentWindow.getComputedStyle(page);for(const key of computed)if(key.startsWith('--'))clone.style.setProperty(key,computed.getPropertyValue(key));const rect=page.getBoundingClientRect();clone.style.width=rect.width+'px';clone.style.height=rect.height+'px';clone.style.font=stage.contentWindow.getComputedStyle(source.body).font;clone.style.page='arlesSection'+index;clone.dataset.printSection=String(index);container.append(clone);count++;number=Number(page.dataset.printNumber)+1;}
  const first=source.querySelector('.pagedjs_page');if(first){const rule=d.createElement('style');rule.textContent='@page arlesSection'+index+'{size:'+first.offsetWidth+'px '+first.offsetHeight+'px;margin:0}';styles.push(rule);}
 }
 d.head.replaceChildren(...styles);d.body.replaceChildren(container);for(const el of container.querySelectorAll('[data-word-pages]'))el.textContent=String(count);return {pages:count,document:d};
 }finally{stages.forEach(s=>s.remove());}
}
export async function openPrintPreview(html){
 const dialog=document.createElement('dialog');dialog.className='nd-print-dialog';dialog.style.cssText='width:96vw;max-width:1500px;height:94vh;max-height:94vh;padding:0;border:1px solid #aac4b6;border-radius:12px;background:#f1f5f1';
 dialog.innerHTML='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px;background:#154d3e;color:white"><strong>Vista previa de impresión</strong><span role="status" style="flex:1">Preparando páginas…</span><label>Página <select data-print-page disabled></select></label><label>Zoom <select data-print-zoom disabled><option value="fit">Ajustar</option><option value="0.75">75 %</option><option value="1">100 %</option><option value="1.25">125 %</option></select></label><button data-print-now disabled>Imprimir / Guardar PDF</button><button data-print-close aria-label="Cerrar vista de impresión">Cerrar</button></div><iframe title="Páginas para imprimir" style="width:100%;height:calc(100% - 65px);border:0" sandbox="allow-scripts allow-same-origin allow-modals"></iframe>';
 dialog.querySelectorAll('button').forEach(b=>b.style.cssText='color:#154d3e;background:white;border:1px solid #a6c6b6;border-radius:5px;padding:8px 12px;cursor:pointer');
 dialog.querySelectorAll('select').forEach(n=>n.style.cssText='color:#154d3e;background:white;padding:6px;border-radius:4px');document.body.append(dialog);dialog.showModal();dialog.style.display='flex';dialog.style.flexDirection='column';const frame=dialog.querySelector('iframe'),button=dialog.querySelector('[data-print-now]'),status=dialog.querySelector('[role=status]');frame.style.flex='1';frame.style.minHeight='0';const close=()=>{frame.srcdoc='';dialog.remove();};dialog.querySelector('[data-print-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});button.onclick=()=>{frame.contentWindow.focus();frame.contentWindow.print();};
 try{const result=await renderPrintFrame(frame,html);if(dialog.isConnected){status.textContent=result.pages+' páginas · Revisa el diseño antes de imprimir';button.disabled=false;const pages=[...result.document.querySelectorAll('.pagedjs_page')],pick=dialog.querySelector('[data-print-page]'),zoom=dialog.querySelector('[data-print-zoom]');pick.innerHTML=pages.map((_,i)=>'<option value="'+i+'">'+(i+1)+'</option>').join('');pick.disabled=zoom.disabled=false;pick.onchange=()=>pages[Number(pick.value)]?.scrollIntoView({block:'start'});zoom.onchange=()=>{const ratio=zoom.value==='fit'?Math.min(1,(frame.clientWidth-40)/Math.max(800,...pages.map(p=>p.offsetWidth))):Number(zoom.value);result.document.querySelector('.pagedjs_pages').style.zoom=String(ratio);};zoom.onchange();}}catch(e){if(dialog.isConnected)status.textContent=e.message;}
 return dialog;
}
