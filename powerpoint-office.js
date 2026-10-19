import {cloudActive} from './platform-cloud.js';
export const POWERPOINT_MIME='application/vnd.openxmlformats-officedocument.presentationml.presentation';
let generatorLoading;
async function powerpointGenerator(){
 if(globalThis.PptxGenJS)return globalThis.PptxGenJS;
 generatorLoading||=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/vendor/pptx/pptxgenjs-4.0.1.bundle.js';script.onload=()=>{if(globalThis.PptxGenJS)resolve(globalThis.PptxGenJS);else{generatorLoading=null;reject(Error('No se pudo preparar la presentación.'));}};script.onerror=()=>{generatorLoading=null;reject(Error('No se pudo preparar la presentación. Intenta nuevamente.'));};document.head.append(script);});
 return generatorLoading;
}
export async function createBlankPowerPointFile(value,Generator){
 const name=String(value??'').trim().replace(/\.pptx$/i,'');
 if(!name||name.length>100||/[\\/:*?"<>|\x00-\x1f]/.test(name))throw Error('Escribe un nombre de hasta 100 caracteres, sin caracteres especiales de archivos.');
 Generator||=await powerpointGenerator();const presentation=new Generator();presentation.layout='LAYOUT_WIDE';presentation.author='Arles SAS';presentation.title=name;presentation.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'es-CO'};presentation.addSlide();
 return new File([await presentation.write({outputType:'arraybuffer',compression:true})],name+'.pptx',{type:POWERPOINT_MIME});
}
export function installPowerPointOffice({currentFolder}){
 const bar=document.querySelector('.library-upload-bar'),button=document.createElement('button');button.className='button primary';button.id='new-powerpoint-office';button.textContent='＋ Nuevo PowerPoint';const word=bar.querySelector('#new-word-office');if(word)word.after(button);else bar.prepend(button);
 const availability=()=>{button.disabled=!cloudActive();button.title=button.disabled?'Inicia sesión para crear una presentación compartida.':'Crear una presentación con ONLYOFFICE';};availability();document.addEventListener('integral-cloud-status',availability);
 const dialog=document.createElement('dialog');dialog.id='new-powerpoint-office-dialog';dialog.className='ts-dialog';dialog.innerHTML='<form><div class="dialog-heading"><h2>Nueva presentación PowerPoint</h2><button type="button" class="icon-button" data-powerpoint-cancel aria-label="Cerrar">×</button></div><label>Nombre de la presentación<input name="name" required maxlength="100" placeholder="Nombre de la presentación" autocomplete="off"></label><p>Se creará un archivo PPTX con una diapositiva en blanco. Elige después su carpeta en la biblioteca y confirma la creación.</p><p role="alert" data-powerpoint-error></p><div class="dialog-actions"><button type="button" class="button secondary" data-powerpoint-cancel>Cancelar</button><button class="button primary" type="submit">Continuar</button></div></form>';document.body.append(dialog);
 button.onclick=()=>{if(!cloudActive())return;dialog.querySelector('form').reset();dialog.querySelector('[data-powerpoint-error]').textContent='';dialog.showModal();dialog.querySelector('input').focus();};
 dialog.querySelectorAll('[data-powerpoint-cancel]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const submit=event.target.querySelector('[type=submit]');submit.disabled=true;try{if(!cloudActive())throw Error('Inicia sesión para crear la presentación en Supabase.');const file=await createBlankPowerPointFile(new FormData(event.target).get('name'));dialog.close();document.dispatchEvent(new CustomEvent('prepare-library-powerpoint',{detail:{file,folder:currentFolder()}}));}catch(error){dialog.querySelector('[data-powerpoint-error]').textContent=error.message;}finally{submit.disabled=false;}};
}
