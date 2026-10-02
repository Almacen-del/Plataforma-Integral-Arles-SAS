import {platformStorage as localStorage} from './platform-cloud.js';
import {installLibraryUpload} from './library-upload.js';
import {openSheetWorkspace} from './sheet-workspace.js';
import {auditSave,auditRecords} from './audit.js';
import {renderSourceHistory} from './document-source-history.js';
import {openNativeDocument,createNativeDocument} from './native-document.js';
import { ROOT, ISO_ROOT, LIBRARY_ROOTS, depth, ensureLibraryRoot, ancestors, createFolder, seed, clearDemo } from './model.js';
import { setupEditor } from './editor.js';
const $ = s => document.querySelector(s);
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const icons = {
 files:'<path d="M8 3h7l4 4v14H8zM15 3v5h4M4 17H2V1h11M11 12h5m-5 4h5"/>',
 folder:'<path d="M3 5h6l2 3h10v12H3z"/>',home:'<path d="m3 10 9-7 9 7v11H3zM9 21v-8h6v8"/>',
 shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z"/><path d="m8 12 3 3 5-6"/>',
 star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
 link:'<path d="m10 14 4-4M8 15l-1 1a4 4 0 0 1-5-6l4-4a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',plus:'<path d="M12 4v16M4 12h16"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM20 2v4m-2-2h4"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 flask:'<path d="M9 3h6M10 3v6l-6 10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L14 9V3M8 15h8"/>',
 list:'<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.files}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
const key='arles-documental-prototipo-v1';
let state={folders:[],documents:[],favorites:[]}; let storageError=false;
try {const saved=JSON.parse(localStorage.getItem(key));if(saved && Array.isArray(saved.folders)&&Array.isArray(saved.documents)&&Array.isArray(saved.favorites))state=saved;}catch{storageError=true;}
ensureLibraryRoot(state);
let folder=ROOT, mode='all', selected=null, tab='details', expanded=new Set([ISO_ROOT]), list=false, toastTimer;
let selectedFolder=null;
const moreButton=(kind,id)=>`<button class="more-button" data-more="${escape(id)}" data-kind="${kind}" aria-label="Editar ${escape((kind==='folder'?state.folders:state.documents).find(x=>x.id===id)?.name||'elemento')}" aria-haspopup="menu" aria-expanded="false">⋮</button>`;
function selectItem(kind,id){
 selected=kind==='document'?id:null;selectedFolder=kind==='folder'?id:null;tab='details';
 document.querySelectorAll('.folder-card,.tree-name').forEach(el=>{const on=el.dataset.folder===selectedFolder;el.classList.toggle('active',on);el.setAttribute('aria-pressed',String(on));});
 document.querySelectorAll('.doc-row').forEach(el=>{const on=el.dataset.doc===selected;el.classList.toggle('active',on);el.setAttribute('aria-pressed',String(on));});
 renderInspector();
}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function save(automaticReason){try{auditSave(key,state,'Biblioteca',automaticReason);}catch(error){const previous=JSON.parse(localStorage.getItem(key)||'null');if(previous){Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,previous);}toast('No se guardó el cambio: '+error.message);throw error;}}
const folderName=id=>state.folders.find(f=>f.id===id)?.name || 'Biblioteca';
const statusClass=s=>s==='En revisión'?'review':s==='Borrador'?'draft':'';
const badge=d=>`<span class="status ${statusClass(d.status)}">${escape(d.status)}</span>`;
function navigate(id){folder=id;mode='all';selected=null;selectedFolder=null;tab='details';$('#search').value='';$('#status').value='';ancestors(state.folders,id).forEach(f=>expanded.add(f.id));render();}
function treeRows(parent,level=0){return state.folders.filter(f=>f.parent===parent).map(f=>{
  const children=state.folders.some(x=>x.parent===f.id),open=expanded.has(f.id);
  return `<div class="tree-row ${folder===f.id?'current':''}" style="padding-left:${level*11}px"><button class="tree-toggle" data-toggle="${escape(f.id)}" aria-label="${open?'Contraer':'Expandir'} ${escape(f.name)}" ${children?`aria-expanded="${open}"`:'disabled'}>${children?(open?'⌄':'›'):'·'}</button><button class="tree-name" data-folder="${escape(f.id)}" title="${escape(f.name)}">${icon('folder')}<span>${escape(f.name)}</span></button>${moreButton('folder',f.id)}</div>${children&&open?treeRows(f.id,level+1):''}`;
}).join('');}
function render(){
 const docs=state.documents,hasDemo=docs.some(d=>d.demo)||state.folders.some(f=>f.demo);
 $('#demo-banner').hidden=!hasDemo;$('#seed').disabled=hasDemo;$('#seed').innerHTML=icon(hasDemo?'check':'spark')+(hasDemo?'Pruebas creadas':'Crear pruebas');
 $('#total-count').textContent=docs.length;$('#tree').innerHTML=treeRows(ROOT)||'<div class="tree-empty">Tu estructura comienza aquí.<br>Crea una carpeta o explora las pruebas.</div>';
 $('#all').classList.toggle('active',mode==='all'&&folder===ROOT);$('#favorites').classList.toggle('active',mode==='favorites');
 const path=ancestors(state.folders,folder);
 $('#breadcrumbs').innerHTML=`<button data-folder="root">Biblioteca</button>${mode==='favorites'?' / Favoritos':path.map(f=>`<span>/</span><button data-folder="${escape(f.id)}">${escape(f.name)}</button>`).join('')}`;
 $('#folder-title').textContent=mode==='favorites'?'Mis favoritos':folder===ROOT?'Biblioteca':folderName(folder);
 $('#folder-subtitle').textContent=mode==='favorites'?'Tus accesos guardados al documento original.':folder===ROOT?'Organiza tu biblioteca por procesos.':'Carpetas, documentos y referencias de este espacio.';
 const level=depth(state.folders,folder);
 $('#depth').textContent=folder===ROOT?'BIBLIOTECA':LIBRARY_ROOTS.includes(folder)?'CARPETA RAÍZ':`NIVEL ${level} DE 5`;
 $('#new-folder').disabled=level>=5||mode==='favorites';
 $('#new-folder').title=level>=5?'Límite de cinco niveles dentro de la raíz':'';
 $('#storage-note').textContent=storageError?'Solo en memoria durante esta sesión':'Almacenamiento local del navegador';
 renderContents();renderInspector();
}
function renderContents(){
 const q=$('#search').value.trim().toLocaleLowerCase(),filter=$('#status').value;
 let folders=mode==='favorites'?[]:state.folders.filter(f=>q?f.name.toLocaleLowerCase().includes(q):f.parent===folder||(f.linkedFolders||[]).includes(folder));
 let docs=state.documents.filter(d=>{
   if(mode==='favorites'&&!state.favorites.includes(d.id))return false;
   if(q){if(![d.name,d.code,...d.shared].join(' ').toLocaleLowerCase().includes(q))return false;}
   else if(mode!=='favorites'){
     if(folder===ROOT)return false;
     if(d.folder!==folder&&!d.linkedFolders.includes(folder))return false;
   }
   return !filter||d.status===filter;
 });
 if(filter)folders=[];
 $('#item-count').textContent=`${folders.length} carpetas · ${docs.length} documentos${q?' · búsqueda global':''}`;
 if(!folders.length&&!docs.length){
  const virgin=!state.folders.length&&!state.documents.length;
  $('#contents').innerHTML=`<div class="empty-state"><div class="empty-illustration">${icon(virgin?'folder':'search')}</div><h3>${virgin?'Un lugar para cada documento':q||filter?'Sin resultados':mode==='favorites'?'Tus favoritos, a un clic':'Esta carpeta está lista'}</h3><p>${virgin?'Explora una biblioteca de ejemplo, con procesos, subcarpetas y documentos compartidos.':q||filter?'Prueba otro nombre o cambia el filtro de estado.':mode==='favorites'?'Selecciona un documento y pulsa la estrella para guardarlo aquí.':'Puedes crear subcarpetas o volver a la biblioteca. En esta etapa no se cargan archivos reales.'}</p>${virgin?`<button class="button primary" data-seed>${icon('spark')}Crear pruebas</button><small>Sin datos reales · Sin base de datos</small>`:q||filter?'<button class="button secondary" data-reset>Restablecer búsqueda</button>':''}</div>`;return;
 }
 let html='';
 if(folders.length)html+=`<div class="section-label">CARPETAS <span>${folders.length} espacios</span></div><div class="folder-grid ${list?'list':''}">${folders.map(f=>{
  const children=state.folders.filter(x=>x.parent===f.id).length, count=state.documents.filter(d=>d.folder===f.id||d.linkedFolders.includes(f.id)).length;
  return `<div class="folder-card" role="button" tabindex="0" aria-pressed="${selectedFolder===f.id}" data-folder="${escape(f.id)}">${moreButton('folder',f.id)}<span class="folder-icon">${icon('folder')}</span><strong>${escape(f.name)}</strong><small>${children} subcarpetas · ${count} documentos</small><span class="folder-desc">${q?escape(ancestors(state.folders,f.id).map(x=>x.name).join(' / ')):escape(f.area)}${f.parent!==folder&&!q?' · Enlace al original':''}</span></div>`;
 }).join('')}</div>`;
 if(docs.length)html+=`<div class="section-label">${folder===ROOT?'DOCUMENTOS DE LA BIBLIOTECA':'DOCUMENTOS'} <span>${docs.length} originales o referencias</span></div><div class="doc-list">${docs.map(d=>`<div class="doc-row ${selected===d.id?'active':''}" role="button" tabindex="0" aria-pressed="${selected===d.id}" data-doc="${d.id}"><span class="file-icon ${d.type.toLowerCase()}">${d.type}</span><span class="doc-main"><strong>${escape(d.name)}</strong><small>${escape(d.code)} · V${d.version} · ${escape(folderName(d.folder))}${folder!==ROOT&&d.folder!==folder?' · Enlace al original':''}</small></span>${d.linkedFolders.length?`<span class="link-badge" title="Documento compartido">${icon('link')}</span>`:''}${badge(d)}${moreButton('document',d.id)}</div>`).join('')}</div>`;
 $('#contents').innerHTML=html;
}
function renderInspector(){
 const f=state.folders.find(x=>x.id===selectedFolder);
 if(f){$('#inspector').innerHTML=`<div class="inspector-header">DOSSIER DE CARPETA ${moreButton('folder',f.id)}</div><div class="folder-icon">${icon('folder')}</div><h3>${escape(f.name)}</h3><p class="doc-code">${escape(ancestors(state.folders,f.id).map(x=>x.name).join(' / '))}</p><div class="notice">${state.folders.filter(x=>x.parent===f.id).length} subcarpetas · ${state.documents.filter(x=>x.folder===f.id).length} documentos<br>${(f.linkedFolders||[]).length} enlaces a otras carpetas</div><p class="doc-code">${escape(f.description||'Sin descripción.')}</p><button class="button primary open-doc" data-open-folder="${escape(f.id)}">Abrir carpeta</button><p class="doc-code">Un clic selecciona. Doble clic abre.</p>`;return;}
 const d=state.documents.find(x=>x.id===selected);
 if(!d){$('#inspector').innerHTML=`<div class="inspector-header">DETALLES DEL DOCUMENTO ${icon('info')}</div><div class="inspector-empty"><div class="art">${icon('files')}</div><h3>Un original.<br>Muchas conexiones.</h3><p>Selecciona un documento para consultar su ubicación, versión y áreas vinculadas.</p><div class="legend"><div>${icon('folder')}Una ubicación de origen</div><div>${icon('link')}Accesos sin duplicados</div><div>${icon('clock')}Historial del documento</div></div></div>`;return;}
 const date=value=>value?escape(String(value).slice(0,10)):'Fecha no registrada';
 const registrations=(d.versions||[]).map(v=>`<div class="history-entry"><b>Registro ${escape(v.number)} · ${escape(({draft:'Borrador',current:'Vigente',review:'En revisión',obsolete:'Obsoleto',approved:'Aprobado',rejected:'Rechazado'})[v.status]||v.status)}</b>${date(v.created)}<p>${escape(v.reason||'Sin motivo registrado')}</p></div>`).join('');
 const history=(d.editorHistory||[]).map(h=>`<div class="history-entry"><b>Guardado ${escape(h.revision)}</b>${date(h.at)} · ${escape(h.author||'Responsable no registrado')}<p>${escape(h.reason||'Sin motivo registrado')}</p></div>`).join('');
 const activity=auditRecords().filter(r=>r.changes?.some(c=>c.entity==='documents'&&c.id===d.id)).map(r=>`<div class="history-entry"><b>${escape(r.name||'Responsable no registrado')}</b>${date(r.at)}<p>${escape(r.reason||'Sin motivo registrado')}</p></div>`).join('');
 $('#inspector').innerHTML=`<div class="inspector-header">DETALLES <button class="icon-button" data-favorite="${escape(d.id)}" aria-label="${state.favorites.includes(d.id)?'Quitar de favoritos':'Añadir a favoritos'}" aria-pressed="${state.favorites.includes(d.id)}">${icon('star')}</button></div><div class="file-icon ${escape(d.type.toLowerCase())}">${escape(d.type)}</div>${badge(d)}<h3>${escape(d.name)}</h3><div class="doc-code">${escape(d.code||'Sin código registrado')} · ${d.demo?'Documento de ejemplo':d.imported?'Archivo importado':'Documento de la biblioteca'}</div><div class="tabs" aria-label="Información del documento">${[['details','Detalles'],['versions','Versiones'],['activity','Actividad']].map(([k,t])=>`<button data-tab="${k}" class="${tab===k?'active':''}" aria-pressed="${tab===k}">${t}</button>`).join('')}</div><div>${tab==='details'?`<dl class="metadata"><div><dt>Custodio</dt><dd>${escape(state.folders.find(f=>f.id===d.folder)?.area||'General')}</dd></div><div><dt>${d.imported?'Registro en la plataforma':'Versión registrada'}</dt><dd>${escape(d.version)}</dd></div><div><dt>Última modificación registrada</dt><dd>${date(d.modified)}</dd></div><div><dt>Ubicación</dt><dd><button class="text-button" data-folder="${escape(d.folder)}">${escape(folderName(d.folder))}</button></dd></div></dl>${d.imported?'<p class="doc-code">El número del registro de carga no identifica la versión del archivo original. Consulta su historial en Versiones.</p>':''}<div class="share-title">ÁREAS VINCULADAS</div><div class="chips">${(d.shared||[]).map(s=>`<span class="chip">${escape(s)}</span>`).join('')}</div>`:tab==='versions'?`<h4>Historial anterior del documento</h4><div data-source-history></div><h4>Registros en la plataforma</h4>${registrations||'<p>No hay versiones de archivo registradas.</p>'}${history?'<h4>Guardados del editor</h4>'+history:''}`:activity||'<p>No hay actividad registrada para este documento.</p>'}</div><button class="button primary open-doc" id="open-preview">${icon('eye')}Vista previa</button><div class="notice">${icon('link')} Un documento, varios accesos. Se conserva el archivo original.</div>`;
 if(tab==='versions')renderSourceHistory($('#inspector [data-source-history]'),d);

}
function runSeed(){if(seed(state)){save();expanded.add('almacen');render();toast('Biblioteca de prueba creada: 5 niveles y documentos compartidos.');}else toast('Las pruebas ya están creadas. No se duplicaron.');}
$('#seed').onclick=runSeed;$('#all').onclick=()=>navigate(ROOT);
$('#favorites').onclick=()=>{mode='favorites';folder=ROOT;selected=null;selectedFolder=null;$('#search').value='';$('#status').value='';render();};
$('#search').oninput=renderContents;$('#status').onchange=renderContents;
$('#view-toggle').onclick=()=>{list=!list;$('#view-toggle').innerHTML=icon(list?'grid':'list');$('#view-toggle').setAttribute('aria-label',list?'Cambiar a vista de tarjetas':'Cambiar a vista de lista');renderContents();};
$('#new-folder').onclick=()=>{ $('#folder-location').textContent='Dentro de: '+[ 'Biblioteca',...ancestors(state.folders,folder).map(f=>f.name)].join(' / ');$('#folder-name').value='';$('#folder-error').textContent='';$('#folder-dialog').showModal();$('#folder-name').focus();};
const newText=document.createElement('button');newText.id='new-text-document';newText.className='button primary';newText.textContent='＋ Documento de texto';$('#new-folder').before(newText);newText.onclick=()=>createNativeDocument(folder);
const sheetsButton=document.createElement('button');sheetsButton.id='open-sheet-workspace';sheetsButton.className='button secondary';sheetsButton.textContent='▦ Hojas de cálculo';newText.after(sheetsButton);sheetsButton.onclick=()=>openSheetWorkspace();
const pdfButton=document.createElement('button');pdfButton.id='open-pdf-workspace';pdfButton.className='button secondary';pdfButton.textContent='PDF · Leer y editar';sheetsButton.after(pdfButton);pdfButton.onclick=()=>import('./pdf-workspace.js').then(m=>m.openPDFWorkspace()).catch(e=>toast('No se pudo abrir PDF: '+e.message));
if(new URLSearchParams(location.search).get('editor')==='pdf')setTimeout(()=>pdfButton.click(),0);
if(new URLSearchParams(location.search).get('editor')==='hojas')setTimeout(openSheetWorkspace,0);
const textExample=document.createElement('button');textExample.id='new-text-example';textExample.className='button secondary';textExample.textContent='Ejemplo editable';newText.before(textExample);textExample.onclick=()=>createNativeDocument(folder,true);
$('#folder-form').onsubmit=e=>{e.preventDefault();try{createFolder(state,folder,$('#folder-name').value);save();expanded.add(folder);$('#folder-dialog').close();render();toast('Carpeta creada.');}catch(err){$('#folder-error').textContent=err.message;}};
$('#clear').onclick=()=>$('#confirm-dialog').showModal();$('#confirm-clear').onclick=()=>{clearDemo(state);save();$('#confirm-dialog').close();navigate(ROOT);toast('Pruebas eliminadas. Tus carpetas se conservaron.');};
$('#help').onclick=()=>{ $('#preview-body').innerHTML='<div class="preview-paper"><div class="preview-brand">PROTOTIPO LOCAL</div><h1>Diseñar antes de conectar</h1><p>Puedes explorar cinco niveles, crear carpetas, buscar, ver versiones ilustrativas y guardar favoritos.</p><p>Los ejemplos y tus carpetas se conservan en este navegador. No se envían datos, no se suben archivos y no hay base de datos.</p><p>Esta vista de diseño muestra todos los procesos para revisar la estructura. No representa el acceso de un empleado. La autenticación y los permisos por cargo se implementarán después.</p></div>';$('#preview-dialog').showModal();};
document.addEventListener('click',e=>{
 if(e.target.closest('[data-more]'))return;
 const btn=e.target.closest('button,.folder-card,.doc-row');if(!btn)return;
 if(btn.dataset.close)$('#'+btn.dataset.close).close();
 if(btn.dataset.folder){if(btn.closest('#breadcrumbs')||btn.classList.contains('text-button'))navigate(btn.dataset.folder);else selectItem('folder',btn.dataset.folder);}
 if(btn.dataset.openFolder)navigate(btn.dataset.openFolder);
 if(btn.dataset.toggle){const id=btn.dataset.toggle;expanded.has(id)?expanded.delete(id):expanded.add(id);$('#tree').innerHTML=treeRows(ROOT);}
 if(btn.hasAttribute('data-seed'))runSeed();
 if(btn.hasAttribute('data-reset')){$('#search').value='';$('#status').value='';renderContents();}
 if(btn.dataset.doc)selectItem('document',btn.dataset.doc);
 if(btn.dataset.tab){tab=btn.dataset.tab;renderInspector();}
 if(btn.dataset.favorite){const id=btn.dataset.favorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();renderContents();renderInspector();}
 if(btn.id==='open-preview'){
 const d=state.documents.find(x=>x.id===selected);if(!d)return;if(d.editorContent){openNativeDocument(d);return;}if(d.managed){document.dispatchEvent(new CustomEvent('open-controlled-document',{detail:d.id}));return;}
 $('#preview-body').innerHTML=`<div class="preview-paper"><div class="preview-brand">ARLES SAS / ESPACIO DOCUMENTAL</div><div class="preview-watermark">EJEMPLO · SIN VALIDEZ OPERATIVA</div><h1>${escape(d.name)}</h1><p>${escape(d.description||'Contenido ilustrativo para revisar la organización documental. No corresponde a un formato aprobado ni a una operación real.')}</p><hr><div class="preview-fields"><div>Código: ${escape(d.code)}</div><div>Versión: ${d.version}</div><div>Estado: ${escape(d.status)}</div><div>Áreas: ${escape(d.shared.join(', '))}</div></div><hr><p>Ubicación única: ${escape(ancestors(state.folders,d.folder).map(f=>f.name).join(' / '))}</p><p>Esta es una vista ilustrativa. No se ha adjuntado un archivo ${d.type} real.</p></div>`;$('#preview-dialog').showModal();}
});
document.addEventListener('keydown',e=>{if(!document.querySelector('#document-view')?.hidden&&e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('#search').focus();}});
document.addEventListener('dblclick',e=>{
 if(e.target.closest('[data-more]'))return;
 const f=e.target.closest('.folder-card,.tree-name');if(f){navigate(f.dataset.folder);return;}
 const d=e.target.closest('.doc-row');if(d){selectItem('document',d.dataset.doc);openNativeDocument(state.documents.find(x=>x.id===d.dataset.doc));}
});
document.addEventListener('keydown',e=>{
 if(e.target.closest('[data-more]'))return;
 const el=e.target.closest('.folder-card,.doc-row,.tree-name');if(!el)return;
 if(e.key==='Enter'){e.preventDefault();if(el.dataset.folder)navigate(el.dataset.folder);else{selectItem('document',el.dataset.doc);openNativeDocument(state.documents.find(x=>x.id===el.dataset.doc));}}
 if(e.key===' '){e.preventDefault();selectItem(el.dataset.folder?'folder':'document',el.dataset.folder||el.dataset.doc);}
});
setupEditor({state,save,render,select:selectItem,toast,escape});
save('Inicialización o actualización de la estructura documental');
render();
installLibraryUpload({currentFolder:()=>folder});




document.addEventListener('library-updated',()=>{const next=JSON.parse(localStorage.getItem(key));Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,next);render();});

document.addEventListener('shell-open-folder',e=>{document.querySelector('#all').click();if(state.folders.some(f=>f.id===e.detail))navigate(e.detail);});
