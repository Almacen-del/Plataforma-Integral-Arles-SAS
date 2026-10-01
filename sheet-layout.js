import {address,position,range,writable} from './sheet-model.js';
import {papers,PX_PER_MM,pageSettings,printPlan,normalizeAreas,pageBreak,organizeObjects,themePresets,validateTheme} from './sheet-layout-model.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const field=(key,label,value,type='text',extra='')=>'<label>'+esc(label)+'<input data-layout="'+key+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>';
const choice=(key,label,map,value,extra='')=>'<label>'+esc(label)+'<select data-layout="'+key+'" '+extra+'>'+Object.entries(map).map(([k,v])=>'<option value="'+esc(k)+'" '+(String(value)===k?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>';
const check=(key,label,value,extra='')=>'<label class="sx-layout-check"><input data-layout="'+key+'" type="checkbox" '+(value?'checked':'')+' '+extra+'>'+esc(label)+'</label>';
const fonts=Object.fromEntries(['Arial','Calibri','Georgia','Verdana','Courier New'].map(f=>[f,f]));
export function createLayoutController(api){
 const {dialog,sheet,book,selection,change,panel,notice}=api;
 let mode='',selected=new Set(),preview=null,backgroundTicket=0;
 const mutate=fn=>{try{writable(sheet());change(fn);refreshPanel();}catch(e){notice(e.message);}};
 const settings=()=>pageSettings(sheet().page);
 function ribbon({button,group}){
  const p=settings(),direct=(key,label,items,value)=>choice(key,label,items,value,'data-layout-direct="'+key+'"').replace('data-layout="'+key+'"','');
  return group('Temas',button('layout-themes','Temas','grid')+button('layout-colors','Colores','fill')+button('layout-fonts','Fuentes','font')+button('layout-effects','Efectos','shape'))+
   group('Configurar página',button('layout-margins','Márgenes','grid')+button('layout-orientation','Orientación','file')+button('layout-size','Tamaño','file')+button('layout-areas','Área de impresión','grid')+button('layout-breaks','Saltos','grid')+button('layout-background','Fondo','file')+button('layout-titles','Imprimir títulos','table'))+
   group('Ajustar área de impresión',direct('fitWidth','Ancho',{0:'Automático',1:'1 página',2:'2 páginas',3:'3 páginas',5:'5 páginas',10:'10 páginas'},p.fitWidth)+direct('fitHeight','Alto',{0:'Automático',1:'1 página',2:'2 páginas',3:'3 páginas',5:'5 páginas',10:'10 páginas'},p.fitHeight)+'<label>Escala<input type="number" min="10" max="400" data-layout-direct="scale" value="'+p.scale+'" '+(p.scaleMode==='fit'?'disabled':'')+'> %</label>')+
   group('Opciones de la hoja',check('viewGrid','Ver cuadrícula',sheet().grid,'data-layout-direct="viewGrid"')+check('printGrid','Imprimir cuadrícula',p.printGrid,'data-layout-direct="printGrid"')+check('viewHeadings','Ver encabezados',!sheet().hideHeadings,'data-layout-direct="viewHeadings"')+check('printHeadings','Imprimir encabezados',p.printHeadings,'data-layout-direct="printHeadings"'))+
   group('Organizar',button('layout-front','Traer adelante','shape')+button('layout-back','Enviar atrás','shape')+button('layout-selection','Panel de selección','grid')+button('layout-align','Alinear','align')+button('layout-group','Agrupar','grid')+button('layout-rotate','Girar','undo'))+
   group('Imprimir',button('print-preview','Vista previa','eye')+button('print-sheet','Imprimir / PDF','file')+button('page-settings','Configurar página','file'));
 }
 function openSettings(section='page'){
  mode='settings';const p=settings(),options=Object.fromEntries(Object.entries(papers).map(([n,[w,h]])=>[n,n+' · '+w+' × '+h+' mm']));
  const sections=[
   ['page','Página',choice('size','Papel',options,p.size,'data-page-size')+choice('orientation','Orientación',{portrait:'Vertical',landscape:'Horizontal'},p.orientation,'data-page-orientation')+choice('scaleMode','Escalado',{percent:'Porcentaje',fit:'Ajustar a páginas'},p.scaleMode)+field('scale','Escala (10–400 %)',p.scale,'number')+field('fitWidth','Páginas de ancho (0 = Automático)',p.fitWidth,'number')+field('fitHeight','Páginas de alto (0 = Automático)',p.fitHeight,'number')],
   ['margins','Márgenes',choice('marginPreset','Preajuste',{custom:'Personalizados',normal:'15 mm',wide:'25,4 mm',narrow:'6,35 mm'},'custom')+field('margin','Todos los lados (mm)',p.margin,'number','data-page-margin')+['top','right','bottom','left'].map((k,i)=>field('margin-'+k,['Superior','Derecho','Inferior','Izquierdo'][i]+' (mm)',p.margins[k],'number')).join('')+field('headerDistance','Encabezado desde el borde (mm)',p.headerDistance,'number')+field('footerDistance','Pie desde el borde (mm)',p.footerDistance,'number')+check('centerHorizontal','Centrar horizontalmente',p.centerHorizontal)+check('centerVertical','Centrar verticalmente',p.centerVertical)],
   ['titles','Hoja e impresión',field('repeatRows','Filas para repetir (ej. 1:2)',p.repeatRows)+field('repeatColumns','Columnas para repetir (ej. A:B)',p.repeatColumns)+check('printGrid','Imprimir líneas de cuadrícula',p.printGrid,'data-page-grid')+check('printHeadings','Imprimir letras y números de encabezados',p.printHeadings)+check('blackWhite','Blanco y negro',p.blackWhite)+choice('order','Orden de páginas',{down:'Hacia abajo y después a la derecha',over:'A la derecha y después hacia abajo'},p.order)+field('firstPage','Primer número de página',p.firstPage,'number')],
   ['footer','Encabezado y pie',field('header','Encabezado',p.header,'text','data-page-header')+field('footer','Pie de página',p.footer,'text','data-page-footer')+'<p>Campos: {hoja}, {libro}, {pagina}, {paginas}, {fecha}.</p>']
  ];
  panel('Configurar página','<div class="sx-layout-form">'+sections.map(([id,title,body])=>'<details '+(id===section?'open':'')+' data-layout-section="'+id+'"><summary>'+title+'</summary>'+body+'</details>').join('')+'<p data-layout-error role="alert"></p><button data-sx="apply-page-settings">Aplicar configuración</button><button data-sx="print-preview">Vista previa</button></div>');
 }
 function readSettings(){
  const p={...settings()},form=dialog.querySelector('.sx-layout-form');
  for(const n of form.querySelectorAll('[data-layout]')){const k=n.dataset.layout;if(k.startsWith('margin-'))p.margins[k.slice(7)]=Number(n.value);else if(k!=='marginPreset')p[k]=n.type==='checkbox'?n.checked:['margin','scale','fitWidth','fitHeight','firstPage','headerDistance','footerDistance'].includes(k)?Number(n.value):n.value;}
  return pageSettings(p);
 }
 function openAreas(){
  mode='areas';const areas=sheet().printRanges?.length?sheet().printRanges:sheet().printRange?[sheet().printRange]:[];
  panel('Área de impresión','<p>Cada rango se imprime por separado. Una combinación debe quedar completa dentro de su área.</p><label>Rangos (uno por línea)<textarea data-layout-areas rows="5">'+esc(areas.join('\n'))+'</textarea></label><button data-sx="print-range">Establecer selección</button><button data-sx="layout-add-area">Añadir selección</button><button data-sx="layout-save-areas">Aplicar rangos</button><button data-sx="clear-print-range">Borrar área de impresión</button><p data-layout-error role="alert"></p>');
 }
 function openBreaks(){
  mode='breaks';const b=sheet().pageBreaks||{};
  panel('Saltos de página','<p>El salto se inserta encima y a la izquierda de la celda activa. Ajustar a páginas ignora los saltos manuales.</p><button data-sx="layout-insert-break">Insertar salto</button><button data-sx="layout-remove-break">Quitar salto en la selección</button><button data-sx="layout-reset-breaks">Restablecer todos los saltos</button><p>Filas: '+(b.rows?.map(n=>n+1).join(', ')||'Ninguno')+' · Columnas: '+(b.columns?.map(n=>address(0,n)[0]).join(', ')||'Ninguno')+'</p>');
 }
 function openBackground(){
  mode='background';panel('Fondo de hoja','<p>Se repite en la cuadrícula y se guarda en el libro. No aparece en la impresión.</p><label>PNG, JPEG o WebP (hasta 1 MB)<input type="file" data-layout-background accept="image/png,image/jpeg,image/webp"></label><button data-sx="layout-clear-background">Eliminar fondo</button><p data-layout-error role="alert"></p>');
 }
 function openThemes(section='theme'){
  mode='themes';const t=book().theme||themePresets.arles;
  const presets={...themePresets,...Object.fromEntries((book().customThemes||[]).map((t,i)=>['custom'+i,t]))};
  panel('Tema del libro','<div class="sx-layout-theme"><p>Se aplica al libro. Los formatos manuales conservan sus fuentes y colores.</p><div class="sx-layout-themes">'+Object.entries(presets).map(([id,t])=>'<button data-layout-theme-preset="'+id+'">'+esc(t.name)+'<span>'+t.colors.map(c=>'<i style="background:'+c+'"></i>').join('')+'</span></button>').join('')+'</div>'+field('themeName','Nombre del tema',t.name)+
   '<details '+(section==='colors'?'open':'')+'><summary>Colores</summary>'+t.colors.map((c,i)=>field('themeColor'+i,'Énfasis '+(i+1),c,'color')).join('')+'</details>'+
   '<details '+(section==='fonts'?'open':'')+'><summary>Fuentes</summary>'+choice('bodyFont','Cuerpo',fonts,t.bodyFont)+choice('headingFont','Encabezados',fonts,t.headingFont)+'</details>'+
   '<details '+(section==='effects'?'open':'')+'><summary>Efectos de objetos</summary>'+choice('effect','Efecto',{plain:'Simple',subtle:'Suave',shadow:'Sombra'},t.effect)+'</details>'+
   '<button data-sx="layout-apply-theme">Aplicar al libro</button><button data-sx="layout-save-theme">Guardar tema personalizado</button>'+
   '<h3>Vincular la selección al tema</h3>'+choice('accent','Énfasis',Object.fromEntries(t.colors.map((_,i)=>[i,'Énfasis '+(i+1)])),0)+'<button data-sx="layout-theme-fill">Relleno de las celdas</button><button data-sx="layout-theme-font">Fuente del cuerpo en las celdas</button><button data-sx="layout-theme-objects">Color en objetos seleccionados</button><p data-layout-error role="alert"></p></div>');
 }
 function openObjects(){
  mode='objects';selected=new Set([...selected].filter(id=>sheet().insertObjects?.some(o=>o.id===id)));
  const controls={front:'Traer al frente',forward:'Traer adelante',back:'Enviar al fondo',backward:'Enviar atrás',left:'Alinear izquierda',center:'Centrar horizontal',right:'Alinear derecha',top:'Alinear arriba',middle:'Centrar vertical',bottom:'Alinear abajo','distribute-x':'Distribuir horizontal','distribute-y':'Distribuir vertical',group:'Agrupar',ungroup:'Desagrupar','rotate-right':'Girar 90° derecha','rotate-left':'Girar 90° izquierda','flip-x':'Voltear horizontal','flip-y':'Voltear vertical'};
  panel('Organizar objetos','<p>Selecciona objetos para alinearlos, distribuirlos, agruparlos o cambiar su orden.</p><div class="sx-layout-object-list">'+(sheet().insertObjects||[]).toReversed().map(o=>'<article><label><input type="checkbox" data-layout-object="'+o.id+'" '+(selected.has(o.id)?'checked':'')+'>'+esc(o.title)+(o.groupId?' · Grupo':'')+'</label><button data-layout-visibility="'+o.id+'" aria-label="'+(o.hidden?'Mostrar':'Ocultar')+' '+esc(o.title)+'">'+(o.hidden?'◌':'◉')+'</button></article>').join('')+'</div><div class="sx-layout-object-controls">'+Object.entries(controls).map(([id,label])=>'<button data-layout-organize="'+id+'">'+label+'</button>').join('')+'</div><p data-layout-error role="alert"></p>');
 }
 function refreshPanel(){if(mode==='areas')openAreas();else if(mode==='breaks')openBreaks();else if(mode==='objects')openObjects();else if(mode==='settings')openSettings();else if(mode==='themes')openThemes();else if(mode==='background')openBackground();else return false;return true;}
 const error=e=>{const n=dialog.querySelector('[data-layout-error]');if(n)n.textContent=e.message;else notice(e.message);};
 function showPreview(){
  try{const plan=printPlan(sheet());preview?.remove();preview=document.createElement('dialog');preview.className='sx-layout-preview';
   preview.innerHTML='<header><div><strong>Vista previa de impresión</strong><small>'+plan.pages.length+' páginas · '+plan.settings.size+' · Escala '+(plan.pages[0].scale*100).toFixed(1)+' %</small></div><button data-layout-print>Imprimir / PDF</button><button data-layout-close aria-label="Cerrar vista previa">×</button></header>'+(plan.warnings.length?'<p>'+esc(plan.warnings.join(' '))+'</p>':'')+'<iframe title="Páginas de impresión"></iframe>';
   dialog.append(preview);preview.querySelector('iframe').srcdoc=printDocument(plan);preview.querySelector('[data-layout-close]').onclick=()=>{preview.close();preview.remove();preview=null;};preview.querySelector('[data-layout-print]').onclick=()=>print(plan);preview.addEventListener('cancel',e=>{e.preventDefault();preview.querySelector('[data-layout-close]').click();});preview.showModal();
  }catch(e){error(e);}
 }
 function print(plan){
  try{plan||=printPlan(sheet());const w=window.open('','_blank');if(!w){notice('Permite abrir la ventana de impresión.');return;}w.document.write(printDocument(plan));w.document.close();w.focus();let printed=false;const run=async()=>{if(printed)return;printed=true;await w.document.fonts.ready;await Promise.all([...w.document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve;})));w.print();};w.onload=run;setTimeout(run,300);}catch(e){error(e);}
 }
 function printDocument(plan){
  const p=plan.settings,cellMap=new Map([...dialog.querySelectorAll('[data-sx-cell]')].map(n=>[n.dataset.sxCell,n])),objects=new Map([...dialog.querySelectorAll('[data-io-id]')].map(n=>[n.dataset.ioId,n]));
  const date=new Date().toLocaleDateString('es-CO');
  const pageText=(t,n)=>esc(String(t).replaceAll('{hoja}',sheet().name).replaceAll('{libro}',book().name).replaceAll('{pagina}',String(n)).replaceAll('{paginas}',String(plan.pages.length)).replaceAll('{fecha}',date));
  const content=plan.pages.map(pg=>{
   const rows=pg.allRows,cols=pg.allCols,covered=new Set(),mergeMap=new Map();
   for(const m of sheet().merges||[]){const refs=range(m),a=position(refs[0]),b=position(refs.at(-1)),rs=rows.filter(r=>r>=a[0]&&r<=b[0]),cs=cols.filter(c=>c>=a[1]&&c<=b[1]);if(rs.length&&cs.length){const anchor=address(rs[0],cs[0]);mergeMap.set(anchor,[rs.length,cs.length,refs[0]]);for(const r of rs)for(const c of cs)if(address(r,c)!==anchor)covered.add(address(r,c));}}
   const width=c=>sheet().columnWidths?.[c]||sheet().defaultWidth||112,height=r=>sheet().rowHeights?.[r]||27;
   let table='<table class="sp-grid"><colgroup>'+(p.printHeadings?'<col style="width:43px">':'')+cols.map(c=>'<col style="width:'+width(c)+'px">').join('')+'</colgroup>';
   if(p.printHeadings)table+='<thead><tr style="height:25px"><th></th>'+cols.map(c=>'<th>'+address(0,c)[0]+'</th>').join('')+'</tr></thead>';
   table+='<tbody>'+rows.map(r=>'<tr style="height:'+height(r)+'px">'+(p.printHeadings?'<th>'+(r+1)+'</th>':'')+cols.map(c=>{
    const id=address(r,c);if(covered.has(id))return '';const merge=mergeMap.get(id),original=cellMap.get(merge?.[2]||id),node=original?.cloneNode(true)||document.createElement('td');
    node.dataset.sheetPrintCell=merge?.[2]||id;node.style.position='relative';node.style.top='';node.style.left='';node.style.zIndex='';node.style.boxShadow='';node.querySelectorAll('.sx-vw-break-label,.sx-rv-note-callout').forEach(n=>n.remove());node.removeAttribute('class');node.removeAttribute('hidden');node.removeAttribute('data-sx-cell');node.style.display='table-cell';node.style.minWidth='0';node.style.maxWidth='none';node.style.width='';
    if(merge){node.rowSpan=merge[0];node.colSpan=merge[1];}else{node.removeAttribute('rowspan');node.removeAttribute('colspan');}
    node.querySelectorAll('.sx-cell-link,[data-table-filter]').forEach(n=>n.remove());node.querySelectorAll('input[type=checkbox]').forEach(n=>n.replaceWith(document.createTextNode(n.checked?'☑':'☐')));const cellHeight=rows.slice(rows.indexOf(r),rows.indexOf(r)+(merge?.[0]||1)).reduce((sum,row)=>sum+height(row),0),borderHeight=parseFloat(node.style.borderTopWidth||'0')+parseFloat(node.style.borderBottomWidth||'0'),wrapper=document.createElement('div');wrapper.className='sp-cell';wrapper.style.paddingLeft=node.style.paddingLeft;wrapper.style.height=Math.max(0,cellHeight-borderHeight-(p.printGrid&&!node.style.borderBottomWidth?1:0))+'px';wrapper.style.justifyContent=node.style.verticalAlign==='bottom'?'flex-end':node.style.verticalAlign==='middle'?'center':'flex-start';while(node.firstChild)wrapper.append(node.firstChild);node.append(wrapper);node.style.padding='0';node.style.height=cellHeight+'px';return node.outerHTML;
   }).join('')+'</tr>').join('')+'</tbody></table>';
   let art='';for(const o of [...(sheet().insertObjects||[]),...(sheet().formControls||[]).filter(o=>o.print!==false)]){if(o.hidden||!objects.has(o.id))continue;const x=pg.titleW+o.x-43-pg.x0,y=pg.titleH+o.y-25-pg.y0;if(x+o.width<0||y+o.height<0||x>pg.width||y>pg.height)continue;const node=objects.get(o.id).querySelector('.sx-io-body').cloneNode(true);node.querySelectorAll('button').forEach(b=>{const s=document.createElement('span');s.textContent=b.textContent;s.className='sp-filter';b.replaceWith(s);});node.querySelectorAll('select').forEach(n=>n.replaceWith(document.createTextNode(n.selectedOptions[0]?.textContent||'')));node.querySelectorAll('input').forEach(n=>n.replaceWith(document.createTextNode(n.type==='checkbox'?(n.checked?'☑':'☐'):n.type==='radio'?(n.checked?'◉':'○'):n.type==='range'&&n.closest('label')?.querySelector('output')?'':n.value)));art+='<div class="sp-object" style="left:'+x+'px;top:'+y+'px;width:'+o.width+'px;height:'+o.height+'px;transform:rotate('+(o.rotation||0)+'deg)">'+node.outerHTML+'</div>';}
   const x=p.margins.left*PX_PER_MM+(p.centerHorizontal?(plan.contentWidth-pg.width*pg.scale)/2:0),y=p.margins.top*PX_PER_MM+(p.centerVertical?(plan.contentHeight-pg.height*pg.scale)/2:0);
   return '<section class="sp-paper '+(p.blackWhite?'sp-mono':'')+'" data-page-number="'+pg.number+'" style="width:'+plan.paper[0]+'px;height:'+plan.paper[1]+'px"><header style="top:'+p.headerDistance+'mm">'+pageText(p.header,pg.number)+'</header><div class="sp-clip" style="left:'+x+'px;top:'+y+'px;width:'+pg.width*pg.scale+'px;height:'+pg.height*pg.scale+'px"><div class="sp-content" style="width:'+pg.width+'px;height:'+pg.height+'px;transform:scale('+pg.scale+')">'+table+art+'</div></div><footer style="bottom:'+p.footerDistance+'mm">'+pageText(p.footer,pg.number)+'</footer></section>';
  }).join('');
  return '<!doctype html><html lang="es"><meta charset="UTF-8"><title>'+esc(book().name)+'</title><style>@page{size:'+plan.paper[0]/PX_PER_MM+'mm '+plan.paper[1]/PX_PER_MM+'mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#e6e9ec;font:11pt Arial;color:#203d31}.sp-paper{position:relative;overflow:hidden;break-after:page;page-break-after:always;background:white;margin:20px auto;box-shadow:0 1px 7px #0003}.sp-paper:last-child{break-after:auto;page-break-after:auto}.sp-paper>header,.sp-paper>footer{position:absolute;left:15mm;right:15mm;text-align:center;white-space:pre-wrap;font:10pt Arial}.sp-clip{position:absolute;overflow:hidden}.sp-content{position:relative;transform-origin:top left}.sp-grid{border-collapse:separate;border-spacing:0;table-layout:fixed;width:100%}.sp-grid td{padding:3px 6px;overflow:hidden;position:relative;border-right:'+(p.printGrid?'1px solid #cbd5ce':'0')+';border-bottom:'+(p.printGrid?'1px solid #cbd5ce':'0')+'}.sp-grid th{font:10px Arial;background:#eef1ef;border-right:1px solid #cbd5ce;border-bottom:1px solid #cbd5ce}.sp-cell{overflow:hidden;position:relative;padding:3px 6px;display:flex;flex-direction:column;flex-shrink:0}.sx-cell-image{max-width:100%;height:auto;max-height:120px}.sx-cell-shape{width:100%;height:65px}.sx-linked-chart{width:100%;height:160px}.sx-cell-text{position:relative;z-index:1}.sx-data-bar{position:absolute;top:2px;bottom:2px}.sx-accounting{display:flex;justify-content:space-between}.sp-object{position:absolute;overflow:hidden}.sx-io-body{width:100%;height:100%;overflow:hidden;padding:10px}.sx-dv-body{display:flex;align-items:center;padding:5px 8px;border:1px solid #a9c3b1;border-radius:4px}.sx-dv-body>label{display:flex;align-items:center;gap:6px;width:100%;height:100%;margin:0}.sx-dv-body>fieldset{width:100%;height:100%;margin:0;border:1px solid #b7ccbd}.sx-dv-scroll.vertical{flex-direction:column}.sx-dv-label{white-space:pre-wrap;overflow-wrap:anywhere}.sx-io-body>svg{width:100%;height:auto;stroke:none;fill:#203d31}.sx-io-image{width:100%;height:100%;object-fit:contain}.sx-io-text{white-space:pre-wrap;overflow-wrap:anywhere}.sx-io-wordart{font-weight:800;text-shadow:2px 3px 0 #0002;letter-spacing:1px}.sx-io-wordart.outline{text-shadow:none;-webkit-text-stroke:1px currentColor;-webkit-text-fill-color:white}.sx-io-wordart.gradient{text-shadow:none;background:linear-gradient(120deg,currentColor,#75b8c9);background-clip:text;-webkit-text-fill-color:transparent}.sx-io-wordart.plain{text-shadow:none}.sx-io-table{border-collapse:collapse;width:100%;font-size:12px}.sx-io-table td,.sx-io-table th{border:1px solid #d7e3da;padding:7px;text-align:right}.sx-io-table .row-label{text-align:left}.sx-io-table th,.sx-io-table tr.total{background:#e3f0e7}.sx-io-table .subtotal{font-weight:bold}.sx-io-table.blue th{background:#e4edf9}[data-theme-effect=shadow]>svg{filter:drop-shadow(3px 4px 3px #0004)}[data-theme-effect=subtle]>svg{filter:drop-shadow(1px 2px 1px #0002)}.sp-filter{display:inline-block;padding:5px;margin:3px;border:1px solid #abcbb5}.sp-mono{filter:grayscale(1)}@media print{body{background:white}.sp-paper{margin:0;box-shadow:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>'+content+'</html>';
 }
 function action(a){
  if(['page-settings','layout-margins','layout-orientation','layout-size','layout-titles'].includes(a)){openSettings(a==='layout-margins'?'margins':a==='layout-titles'?'titles':'page');return true;}
  if(a==='apply-page-settings'){try{const p=readSettings();writable(sheet());change(()=>sheet().page=p);dialog.querySelector('.sx-ribbon').innerHTML=api.ribbon();notice('Configuración de página aplicada.');}catch(e){error(e);}return true;}
  if(a==='layout-areas'){openAreas();return true;}
  if(['print-range','layout-add-area','layout-save-areas','clear-print-range'].includes(a)){
   try{const existing=sheet().printRanges?.length?sheet().printRanges:sheet().printRange?[sheet().printRange]:[],sel=selection()[0]+':'+selection().at(-1);
    const raw=a==='clear-print-range'?[]:a==='print-range'?[sel]:a==='layout-add-area'?[...existing,sel]:dialog.querySelector('[data-layout-areas]').value.split(/[\n;]/).filter(s=>s.trim()),areas=normalizeAreas(raw,sheet());writable(sheet());change(()=>{sheet().printRanges=areas;if(areas.length)sheet().printRange=areas[0];else delete sheet().printRange;});if(mode==='areas')openAreas();notice(areas.length?'Área de impresión: '+areas.join('; '):'Área de impresión eliminada.');
   }catch(e){error(e);}return true;
  }
  if(a==='layout-breaks'){openBreaks();return true;}
  if(['layout-insert-break','layout-remove-break','layout-reset-breaks'].includes(a)){mutate(()=>pageBreak(sheet(),selection()[0],a==='layout-insert-break'?'insert':a==='layout-remove-break'?'remove':'reset'));return true;}
  if(a==='layout-background'){openBackground();return true;}
  if(a==='layout-clear-background'){mutate(()=>delete sheet().background);return true;}
  if(['layout-themes','layout-colors','layout-fonts','layout-effects'].includes(a)){openThemes(a.split('-')[1]);return true;}
  if(['layout-apply-theme','layout-save-theme'].includes(a)){try{const form=dialog.querySelector('.sx-layout-theme'),get=k=>form.querySelector('[data-layout="'+k+'"]').value,t=validateTheme({name:get('themeName'),colors:Array.from({length:6},(_,i)=>get('themeColor'+i)),bodyFont:get('bodyFont'),headingFont:get('headingFont'),effect:get('effect')});writable(sheet());change(()=>{book().theme=t;if(a==='layout-save-theme'){book().customThemes||=[];const i=book().customThemes.findIndex(v=>v.name===t.name);if(i<0)book().customThemes.push(t);else book().customThemes[i]=t;}});openThemes();}catch(e){error(e);}return true;}
  if(a.startsWith('layout-theme-')){const slot=+dialog.querySelector('[data-layout=accent]').value;mutate(()=>{if(a==='layout-theme-objects'){if(!selected.size)throw Error('Elige objetos en Panel de selección antes de vincularlos al tema.');for(const o of sheet().insertObjects||[])if(selected.has(o.id))o.themeSlot=slot;}else for(const id of selection()){const cell=sheet().cells[id]||={};if(a==='layout-theme-fill'){cell.themeFill=slot;delete cell.fill;}else{cell.themeFont='body';delete cell.font;}}});return true;}
  if(['layout-front','layout-back','layout-selection','layout-align','layout-group','layout-rotate'].includes(a)){openObjects();return true;}
  if(a==='print-preview'){showPreview();return true;}if(a==='print-sheet'){print();return true;}
  return false;
 }
 dialog.addEventListener('click',e=>{
  const t=e.target.closest('[data-layout-organize],[data-layout-visibility],[data-layout-theme-preset]');if(!t)return;
  if(t.dataset.layoutOrganize){try{writable(sheet());const draft=structuredClone(sheet());organizeObjects(draft,[...selected],t.dataset.layoutOrganize);change(()=>sheet().insertObjects=draft.insertObjects);openObjects();}catch(e){error(e);}}
  if(t.dataset.layoutVisibility)mutate(()=>{const o=sheet().insertObjects.find(o=>o.id===t.dataset.layoutVisibility);o.hidden=!o.hidden;});
  if(t.dataset.layoutThemePreset){const id=t.dataset.layoutThemePreset,theme=themePresets[id]||book().customThemes?.[+id.slice(6)];mutate(()=>book().theme=structuredClone(theme));openThemes();}
 });
 dialog.addEventListener('input',e=>{
  const t=e.target;if(t.matches('[data-layout=margin]'))for(const n of dialog.querySelectorAll('[data-layout^="margin-"]'))n.value=t.value;
 });
 dialog.addEventListener('change',e=>{
  const t=e.target;
  if(t.matches('[data-layout-object]')){if(t.checked)selected.add(t.dataset.layoutObject);else selected.delete(t.dataset.layoutObject);refreshGrid();}
  if(t.matches('[data-layout=marginPreset]')&&t.value!=='custom'){const v={normal:15,wide:25.4,narrow:6.35}[t.value];for(const n of dialog.querySelectorAll('[data-layout^="margin"]'))if(n.type==='number')n.value=v;}
  if(t.matches('[data-layout-direct]')){const k=t.dataset.layoutDirect;mutate(()=>{if(k==='viewGrid')sheet().grid=t.checked;else if(k==='viewHeadings')sheet().hideHeadings=!t.checked;else{const p=settings();p[k]=t.type==='checkbox'?t.checked:Number(t.value);if(['fitWidth','fitHeight'].includes(k))p.scaleMode=p.fitWidth||p.fitHeight?'fit':'percent';if(k==='scale')p.scaleMode='percent';sheet().page=pageSettings(p);}});dialog.querySelector('.sx-ribbon').innerHTML=api.ribbon();}
  if(t.matches('[data-layout-background]')){
   const file=t.files[0],ticket=++backgroundTicket,owner=sheet().id;
   if(!file)return;if(file.size>1e6||!['image/png','image/jpeg','image/webp'].includes(file.type)){error(Error('Usa PNG, JPEG o WebP de hasta 1 MB.'));return;}
   const reader=new FileReader();reader.onload=()=>{if(ticket!==backgroundTicket||sheet().id!==owner)return;mutate(()=>sheet().background=reader.result);};reader.onerror=()=>error(Error('No se pudo leer la imagen.'));reader.readAsDataURL(file);
  }
 });
 function refreshGrid(){
  const s=sheet(),scroll=dialog.querySelector('.sx-grid-scroll');if(!scroll)return;
  scroll.style.backgroundImage=/^data:image\/(png|jpeg|webp);base64,/i.test(s.background||'')?'url("'+s.background+'")':'none';
  const rows=new Set(s.pageBreaks?.rows||[]),cols=new Set(s.pageBreaks?.columns||[]);
  for(const cell of dialog.querySelectorAll('[data-sx-cell]')){const [r,c]=position(cell.dataset.sxCell);cell.classList.toggle('sx-page-rowbreak',rows.has(r));cell.classList.toggle('sx-page-colbreak',cols.has(c));}
  dialog.querySelector('.sx-object-layer')?.setAttribute('data-theme-effect',book().theme?.effect||'plain');
  for(const n of dialog.querySelectorAll('[data-io-id]'))n.classList.toggle('sx-layout-selected',selected.has(n.dataset.ioId));
 }
 return {ribbon,action,refreshPanel,refreshGrid,printDocument,release(a){if(!['undo','redo','save'].includes(a))mode='';},theme:()=>book().theme||themePresets.arles};
}
