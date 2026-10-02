import {cloudActive,flushCloud} from './platform-cloud.js';
import {platformStorage as localStorage} from './platform-cloud.js';
import {refreshReferences} from './native-references.js';
import {attachObjectWrap} from './native-object-wrap.js';
import {equationElement} from './native-equations.js';
import {auditSave,auditedAction,currentAuditActor} from './audit.js';
import {ancestors} from './model.js';
import {toolsHTML,attachTools,copySafeStyles,pageSettings,applyPage,printStyles} from './native-tools.js';
import {hydrateImages,imagePrintHTML,commitImages,clearImageSession} from './native-assets.js';
import {identitySettings,identityMiniPreview,identityHeader,identityFooter,identityPageStyles,identityLogo} from './native-identity.js';
import {attachReview,safeLink} from './native-review.js';
import {openNativeHistory} from './native-history.js';
import {attachPages} from './native-pages.js';
import {pageGeometry} from './native-page-layout.js';

const KEY='arles-documental-prototipo-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=()=>JSON.parse(localStorage.getItem(KEY));
const modal=document.createElement('dialog');modal.className='nd-window';document.body.append(modal);
let doc,baseRevision=0,dirty=false,editing=false,isNew=false,busy=false,opener;
let layout=pageSettings();
let identity=identitySettings();
let comments=[];
let disposePages=()=>{};
const route=(s,id)=>['Biblioteca',...ancestors(s.folders,id).map(f=>f.name)].join(' / ');

// Persist only the formatting our editor understands, including on paste and reload.
export function cleanDocumentHTML(html){
 const source=document.createElement('template');source.innerHTML=html;
 const allowed=new Set(['P','DIV','BR','H1','H2','H3','H4','H5','H6','B','STRONG','I','EM','U','S','UL','OL','LI','BLOCKQUOTE','TABLE','TBODY','THEAD','TR','TD','TH','SPAN','HR','FONT','IMG','A','SUB','SUP']);
 function copy(node){
  if(node.nodeType===3)return document.createTextNode(node.textContent);
  if(node.nodeType===1&&node.hasAttribute('data-wrap-guide'))return document.createTextNode('');
  if(node.nodeType!==1||['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH'].includes(node.tagName))return document.createTextNode('');
  if(node.dataset.equation){try{const el=equationElement(JSON.parse(node.dataset.equation));el.querySelectorAll('[contenteditable]').forEach(n=>n.setAttribute('contenteditable','false'));return el;}catch{return document.createTextNode('[Ecuación no válida]');}}
  if(node.tagName==='IMG'&&!/^[0-9a-f-]{36}$/i.test(node.dataset.imageId||''))return document.createTextNode('');
  const result=allowed.has(node.tagName)&&!(node.tagName==='A'&&!safeLink(node.getAttribute('href')))?document.createElement(node.tagName==='FONT'?'span':node.tagName.toLowerCase()):document.createDocumentFragment();
  if(result.nodeType===1&&['left','center','right','justify'].includes(node.style.textAlign))result.style.textAlign=node.style.textAlign;
  if(result.nodeType===1)copySafeStyles(node,result);
  if(node.tagName==='A'&&safeLink(node.getAttribute('href'))){result.href=safeLink(node.getAttribute('href'));result.target='_blank';result.rel='noopener noreferrer';}
  for(const child of node.childNodes)result.append(copy(child));return result;
 }
 const out=document.createElement('div');for(const n of source.content.childNodes)out.append(copy(n));refreshReferences(out);return out.innerHTML;
}

export async function openNativeDocument(value){
 if(modal.open)return;
 const current=load()?.documents.find(d=>d.id===value.id)||value;
 if(!current.editorContent){
  const vs=current.versions||[],v=vs.find(v=>v.status==='current')||vs.at(-1);
  if(v?.fileId){const {previewFile}=await import('./document-control.js');try{await previewFile(current.id+'|'+v.id);}catch(e){alert(e.message);}return;}
 }
 opener=document.activeElement;doc=structuredClone(current);isNew=false;editing=false;dirty=false;baseRevision=doc.editorContent?.revision||0;render();modal.showModal();
}

export function createNativeDocument(folder,example=false){
 if(modal.open)return;
 const s=load();if(!s.folders.some(f=>f.id===folder)){alert('Entra primero en la carpeta donde guardarás el documento.');return;}
 opener=document.activeElement;const id=crypto.randomUUID();
 doc={id,name:example?'Ejemplo de procedimiento Arles':'Documento nuevo',code:'DOC-'+id.slice(0,8).toUpperCase(),type:'ARLES',folder,linkedFolders:[],shared:[],status:'Borrador',version:'01',origin:'internal',documentKind:'Documento',ownerArea:s.folders.find(f=>f.id===folder)?.area||'General',description:'Documento creado con el editor Arles',editorContent:{revision:0,html:example?'<h1>Procedimiento de ejemplo</h1><p>Contenido ficticio para probar el editor.</p><h2>Objetivo</h2><p>Registrar y revisar las actividades del área.</p><h2>Actividades</h2><ol><li>Preparar la actividad.</li><li>Registrar el resultado.</li></ol><table><tbody><tr><th>Actividad</th><th>Responsable</th></tr><tr><td>Revisión</td><td>Persona de ejemplo</td></tr></tbody></table>':'<p><br></p>'},editorHistory:[]};
 if(example)doc.editorContent.html+='<div data-page-break="true" contenteditable="false" aria-label="Salto de página"><br></div><h2>Evidencias y observaciones</h2><p>Esta sección comenzará en una página nueva al imprimir o guardar como PDF.</p>';
 doc.editorContent.identity={enabled:true,showLogo:true,date:new Date().toLocaleDateString('en-CA'),footer:example?'Documento de ejemplo · sin validez operativa':'',numberPages:true};
 if(example)doc.editorContent.comments=[{id:crypto.randomUUID(),author:'Revisor de ejemplo',role:'Calidad · ejemplo',text:'Verificar los responsables antes de aprobar este procedimiento.',quote:null,status:'open',at:new Date().toISOString()}];
 isNew=true;editing=true;dirty=true;baseRevision=0;render();modal.showModal();
}

function render(){
 disposePages();
 layout=pageSettings(doc.editorContent?.page);
 identity=identitySettings(doc.editorContent?.identity);
 comments=structuredClone(doc.editorContent?.comments||[]);
 const native=!!doc.editorContent,locked=doc.retired||doc.status==='Obsoleto'||doc.documentKind==='Registro diligenciado';
 modal.innerHTML=`<header class="nd-head"><div><small>EDITOR DE DOCUMENTOS · ARLES SAS</small>${editing?`<div class="nd-document-fields"><label>Nombre del documento<input id="nd-name" maxlength="100" value="${esc(doc.name)}"></label><label>Código<input id="nd-code" maxlength="60" value="${esc(doc.code)}" autocomplete="off"></label></div>`:`<h2>${esc(doc.name)}</h2>`}<p>${esc(doc.code)} · ${esc(route(load(),doc.folder))}</p></div><button class="icon-button" data-nd="close" aria-label="Cerrar documento">×</button></header>
 <div class="nd-actions"><span id="nd-state" role="status">${native?(editing?'Cambios sin guardar':(cloudActive()?'Solo lectura · Supabase':'Solo lectura · Guardado en este navegador')):'Documento sin archivo adjunto'}</span>${native?`<button class="button secondary" data-nd="edit" ${editing||locked?'disabled':''}>Editar</button><button class="button primary" data-nd="save" ${!editing?'disabled':''}>Guardar cambios</button><button class="button secondary" data-nd="print">Imprimir / PDF</button><button class="button secondary" data-nd="docx" title="Descargar el contenido actual. Los comentarios e historial permanecen en la plataforma.">Descargar Word</button>`:''}</div>
 ${native?`<div class="nd-toolbar" aria-label="Herramientas de texto" ${!editing?'hidden':''}>${[['bold','Negrita'],['italic','Cursiva'],['underline','Subrayado'],['insertUnorderedList','Lista'],['insertOrderedList','Numeración'],['justifyLeft','Izquierda'],['justifyCenter','Centrar'],['justifyRight','Derecha'],['undo','Deshacer'],['redo','Rehacer']].map(([cmd,label])=>`<button type="button" data-command="${cmd}">${label}</button>`).join('')}<button data-block="h1">Título</button><button data-block="h2">Subtítulo</button><button data-block="p">Párrafo</button><button data-nd="table">Tabla 3 × 3</button></div><div class="nd-canvas"><article id="nd-paper" class="nd-paper" role="textbox" aria-label="Contenido del documento" aria-multiline="true" contenteditable="${editing}" spellcheck="true">${cleanDocumentHTML(doc.editorContent.html)}</article></div><details class="nd-history"><summary>Historial de guardados (${(doc.editorHistory||[]).length})</summary>${[...(doc.editorHistory||[])].reverse().map(h=>`<details><summary>Guardado ${h.revision} · ${esc(new Date(h.at).toLocaleString('es-CO'))}</summary><div class="nd-history-content">${cleanDocumentHTML(h.html)}</div></details>`).join('')||'<p>El primer guardado aparecerá aquí.</p>'}</details>`:`<div class="nd-empty"><h3>${esc(doc.name)}</h3><p>${esc(doc.description||'No hay contenido adjunto para visualizar.')}</p><p>Este elemento es una referencia de la biblioteca. Para escribir, crea un documento Arles dentro de su carpeta. La importación de Word se incorporará en otra etapa.</p></div>`}
 <footer class="nd-foot">${native?'El guardado conserva la carpeta y los enlaces. Cada guardado mantiene una revisión recuperable en el historial; no publica una versión aprobada.':'El original se conserva sin cambios.'}<span id="nd-error" role="alert"></span></footer>`;
 const dock=document.createElement('div');dock.className='nd-sticky-tools';const actions=modal.querySelector('.nd-actions');actions.before(dock);dock.append(actions);const toolbar=modal.querySelector('.nd-toolbar');if(toolbar)dock.append(toolbar);
 const paper=modal.querySelector('#nd-paper');if(paper){applyPage(paper,layout);const header=document.createElement('div');header.className='nd-identity-preview';paper.before(header);const footer=document.createElement('div');footer.className='nd-footer-preview';paper.after(footer);refreshIdentity();hydrateImages(modal);attachObjectWrap(paper);modal.querySelector('.nd-toolbar').innerHTML=toolsHTML(layout);if(editing)attachTools(modal,{changed:markDirty,getPage:()=>({...layout}),setPage:value=>{layout=pageSettings(value);applyPage(paper,layout);refreshIdentity();for(const el of modal.querySelectorAll('[data-page]'))el.value=String(layout[el.dataset.page]);},getIdentity:()=>({...identity}),setIdentity:value=>{identity=identitySettings(value);refreshIdentity();for(const el of modal.querySelectorAll('[data-identity]')){if(el.type==='checkbox')el.checked=identity[el.dataset.identity];else el.value=identity[el.dataset.identity];}},getReview:()=>structuredClone(comments),setReview:value=>{comments=structuredClone(value);paper.dispatchEvent(new Event('nd-review-refresh'));},doc});attachReview(modal,{editing,getComments:()=>comments,setComments:value=>{comments=value;},changed:markDirty});}
 modal.querySelector('#nd-paper')?.addEventListener('input',markDirty);
 for(const id of ['nd-name','nd-code'])modal.querySelector('#'+id)?.addEventListener('input',()=>{markDirty();refreshIdentity();});
 modal.querySelector('#nd-paper')?.addEventListener('paste',e=>{if(!editing)return;e.preventDefault();document.execCommand('insertHTML',false,cleanDocumentHTML(e.clipboardData.getData('text/html')||esc(e.clipboardData.getData('text/plain')).replaceAll('\n','<br>')));markDirty();});
 modal.querySelector('#nd-paper')?.addEventListener('drop',e=>e.preventDefault());
 if(paper){const history=document.createElement('button');history.className='button secondary';history.dataset.ndHistory='open';history.textContent='Comparar y recuperar';modal.querySelector('.nd-actions').append(history);history.onclick=()=>openNativeHistory(doc,{clean:cleanDocumentHTML,canRestore:!dirty&&!locked&&!isNew,blockedReason:dirty?'Guarda los cambios pendientes antes de recuperar una revisión.':locked?'Este documento está protegido.':'',onRestore:async snapshot=>{const result=await save(snapshot);if(!result)throw Error(modal.querySelector('#nd-error').textContent||'Recuperación cancelada. El documento se conserva sin cambios.');return result;}});}
 if(paper)disposePages=attachPages(modal,{snapshot:()=>({doc:{...doc,name:modal.querySelector('#nd-name')?.value??doc.name,code:modal.querySelector('#nd-code')?.value??doc.code},html:paper.innerHTML,page:{...layout},identity:{...identity}}),buildPrintHTML:buildNativePrintHTML});
 if(editing&&toolbar){const tabs=toolbar.querySelector('.nd-ribbon-tabs');if(tabs){const state=actions.querySelector('#nd-state');if(state)modal.querySelector('.nd-head>div').append(state);tabs.append(actions);actions.setAttribute('aria-label','Acciones del documento');}}
}
function refreshIdentity(){const header=modal.querySelector('.nd-identity-preview'),footer=modal.querySelector('.nd-footer-preview');if(!header)return;header.innerHTML=identityHeader({...doc,name:modal.querySelector('#nd-name')?.value??doc.name,code:modal.querySelector('#nd-code')?.value??doc.code},identity);footer.innerHTML=identityFooter(identity);header.style.paddingBottom=identity.headerGap+'mm';footer.style.paddingTop=identity.footerGap+'mm';const mini=modal.querySelector('[data-identity-preview]');if(mini)mini.innerHTML=identityMiniPreview({...doc,name:modal.querySelector('#nd-name')?.value??doc.name,code:modal.querySelector('#nd-code')?.value??doc.code},identity);for(const element of [header,footer]){element.style.maxWidth=modal.querySelector('#nd-paper').style.getPropertyValue('--page-width');element.style.setProperty('--page-margin',layout.margin+'mm');element.style.paddingLeft=layout.left+'mm';element.style.paddingRight=layout.right+'mm';}}
function markDirty(){dirty=true;modal.querySelector('#nd-state').textContent='Cambios sin guardar';}
async function save(recovery=null){
 if(busy||(recovery?dirty:!editing||!dirty))return false;
 modal.querySelector('#nd-error').textContent='';
 if(modal.querySelector('[data-tool=image-upload]')?.disabled){modal.querySelector('#nd-error').textContent='Espera a que termine de cargar la imagen antes de guardar.';return;}
 const html=cleanDocumentHTML(recovery?.html??modal.querySelector('#nd-paper').innerHTML),name=modal.querySelector('#nd-name')?.value.trim()??doc.name,code=modal.querySelector('#nd-code')?.value.trim()??doc.code;
 const page=recovery?pageSettings(recovery.page):{...layout},header=recovery?identitySettings(recovery.identity):{...identity},review=structuredClone(recovery?recovery.comments||[]:comments);
 if(!code){modal.querySelector('#nd-error').textContent='Escribe un código para el documento.';return;}
 if(!name){modal.querySelector('#nd-error').textContent='Escribe un nombre para el documento.';return;}
 if(html.length>300000){modal.querySelector('#nd-error').textContent='Este documento supera el límite local de 300.000 caracteres.';return;}
 busy=true;modal.querySelector('[data-nd=save]').disabled=true;
 try{
  const done=await auditedAction(()=>{
   const s=load(),latest=s.documents.find(d=>d.id===doc.id);
   if(!isNew&&!latest)throw Error('El documento fue eliminado. No se sobrescribió ningún dato.');
   if(latest&&(latest.editorContent?.revision!==baseRevision))throw Error('El documento cambió en otra ventana. Conserva tu texto y vuelve a abrirlo antes de guardar.');
   if(latest&&(latest.retired||latest.status==='Obsoleto'||latest.documentKind==='Registro diligenciado'))throw Error('El documento ahora está protegido. No se guardaron cambios.');
   const target=latest||structuredClone(doc);
   if(recovery&&!target.editorHistory?.some(h=>h.revision===recovery.revision&&h.html===recovery.html))throw Error('No se encontró el guardado original para recuperar.');
   if(!s.folders.some(f=>f.id===target.folder))throw Error('La carpeta ya no existe. No se guardaron cambios.');
   if(s.documents.some(d=>d.id!==target.id&&d.folder===target.folder&&d.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('Ya existe ese nombre en esta carpeta. Elige otro nombre.');
   if(s.documents.some(d=>d.id!==target.id&&String(d.code||'').trim().toLocaleLowerCase()===code.toLocaleLowerCase()))throw Error('Ese código ya pertenece a otro documento.');
   const revision=baseRevision+1,at=new Date().toISOString();
   const actor=currentAuditActor();const restored=recovery?{restoredFrom:recovery.revision}:{};
   target.editorContent={html,revision,page,identity:header,comments:review};target.editorHistory=[...(target.editorHistory||[]),{html,revision,at,page,name,code,identity:header,comments:review,author:actor?.name||'',role:actor?.role||'',reason:actor?.reason||'',...restored}];target.modified=at;
   target.name=name;target.code=code;if(isNew)s.documents.push(target);
   auditSave(KEY,s,'Biblioteca');commitImages(html);doc=structuredClone(target);baseRevision=revision;isNew=false;dirty=false;
  });
  if(done){await flushCloud();document.dispatchEvent(new Event('library-updated'));document.dispatchEvent(new Event('platform-data-changed'));render();modal.querySelector('#nd-state').textContent='Guardado · '+new Date().toLocaleTimeString('es-CO')+' · misma carpeta';}
  return done;
 }catch(e){dirty=true;modal.querySelector('#nd-state').textContent='Guardado pendiente';modal.querySelector('#nd-error').textContent='No se confirmó el guardado: '+e.message;return false;}
 finally{busy=false;modal.querySelector('[data-nd=save]').disabled=!editing;}
}
function close(){if(busy||modal.querySelector('[data-tool=image-upload]')?.disabled)return;if(dirty&&!confirm('Hay cambios sin guardar. ¿Quieres descartarlos y cerrar?'))return;dirty=false;disposePages();modal.close();clearImageSession();opener?.focus();}
modal.addEventListener('cancel',e=>{if(e.target!==modal)return;e.preventDefault();close();});
window.addEventListener('beforeunload',e=>{if(dirty&&modal.open){e.preventDefault();e.returnValue='';}});
modal.addEventListener('mousedown',e=>{if(e.target.closest('.nd-toolbar button'))e.preventDefault();});
modal.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.nd==='close')close();
 if(b.dataset.nd==='save')save();
 if(b.dataset.nd==='edit'){editing=true;render();modal.querySelector('#nd-state').textContent='En edición · sin cambios';modal.querySelector('#nd-paper').focus();}
 if(editing&&(b.dataset.command||b.dataset.block||b.dataset.nd==='table')){
  const paper=modal.querySelector('#nd-paper');paper.focus();const selection=window.getSelection();if(!selection.rangeCount||!paper.contains(selection.anchorNode)){const range=document.createRange();range.selectNodeContents(paper);range.collapse(false);selection.removeAllRanges();selection.addRange(range);}
  if(b.dataset.command)document.execCommand(b.dataset.command,false);
  if(b.dataset.block)document.execCommand('formatBlock',false,b.dataset.block);
  if(b.dataset.nd==='table')document.execCommand('insertHTML',false,'<table><tbody>'+Array.from({length:3},()=>'<tr><td>Texto</td><td>Texto</td><td>Texto</td></tr>').join('')+'</tbody></table><p><br></p>');markDirty();
 }
 if(b.dataset.nd==='docx'){
  if(modal.querySelector('[data-tool=image-upload]')?.disabled){modal.querySelector('#nd-error').textContent='Espera a que termine de cargar la imagen.';return;}
  const snapshot={doc:{...doc,name:modal.querySelector('#nd-name')?.value??doc.name,code:modal.querySelector('#nd-code')?.value??doc.code},html:cleanDocumentHTML(modal.querySelector('#nd-paper').innerHTML),page:{...layout},identity:{...identity}};
  try{b.disabled=true;modal.querySelector('#nd-error').textContent='';const {buildNativeDOCX,docxFilename}=await import('./native-docx.js');const blob=await buildNativeDOCX(snapshot),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=docxFilename(snapshot.doc.name);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);modal.querySelector('#nd-state').textContent=dirty?'Word descargado con cambios pendientes · guarda también en la biblioteca':'Word descargado · original conservado';}
  catch(error){modal.querySelector('#nd-error').textContent='No se pudo exportar a Word: '+error.message;}finally{b.disabled=false;}
 }
 if(b.dataset.nd==='print'){
  try{
  b.disabled=true;
  const html=await buildNativePrintHTML({...doc,name:modal.querySelector('#nd-name')?.value??doc.name,code:modal.querySelector('#nd-code')?.value??doc.code},modal.querySelector('#nd-paper').innerHTML,layout,identity);
  const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:0;height:0;border:0';document.body.append(frame);
  frame.onload=async()=>{await Promise.all([...frame.contentDocument.images].map(img=>img.decode().catch(()=>{})));frame.contentWindow.focus();frame.contentWindow.print();setTimeout(()=>frame.remove(),60000);};
  frame.srcdoc=html;
  }catch(error){modal.querySelector('#nd-error').textContent=error.message;}finally{b.disabled=false;}
 }
});
export async function buildNativePrintHTML(documentInfo,html,page,header){const config=identitySettings(header),logo=config.enabled&&config.showLogo?await identityLogo():'',geom=pageGeometry(page,config);return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(documentInfo.name)+'</title><style>'+printStyles(page)+await identityPageStyles(documentInfo,header,logo,geom.contentWidth)+`body{margin:0;overflow-wrap:anywhere}img[data-image-id]{max-height:${geom.contentHeight}mm;object-fit:contain}`+'</style></head><body>'+await imagePrintHTML(cleanDocumentHTML(html))+'</body></html>';}
modal.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}});
