import {cloudActive} from './platform-cloud.js';
export const EXCEL_MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
let generatorLoading;
async function excelGenerator(){
 if(globalThis.ExcelJS)return globalThis.ExcelJS;
 generatorLoading||=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/vendor/xlsx/exceljs-4.4.0.js';script.onload=()=>{if(globalThis.ExcelJS)resolve(globalThis.ExcelJS);else{generatorLoading=null;script.remove();reject(Error('No se pudo preparar el libro Excel.'));}};script.onerror=()=>{generatorLoading=null;script.remove();reject(Error('No se pudo preparar el libro Excel. Intenta nuevamente.'));};document.head.append(script);});
 return generatorLoading;
}
export async function createBlankExcelFile(value,Generator){
 const name=String(value??'').trim().replace(/\.xlsx$/i,'');
 if(!name||name.length>100||/[\\/:*?"<>|\x00-\x1f]/.test(name))throw Error('Escribe un nombre de hasta 100 caracteres, sin caracteres especiales de archivos.');
 Generator||=await excelGenerator();const workbook=new Generator.Workbook();workbook.creator='Arles SAS';workbook.title=name;const sheet=workbook.addWorksheet('Hoja 1');sheet.views=[{state:'normal',activeCell:'A1'}];
 return new File([await workbook.xlsx.writeBuffer()],name+'.xlsx',{type:EXCEL_MIME});
}
export function installExcelOffice({currentFolder}){
 const bar=document.querySelector('.library-upload-bar'),button=document.createElement('button');button.className='button primary';button.id='new-excel-office';button.textContent='＋ Nuevo Excel';const word=bar.querySelector('#new-word-office');if(word)word.after(button);else bar.prepend(button);
 const availability=()=>{button.disabled=!cloudActive();button.title=button.disabled?'Inicia sesión para crear un libro Excel compartido.':'Crear un libro Excel con ONLYOFFICE';};availability();document.addEventListener('integral-cloud-status',availability);
 const dialog=document.createElement('dialog');dialog.id='new-excel-office-dialog';dialog.className='ts-dialog';dialog.innerHTML='<form><div class="dialog-heading"><h2>Nuevo libro Excel</h2><button type="button" class="icon-button" data-excel-cancel aria-label="Cerrar">×</button></div><label>Nombre del libro<input name="name" required maxlength="100" placeholder="Nombre del libro" autocomplete="off"></label><p>Se creará un archivo XLSX con una hoja en blanco. Elige después su carpeta en la biblioteca y confirma la creación.</p><p role="alert" data-excel-error></p><div class="dialog-actions"><button type="button" class="button secondary" data-excel-cancel>Cancelar</button><button class="button primary" type="submit">Continuar</button></div></form>';document.body.append(dialog);
 button.onclick=()=>{if(!cloudActive())return;dialog.querySelector('form').reset();dialog.querySelector('[data-excel-error]').textContent='';dialog.showModal();dialog.querySelector('input').focus();};
 dialog.querySelectorAll('[data-excel-cancel]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const submit=event.target.querySelector('[type=submit]');submit.disabled=true;try{if(!cloudActive())throw Error('Inicia sesión para crear el libro en Supabase.');const file=await createBlankExcelFile(new FormData(event.target).get('name'));dialog.close();document.dispatchEvent(new CustomEvent('prepare-library-excel',{detail:{file,folder:currentFolder()}}));}catch(error){dialog.querySelector('[data-excel-error]').textContent=error.message;}finally{submit.disabled=false;}};
}
