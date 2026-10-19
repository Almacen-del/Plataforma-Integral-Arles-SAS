import {cloudActive,officeDraft,platformStorage} from './platform-cloud.js';
import {openOnlyofficeIfAvailable} from './onlyoffice-client.js';

let activeReader;
const labels={draft:'Borrador',review:'En revisión',current:'Vigente',approved:'Aprobado',obsolete:'Obsoleto',rejected:'Rechazado'};
export function canEditLibraryPDF(doc,version){
 return !!doc&&!!version?.fileId&&/\.pdf$/i.test(version.fileName||'')&&!doc.demo&&!doc.retired&&!['obsolete','rejected'].includes(version.status)&&doc.documentKind!=='Registro diligenciado';
}
export async function openLibraryPDFReader(doc,version){
 if(!version?.fileId||!/\.pdf$/i.test(version.fileName||''))throw Error('Selecciona una versión PDF con archivo.');
 activeReader?.close();
 if(!document.querySelector('link[data-pdf-reader-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href='/pdf-library-reader.css';style.dataset.pdfReaderStyle='';document.head.append(style);}
 const dialog=document.createElement('dialog');dialog.id='arles-pdf-reader';dialog.setAttribute('aria-labelledby','pdf-reader-title');dialog.dataset.documentId=doc.id;dialog.dataset.versionId=version.id;
 dialog.innerHTML='<header class="pr-header"><button type="button" class="icon-button" data-pr-close aria-label="Cerrar lector PDF">←</button><div class="pr-heading"><h2 id="pdf-reader-title"></h2><p data-pr-source></p></div><button type="button" class="button secondary" data-pr-refresh>Actualizar</button><button type="button" class="button secondary" data-pr-download disabled>Descargar</button><button type="button" class="button primary" data-pr-edit disabled>Editar PDF ↗</button></header><div class="pr-toolbar" aria-label="Controles del lector PDF"><button type="button" data-pr-previous aria-label="Página anterior" disabled>‹</button><label>Página <input type="number" min="1" value="1" data-pr-page aria-label="Número de página" disabled></label><span data-pr-count>de —</span><button type="button" data-pr-next aria-label="Página siguiente" disabled>›</button><label class="pr-zoom-label">Zoom <select data-pr-zoom aria-label="Zoom del PDF" disabled><option value="fit">Ajustar al ancho</option><option value="0.5">50 %</option><option value="0.75">75 %</option><option value="1">100 %</option><option value="1.25">125 %</option><option value="1.5">150 %</option><option value="2">200 %</option></select></label><span class="pr-readonly">Vista de lectura</span></div><p class="pr-action-message" data-pr-action role="status" hidden></p><div class="pr-stage"><p class="pr-message" data-pr-message role="status">Abriendo PDF…</p><form class="pr-password" data-pr-password hidden><label>Contraseña del PDF<input type="password" name="password" autocomplete="off" required></label><p role="alert" data-pr-password-error></p><button type="submit" class="button primary">Abrir PDF</button></form><div class="pr-paper" data-pr-paper hidden></div></div>';
 document.body.append(dialog);activeReader=dialog;dialog.showModal();
 const q=selector=>dialog.querySelector(selector),controller=new AbortController(),signal=controller.signal;
 let aiPanel,aiHost;
 const aiButton=document.createElement('button');aiButton.type='button';aiButton.textContent='Asistente IA';q('[data-pr-close]').before(aiButton);
 aiButton.onclick=async()=>{
  if(aiPanel){aiPanel.remove();aiPanel=null;if(window.__arlesPDFAI===aiHost)delete window.__arlesPDFAI;return;}
  if(!pdf||!cloudActive()){action('Abre el PDF con tu cuenta conectada para consultar al asistente.');return;}
  const {createEditorAIHost}=await import('./editor-ai-host.js'),{cloudClient}=await import('./platform-cloud.js');if(closed)return;
  aiHost={...createEditorAIHost({documentId:doc.id,versionId:version.id,type:'pdf',editable:false},{getSession:()=>cloudClient().auth.getSession()}),async readContext(){if(!pdf||closed)throw Error('El PDF no está disponible.');const page=await pdf.getPage(pageNumber),data=await page.getTextContent(),text=data.items.map(item=>item.str||'').join(' ');if(!text.trim())throw Error('Esta página no contiene texto extraíble. Necesita OCR antes de consultarla.');return {context:{type:'pdf',text:'Página '+pageNumber+'\n'+text.slice(0,11900),truncated:true},target:{}};}};
  window.__arlesPDFAI=aiHost;aiPanel=document.createElement('iframe');aiPanel.className='pr-ai-panel';aiPanel.title='Asistente del PDF';aiPanel.src='/office-ai/index.html?reader=pdf';dialog.append(aiPanel);
 };
 let file,loadingTask,pdf,renderTask,textLayer,reader,pageNumber=1,loadGeneration=0,renderGeneration=0,closed=false,resizeTimer;
 const liveDoc=()=>{try{return JSON.parse(platformStorage.getItem('arles-documental-prototipo-v1')||'{}').documents?.find(d=>d.id===doc.id)||doc;}catch{return doc;}};
 const liveVersion=()=>liveDoc().versions?.find(v=>v.id===version.id)||version;
 q('#pdf-reader-title').textContent=doc.name||version.fileName;
 function editAvailability(){const allowed=cloudActive()&&canEditLibraryPDF(liveDoc(),liveVersion());q('[data-pr-edit]').disabled=!file||!pdf||!allowed;q('[data-pr-edit]').title=allowed?'Abrir el editor PDF en otra pestaña':!cloudActive()?'Inicia sesión para editar este PDF.':'Esta versión está disponible solo para lectura.';}
 function controls(){const ready=!!pdf;q('[data-pr-page]').disabled=!ready;q('[data-pr-zoom]').disabled=!ready;q('[data-pr-previous]').disabled=!ready||pageNumber<=1;q('[data-pr-next]').disabled=!ready||pageNumber>=pdf.numPages;q('[data-pr-page]').value=pageNumber;q('[data-pr-page]').max=pdf?.numPages||1;q('[data-pr-count]').textContent='de '+(pdf?.numPages||'—');q('[data-pr-download]').disabled=!file;editAvailability();}
 function message(value){q('[data-pr-message]').textContent=value;q('[data-pr-message]').hidden=!value;}
 function action(value){q('[data-pr-action]').textContent=value;q('[data-pr-action]').hidden=!value;}
 async function renderPage(){
  if(!pdf||closed)return;const generation=++renderGeneration,current=pdf;renderTask?.cancel();textLayer?.cancel();delete q('[data-pr-paper]').dataset.renderedPage;
  try{
   const page=await current.getPage(pageNumber);if(closed||generation!==renderGeneration||current!==pdf)return;
   const base=page.getViewport({scale:1}),choice=q('[data-pr-zoom]').value,scale=choice==='fit'?Math.min(2,Math.max(.1,(q('.pr-stage').clientWidth-64)/base.width)):Number(choice),viewport=page.getViewport({scale});
   const paper=q('[data-pr-paper]'),canvas=document.createElement('canvas'),layer=document.createElement('div'),pixels=Math.min(window.devicePixelRatio||1,2,Math.sqrt(16000000/(viewport.width*viewport.height)));
   canvas.width=Math.max(1,Math.floor(viewport.width*pixels));canvas.height=Math.max(1,Math.floor(viewport.height*pixels));canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';canvas.setAttribute('aria-label','Página '+pageNumber+' del PDF');layer.className='textLayer';
   paper.replaceChildren(canvas,layer);paper.style.width=viewport.width+'px';paper.style.height=viewport.height+'px';paper.style.setProperty('--total-scale-factor',scale);paper.style.setProperty('--scale-round-x','1px');paper.style.setProperty('--scale-round-y','1px');paper.hidden=false;message('');controls();
   const task=renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:pixels!==1?[pixels,0,0,pixels,0,0]:null,annotationMode:reader.AnnotationMode.ENABLE});await task.promise;
   if(closed||generation!==renderGeneration||current!==pdf)return;
   const content=await page.getTextContent();if(closed||generation!==renderGeneration||current!==pdf)return;
   const text=textLayer=new reader.TextLayer({textContentSource:content,container:layer,viewport});await text.render();
   if(generation===renderGeneration&&!closed){paper.dataset.renderedPage=String(pageNumber);q('.pr-stage').scrollTop=0;}
  }catch(error){if(!closed&&generation===renderGeneration&&error.name!=='RenderingCancelledException')message('No se pudo mostrar la página. '+error.message);}
 }
 async function reload(){
  const generation=++loadGeneration;++renderGeneration;renderTask?.cancel();textLayer?.cancel();pdf=null;file=null;controls();delete q('[data-pr-paper]').dataset.renderedPage;q('[data-pr-paper]').hidden=true;q('[data-pr-password]').hidden=true;action('');message('Abriendo PDF…');q('[data-pr-refresh]').disabled=true;
  const old=loadingTask;loadingTask=null;if(old)await old.destroy().catch(()=>{});
  try{
   const draft=await officeDraft(version.fileId);const {blobOperation}=await import('./document-control.js');const blob=draft?.blob||await blobOperation('get',version.fileId);
   if(closed||generation!==loadGeneration)return;
   if(!(blob instanceof Blob)||!blob.size)throw Error('El archivo no está disponible.');if(blob.size>50*1024*1024)throw Error('El lector admite PDF de hasta 50 MB.');
   if(!new TextDecoder('ascii').decode(await blob.slice(0,1024).arrayBuffer()).includes('%PDF-'))throw Error('El archivo no contiene un PDF válido.');
   reader=await import('./public/vendor/pdf/pdf-6.3.289.mjs');reader.GlobalWorkerOptions.workerSrc='/public/vendor/pdf/pdf.worker-6.3.289.mjs';
   if(closed||generation!==loadGeneration)return;
   file=new File([blob],version.fileName,{type:'application/pdf'});
   q('[data-pr-source]').textContent=(draft?'Borrador compartido guardado'+(draft.savedAt?' · '+new Date(draft.savedAt).toLocaleString('es-CO'):''):'Original · '+(labels[version.status]||version.status||'Documento'))+' · V'+(version.number||'01');
   const bytes=new Uint8Array(await blob.arrayBuffer());if(closed||generation!==loadGeneration)return;
   const task=loadingTask=reader.getDocument({data:bytes,isEvalSupported:false,cMapUrl:'/public/vendor/pdf/cmaps/',cMapPacked:true,standardFontDataUrl:'/public/vendor/pdf/standard_fonts/',wasmUrl:'/public/vendor/pdf/wasm/',useSystemFonts:true});
   task.onPassword=(update,reason)=>{if(closed||generation!==loadGeneration)return;message('');const form=q('[data-pr-password]');form.hidden=false;q('[data-pr-password-error]').textContent=reason===reader.PasswordResponses.INCORRECT_PASSWORD?'La contraseña no es correcta. Intenta nuevamente.':'';form.reset();form.querySelector('input').focus();form.onsubmit=event=>{event.preventDefault();const password=form.querySelector('input').value;form.reset();form.hidden=true;message('Abriendo PDF…');update(password);};};
   const result=await task.promise;if(closed||generation!==loadGeneration)return;pdf=result;pageNumber=Math.min(pageNumber,pdf.numPages);controls();await renderPage();
  }catch(error){if(!closed&&generation===loadGeneration){file=null;pdf=null;controls();message('No se pudo abrir el PDF. '+error.message);}}
  finally{if(!closed&&generation===loadGeneration)q('[data-pr-refresh]').disabled=false;}
 }
 q('[data-pr-close]').onclick=()=>dialog.close();q('[data-pr-refresh]').onclick=reload;
 q('[data-pr-previous]').onclick=()=>{if(pdf&&pageNumber>1){pageNumber--;renderPage();}};
 q('[data-pr-next]').onclick=()=>{if(pdf&&pageNumber<pdf.numPages){pageNumber++;renderPage();}};
 q('[data-pr-page]').onchange=()=>{if(pdf){pageNumber=Math.max(1,Math.min(pdf.numPages,Math.trunc(Number(q('[data-pr-page]').value)||1)));renderPage();}};
 q('[data-pr-zoom]').onchange=renderPage;
 q('[data-pr-edit]').onclick=async()=>{if(!cloudActive()||!canEditLibraryPDF(liveDoc(),liveVersion())){editAvailability();return;}q('[data-pr-edit]').disabled=true;action('Abriendo el editor PDF…');try{if(!await openOnlyofficeIfAvailable(doc.id,liveVersion(),undefined,{requireNewTab:true}))throw Error('No se pudo abrir el editor.');action('El editor se abrió en otra pestaña. Usa Actualizar después de guardar para ver los cambios.');}catch(error){action(error.message);}finally{editAvailability();}};
 q('[data-pr-download]').onclick=()=>{if(!file)return;const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.addEventListener('integral-cloud-status',editAvailability,{signal});document.addEventListener('platform-data-changed',editAvailability,{signal});
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(q('[data-pr-zoom]').value==='fit')renderPage();},150);},{signal});
 dialog.addEventListener('close',()=>{closed=true;if(window.__arlesPDFAI===aiHost)delete window.__arlesPDFAI;++loadGeneration;++renderGeneration;controller.abort();clearTimeout(resizeTimer);renderTask?.cancel();textLayer?.cancel();loadingTask?.destroy().catch(()=>{});dialog.remove();if(activeReader===dialog)activeReader=null;},{once:true});
 await reload();
}
