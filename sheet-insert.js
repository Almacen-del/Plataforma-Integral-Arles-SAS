import {shapes,shapeSVG} from './native-shapes.js';
import {icons,iconSVG} from './native-icons.js';
import {templates,mathML,validateMath} from './native-math-model.js';
import {range,value,writable} from './sheet-model.js';
import {records,pivotData,chartSeries,timelinePeriods,operations,calculations,validateObject} from './sheet-insert-model.js';
import {chartTypes,renderChart} from './sheet-insert-charts.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds={shape:'Forma flotante',icon:'Icono',image:'Imagen flotante',equation:'Ecuación',text:'Cuadro de texto',wordart:'WordArt',diagram:'Diagrama',chart:'Gráfico editable',pivot:'Tabla dinámica',slicer:'Segmentación',timeline:'Escala de tiempo'};
const fmt=v=>typeof v==='number'?v.toLocaleString('es-CO',{maximumFractionDigits:4}):String(v);
const input=(key,label,v,type='text')=>'<label>'+escape(label)+'<input data-io="'+key+'" type="'+type+'" value="'+escape(v)+'"></label>';
const select=(key,label,items,v)=>'<label>'+escape(label)+'<select data-io="'+key+'">'+Object.entries(items).map(([id,n])=>'<option value="'+escape(id)+'" '+(String(v)===id?'selected':'')+'>'+escape(n)+'</option>').join('')+'</select></label>';
const check=(key,label,checked)=>'<label class="sx-io-check"><input type="checkbox" data-io="'+key+'" '+(checked?'checked':'')+'>'+escape(label)+'</label>';
const choices=(key,label,fields,selected=[])=>'<fieldset class="sx-io-fields"><legend>'+escape(label)+'</legend>'+Object.entries(fields).map(([id,n])=>'<label class="sx-io-check"><input type="checkbox" data-io-extra="'+key+'" value="'+id+'" '+(selected.includes(+id)?'checked':'')+'>'+escape(n)+'</label>').join('')+'</fieldset>';
export function chartSVG(data,type){return renderChart({categories:data.map(p=>p.label),series:[{name:'Valores',values:data.map(p=>p.value)}]}, {chartType:type});}

export function createInsertController(api){
 const {dialog,sheet,selection,change,panel,notice}=api;
 let editing=null,mathDraft=null,imageDraft=null,imageTicket=0;
 const get=()=> (sheet().insertObjects||[]).find(o=>o.id===editing);
 const themed=o=>o.themeSlot!=null?{...o,color:api.theme?.().colors[o.themeSlot]||o.color,themeColors:api.theme?.().colors}:o;
 const content=o=>{try{
  o=themed(o);
  if(o.kind==='shape')return shapeSVG(o.artId,{fill:o.color,stroke:'#185b40',text:o.text});
  if(o.kind==='icon')return iconSVG(o.artId,{color:o.color,style:'transparent'});
  if(o.kind==='image')return /^data:image\/(png|jpeg|webp);base64,/i.test(o.image||'')?'<img class="sx-io-image" src="'+escape(o.image)+'" alt="'+escape(o.alt||'')+'" style="object-fit:'+(['contain','cover','fill'].includes(o.imageFit)?o.imageFit:'contain')+';opacity:'+((o.opacity??100)/100)+'">':'<p>Selecciona una imagen.</p>';
  if(o.kind==='equation')return mathML(o.math);
  if(o.kind==='chart')return renderChart(chartSeries(sheet(),o),o);
  if(o.kind==='pivot'){const d=pivotData(sheet(),o);return '<table aria-label="'+escape(o.title)+'" class="sx-io-table '+escape(o.tableStyle||'green')+'" style="min-width:'+Math.max(360,d.headers.length*100)+'px"><thead><tr>'+d.headers.map(v=>'<th scope="col">'+escape(v)+'</th>').join('')+'</tr></thead><tbody>'+d.rows.map((row,r)=>'<tr class="'+d.rowKinds[r]+'">'+row.map((v,c)=>'<td class="'+(c<d.rowFieldCount?'row-label':'')+'">'+escape(v==null?'—':d.percentColumns.includes(c)?(v*100).toLocaleString('es-CO',{maximumFractionDigits:2})+' %':fmt(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
  if(o.kind==='slicer'){const d=records(sheet(),o.source),items=[...new Set(d.rows.map(r=>String(r.values[o.field||0])))];return '<button data-io-clear="'+o.id+'">Borrar filtro</button><div class="sx-io-items">'+items.map(v=>'<button data-io-filter="'+o.id+'" data-value="'+escape(v)+'" aria-pressed="'+!!o.selected?.includes(v)+'">'+escape(v||'(Vacío)')+'</button>').join('')+'</div>';}
  if(o.kind==='timeline'){const periods=timelinePeriods(sheet(),o);return '<p>Selecciona un período; Mayús amplía el intervalo.</p><div class="sx-io-periods">'+periods.map(p=>'<button data-io-period="'+o.id+'" data-from="'+p.from+'" data-to="'+p.to+'" aria-pressed="'+!!(o.from&&o.to&&p.from>=o.from&&p.to<=o.to)+'">'+escape(p.key)+'</button>').join('')+'</div><label>Desde<input type="date" data-io-date="from" data-id="'+o.id+'" value="'+escape(o.from||'')+'"></label><label>Hasta<input type="date" data-io-date="to" data-id="'+o.id+'" value="'+escape(o.to||'')+'"></label><button data-io-clear="'+o.id+'">Borrar filtro</button>';}
  if(o.kind==='diagram')return diagramSVG(o);
  const text=o.linkedCell?value(sheet(),o.linkedCell):o.text;
  return '<div class="sx-io-text '+(o.kind==='wordart'?'sx-io-wordart '+escape(o.wordStyle||'shadow'):'')+'" style="color:'+o.color+';font-size:'+o.fontSize+'px">'+escape(text)+'</div>';
 }catch(e){return '<p role="status">'+escape(e.message)+'</p>';}};
 function render(){
  dialog.querySelector('.sx-object-layer')?.remove();
  const scroll=dialog.querySelector('.sx-grid-scroll');if(!scroll)return;
  const layer=document.createElement('div');layer.className='sx-object-layer';
  layer.innerHTML=(sheet().insertObjects||[]).filter(o=>!o.hidden).map(o=>'<section class="sx-insert-object" data-io-id="'+o.id+'" aria-label="'+escape(o.title)+'" style="left:'+o.x+'px;top:'+o.y+'px;width:'+o.width+'px;height:'+o.height+'px;transform:rotate('+(o.rotation||0)+'deg)"><header><span data-io-drag tabindex="0" role="button" aria-label="Mover '+escape(o.title)+'">⠿ '+escape(o.title)+(o.groupId?' · Grupo':'')+'</span><button data-io-edit="'+o.id+'" aria-label="Editar '+escape(o.title)+'">✎</button></header><div class="sx-io-body" data-theme-effect="'+(api.theme?.().effect||'plain')+'" style="font-family:'+escape(api.theme?.().bodyFont||'Arial')+';transform:scale('+(o.flipH?-1:1)+','+(o.flipV?-1:1)+')">'+content(o)+'</div><span data-io-resize role="button" tabindex="0" aria-label="Cambiar tamaño">◢</span></section>').join('');
  scroll.append(layer);
 }
 function fieldMap(source){try{return Object.fromEntries(records(sheet(),source).headers.map((n,i)=>[i,n]));}catch{return {'0':'Primera columna','1':'Segunda columna'};}}
 function measureForm(m,fields){return '<div class="sx-io-measure">'+select('measureField','Campo',fields,m.field)+select('measureOperation','Resumir mediante',operations,m.operation)+select('measureShowAs','Mostrar como',calculations,m.showAs||'normal')+input('measureLabel','Nombre (opcional)',m.label||'')+'<button type="button" data-io-remove-measure>Quitar cálculo</button></div>';}
 function reportForm(f,fields,source){
  let values=[];try{values=[...new Set(records(sheet(),source).rows.map(r=>String(r.values[f.field||0])))];}catch{}
  return '<div class="sx-io-report">'+select('reportField','Campo de filtro',fields,f.field)+'<fieldset class="sx-io-fields"><legend>Valores (ninguno = todos)</legend>'+values.map(v=>'<label class="sx-io-check"><input type="checkbox" data-io-report-value value="'+escape(v)+'" '+(f.selected?.includes(v)?'checked':'')+'>'+escape(v||'(Vacío)')+'</label>').join('')+'</fieldset><button type="button" data-io-remove-report>Quitar filtro</button></div>';
 }
 function dataFields(kind,o){
  const fields=fieldMap(o.source),first=o.measures?.[0]||{field:o.valueField??1,operation:o.operation||'sum',showAs:o.showAs||'normal'};
  let form='';
  if(['chart','pivot'].includes(kind))form+=select('rowField',kind==='chart'?'Categorías':'Primer campo de filas',fields,o.rowFields?.[0]??o.rowField??0)+select('valueField',kind==='chart'?'Primera serie':'Primer campo de valores',fields,first.field);
  else form+=select('field','Campo',fields,o.field??0);
  if(kind==='chart'){
   form+=select('chartType','Tipo',chartTypes,o.chartType||'columns')+'<details open><summary>Series y diseño</summary>'+choices('seriesFields','Series adicionales',fields,(o.seriesFields||[]).slice(1))+select('palette','Colores',{arles:'Arles',office:'Office',soft:'Suaves'},o.palette||'arles')+check('showLegend','Mostrar leyenda',o.showLegend!==false)+check('showLabels','Mostrar valores',!!o.showLabels)+'</details>';
   form+='<div data-io-for="scatter bubble">'+select('xField','Valores X',fields,o.xField??o.rowField??0)+'</div><div data-io-for="bubble">'+select('sizeField','Tamaño de las burbujas',fields,o.sizeField??o.valueField??1)+'</div>';
   form+='<div data-io-for="histogram">'+select('binMode','Intervalos',{auto:'Automáticos',count:'Cantidad de intervalos',width:'Ancho de intervalo'},o.binWidth!=null?'width':o.binCount!=null?'count':'auto')+'<div data-io-bin="count">'+input('binCount','Cantidad (1–100)',o.binCount??10,'number')+'</div><div data-io-bin="width">'+input('binWidth','Ancho',o.binWidth??1,'number')+'</div></div>';
   form+='<div data-io-for="box">'+select('quartiles','Cuartiles',{inclusive:'Interpolación inclusiva',exclusive:'Interpolación exclusiva'},o.quartiles||'inclusive')+'</div><p data-io-for="pie doughnut waterfall funnel histogram pareto">Este tipo usa la primera serie. Circular, Pareto y embudo requieren valores no negativos.</p><p data-io-for="combo">La última serie se dibuja como línea. Todas las series usan la misma escala.</p>';
  }
  if(kind==='pivot'){
   form+=select('colField','Primer campo de columnas',{'-1':'Sin campo',...fields},o.colFields?.[0]??o.colField??-1)+select('operation','Resumir mediante',operations,first.operation)+select('showAs','Mostrar como',calculations,first.showAs||'normal')+input('valueLabel','Nombre del primer cálculo (opcional)',first.label||'');
   form+='<details open><summary>Campos y cálculos adicionales</summary>'+choices('rowFields','Más campos de filas (orden del origen)',fields,(o.rowFields||[]).slice(1))+choices('colFields','Más campos de columnas (orden del origen)',fields,(o.colFields||[]).slice(1))+'<div data-io-measures>'+(o.measures||[]).slice(1).map(m=>measureForm(m,fields)).join('')+'</div><button data-io-add-measure>Añadir cálculo</button></details>';
   form+='<details><summary>Filtros del informe</summary><div data-io-reports>'+(o.reportFilters||[]).map(f=>reportForm(f,fields,o.source)).join('')+'</div><button data-io-add-report>Añadir filtro</button></details>'+check('totals','Mostrar totales generales',!!o.totals)+check('subtotals','Mostrar subtotales de filas',!!o.subtotals)+select('tableStyle','Diseño',{green:'Verde',blue:'Azul',plain:'Claro'},o.tableStyle||'green');
  }
  if(['slicer','timeline'].includes(kind)){
   if(kind==='timeline')form+=select('period','Agrupar fechas por',{year:'Años',quarter:'Trimestres',month:'Meses',day:'Días'},o.period||'month');
   const targets=(sheet().insertObjects||[]).filter(t=>['chart','pivot'].includes(t.kind)&&t.source===o.source);
   form+=select('connectionMode','Conectar a',{all:'Todos con este origen (incluye los futuros)',manual:'Elegir objetos'},o.targetIds==null?'all':'manual')+'<div data-io-connections>'+targets.map(t=>'<label class="sx-io-check"><input type="checkbox" data-io-target value="'+escape(t.id)+'" '+(o.targetIds?.includes(t.id)?'checked':'')+'>'+escape(t.title)+'</label>').join('')+(targets.length?'':'<p>Inserta un gráfico o una tabla con este origen para conectarlo.</p>')+'</div>';
  }
  return form;
 }
 function options(form){
  const type=form.querySelector('[data-io=chartType]')?.value;
  for(const n of form.querySelectorAll('[data-io-for]'))n.hidden=!n.dataset.ioFor.split(' ').includes(type);
  const mode=form.querySelector('[data-io=binMode]')?.value;
  for(const n of form.querySelectorAll('[data-io-bin]'))n.hidden=n.dataset.ioBin!==mode;
  const connections=form.querySelector('[data-io-connections]');if(connections)connections.hidden=form.querySelector('[data-io=connectionMode]').value!=='manual';
 }
 function editor(kind,object){
  editing=object?.id||null;mathDraft=structuredClone(object?.math||templates[0][2]);imageDraft=object?.image||null;imageTicket++;
  const o=object?themed(object):{kind,title:kinds[kind],source:selection()[0]+':'+selection().at(-1),x:80,y:80,width:460,height:290,text:kind==='shape'?'':'Escribe aquí',color:'#21804a',fontSize:24,rowField:0,valueField:1,colField:-1,field:0,operation:'sum',chartType:'columns',layout:'process',rotation:0,totals:true,showLegend:true,showLabels:false,period:'month'};
  let form=input('title','Título',o.title);
  if(kind==='shape'||kind==='icon'){
   const catalog=kind==='shape'?shapes:icons;
   form+='<label>Buscar<input data-io-search placeholder="Nombre…"></label><div class="sx-io-gallery">'+catalog.map(item=>'<button type="button" data-io-art="'+item.id+'" data-name="'+escape(item.name)+'" title="'+escape(item.name)+'" aria-pressed="'+(item.id===(o.artId||catalog[0].id))+'">'+(kind==='shape'?shapeSVG(item.id):iconSVG(item.id))+'<span>'+escape(item.name)+'</span></button>').join('')+'</div><input type="hidden" data-io="artId" value="'+escape(o.artId||catalog[0].id)+'">'+input('color','Color',o.color||'#21804a','color')+(kind==='shape'?input('text','Texto',o.text||''):'');
  }else if(kind==='image'){
   form+='<label>Imagen PNG, JPEG o WebP<input type="file" data-io-image accept="image/png,image/jpeg,image/webp"></label>'+input('alt','Descripción de la imagen',o.alt||'')+select('imageFit','Ajuste',{contain:'Conservar imagen completa',cover:'Rellenar y recortar',fill:'Estirar'},o.imageFit||'contain')+input('opacity','Opacidad (0–100)',o.opacity??100,'number')+input('rotation','Giro (grados)',o.rotation||0,'number')+'<p>Máximo 1 MB por imagen.</p>';
  }else if(kind==='equation'){
   form+=select('template','Plantilla',Object.fromEntries(templates.map((t,i)=>[i,t[1]])),o.template||0)+'<div data-io-math></div><div data-io-math-preview></div>';
  }else if(['text','wordart','diagram'].includes(kind)){
   form+='<label>Texto'+(kind==='diagram'?' (un elemento por línea)':'')+'<textarea data-io="text" rows="5">'+escape(o.text)+'</textarea></label>'+input('color','Color',o.color,'color');
   if(kind==='diagram')form+=select('layout','Diseño',{process:'Proceso',list:'Lista',cycle:'Ciclo',hierarchy:'Jerarquía'},o.layout)+'<p>En jerarquía, la primera línea es la raíz y las siguientes son sus hijos.</p>';
   else{form+=input('fontSize','Tamaño de letra',o.fontSize,'number')+input('linkedCell','Vincular texto a celda (opcional)',o.linkedCell||'')+input('rotation','Giro (grados)',o.rotation||0,'number');if(kind==='wordart')form+=select('wordStyle','Estilo',{shadow:'Sombra',outline:'Contorno',gradient:'Degradado',plain:'Simple'},o.wordStyle||'shadow');}
  }else{
   form+=input('source','Origen (incluye encabezados)',o.source)+'<div data-io-data-fields>'+dataFields(kind,o)+'</div><p>Se recalcula al editar las celdas. Usa las conexiones de cada filtro para elegir qué gráficos y tablas afecta.</p>';
  }
  form+='<details open><summary>Posición y tamaño</summary>'+input('x','Posición horizontal',o.x,'number')+input('y','Posición vertical',o.y,'number')+input('width','Ancho',o.width,'number')+input('height','Alto',o.height,'number')+'</details>';
  panel((object?'Editar ':'Insertar ')+kinds[kind],'<div class="sx-io-form" data-io-kind="'+kind+'">'+form+'<p data-io-error role="alert"></p><button data-io-preview>Vista previa</button><button data-io-apply>Aplicar</button><div data-io-object-preview></div>'+(object?'<button data-io-front>Traer al frente</button><button data-io-back>Enviar al fondo</button><button data-io-remove>Eliminar objeto</button>':'')+'</div>');
  if(kind==='equation')renderMath();options(dialog.querySelector('.sx-io-form'));
 }
 function renderMath(){
  const box=dialog.querySelector('[data-io-math]');if(!box)return;const leaves=[];
  const walk=(n,path=[])=>{if(n.type==='text')leaves.push([path,n.value]);else n.children.forEach((c,i)=>walk(c,[...path,i]));};walk(mathDraft);
  box.innerHTML=leaves.map(([path,v],i)=>'<label>Elemento '+(i+1)+'<input data-io-math-leaf="'+path.join('.')+'" value="'+escape(v)+'"></label>').join('');
  dialog.querySelector('[data-io-math-preview]').innerHTML=mathML(mathDraft);
 }
 function readDraft(form){
  const o={...(get()||{}),id:editing||crypto.randomUUID(),kind:form.dataset.ioKind};
  const numeric=['x','y','width','height','rowField','colField','valueField','field','fontSize','rotation','xField','sizeField','opacity'];
  for(const n of form.querySelectorAll('[data-io]'))if(!n.closest('.sx-io-measure,.sx-io-report'))o[n.dataset.io]=n.type==='checkbox'?n.checked:numeric.includes(n.dataset.io)?Number(n.value):n.value;
  const additional=key=>[...form.querySelectorAll('[data-io-extra="'+key+'"]:checked')].map(n=>+n.value);
  if(o.kind==='chart'){
   o.seriesFields=[...new Set([o.valueField,...additional('seriesFields')])];
   o.binCount=o.binMode==='count'?Number(o.binCount):null;o.binWidth=o.binMode==='width'?Number(o.binWidth):null;
  }
  if(o.kind==='pivot'){
   o.rowFields=[...new Set([o.rowField,...additional('rowFields')])];o.colFields=[...new Set([...(o.colField>=0?[o.colField]:[]),...additional('colFields')])];
   o.measures=[{field:o.valueField,operation:o.operation,showAs:o.showAs,label:o.valueLabel},...[...form.querySelectorAll('.sx-io-measure')].map(row=>({field:+row.querySelector('[data-io=measureField]').value,operation:row.querySelector('[data-io=measureOperation]').value,showAs:row.querySelector('[data-io=measureShowAs]').value,label:row.querySelector('[data-io=measureLabel]').value}))];
   o.reportFilters=[...form.querySelectorAll('.sx-io-report')].map(row=>({field:+row.querySelector('[data-io=reportField]').value,selected:[...row.querySelectorAll('[data-io-report-value]:checked')].map(n=>n.value)}));
  }
  if(['slicer','timeline'].includes(o.kind)){
   if(o.connectionMode==='all')delete o.targetIds;else o.targetIds=[...form.querySelectorAll('[data-io-target]:checked')].map(n=>n.value);
   if(get()&&(get().source!==o.source||get().field!==o.field)){o.selected=[];o.from='';o.to='';}
  }
  return o;
 }
 function validatedDraft(form){
  const o=readDraft(form);
  if(get()?.themeSlot!=null&&form.querySelector('[data-io=color]')&&o.color!==themed(get()).color)delete o.themeSlot;
  if(o.kind==='equation')o.math=validateMath(mathDraft);
  if(o.kind==='image'){if(!imageDraft)throw Error('Selecciona primero una imagen.');o.image=imageDraft;if(!Number.isFinite(o.opacity)||o.opacity<0||o.opacity>100)throw Error('La opacidad debe estar entre 0 y 100.');}
  if(o.kind==='shape')shapeSVG(o.artId);if(o.kind==='icon')iconSVG(o.artId);
  if(!/^#[0-9a-f]{6}$/i.test(o.color||'#21804a'))throw Error('Color inválido.');
  if(o.linkedCell){o.linkedCell=o.linkedCell.trim().toUpperCase();if(range(o.linkedCell).length!==1)throw Error('Vincula una sola celda.');}
  if(o.fontSize!=null&&(!Number.isFinite(o.fontSize)||o.fontSize<8||o.fontSize>120))throw Error('Usa una letra entre 8 y 120.');
  if(o.kind==='diagram'&&String(o.text).split('\n').filter(s=>s.trim()).length>50)throw Error('Usa hasta 50 elementos por diagrama.');
  if(o.rotation!=null&&(!Number.isFinite(o.rotation)||Math.abs(o.rotation)>360))throw Error('Usa un giro entre -360 y 360.');
  if(o.source){const refs=range(o.source.trim().toUpperCase());o.source=refs[0]+':'+refs.at(-1);}
  validateObject(sheet(),o);return o;
 }
 function action(a){
  if(!a.startsWith('io-'))return false;const kind=a.slice(3);
  if(kinds[kind]){editor(kind);return true;}
  if(kind==='objects'){panel('Objetos de la hoja',(sheet().insertObjects||[]).map(o=>'<button data-io-edit="'+o.id+'">'+escape(o.title)+'</button>').join('')||'<p>Aún no hay objetos flotantes.</p>');return true;}
  return false;
 }

 dialog.addEventListener('click',e=>{
  const art=e.target.closest('[data-io-art]');
  if(art){dialog.querySelector('[data-io=artId]').value=art.dataset.ioArt;for(const b of dialog.querySelectorAll('[data-io-art]'))b.setAttribute('aria-pressed',String(b===art));}
  const edit=e.target.closest('[data-io-edit]');
  if(edit){const o=sheet().insertObjects?.find(o=>o.id===edit.dataset.ioEdit);if(o)editor(o.kind,o);}
  const form=dialog.querySelector('.sx-io-form');
  if(e.target.closest('[data-io-add-measure]'))form.querySelector('[data-io-measures]').insertAdjacentHTML('beforeend',measureForm({field:+form.querySelector('[data-io=valueField]').value,operation:'sum',showAs:'normal'},fieldMap(form.querySelector('[data-io=source]').value)));
  if(e.target.closest('[data-io-remove-measure]'))e.target.closest('.sx-io-measure').remove();
  if(e.target.closest('[data-io-add-report]'))form.querySelector('[data-io-reports]').insertAdjacentHTML('beforeend',reportForm({field:0,selected:[]},fieldMap(form.querySelector('[data-io=source]').value),form.querySelector('[data-io=source]').value));
  if(e.target.closest('[data-io-remove-report]'))e.target.closest('.sx-io-report').remove();
  if(e.target.closest('[data-io-apply],[data-io-preview]')){
   try{
    const o=validatedDraft(form);form.querySelector('[data-io-error]').textContent='';
    if(e.target.closest('[data-io-preview]'))form.querySelector('[data-io-object-preview]').innerHTML=content(o);
    else{writable(sheet());change(()=>{sheet().insertObjects||=[];const index=sheet().insertObjects.findIndex(x=>x.id===o.id);if(index<0)sheet().insertObjects.push(o);else sheet().insertObjects[index]=o;});editor(o.kind,o);}
   }catch(error){form.querySelector('[data-io-error]').textContent=error.message;}
  }
  if(e.target.closest('[data-io-remove]')){change(()=>{writable(sheet());sheet().insertObjects=sheet().insertObjects.filter(o=>o.id!==editing);});action('io-objects');}
  if(e.target.closest('[data-io-front],[data-io-back]')){const back=!!e.target.closest('[data-io-back]');change(()=>{writable(sheet());const o=get();if(!o)return;sheet().insertObjects=sheet().insertObjects.filter(x=>x.id!==o.id);sheet().insertObjects[back?'unshift':'push'](o);});}
  const period=e.target.closest('[data-io-period]');
  if(period)change(()=>{writable(sheet());const o=sheet().insertObjects.find(o=>o.id===period.dataset.ioPeriod);if(e.shiftKey&&o.from){o.from=[o.from,period.dataset.from].sort()[0];o.to=[o.to,period.dataset.to].sort().at(-1);}else{o.from=period.dataset.from;o.to=period.dataset.to;}});
  const filter=e.target.closest('[data-io-filter]'),clear=e.target.closest('[data-io-clear]');
  if(filter||clear)change(()=>{writable(sheet());const o=sheet().insertObjects.find(o=>o.id===(filter?.dataset.ioFilter||clear.dataset.ioClear));if(clear){o.selected=[];o.from='';o.to='';}else{const v=filter.dataset.value;o.selected=o.selected||[];o.selected=o.selected.includes(v)?o.selected.filter(x=>x!==v):[...o.selected,v];}});
 });
 dialog.addEventListener('input',e=>{
  const t=e.target;
  if(t.matches('[data-io-search]'))for(const b of dialog.querySelectorAll('[data-io-art]'))b.hidden=!b.dataset.name.toLocaleLowerCase().includes(t.value.toLocaleLowerCase());
  if(t.matches('[data-io-math-leaf]')){let node=mathDraft;for(const i of t.dataset.ioMathLeaf.split('.').filter(Boolean))node=node.children[+i];node.value=t.value;try{dialog.querySelector('[data-io-math-preview]').innerHTML=mathML(mathDraft);}catch(error){dialog.querySelector('[data-io-error]').textContent=error.message;}}
 });
 dialog.addEventListener('change',e=>{
  const t=e.target,form=t.closest('.sx-io-form');
  if(t.matches('[data-io=template]')){mathDraft=structuredClone(templates[+t.value][2]);renderMath();}
  if(t.matches('[data-io-image]')){
   const file=t.files[0],ticket=++imageTicket;imageDraft=null;
   if(file){if(file.size>1e6||!['image/png','image/jpeg','image/webp'].includes(file.type)){form.querySelector('[data-io-error]').textContent='Usa PNG, JPEG o WebP de hasta 1 MB.';return;}
    const reader=new FileReader();form.querySelector('[data-io-error]').textContent='Cargando imagen…';
    reader.onload=()=>{if(ticket!==imageTicket||!form.isConnected)return;imageDraft=reader.result;form.querySelector('[data-io-error]').textContent='';};
    reader.onerror=()=>{if(ticket===imageTicket&&form.isConnected)form.querySelector('[data-io-error]').textContent='No se pudo leer la imagen.';};reader.readAsDataURL(file);
   }
  }
  if(t.matches('[data-io-date]')){
   const date=t.value;change(()=>{writable(sheet());const o=sheet().insertObjects.find(o=>o.id===t.dataset.id),from=t.dataset.ioDate==='from'?date:o.from,to=t.dataset.ioDate==='to'?date:o.to;if(from&&to&&from>to)throw Error('La fecha inicial debe ser anterior a la final.');o[t.dataset.ioDate]=date;});
  }
  if(t.matches('[data-io=chartType],[data-io=binMode],[data-io=connectionMode]'))options(form);
  if(t.matches('[data-io=reportField]')){const row=t.closest('.sx-io-report');row.outerHTML=reportForm({field:+t.value,selected:[]},fieldMap(form.querySelector('[data-io=source]').value),form.querySelector('[data-io=source]').value);}
  if(t.matches('[data-io=source]')){
   try{const refs=range(t.value.trim().toUpperCase()),source=refs[0]+':'+refs.at(-1);records(sheet(),source);const o=readDraft(form);o.source=source;form.querySelector('[data-io-data-fields]').innerHTML=dataFields(o.kind,o);options(form);form.querySelector('[data-io-error]').textContent='';}
   catch(error){form.querySelector('[data-io-error]').textContent=error.message;}
  }
 });
 dialog.addEventListener('pointerdown',e=>{
  const handle=e.target.closest('[data-io-drag],[data-io-resize]');if(!handle)return;
  e.preventDefault();e.stopPropagation();
  if(sheet().protected){notice('Desprotege la hoja para mover objetos.');return;}
  const node=handle.closest('[data-io-id]'),id=node.dataset.ioId,o=sheet().insertObjects.find(o=>o.id===id),resize=handle.hasAttribute('data-io-resize'),x=e.clientX,y=e.clientY,initial={...o},scroll=node.closest('.sx-grid-scroll'),scrollX=scroll.scrollLeft,scrollY=scroll.scrollTop;
  const members=structuredClone((sheet().insertObjects||[]).filter(v=>v.id===id||o.groupId&&v.groupId===o.groupId));
  handle.setPointerCapture(e.pointerId);
  const move=ev=>{const dx=ev.clientX-x+scroll.scrollLeft-scrollX,dy=ev.clientY-y+scroll.scrollTop-scrollY;if(resize){node.style.width=Math.min(1400,Math.max(160,initial.width+dx))+'px';node.style.height=Math.min(1200,Math.max(100,initial.height+dy))+'px';}else{const mx=Math.max(-Math.min(...members.map(v=>v.x)),dx),my=Math.max(-Math.min(...members.map(v=>v.y)),dy);for(const m of members){const n=dialog.querySelector('[data-io-id="'+m.id+'"]');if(n){n.style.left=m.x+mx+'px';n.style.top=m.y+my+'px';}}}};
  const clean=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',cancel);};
  const finish=()=>{clean();const patch=resize?{width:parseFloat(node.style.width),height:parseFloat(node.style.height)}:{x:parseFloat(node.style.left),y:parseFloat(node.style.top)};change(()=>{writable(sheet());if(resize)Object.assign(sheet().insertObjects.find(o=>o.id===id),patch);else for(const m of members)Object.assign(sheet().insertObjects.find(o=>o.id===m.id),{x:m.x+patch.x-initial.x,y:m.y+patch.y-initial.y});});};
  const cancel=()=>{clean();render();};
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',cancel);
 });
 dialog.addEventListener('keydown',e=>{
  const h=e.target.closest('[data-io-drag],[data-io-resize]');if(!h||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();e.stopImmediatePropagation();
  const id=h.closest('[data-io-id]').dataset.ioId,step=e.shiftKey?10:1,dx=e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0,dy=e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0;
  change(()=>{writable(sheet());const o=sheet().insertObjects.find(o=>o.id===id);if(h.hasAttribute('data-io-resize')){o.width=Math.max(160,Math.min(1400,o.width+dx));o.height=Math.max(100,Math.min(1200,o.height+dy));}else{const members=sheet().insertObjects.filter(v=>v.id===id||o.groupId&&v.groupId===o.groupId),mx=Math.max(dx,-Math.min(...members.map(v=>v.x))),my=Math.max(dy,-Math.min(...members.map(v=>v.y)));for(const m of members){m.x+=mx;m.y+=my;}}});
  dialog.querySelector('[data-io-id="'+id+'"] '+(h.hasAttribute('data-io-resize')?'[data-io-resize]':'[data-io-drag]'))?.focus();
 },true);
 return {render,action};
}

let diagramSerial=0;
function diagramSVG(o){
 const items=String(o.text||'').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,50),n=items.length;
 if(!n)return '<p>Escribe un elemento por línea.</p>';
 const layout=o.layout||'process',W=760,H=layout==='list'?n*100+40:layout==='cycle'?500:layout==='hierarchy'?Math.ceil(Math.max(1,n-1)/4)*110+150:Math.ceil(n/4)*120+40;
 const points=items.map((_,i)=>layout==='list'?[W/2,60+i*100]:layout==='cycle'?[W/2+230*Math.sin(i/n*Math.PI*2),H/2-170*Math.cos(i/n*Math.PI*2)]:layout==='hierarchy'?(i===0?[W/2,60]:[100+(i-1)%4*185,175+Math.floor((i-1)/4)*110]):[100+(Math.floor(i/4)%2?3-i%4:i%4)*185,70+Math.floor(i/4)*120]);
 let svg='',marker='io-arrow-'+(++diagramSerial);
 const edge=(i,j)=>{const [x,y]=points[i],[u,v]=points[j],dx=u-x,dy=v-y,from=Math.min(82/Math.abs(dx),38/Math.abs(dy)),to=Math.min(84/Math.abs(dx),40/Math.abs(dy));svg+='<path class="sx-io-connector" d="M'+(x+dx*from)+' '+(y+dy*from)+'L'+(u-dx*to)+' '+(v-dy*to)+'" stroke="'+o.color+'" stroke-width="2" marker-end="url(#'+marker+')" fill="none"/>';};
 if(layout==='hierarchy'){for(let i=1;i<n;i++)edge(0,i);}else{for(let i=1;i<n;i++)edge(i-1,i);if(layout==='cycle'&&n>1)edge(n-1,0);}
 items.forEach((item,i)=>{const [x,y]=points[i],lines=item.match(/.{1,20}/g)?.slice(0,3)||[''];svg+='<g><title>'+escape(item)+'</title><rect x="'+(x-78)+'" y="'+(y-34)+'" width="156" height="68" rx="12" fill="'+o.color+'18" stroke="'+o.color+'"/>'+lines.map((line,k)=>'<text x="'+x+'" y="'+(y-(lines.length-1)*8+k*16)+'" text-anchor="middle" font-size="13" fill="#203d31">'+escape(line)+'</text>').join('')+'</g>';});
 return '<svg class="sx-io-diagram-svg" role="img" aria-label="Diagrama '+escape(layout)+'" viewBox="0 0 '+W+' '+H+'"><defs><marker id="'+marker+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="'+o.color+'"/></marker></defs>'+svg+'</svg>';
}

