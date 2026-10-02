import {attachView} from './native-view.js';
import {attachTracking,copyTracking} from './native-tracking.js';
import {attachMerge} from './native-merge.js';
import {copyMergeData} from './native-merge-model.js';
import {attachReferences,copyReferenceData,refreshReferences} from './native-references.js';
import {normalizePage,pageGeometry} from './native-page-layout.js';
import {attachLayout} from './native-layout-ribbon.js';
import {signatureSettings} from './native-signature.js';
import {artSettings} from './native-art.js';
import {attachObjectDeletion} from './native-object-deletion.js';
import {attachContextRibbon} from './native-context-ribbon.js';
import {applyBox} from './native-text-boxes.js';
import {validateChart} from './native-chart-model.js';
import {validateDiagram} from './native-diagram-model.js';
import {attachInsert} from './native-insert.js';
import {attachHome} from './native-home.js';
import {attachInteraction} from './native-interaction.js';
import {attachObjectTools} from './native-objects.js';
import {styleRibbon} from './native-ribbon.js';
import {addImage,hydrateImages} from './native-assets.js';
import {identityControls} from './native-identity.js';
export const fonts=['Arial','Calibri','Times New Roman','Georgia','Verdana','Courier New'];
export const pageSettings=normalizePage;
export function applyPage(paper,value){const p=pageSettings(value),g=pageGeometry(p);paper.style.setProperty('--page-width',g.width+'mm');paper.style.setProperty('--page-height',g.height+'mm');paper.style.setProperty('--page-margin',p.margin+'mm');paper.style.paddingLeft=p.left+'mm';paper.style.paddingRight=p.right+'mm';paper.style.paddingTop=p.top+'mm';paper.style.paddingBottom=p.bottom+'mm';paper.style.columnCount=String(p.columns);paper.style.columnGap=p.columnGap+'mm';paper.style.columnRule=p.columnRule?'1px solid #789184':'none';paper.style.hyphens=p.hyphens;paper.lang='es';let sheet=paper.previousElementSibling?.matches('style[data-page-body]')?paper.previousElementSibling:null;if(!sheet){sheet=document.createElement('style');sheet.dataset.pageBody='true';paper.before(sheet);}sheet.textContent=p.normProfile?`#nd-paper>p{font-family:${p.bodyStyle.font};font-size:${p.bodyStyle.size}pt;line-height:${p.bodyStyle.line};text-align:${p.bodyStyle.align};text-indent:${p.bodyStyle.first}pt;margin-top:0;margin-bottom:${p.bodyStyle.after}pt}`:'';}
export function printStyles(value){const p=pageSettings(value),g=pageGeometry(p);return `@page{size:${g.width}mm ${g.height}mm;margin:${p.top}mm ${p.right}mm ${p.bottom}mm ${p.left}mm}body{column-count:${p.columns};column-gap:${p.columnGap}mm;column-rule:${p.columnRule?'1px solid #789184':'none'};hyphens:${p.hyphens}}[data-layout-break=page],[data-layout-break=nextPage]{break-after:page}[data-layout-break=column]{break-after:column}[data-layout-break=evenPage]{break-after:left}[data-layout-break=oddPage]{break-after:right}[data-layout-break]{height:0;margin:0;border:0}body{font:${p.bodyStyle.size}pt ${p.bodyStyle.font};line-height:${p.bodyStyle.line};color:#182f29}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #888;padding:8px;overflow-wrap:anywhere}${p.normProfile?`body>p{font-family:${p.bodyStyle.font};font-size:${p.bodyStyle.size}pt;line-height:${p.bodyStyle.line};text-align:${p.bodyStyle.align};text-indent:${p.bodyStyle.first}pt;margin-top:0;margin-bottom:${p.bodyStyle.after}pt}`:''}[data-heading-number]::before{content:attr(data-heading-number) ' '}h1,h2,h3{break-after:avoid}[data-page-break]{break-after:page;page-break-after:always;height:0!important;margin:0!important;padding:0!important;border:0!important}[data-page-break]::after{display:none}tr{break-inside:avoid}ol[data-multilevel],ol[data-multilevel] ol{counter-reset:arles-list;list-style:none;padding-left:28px}ol[data-multilevel] li{counter-increment:arles-list}ol[data-multilevel] li::before{content:counters(arles-list,'.') '. '}`;}
export function copySafeStyles(node,result){
 copyTracking(node,result);copyReferenceData(node,result);copyMergeData(node,result);
 if(node.tagName==='DIV'&&node.dataset.textBox){try{applyBox(result,JSON.parse(node.dataset.textBox));return;}catch{}}
 if(node.tagName==='IMG'&&node.dataset.shape){try{const m=JSON.parse(node.dataset.shape);if(typeof m.id==='string'&&m.id.length<80&&/^#[a-f0-9]{6}$/i.test(m.fill)&&/^#[a-f0-9]{6}$/i.test(m.stroke))result.dataset.shape=JSON.stringify({id:m.id,fill:m.fill,stroke:m.stroke,text:String(m.text||'').slice(0,24)});}catch{}}
 if(node.tagName==='IMG'&&node.dataset.art){try{result.dataset.art=JSON.stringify(artSettings(JSON.parse(node.dataset.art)));}catch{}}
 if(node.tagName==='IMG'&&node.dataset.signature){try{result.dataset.signature=JSON.stringify(signatureSettings(JSON.parse(node.dataset.signature)));}catch{}}
 if(node.tagName==='SPAN'&&node.dataset.dropCap==='true'){result.dataset.dropCap='true';Object.assign(result.style,{fontSize:'36pt',fontWeight:'bold',cssFloat:'left',lineHeight:'1',marginRight:'6px',marginTop:'0',marginBottom:'0'});return;}
 if(['page','column','nextPage','continuous','evenPage','oddPage'].includes(node.dataset.layoutBreak)){result.dataset.layoutBreak=node.dataset.layoutBreak;result.contentEditable='false';}
 if(node.dataset.suppressLineNumbers==='true')result.dataset.suppressLineNumbers='true';
 if(node.tagName==='BR'&&node.style.clear==='both')result.style.clear='both';
 const s=node.style;
 if(node.tagName==='TABLE'&&s.borderCollapse==='collapse')result.style.borderCollapse='collapse';
 if(node.tagName==='LI'&&s.listStyleType==='none')result.style.listStyleType='none';
 if(node.tagName==='TABLE'&&/^[a-f0-9-]{36}$/.test(node.dataset.chartTable||''))result.dataset.chartTable=node.dataset.chartTable;
 if(node.tagName==='IMG'&&/^[a-f0-9-]{36}$/.test(node.dataset.chartId||''))result.dataset.chartId=node.dataset.chartId;
 if(node.tagName==='IMG'&&node.dataset.chart){try{result.dataset.chart=JSON.stringify(validateChart(JSON.parse(node.dataset.chart)));}catch{}}
 if(node.tagName==='IMG'&&node.dataset.diagram){try{result.dataset.diagram=JSON.stringify(validateDiagram(JSON.parse(node.dataset.diagram)));}catch{}} 
 if(node.tagName==='OL'&&node.dataset.multilevel==='true')result.dataset.multilevel='true';
 for(const prop of ['color','backgroundColor'])if(/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(s[prop]))result.style[prop]=s[prop];
 const family=s.fontFamily.replaceAll('"','').replaceAll("'",'');if(/^[\p{L}\p{N} _,-]{1,100}$/u.test(family))result.style.fontFamily=family;
 if(/^(\d+(\.\d+)?)(px|pt)$/.test(s.fontSize)&&parseFloat(s.fontSize)>=6&&parseFloat(s.fontSize)<=96)result.style.fontSize=s.fontSize;
 if(['bold','normal','400','700'].includes(s.fontWeight))result.style.fontWeight=s.fontWeight;
 if(['italic','normal'].includes(s.fontStyle))result.style.fontStyle=s.fontStyle;
 if(['underline','line-through','none'].includes(s.textDecorationLine))result.style.textDecorationLine=s.textDecorationLine;
 if((/^\d+(\.\d+)?$/.test(s.lineHeight)&&Number(s.lineHeight)>=.5&&Number(s.lineHeight)<=5)||(/^\d+(\.\d+)?(pt|px)$/.test(s.lineHeight)&&parseFloat(s.lineHeight)<=200))result.style.lineHeight=s.lineHeight;
 for(const prop of ['marginTop','marginBottom','marginLeft','marginRight','textIndent'])if(/^(0|-?\d+(\.\d+)?(px|pt))$/.test(s[prop])&&Math.abs(parseFloat(s[prop]))<=300)result.style[prop]=s[prop];
 if(node.tagName==='FONT'){
  if(fonts.includes(node.getAttribute('face')))result.style.fontFamily=node.getAttribute('face');
  if(/^#[\da-f]{6}$/i.test(node.getAttribute('color')||''))result.style.color=node.getAttribute('color');
 }
 if(['TD','TH'].includes(node.tagName)){for(const attr of ['colspan','rowspan']){const n=Number(node.getAttribute(attr));if(Number.isInteger(n)&&n>=1&&n<=20)result.setAttribute(attr,n);}}
 if(['TABLE','TD','TH','IMG'].includes(node.tagName)){
  for(const prop of ['borderWidth','padding'])if(/^\d+(\.\d+)?px$/.test(s[prop])&&parseFloat(s[prop])<=40)result.style[prop]=s[prop];
  if(['solid','dashed','dotted','none'].includes(s.borderStyle))result.style.borderStyle=s.borderStyle;
  if(/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(s.borderColor))result.style.borderColor=s.borderColor;
  if(['top','middle','bottom'].includes(s.verticalAlign))result.style.verticalAlign=s.verticalAlign;
  if(node.tagName!=='IMG'&&/^\d+(\.\d+)?%$/.test(s.width)&&parseFloat(s.width)<=100)result.style.width=s.width;
 }
 if(node.tagName==='TABLE'&&node.dataset.tableMoved==='true'){result.dataset.tableMoved='true';for(const prop of ['marginLeft','marginTop'])result.style[prop]=Math.max(0,Math.min(2000,parseFloat(s[prop])||0))+'px';result.style.marginRight='0';}
 if(node.tagName==='TR'&&/^\d+(\.\d+)?px$/.test(s.height)&&parseFloat(s.height)<=500)result.style.height=s.height;
 if(node.tagName==='TABLE'&&['left','center','right'].includes(node.dataset.tableAlign)){result.dataset.tableAlign=node.dataset.tableAlign;result.style.marginLeft=node.dataset.tableAlign==='left'?'0':'auto';result.style.marginRight=node.dataset.tableAlign==='right'?'0':'auto';}
 if(node.tagName==='IMG'){const rotation=Number(node.dataset.rotation);if(Number.isFinite(rotation)&&rotation>=0&&rotation<360){result.dataset.rotation=String(rotation);result.style.transform=`rotate(${rotation}deg)`;}if(['inline','left','right','square','front','behind','independent'].includes(node.dataset.wrap)){result.dataset.wrap=node.dataset.wrap;result.style.cssFloat=['left','right'].includes(node.dataset.wrap)?node.dataset.wrap:'none';if(node.dataset.wrap==='square'){for(const axis of ['x','y'])result.dataset[axis]=String(Math.max(0,Math.min(2000,Number(node.dataset[axis])||0)));result.dataset.wrapSide=node.dataset.wrapSide==='right'?'right':'left';result.style.cssFloat=result.dataset.wrapSide;result.style.marginLeft=result.dataset.wrapSide==='right'?'12px':result.dataset.x+'px';result.style.marginTop=result.dataset.y+'px';result.style.marginRight=result.dataset.wrapSide==='right'?'max(0px, calc(100% - '+(parseFloat(node.style.width)||60)+'% - '+result.dataset.x+'px))':'12px';result.style.marginBottom='12px';result.style.shapeOutside='inset('+result.dataset.y+'px 0 0 0) margin-box';}if(['front','behind','independent'].includes(node.dataset.wrap)){result.style.position='absolute';result.style.margin='0';result.style.zIndex=node.dataset.wrap==='behind'?'-1':'1';for(const axis of ['x','y'])result.dataset[axis]=String(Math.max(-2000,Math.min(2000,Number(node.dataset[axis])||0)));result.style.left=result.dataset.x+'px';result.style.top=result.dataset.y+'px';}}}
 if(node.dataset.imageAnchor==='true'&&['P','DIV'].includes(node.tagName)){result.dataset.imageAnchor='true';result.style.position='relative';result.style.isolation='isolate';}
 if(node.dataset.bookmark&&/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(node.dataset.bookmark)){result.dataset.bookmark=node.dataset.bookmark;result.id=node.dataset.bookmark;}
 if(node.dataset.pageBreak==='true'){result.dataset.pageBreak='true';result.contentEditable='false';result.setAttribute('aria-label','Salto de página');}
 if(node.tagName==='IMG'&&/^[0-9a-f-]{36}$/i.test(node.dataset.imageId||'')){result.dataset.imageId=node.dataset.imageId;result.alt=String(node.alt||'Imagen').slice(0,180);result.style.width=Math.min(100,Math.max(10,parseFloat(node.style.width)||60))+'%';result.dataset.imageAlign=['left','center','right'].includes(node.dataset.imageAlign)?node.dataset.imageAlign:'center';if(/^\d+(\.\d+)?%$/.test(s.marginLeft)&&parseFloat(s.marginLeft)<=90){result.style.marginLeft=s.marginLeft;result.style.marginRight='0';}}
}
const button=(cmd,label)=>`<button type="button" data-command="${cmd}">${label}</button>`;
export function toolsHTML(value){const p=pageSettings(value);return `<nav class="nd-ribbon-tabs" aria-label="Herramientas del documento">${['Inicio','Insertar','Disposición'].map((s,i)=>`<button type="button" data-ribbon="${i}" aria-pressed="${i===0}">${s}</button>`).join('')}</nav>
 <section class="nd-ribbon-panel" data-panel="0"><div class="nd-tool-group"><label>Fuente<select data-text-style="fontFamily">${fonts.map(f=>`<option>${f}</option>`).join('')}</select></label><label>Tamaño<select data-text-style="fontSize">${[8,9,10,11,12,14,16,18,20,24,28,36,48,72].map(n=>`<option value="${n}pt" ${n===12?'selected':''}>${n}</option>`).join('')}</select></label>${button('bold','Negrita')}${button('italic','Cursiva')}${button('underline','Subrayado')}<label>Color<input type="color" value="#182f29" data-text-style="color"></label><label>Resaltado<input type="color" value="#fff19b" data-text-style="backgroundColor"></label></div>
 <div class="nd-tool-group">${[['justifyLeft','Izquierda'],['justifyCenter','Centrar'],['justifyRight','Derecha'],['justifyFull','Justificar'],['insertUnorderedList','Viñetas'],['insertOrderedList','Numeración']].map(([c,l])=>button(c,l)).join('')}<label>Interlineado<select data-paragraph="lineHeight">${['1','1.15','1.5','2'].map(v=>`<option ${v==='1.5'?'selected':''}>${v}</option>`).join('')}</select></label><label>Espacio antes<select data-paragraph="marginTop">${[0,6,12,18,24].map(v=>`<option value="${v}pt">${v} pt</option>`).join('')}</select></label><label>Después<select data-paragraph="marginBottom">${[0,6,12,18,24].map(v=>`<option value="${v}pt">${v} pt</option>`).join('')}</select></label><button data-indent="-1">Menos sangría</button><button data-indent="1">Más sangría</button></div>
 <div class="nd-tool-group"><button data-block="h1">Título</button><button data-block="h2">Subtítulo</button><button data-block="p">Párrafo</button>${button('removeFormat','Limpiar formato')}${button('undo','Deshacer')}${button('redo','Rehacer')}</div></section>
 <section class="nd-ribbon-panel" data-panel="1" hidden><div class="nd-tool-group"><button data-tool="page-break">Salto de página</button><span>Ctrl + Enter</span></div><div class="nd-tool-group"><label>Filas<input id="nd-rows" type="number" value="3" min="1" max="20"></label><label>Columnas<input id="nd-columns" type="number" value="3" min="1" max="10"></label><button data-tool="insert-table">Insertar tabla</button></div><div class="nd-tool-group" id="nd-cell-tools" hidden><span>Celda seleccionada</span>${[['row-add','Añadir fila'],['row-delete','Eliminar fila'],['column-add','Añadir columna'],['column-delete','Eliminar columna'],['merge','Combinar con derecha'],['table-delete','Eliminar tabla']].map(([v,l])=>`<button data-tool="${v}">${l}</button>`).join('')}<label>Sombreado<input type="color" value="#edf3e4" data-cell-color></label></div><small>Selecciona una celda para editar su tabla.</small></section>
 <section class="nd-ribbon-panel" data-panel="2" hidden><div class="nd-tool-group"><label>Papel<select data-page="size"><option value="A4" ${p.size==='A4'?'selected':''}>A4</option><option value="Letter" ${p.size==='Letter'?'selected':''}>Carta</option></select></label><label>Orientación<select data-page="orientation"><option value="portrait" ${p.orientation==='portrait'?'selected':''}>Vertical</option><option value="landscape" ${p.orientation==='landscape'?'selected':''}>Horizontal</option></select></label><label>Márgenes<select data-page="margin">${[10,20,25,30].map(n=>`<option value="${n}" ${p.margin===n?'selected':''}>${n} mm</option>`).join('')}</select></label></div><small>Los saltos manuales se marcan en la hoja. La paginación automática se calcula al imprimir.</small></section>`;}

export function attachTools(modal,{changed,getPage,setPage,getIdentity=()=>({}),setIdentity=()=>{},getReview=()=>[],setReview=()=>{},doc={}}){
 const paper=modal.querySelector('#nd-paper'),bar=modal.querySelector('.nd-toolbar');if(!paper||!bar)return;
 const imageGroup=document.createElement('div');imageGroup.className='nd-tool-group';imageGroup.innerHTML='<button data-tool="image-upload">Insertar imagen</button><input type="file" id="nd-image-file" accept="image/png,image/jpeg,image/webp" hidden><span>PNG, JPG o WebP · máximo 5 MB</span><div id="nd-image-tools" hidden><label>Ancho<select data-image-width><option value="25">25 %</option><option value="50">50 %</option><option value="60">60 %</option><option value="75">75 %</option><option value="100">100 %</option></select></label><label>Alineación<select data-image-align><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></label><label>Descripción<input data-image-alt maxlength="180"></label><button data-tool="image-delete">Eliminar imagen</button></div>';bar.querySelector('[data-panel="1"]').prepend(imageGroup);
 const identityPanel=document.createElement('section');identityPanel.className='nd-ribbon-panel';identityPanel.dataset.panel='3';identityPanel.hidden=true;identityPanel.innerHTML=identityControls(doc,getIdentity());bar.append(identityPanel);styleRibbon(bar);
 let range=null,selectedImage=null;const snapshots=[{html:paper.innerHTML,page:getPage(),identity:getIdentity(),review:getReview()}];let cursor=0;
 function remember(){const s=window.getSelection();if(s.rangeCount&&paper.contains(s.anchorNode)&&paper.contains(s.focusNode)){range=s.getRangeAt(0).cloneRange();bar.querySelector('#nd-cell-tools').hidden=!cell();}}
 function focus(){paper.focus();const s=window.getSelection();if(range&&paper.contains(range.startContainer)&&paper.contains(range.endContainer)){s.removeAllRanges();s.addRange(range);}else{const r=document.createRange();r.selectNodeContents(paper);r.collapse(false);s.removeAllRanges();s.addRange(r);}return s;}
 function commit(){refreshReferences(paper);const current={html:paper.innerHTML,page:getPage(),identity:getIdentity(),review:getReview()};if(JSON.stringify(current)!==JSON.stringify(snapshots[cursor])){snapshots.splice(cursor+1);snapshots.push(current);if(snapshots.length>100)snapshots.shift();cursor=snapshots.length-1;changed();}remember();}
 function history(delta){const next=cursor+delta;if(next<0||next>=snapshots.length)return;cursor=next;paper.innerHTML=snapshots[cursor].html;hydrateImages(paper);setPage(snapshots[cursor].page);setIdentity(snapshots[cursor].identity);setReview(snapshots[cursor].review);selectedImage=null;bar.querySelector('#nd-image-tools').hidden=true;range=null;changed();focus();}
 function cell(){let n=range?.startContainer;if(n?.nodeType===3)n=n.parentElement;return n?.closest?.('td,th');}
 function paragraph(prop,value){focus();let blocks=[...paper.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,blockquote,td,th,div:not([data-page-break])')].filter(n=>window.getSelection().getRangeAt(0).intersectsNode(n));blocks=blocks.filter(n=>!blocks.some(child=>child!==n&&n.contains(child)));if(!blocks.length){document.execCommand('formatBlock',false,'p');remember();let n=range?.startContainer;if(n?.nodeType===3)n=n.parentElement;blocks=[n?.closest('p')].filter(Boolean);}for(const n of blocks)n.style[prop]=typeof value==='function'?value(n):value;}
 paper.addEventListener('mouseup',remember);paper.addEventListener('keyup',remember);paper.addEventListener('input',commit);
 paper.addEventListener('click',e=>{const c=e.target.closest('td,th');if(c&&paper.contains(c)){const s=getSelection();if(!c.contains(s.anchorNode)){const r=document.createRange();r.selectNodeContents(c);r.collapse(true);s.removeAllRanges();s.addRange(r);}remember();}});
 paper.addEventListener('click',e=>{selectedImage=e.target.closest('img[data-image-id]');paper.querySelectorAll('.nd-image-selected').forEach(n=>n.classList.remove('nd-image-selected'));bar.querySelector('#nd-image-tools').hidden=!selectedImage;if(selectedImage){selectedImage.classList.add('nd-image-selected');bar.querySelector('[data-image-width]').value=parseFloat(selectedImage.style.width)||60;bar.querySelector('[data-image-align]').value=selectedImage.dataset.imageAlign||'center';bar.querySelector('[data-image-alt]').value=selectedImage.alt;}});
 bar.querySelector('#nd-image-file').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;const button=bar.querySelector('[data-tool=image-upload]');button.disabled=true;try{const asset=await addImage(file);if(!modal.contains(paper))return;focus();const img=document.createElement('img');img.dataset.imageId=asset.id;img.dataset.imageAlign='center';img.alt=asset.alt;img.style.width='60%';document.execCommand('insertHTML',false,img.outerHTML+'<p><br></p>');await hydrateImages(paper);commit();}catch(err){modal.querySelector('#nd-error').textContent=err.message;}finally{button.disabled=false;}});
 bar.addEventListener('pointerdown',()=>remember());
 bar.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.closest('.nd-actions'))return;e.stopPropagation();
  if(b.dataset.ribbon!==undefined){bar.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==b.dataset.ribbon);bar.querySelectorAll('[data-ribbon]').forEach(t=>t.setAttribute('aria-pressed',t===b));return;}
  focus();modal.querySelector('#nd-error').textContent='';
  if(b.dataset.command==='undo')return history(-1);if(b.dataset.command==='redo')return history(1);
  if(b.dataset.command==='insertOrderedList'){let n=getSelection().anchorNode;n=n?.nodeType===3?n.parentElement:n;let list=n?.closest('ol');if(list){while(list.parentElement.closest('ol'))list=list.parentElement.closest('ol');if(list.dataset.multilevel){delete list.dataset.multilevel;commit();return;}}}
  if(b.dataset.command)document.execCommand(b.dataset.command,false);
  if(b.dataset.block){document.execCommand('formatBlock',false,b.dataset.block);const active=getSelection().getRangeAt(0);for(const n of paper.querySelectorAll('p,h1,h2,h3,h4,h5,h6'))if(active.intersectsNode(n)){delete n.dataset.outlineLevel;if(b.dataset.block==='h1')n.dataset.documentTitle='true';else delete n.dataset.documentTitle;}}
  if(b.dataset.indent)paragraph('marginLeft',n=>Math.min(120,Math.max(0,parseFloat(n.style.marginLeft||0)+Number(b.dataset.indent)*24))+'pt');
  const action=b.dataset.tool;
  if(action==='image-upload'){bar.querySelector('#nd-image-file').click();return;}
  if(action==='image-delete'&&selectedImage){selectedImage.remove();selectedImage=null;bar.querySelector('#nd-image-tools').hidden=true;}
  if(action==='page-break'){
   if(cell()){modal.querySelector('#nd-error').textContent='Coloca el cursor fuera de la tabla para insertar el salto de página.';return;}
   document.execCommand('insertHTML',false,'<div data-page-break="true" contenteditable="false" aria-label="Salto de página"><br></div><p><br></p>');
  }
  if(action==='insert-table'){
   const rows=Number(bar.querySelector('#nd-rows').value),cols=Number(bar.querySelector('#nd-columns').value);
   if(!Number.isInteger(rows)||rows<1||rows>20||!Number.isInteger(cols)||cols<1||cols>10){modal.querySelector('#nd-error').textContent='Usa de 1 a 20 filas y de 1 a 10 columnas.';return;}
   if(cell()){modal.querySelector('#nd-error').textContent='Coloca el cursor fuera de la tabla.';return;}
   document.execCommand('insertHTML',false,'<table><tbody>'+Array.from({length:rows},()=>'<tr>'+Array.from({length:cols},()=>'<td><br></td>').join('')+'</tr>').join('')+'</tbody></table><p><br></p>');
  }
  if(['row-add','row-delete','column-add','column-delete','merge','table-delete'].includes(action)){
   const c=cell();if(!c)return;const row=c.parentElement,table=c.closest('table'),index=c.cellIndex;
   if((action.startsWith('column-')||action.startsWith('row-'))&&table.querySelector('[colspan]:not([colspan="1"]),[rowspan]:not([rowspan="1"])')){modal.querySelector('#nd-error').textContent='Deshaz la combinación de celdas antes de cambiar columnas.';return;}
   if(action==='row-add'){const next=row.cloneNode(true);next.querySelectorAll('td,th').forEach(c=>c.innerHTML='<br>');row.after(next);}
   if(action==='row-delete'){if(table.rows.length===1)table.remove();else row.remove();}
   if(action==='column-add')for(const r of table.rows){const n=document.createElement('td');n.innerHTML='<br>';r.cells[index].after(n);}
   if(action==='column-delete'){if(row.cells.length===1)table.remove();else for(const r of table.rows)r.cells[index]?.remove();}
   if(action==='merge'){const next=c.nextElementSibling;if(next&&c.rowSpan===1&&next.rowSpan===1){c.colSpan+=next.colSpan;c.innerHTML+='<br>'+next.innerHTML;next.remove();}}
   if(action==='table-delete')table.remove();
   if(!paper.children.length)paper.innerHTML='<p><br></p>';
  }
  commit();
 });
 bar.addEventListener('input',e=>{const el=e.target;if(el.dataset.identity==='footer'){setIdentity({...getIdentity(),footer:el.value});commit();}});
 bar.addEventListener('change',e=>{
  const el=e.target;if(el.dataset.page){setPage({...getPage(),[el.dataset.page]:el.value});commit();return;}
  if(el.dataset.identity){setIdentity({...getIdentity(),[el.dataset.identity]:el.type==='checkbox'?el.checked:el.value});commit();return;}
  if(selectedImage&&paper.contains(selectedImage)){if(el.hasAttribute('data-image-width'))selectedImage.style.width=el.value+'%';if(el.hasAttribute('data-image-align'))selectedImage.dataset.imageAlign=el.value;if(el.hasAttribute('data-image-alt'))selectedImage.alt=el.value;if(el.matches('[data-image-width],[data-image-align],[data-image-alt]')){commit();return;}}
  focus();
  if(el.dataset.textStyle){const prop=el.dataset.textStyle,r=window.getSelection().getRangeAt(0);if(r.collapsed){modal.querySelector('#nd-error').textContent='Selecciona el texto al que deseas aplicar este formato.';return;}
   const walker=document.createTreeWalker(paper,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(r.intersectsNode(n)&&n.length)nodes.push({n,start:n===r.startContainer?r.startOffset:0,end:n===r.endContainer?r.endOffset:n.length});}
   for(const {n,start,end} of nodes.reverse()){if(end<=start)continue;const part=document.createRange();part.setStart(n,start);part.setEnd(n,end);const span=document.createElement('span');span.style[prop]=el.value;part.surroundContents(span);}
   range=null;
  }
  if(el.dataset.paragraph)paragraph(el.dataset.paragraph,el.value);
  if(el.hasAttribute('data-cell-color')&&cell())cell().style.backgroundColor=el.value;
  commit();
 });
 attachReferences(modal,{focus,commit});attachMerge(modal,{focus,commit,doc,getPage,getIdentity});attachTracking(modal,{commit});attachView(modal,{doc,getPage,getIdentity,commit});attachLayout(modal,{getPage,setPage,focus,paragraph,commit,getIdentity,setIdentity});attachInsert(modal,{focus,commit,doc});attachHome(modal,{focus,commit});attachObjectTools(modal,{image:()=>selectedImage,cell,commit,focus});attachInteraction(modal,{commit,focus,cell});attachContextRibbon(modal,{commit});attachObjectDeletion(modal,{commit});
 paper.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopPropagation();history(e.key.toLowerCase()==='y'||e.shiftKey?1:-1);}
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();remember();bar.querySelector('[data-tool=page-break]').click();}
 });
}
