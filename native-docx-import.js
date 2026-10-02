import {readWordBibliography,readWordCustomParts} from './native-word-bibliography.js';
import {prepareWordTextBoxes} from './native-word-text-boxes.js';
import {prepareWordRevisions} from './native-word-revisions.js';
import {readWordComments,prepareCommentMarkers,commentQuotes} from './native-word-comments.js';
import {prepareWordMath} from './native-math-import.js';
import {sectionSettings} from './native-word-sections.js';
import {addImage,clearImageSession} from './native-assets.js';
import {prepareWordCharts} from './native-word-charts.js';
import {prepareWordNotes} from './native-word-notes.js';
import {prepareWordControls} from './native-word-controls.js';
let readerPromise;
function reader(){return readerPromise||=(new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/vendor/mammoth-1.13.0.js';s.onload=()=>resolve(window.mammoth);s.onerror=()=>{readerPromise=null;reject(Error('No se pudo cargar el lector Word.'));};document.head.append(s);}));}
export async function importWord(file){
 if(file.size>50*1024*1024)throw Error('El editor admite Word de hasta 50 MB.');
 const {checkXlsxArchive,loadXlsxReader}=await import('./sheet-xlsx.js');const bytes=await file.arrayBuffer();try{checkXlsxArchive(bytes);}catch(e){throw Error(e.message.replaceAll('XLSX','DOCX'));}
 await loadXlsxReader();const zip=await window.JSZip.loadAsync(bytes);if(!zip.file('word/document.xml'))throw Error('El archivo no contiene un Word DOCX válido.');
 const {parseWordXML,preserveWordStyles,wordPage}=await import('./native-docx-format.js');
 const sourceCustomParts=await readWordCustomParts(zip),sourceBibliography=await readWordBibliography(zip);const main=parseWordXML(await zip.file('word/document.xml').async('string')),styles=parseWordXML(await zip.file('word/styles.xml')?.async('string')||'<styles/>'),numbering=parseWordXML(await zip.file('word/numbering.xml')?.async('string')||'<numbering/>');
 const comments=await readWordComments(zip,parseWordXML);
 const mammoth=await reader(),warnings=['Se importan el contenido, encabezado, pie y configuración de página. Los objetos flotantes y los saltos automáticos pueden variar respecto a Word. El original se conserva completo.'];
 if([...main.getElementsByTagNameNS('*','cols')].some(n=>['0','false','off'].includes(n.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','equalWidth'))))warnings.push('El documento usa columnas de anchos distintos; la vista editable las distribuye con anchos iguales. La impresión y la descarga Word conservan sus medidas.');
 if(main.getElementsByTagNameNS('*','sectPr').length>1)warnings.push('Este Word contiene varias secciones: el editor usa una configuración de página común; consulta el original para los cambios de orientación o márgenes entre secciones.');
 if([...main.getElementsByTagNameNS('*','headerReference'),...main.getElementsByTagNameNS('*','footerReference')].some(n=>['first','even'].includes(n.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','type'))))warnings.push('Los encabezados y pies especiales de primera página o páginas pares todavía no se reproducen por separado.');
 for(const [tag,label] of [['relIds','diagramas SmartArt']])if(main.getElementsByTagNameNS('*',tag).length)warnings.push('El archivo incluye '+label+'; su representación o edición completa todavía requiere consultar el Word original.');
 if(zip.file('word/commentsExtended.xml')||zip.file('word/commentsExtensible.xml'))warnings.push('Los comentarios modernos se muestran como anotaciones separadas; sus hilos y estados avanzados se conservan en el original.');
 if(main.getElementsByTagNameNS('*','altChunk').length)warnings.push('Este Word contiene contenido vinculado o incrustado de otro documento; ese contenido se conserva en el original y puede faltar en la vista editable.');
 if(main.getElementsByTagNameNS('*','ins').length||main.getElementsByTagNameNS('*','del').length)warnings.push('Las inserciones y eliminaciones de texto admitidas se muestran en Revisiones importadas. El PDF presenta el contenido actual y el Word exportado conserva las marcas pendientes.');
 if(main.getElementsByTagNameNS('*','anchor').length)warnings.push('Este archivo contiene objetos flotantes; su posición puede cambiar al importarlos.');
 async function convert(buffer,xml){
  const mathCopy=await window.JSZip.loadAsync(buffer),conversionXML=parseWordXML(await mathCopy.file('word/document.xml').async('string')),restoreBoxes=prepareWordTextBoxes(conversionXML,warnings),restoreControls=prepareWordControls(conversionXML,warnings),restoreCharts=await prepareWordCharts(conversionXML,mathCopy,warnings),restoreNotes=await prepareWordNotes(conversionXML,mathCopy,warnings),restoreRevisions=prepareWordRevisions(conversionXML,warnings),restoreComments=prepareCommentMarkers(conversionXML,comments),math=prepareWordMath(conversionXML,warnings);xml=math.xml;
  mathCopy.file('word/document.xml',new XMLSerializer().serializeToString(xml));buffer=await mathCopy.generateAsync({type:'arraybuffer'});
  // Mammoth skips fldSimple cached results. Flatten only the conversion copy;
  // keep the source XML for field ranges and the original archive unchanged.
  if(xml.getElementsByTagNameNS('*','fldSimple').length){const converted=await window.JSZip.loadAsync(buffer),body=parseWordXML(await converted.file('word/document.xml').async('string'));for(const field of [...body.getElementsByTagNameNS('*','fldSimple')])field.replaceWith(...field.childNodes);converted.file('word/document.xml',new XMLSerializer().serializeToString(body));buffer=await converted.generateAsync({type:'arraybuffer'});}

  const result=await mammoth.convertToHtml({arrayBuffer:buffer},{externalFileAccess:false,includeEmbeddedStyleMap:false,styleMap:["br[type='page'] => br.word-page-break","br[type='column'] => br.word-column-break",'u => u',"p[style-name='Título 1'] => h1:fresh","p[style-name='Título 2'] => h2:fresh"],convertImage:mammoth.images.imgElement(async image=>{
   if(!['image/png','image/jpeg','image/webp','image/gif','image/bmp'].includes(image.contentType)){warnings.push('Una imagen no compatible se conserva únicamente en el original.');return {src:'',alt:'Imagen no compatible; consultar original'};}
   const asset=await addImage(new File([await image.readAsArrayBuffer()],'Imagen del Word',{type:image.contentType}),{preserveOriginal:true});return {src:'arles-image:'+asset.id};
  })});
  const template=document.createElement('div');template.innerHTML=result.value;for(const image of template.querySelectorAll('img')){const id=image.getAttribute('src')?.replace(/^arles-image:/,'');if(/^[a-f0-9-]{36}$/i.test(id||'')){image.dataset.imageId=id;image.removeAttribute('src');}else image.replaceWith(document.createTextNode(image.alt||'[Imagen en el original]'));}
  warnings.push(...result.messages.map(m=>m.message));template.innerHTML=preserveWordStyles(template,xml,styles,numbering);
  for(const marker of [...template.querySelectorAll('br.word-page-break,br.word-column-break')]){const kind=marker.classList.contains('word-page-break')?'page':'column',block=marker.closest('p,h1,h2,h3,h4,h5,h6');if(!block){marker.dataset.wordBreak=kind;marker.className='';continue;}const range=document.createRange();range.setStartAfter(marker);range.setEnd(block,block.childNodes.length);const next=block.cloneNode(false);next.removeAttribute('id');next.append(range.extractContents());next.style.breakBefore=kind;marker.remove();block.after(next);}
  math.restore(template);restoreComments(template);restoreRevisions(template);restoreCharts(template);restoreNotes(template);restoreControls(template);restoreBoxes(template);
  // Imported headings retain their source numbering; no new numbering is imposed.
  const store=document.createElement('div');store.dataset.refStore=JSON.stringify({sources:[],style:'author',headingNumbering:'none'});store.hidden=true;store.contentEditable='false';template.append(store);return template.innerHTML;
 }
 try{
  const rels=parseWordXML(await zip.file('word/_rels/document.xml.rels').async('string'));
  async function region(kind,type='default',section=main){const ref=[...section.getElementsByTagNameNS('*',kind+'Reference')].find(n=>n.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','type')===type);if(!ref)return '';const id=ref.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),rel=[...rels.getElementsByTagNameNS('*','Relationship')].find(n=>n.getAttribute('Id')===id);if(!rel||rel.getAttribute('TargetMode')==='External')return '';const path='word/'+rel.getAttribute('Target').replace(/^\/?word\//,'');const part=zip.file(path);if(!part)return '';const source=parseWordXML(await part.async('string'));const copy=await window.JSZip.loadAsync(bytes);copy.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+[...source.documentElement.childNodes].map(n=>new XMLSerializer().serializeToString(n)).join('')+'</w:body></w:document>');const regionRels=zip.file('word/_rels/'+path.split('/').at(-1)+'.rels');copy.file('word/_rels/document.xml.rels',regionRels?await regionRels.async('string'):'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');return convert(await copy.generateAsync({type:'arraybuffer'}),source);}
  const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main',attr=(n,k='val')=>n?.getAttributeNS(W,k),direct=(n,name)=>[...(n?.children||[])].find(c=>c.localName===name),on=n=>!!n&&!['0','false','off'].includes(attr(n));
  const props=[...main.getElementsByTagNameNS(W,'sectPr')],settings=parseWordXML(await zip.file('word/settings.xml')?.async('string')||'<settings/>'),evenAndOdd=on(settings.getElementsByTagNameNS(W,'evenAndOddHeaders')[0]);
  const advanced=props.length>1||evenAndOdd||props.some(p=>{const num=direct(p,'pgNumType');return on(direct(p,'titlePg'))||(attr(num,'start')!=null&&Number(attr(num,'start'))!==1)||(['upperRoman','lowerRoman','upperLetter','lowerLetter'].includes(attr(num,'fmt')));});
  if(advanced){
   const body=main.getElementsByTagNameNS(W,'body')[0],groups=[];let pending=[];
   for(const node of body.children){if(node.localName==='sectPr'){groups.push({nodes:pending,properties:node});pending=[];continue;}pending.push(node);const pr=direct(direct(node,'pPr'),'sectPr');if(pr){groups.push({nodes:pending,properties:pr});pending=[];}}
   if(pending.length)groups.push({nodes:pending,properties:props.at(-1)});
   const output=document.createElement('div'),linked={};let firstPage;
   for(const group of groups){const copy=main.cloneNode(true),copyBody=copy.getElementsByTagNameNS(W,'body')[0];copyBody.replaceChildren(...group.nodes.map(n=>n.cloneNode(true)));for(const old of [...copyBody.getElementsByTagNameNS(W,'sectPr')])old.remove();if(group.properties)copyBody.append(group.properties.cloneNode(true));
    const pg={...wordPage(copy),mirror:on(settings.getElementsByTagNameNS(W,'mirrorMargins')[0])},num=direct(group.properties,'pgNumType'),config=sectionSettings({page:pg,type:attr(direct(group.properties,'type')),titlePage:on(direct(group.properties,'titlePg')),evenAndOdd,start:attr(num,'start')==null?null:Number(attr(num,'start')),format:attr(num,'fmt')});firstPage??=pg;
    const part=await window.JSZip.loadAsync(bytes);part.file('word/document.xml',new XMLSerializer().serializeToString(copy));const content=await convert(await part.generateAsync({type:'arraybuffer'}),copy),wrapper=document.createElement('div');wrapper.dataset.wordSection=JSON.stringify(config);
    for(const kind of ['header','footer'])for(const type of ['default','first','even']){const key=kind+'-'+type,ref=[...(group.properties?.getElementsByTagNameNS(W,kind+'Reference')||[])].find(n=>attr(n,'type')===type);if(ref)linked[key]=await region(kind,type,group.properties);const el=document.createElement('div');el.dataset.wordRegion=key;el.innerHTML=linked[key]||'';wrapper.append(el);}
    const contentNode=document.createElement('div');contentNode.dataset.wordBody='true';contentNode.innerHTML=content;wrapper.append(contentNode);output.append(wrapper);
   }
   const notices=warnings.filter(w=>!w.startsWith('Este Word contiene varias secciones:')&&!w.startsWith('Los encabezados y pies especiales'));notices.push('Se conservan las secciones y sus encabezados y pies. Vista de páginas muestra la composición de impresión.');if(groups.some(g=>attr(direct(g.properties,'type'))==='continuous'))notices.push('Los saltos continuos comparten página cuando mantienen la misma configuración, encabezados y numeración. Los cambios de esas propiedades pueden iniciar otra página en PDF.');
   return {sourceCustomParts,sourceBibliography,comments:commentQuotes(output.innerHTML,comments),html:output.innerHTML,page:firstPage,sourceHeader:'',sourceFooter:'',sourceFormatVersion:8,warnings:[...new Set(notices)],formatHTML:value=>value};
  }
  const html=await convert(bytes,main),page={...wordPage(main),mirror:on(settings.getElementsByTagNameNS(W,'mirrorMargins')[0])};
  return {sourceCustomParts,sourceBibliography,comments:commentQuotes(html,comments),html,page,formatHTML:value=>{const root=document.createElement('div');root.innerHTML=value;return preserveWordStyles(root,main,styles,numbering);},sourceHeader:await region('header'),sourceFooter:await region('footer'),sourceFormatVersion:8,warnings:[...new Set(warnings)]};
 }catch(e){await clearImageSession();throw e;}

}
let opening=false;
export async function openLibraryWord(doc,version,blob){
 if(opening)return;if(document.querySelector('.nd-window[open]'))throw Error('Cierra el documento abierto antes de abrir otro Word.');opening=true;
 try{
  const {blobOperation}=await import('./document-control.js');const {openImportedWord,cleanDocumentHTML}=await import('./native-document.js');
  const key='editor-docx:'+version.fileId,draft=await blobOperation('get',key),file=new File([blob],version.fileName,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  if(draft&&(draft.kind!=='library-docx-v1'||draft.fileId!==version.fileId||typeof draft.document?.editorContent?.html!=='string'))throw Error('El borrador Word no se pudo leer. No se sobrescribió.');
  const imported=draft?.document.editorContent.sourceFormatVersion===8?null:await importWord(file);
  const content=draft?.document||{...doc,editorContent:{html:cleanDocumentHTML(imported.html),revision:0,page:imported.page,sourceHeader:cleanDocumentHTML(imported.sourceHeader),sourceFooter:cleanDocumentHTML(imported.sourceFooter),sourceFormatVersion:8,sourceCustomParts:imported.sourceCustomParts,sourceBibliography:imported.sourceBibliography,comments:imported.comments,sourceHeaderDistance:imported.page.sourceHeaderDistance,sourceFooterDistance:imported.page.sourceFooterDistance,identity:{enabled:false}},editorHistory:[],importWarnings:imported.warnings};
  if(draft&&imported){
   const previous=content.editorContent,baseline=previous.sourceBaseline;
   const untouched=previous.revision===0||baseline&&['html','page','sourceHeader','sourceFooter','identity','comments'].every(k=>JSON.stringify(previous[k])===JSON.stringify(baseline[k]));
   // Existing edits and their layout take precedence over parser upgrades.
   content.editorContent=untouched?{...previous,html:cleanDocumentHTML(imported.html),comments:imported.comments,sourceCustomParts:imported.sourceCustomParts,sourceBibliography:imported.sourceBibliography,page:imported.page,sourceHeaderDistance:imported.page.sourceHeaderDistance,sourceFooterDistance:imported.page.sourceFooterDistance,sourceHeader:cleanDocumentHTML(imported.sourceHeader),sourceFooter:cleanDocumentHTML(imported.sourceFooter),sourceFormatVersion:8}:{...previous,sourceFormatVersion:8};
   content.importWarnings=[...imported.warnings,...(untouched?[]:['Este borrador conserva tus cambios anteriores. Para recuperar objetos que faltaban al abrirlo, importa una copia del Word original y compara ambas versiones.'])];
  }
  if(imported)content.editorContent.sourceBaseline={comments:imported.comments,html:cleanDocumentHTML(imported.html),sourceCustomParts:imported.sourceCustomParts,sourceBibliography:imported.sourceBibliography,page:imported.page,identity:{enabled:false},sourceHeader:cleanDocumentHTML(imported.sourceHeader),sourceFooter:cleanDocumentHTML(imported.sourceFooter)};
  let expectedRevision=draft?.document.editorContent.revision||0;
  openImportedWord(content,{original:file,onSave:async next=>{
   const {platformStorage}=await import('./platform-cloud.js');const current=JSON.parse(platformStorage.getItem('arles-documental-prototipo-v1')).documents.find(d=>d.id===doc.id);
   if(!current||current.retired||current.status==='Obsoleto'||current.documentKind==='Registro diligenciado'||!current.versions?.some(v=>v.id===version.id&&v.fileId===version.fileId))throw Error('La versión cambió o el documento está protegido. No se guardaron cambios.');
   const latest=await blobOperation('get',key);if((latest?.document?.editorContent?.revision||0)!==expectedRevision)throw Error('El borrador cambió en otra ventana. Vuelve a abrirlo antes de guardar.');
   await blobOperation('put',key,{kind:'library-docx-v1',fileId:version.fileId,document:next,savedAt:new Date().toISOString()});expectedRevision=next.editorContent.revision;
  }});
 }finally{opening=false;}
}
