import {initializeCloud,cloudClient,cloudActive,signInCloud} from './platform-cloud.js';
import {officeHealth,requireOfficeReady} from './onlyoffice-connection.js';
import {createEditorAIHost} from './editor-ai-host.js';
const $=id=>document.getElementById(id),message=$('message'),params=new URLSearchParams(location.search);
let session,editor,serverURL='',polling=false,changed=false,lastSavedAt=null;
function showError(error){$('status').textContent=error.message;}
async function request(route,method='GET',body){
 const {data,error}=await cloudClient().auth.getSession();if(error||!data.session)throw Error('Inicia sesión en Arles.');
 const response=await fetch(serverURL+'/api/onlyoffice/'+route,{method,headers:{Authorization:'Bearer '+data.session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo completar la operación.');return result;
}
async function state(){
 if(!session||polling)return;polling=true;
 try{const value=await request('state/'+session.sessionId);$('recover').hidden=!value.pending;if(value.savedAt&&value.savedAt!==lastSavedAt){changed=false;lastSavedAt=value.savedAt;}
  if(value.error)$('status').textContent=value.error;
  else if(value.pending)$('status').textContent='Guardado pendiente en Supabase';
  else if(changed)$('status').textContent='Editando · autoguardado activo';
  else $('status').textContent=value.savedAt?'Guardado en Supabase · '+new Date(value.savedAt).toLocaleTimeString('es-CO'):'Borrador compartido · Supabase';
 }catch(error){showError(error);}finally{polling=false;}
}
async function open(){
 if(!params.get('document')||!params.get('version'))throw Error('Abre un documento desde la biblioteca de Arles.');
 serverURL=requireOfficeReady(await officeHealth());
 session=await request('session','POST',{documentId:params.get('document'),versionId:params.get('version')});
 $('title').textContent=session.title;document.title=session.title+' | Arles';
 const aiType={docx:'word',xlsx:'cell',pptx:'slide'}[session.config.document.fileType];
 if(aiType)window.__arlesEditorAI=createEditorAIHost({documentId:params.get('document'),versionId:params.get('version'),type:aiType,editable:session.editable},{getSession:()=>cloudClient().auth.getSession()});
 if(session.config.document.fileType==='pdf'){$('pdf-tools').hidden=false;$('pdf-tools').disabled=!session.editable;}
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=serverURL+'/onlyoffice/web-apps/apps/api/documents/api.js';script.onload=resolve;script.onerror=()=>reject(Error('El motor no está disponible. Comprueba que el equipo servidor esté encendido.'));document.head.append(script);});
 lastSavedAt=session.savedAt;
 session.config.events={onDocumentReady:()=>{message.hidden=true;$('save').disabled=!session.editable;state();},onDocumentStateChange:event=>{if(event.data)changed=true;state();},onError:event=>{$('status').textContent='El editor informó un error: '+event.data.errorDescription;}};
 editor=new window.DocsAPI.DocEditor('editor',session.config);setInterval(state,15000);
}
$('save').onclick=async()=>{try{$('save').disabled=true;$('status').textContent='Preparando guardado…';await request('save/'+session.sessionId,'POST');setTimeout(state,4000);}catch(error){showError(error);}finally{$('save').disabled=!session?.editable;}};
$('pdf-tools').onclick=async()=>{try{if(!session?.editable)return;await (await import('./pdf-tools.js')).openPDFTools({serverURL,documentId:params.get('document'),versionId:params.get('version')});}catch(error){showError(error);}};
$('recover').onclick=async()=>{try{const {data}=await cloudClient().auth.getSession();const response=await fetch(serverURL+'/api/onlyoffice/pending/'+session.sessionId,{headers:{Authorization:'Bearer '+data.session.access_token}});if(!response.ok)throw Error('No se pudo recuperar el pendiente.');const url=URL.createObjectURL(await response.blob()),a=document.createElement('a');a.href=url;a.download=session.config.document.title;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(error){showError(error);}};
try{await initializeCloud();if(cloudActive())await open();else{
 message.innerHTML='<h1>Inicia sesión en Arles</h1><p>Usa tu cuenta autorizada para abrir este documento.</p><form><label>Correo<input name="email" type="email" autocomplete="username" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><p role="alert"></p><button>Iniciar sesión</button></form>';
 message.querySelector('form').onsubmit=async event=>{event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;try{const data=new FormData(event.target);await signInCloud(data.get('email'),data.get('password'));location.reload();}catch(error){event.target.querySelector('[role=alert]').textContent=error.message;button.disabled=false;}};
}}catch(error){message.textContent=error.message;showError(error);}
