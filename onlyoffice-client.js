import {cloudActive} from './platform-cloud.js';
import {officeHealth} from './onlyoffice-connection.js';
export {officeDraft} from './platform-cloud.js';
export {officeHealth} from './onlyoffice-connection.js';
export async function openOnlyofficeIfAvailable(documentId,version,health,{requireNewTab=false}={}){
 if(!version?.fileId||!/\.(xlsx|docx|pptx|pdf)$/i.test(version.fileName||''))return false;
 if(!cloudActive())throw Error('Inicia sesión en la plataforma para abrir el archivo con ONLYOFFICE.');
 health||=await officeHealth();if(!health.enabled)throw Error('ONLYOFFICE no está conectado. Los editores anteriores permanecen desactivados.');
 if(!health.ready)throw Error('El editor temporal no está disponible. Comprueba que el equipo servidor y Docker estén encendidos.');
 const url=new URL('/onlyoffice-editor.html',location.origin);
 url.searchParams.set('document',documentId);url.searchParams.set('version',version.id);
 const tab=window.open(url.href,'_blank');if(tab)tab.opener=null;else if(requireNewTab)throw Error('Permite las ventanas emergentes de la plataforma para abrir el editor en otra pestaña.');else location.assign(url.href);return true;
}
