import {cloudActive} from './platform-cloud.js';
export const WORD_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
let zipLoading;
async function wordZip(){
 if(globalThis.JSZip)return globalThis.JSZip;
 zipLoading||=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/vendor/xlsx/jszip-3.10.1.js';script.onload=()=>globalThis.JSZip?resolve(globalThis.JSZip):reject(Error('No se pudo preparar el documento Word.'));script.onerror=()=>{zipLoading=null;reject(Error('No se pudo preparar el documento Word. Intenta nuevamente.'));};document.head.append(script);});
 return zipLoading;
}
export async function createBlankWordFile(value,Zip){
 const name=String(value??'').trim().replace(/\.docx$/i,'');
 if(!name||name.length>100||/[\\/:*?"<>|\x00-\x1f]/.test(name))throw Error('Escribe un nombre de hasta 100 caracteres, sin caracteres especiales de archivos.');
 Zip||=await wordZip();const zip=new Zip();
 zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>');
 zip.file('word/styles.xml','<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/><w:lang w:val="es-CO"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>');
 return new File([await zip.generateAsync({type:'uint8array',compression:'DEFLATE'})],name+'.docx',{type:WORD_MIME});
}
export function installWordOffice({currentFolder}){
 const bar=document.querySelector('.library-upload-bar'),button=document.createElement('button');button.className='button primary';button.id='new-word-office';button.textContent='＋ Nuevo Word';bar.prepend(button);
 const availability=()=>{button.disabled=!cloudActive();button.title=button.disabled?'Inicia sesión para crear un documento Word compartido.':'Crear un documento Word con ONLYOFFICE';};availability();document.addEventListener('integral-cloud-status',availability);
 const dialog=document.createElement('dialog');dialog.id='new-word-office-dialog';dialog.className='ts-dialog';dialog.innerHTML='<form><div class="dialog-heading"><h2>Nuevo documento Word</h2><button type="button" class="icon-button" data-word-cancel aria-label="Cerrar">×</button></div><label>Nombre del documento<input name="name" required maxlength="100" placeholder="Nombre del documento" autocomplete="off"></label><p>Se creará un archivo DOCX en blanco. Elige después su carpeta en la biblioteca y confirma la creación.</p><p role="alert" data-word-error></p><div class="dialog-actions"><button type="button" class="button secondary" data-word-cancel>Cancelar</button><button class="button primary" type="submit">Continuar</button></div></form>';document.body.append(dialog);
 button.onclick=()=>{if(!cloudActive())return;dialog.querySelector('form').reset();dialog.querySelector('[data-word-error]').textContent='';dialog.showModal();dialog.querySelector('input').focus();};
 dialog.querySelectorAll('[data-word-cancel]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const submit=event.target.querySelector('[type=submit]');submit.disabled=true;try{if(!cloudActive())throw Error('Inicia sesión para crear el documento en Supabase.');const file=await createBlankWordFile(new FormData(event.target).get('name'));dialog.close();document.dispatchEvent(new CustomEvent('prepare-library-word',{detail:{file,folder:currentFolder()}}));}catch(error){dialog.querySelector('[data-word-error]').textContent=error.message;}finally{submit.disabled=false;}};
}
