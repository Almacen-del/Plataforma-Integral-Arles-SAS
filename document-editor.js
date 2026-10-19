import {isLibraryImage} from './image-formats.js';
import {versions} from './document-control-model.js';
import {openOnlyofficeIfAvailable} from './onlyoffice-client.js';

const editorUnavailableNotice='Para editar, inicia sesión en Arles y abre un archivo DOCX, XLSX o PPTX de la biblioteca.';
export async function openDocumentEditor(doc){
 document.querySelector('#document-editor-notice')?.remove();
 try{
  const candidates=versions(doc||{}),version=candidates.find(v=>v.status==='current'&&v.fileId)||[...candidates].reverse().find(v=>v.fileId);
  if(doc&&version&&isLibraryImage(version.fileName)){await (await import('./image-library-reader.js')).openLibraryImageReader(doc,version);return;}
  if(doc&&version&&/\.pdf$/i.test(version.fileName||'')){await (await import('./pdf-library-reader.js')).openLibraryPDFReader(doc,version);return;}
  if(!doc||!version||!await openOnlyofficeIfAvailable(doc.id,version))throw Error(editorUnavailableNotice);
 }catch(error){
  let notice=document.querySelector('#document-editor-notice');
  if(!notice){notice=document.createElement('p');notice.id='document-editor-notice';notice.className='ts-note';notice.setAttribute('role','status');document.querySelector('.workspace').prepend(notice);}
  notice.textContent=error.message;
 }
}
