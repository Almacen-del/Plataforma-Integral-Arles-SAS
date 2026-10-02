import {addImage,clearImageSession} from './native-assets.js';
let readerPromise;
function reader(){return readerPromise||=(new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/vendor/mammoth-1.13.0.js';s.onload=()=>resolve(window.mammoth);s.onerror=()=>{readerPromise=null;reject(Error('No se pudo cargar el lector Word.'));};document.head.append(s);}));}
export async function importWord(file){
 if(file.size>25*1024*1024)throw Error('El editor admite Word de hasta 25 MB.');
 const {checkXlsxArchive,loadXlsxReader}=await import('./sheet-xlsx.js');const bytes=await file.arrayBuffer();try{checkXlsxArchive(bytes);}catch(e){throw Error(e.message.replaceAll('XLSX','DOCX'));}
 await loadXlsxReader();const zip=await window.JSZip.loadAsync(bytes);if(!zip.file('word/document.xml'))throw Error('El archivo no contiene un Word DOCX válido.');
 const mammoth=await reader(),warnings=['Importación editable: la distribución de páginas, encabezados, pies y formatos complejos puede diferir de Word. El original se conserva completo.'];
 try{
  const result=await mammoth.convertToHtml({arrayBuffer:bytes},{externalFileAccess:false,includeEmbeddedStyleMap:false,styleMap:['u => u',"p[style-name='Título 1'] => h1:fresh","p[style-name='Título 2'] => h2:fresh"],convertImage:mammoth.images.imgElement(async image=>{
   if(!['image/png','image/jpeg','image/webp'].includes(image.contentType)){warnings.push('Una imagen no compatible se conserva únicamente en el original.');return {src:'',alt:'Imagen no compatible; consultar original'};}
   const asset=await addImage(new File([await image.readAsArrayBuffer()],'Imagen del Word',{type:image.contentType}));return {src:'arles-image:'+asset.id};
  })});
  const template=document.createElement('template');template.innerHTML=result.value;for(const image of template.content.querySelectorAll('img')){const id=image.getAttribute('src')?.replace(/^arles-image:/,'');if(/^[a-f0-9-]{36}$/i.test(id||'')){image.dataset.imageId=id;image.removeAttribute('src');}else image.replaceWith(document.createTextNode(image.alt||'[Imagen en el original]'));}
  warnings.push(...result.messages.map(m=>m.message));return {html:template.innerHTML,warnings};
 }catch(e){await clearImageSession();throw e;}
}
let opening=false;
export async function openLibraryWord(doc,version,blob){
 if(opening)return;if(document.querySelector('.nd-window[open]'))throw Error('Cierra el documento abierto antes de abrir otro Word.');opening=true;
 try{
  const {blobOperation}=await import('./document-control.js');const {openImportedWord,cleanDocumentHTML}=await import('./native-document.js');
  const key='editor-docx:'+version.fileId,draft=await blobOperation('get',key),file=new File([blob],version.fileName,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  if(draft&&(draft.kind!=='library-docx-v1'||draft.fileId!==version.fileId||typeof draft.document?.editorContent?.html!=='string'))throw Error('El borrador Word no se pudo leer. No se sobrescribió.');
  const imported=draft?null:await importWord(file);
  const content=draft?.document||{...doc,editorContent:{html:cleanDocumentHTML(imported.html),revision:0,identity:{enabled:false}},editorHistory:[],importWarnings:imported.warnings};
  let expectedRevision=draft?.document.editorContent.revision||0;
  openImportedWord(content,{original:file,onSave:async next=>{
   const {platformStorage}=await import('./platform-cloud.js');const current=JSON.parse(platformStorage.getItem('arles-documental-prototipo-v1')).documents.find(d=>d.id===doc.id);
   if(!current||current.retired||current.status==='Obsoleto'||current.documentKind==='Registro diligenciado'||!current.versions?.some(v=>v.id===version.id&&v.fileId===version.fileId))throw Error('La versión cambió o el documento está protegido. No se guardaron cambios.');
   const latest=await blobOperation('get',key);if((latest?.document?.editorContent?.revision||0)!==expectedRevision)throw Error('El borrador cambió en otra ventana. Vuelve a abrirlo antes de guardar.');
   await blobOperation('put',key,{kind:'library-docx-v1',fileId:version.fileId,document:next,savedAt:new Date().toISOString()});expectedRevision=next.editorContent.revision;
  }});
 }finally{opening=false;}
}
