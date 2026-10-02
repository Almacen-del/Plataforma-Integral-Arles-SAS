import {addImage,clearImageSession} from './native-assets.js';
let readerPromise;
function reader(){return readerPromise||=(new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/vendor/mammoth-1.13.0.js';s.onload=()=>resolve(window.mammoth);s.onerror=()=>{readerPromise=null;reject(Error('No se pudo cargar el lector Word.'));};document.head.append(s);}));}
export async function importWord(file){
 if(file.size>25*1024*1024)throw Error('El editor admite Word de hasta 25 MB.');
 const {checkXlsxArchive,loadXlsxReader}=await import('./sheet-xlsx.js');const bytes=await file.arrayBuffer();try{checkXlsxArchive(bytes);}catch(e){throw Error(e.message.replaceAll('XLSX','DOCX'));}
 await loadXlsxReader();const zip=await window.JSZip.loadAsync(bytes);if(!zip.file('word/document.xml'))throw Error('El archivo no contiene un Word DOCX válido.');
 const {parseWordXML,preserveWordStyles,wordPage}=await import('./native-docx-format.js');
 const main=parseWordXML(await zip.file('word/document.xml').async('string')),styles=parseWordXML(await zip.file('word/styles.xml')?.async('string')||'<styles/>'),numbering=parseWordXML(await zip.file('word/numbering.xml')?.async('string')||'<numbering/>');
 const mammoth=await reader(),warnings=['Se importan el contenido, encabezado, pie y configuración de página. Los objetos flotantes y los saltos automáticos pueden variar respecto a Word. El original se conserva completo.'];
 if(main.getElementsByTagNameNS('*','sectPr').length>1)warnings.push('Este Word contiene varias secciones: el editor usa una configuración de página común; consulta el original para los cambios de orientación o márgenes entre secciones.');
 if([...main.getElementsByTagNameNS('*','headerReference'),...main.getElementsByTagNameNS('*','footerReference')].some(n=>['first','even'].includes(n.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','type'))))warnings.push('Los encabezados y pies especiales de primera página o páginas pares todavía no se reproducen por separado.');
 if(main.getElementsByTagNameNS('*','anchor').length)warnings.push('Este archivo contiene objetos flotantes; su posición puede cambiar al importarlos.');
 async function convert(buffer,xml){
  const result=await mammoth.convertToHtml({arrayBuffer:buffer},{externalFileAccess:false,includeEmbeddedStyleMap:false,styleMap:['u => u',"p[style-name='Título 1'] => h1:fresh","p[style-name='Título 2'] => h2:fresh"],convertImage:mammoth.images.imgElement(async image=>{
   if(!['image/png','image/jpeg','image/webp'].includes(image.contentType)){warnings.push('Una imagen no compatible se conserva únicamente en el original.');return {src:'',alt:'Imagen no compatible; consultar original'};}
   const asset=await addImage(new File([await image.readAsArrayBuffer()],'Imagen del Word',{type:image.contentType}));return {src:'arles-image:'+asset.id};
  })});
  const template=document.createElement('div');template.innerHTML=result.value;for(const image of template.querySelectorAll('img')){const id=image.getAttribute('src')?.replace(/^arles-image:/,'');if(/^[a-f0-9-]{36}$/i.test(id||'')){image.dataset.imageId=id;image.removeAttribute('src');}else image.replaceWith(document.createTextNode(image.alt||'[Imagen en el original]'));}
  warnings.push(...result.messages.map(m=>m.message));return preserveWordStyles(template,xml,styles,numbering);
 }
 try{
  const html=await convert(bytes,main),page=wordPage(main),rels=parseWordXML(await zip.file('word/_rels/document.xml.rels').async('string'));
  async function region(kind){const ref=[...main.getElementsByTagNameNS('*',kind+'Reference')].find(n=>n.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','type')==='default');if(!ref)return '';const id=ref.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),rel=[...rels.getElementsByTagNameNS('*','Relationship')].find(n=>n.getAttribute('Id')===id);if(!rel||rel.getAttribute('TargetMode')==='External')return '';const path='word/'+rel.getAttribute('Target').replace(/^\/?word\//,'');const part=zip.file(path);if(!part)return '';const source=parseWordXML(await part.async('string'));const copy=await window.JSZip.loadAsync(bytes);copy.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+[...source.documentElement.childNodes].map(n=>new XMLSerializer().serializeToString(n)).join('')+'</w:body></w:document>');const regionRels=zip.file('word/_rels/'+path.split('/').at(-1)+'.rels');copy.file('word/_rels/document.xml.rels',regionRels?await regionRels.async('string'):'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');return convert(await copy.generateAsync({type:'arraybuffer'}),source);}
  return {html,page,formatHTML:value=>{const root=document.createElement('div');root.innerHTML=value;return preserveWordStyles(root,main,styles,numbering);},sourceHeader:await region('header'),sourceFooter:await region('footer'),sourceFormatVersion:6,warnings};
 }catch(e){await clearImageSession();throw e;}

}
let opening=false;
export async function openLibraryWord(doc,version,blob){
 if(opening)return;if(document.querySelector('.nd-window[open]'))throw Error('Cierra el documento abierto antes de abrir otro Word.');opening=true;
 try{
  const {blobOperation}=await import('./document-control.js');const {openImportedWord,cleanDocumentHTML}=await import('./native-document.js');
  const key='editor-docx:'+version.fileId,draft=await blobOperation('get',key),file=new File([blob],version.fileName,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  if(draft&&(draft.kind!=='library-docx-v1'||draft.fileId!==version.fileId||typeof draft.document?.editorContent?.html!=='string'))throw Error('El borrador Word no se pudo leer. No se sobrescribió.');
  const imported=draft?.document.editorContent.sourceFormatVersion===6?null:await importWord(file);
  const content=draft?.document||{...doc,editorContent:{html:cleanDocumentHTML(imported.html),revision:0,page:imported.page,sourceHeader:cleanDocumentHTML(imported.sourceHeader),sourceFooter:cleanDocumentHTML(imported.sourceFooter),sourceFormatVersion:6,sourceHeaderDistance:imported.page.sourceHeaderDistance,sourceFooterDistance:imported.page.sourceFooterDistance,identity:{enabled:false}},editorHistory:[],importWarnings:imported.warnings};
  if(draft&&imported){content.editorContent={...content.editorContent,html:cleanDocumentHTML(imported.formatHTML(content.editorContent.html)),page:imported.page,sourceHeaderDistance:imported.page.sourceHeaderDistance,sourceFooterDistance:imported.page.sourceFooterDistance,sourceHeader:cleanDocumentHTML(imported.sourceHeader),sourceFooter:cleanDocumentHTML(imported.sourceFooter),sourceFormatVersion:6};content.importWarnings=imported.warnings;}
  if(imported)content.editorContent.sourceBaseline={html:cleanDocumentHTML(imported.html),page:imported.page,identity:{enabled:false},sourceHeader:cleanDocumentHTML(imported.sourceHeader),sourceFooter:cleanDocumentHTML(imported.sourceFooter)};
  let expectedRevision=draft?.document.editorContent.revision||0;
  openImportedWord(content,{original:file,onSave:async next=>{
   const {platformStorage}=await import('./platform-cloud.js');const current=JSON.parse(platformStorage.getItem('arles-documental-prototipo-v1')).documents.find(d=>d.id===doc.id);
   if(!current||current.retired||current.status==='Obsoleto'||current.documentKind==='Registro diligenciado'||!current.versions?.some(v=>v.id===version.id&&v.fileId===version.fileId))throw Error('La versión cambió o el documento está protegido. No se guardaron cambios.');
   const latest=await blobOperation('get',key);if((latest?.document?.editorContent?.revision||0)!==expectedRevision)throw Error('El borrador cambió en otra ventana. Vuelve a abrirlo antes de guardar.');
   await blobOperation('put',key,{kind:'library-docx-v1',fileId:version.fileId,document:next,savedAt:new Date().toISOString()});expectedRevision=next.editorContent.revision;
  }});
 }finally{opening=false;}
}
