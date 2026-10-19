import {validateProposal,normalizeHistory} from '../editor-ai-model.js';
import {readEditorContext,applyEditorProposal} from './commands.js';

const standalone=new URLSearchParams(location.search).get('reader')==='pdf';
if(standalone)window.Asc={scope:{},plugin:{info:{editorType:'pdf'},callCommand(fn,a,b,callback){window.parent.__arlesPDFAI.readContext().then(callback).catch(e=>callback({error:e.message}));},executeCommand(){}}};
const $=id=>document.getElementById(id),plugin=window.Asc.plugin;
let identity,type,editable=false,busy=false,requestId=0,controller,proposal,snapshot,ready=false;
const history=[];
function scrollChat(){requestAnimationFrame(()=>{const main=document.querySelector('main');main.scrollTop=main.scrollHeight;});}
function message(role,text){const item=document.createElement('article');item.className='chat-message '+role;const label=document.createElement('strong'),body=document.createElement('div');label.textContent=role==='user'?'Tú':'Asistente Arles';body.textContent=text;item.append(label,body);$('messages').append(item);}
const names={word:'Word',cell:'Excel',slide:'PowerPoint',pdf:'PDF'};
function error(message){$('error').textContent=message||'';$('error').hidden=!message;}
function setBusy(value){busy=value;$('send').disabled=value||!ready;$('cancel').hidden=!value;$('new-chat').disabled=value;$('apply').disabled=value||!proposal||!editable;$('replace').disabled=value||!proposal||!editable;}
function command(fn,scope){Object.assign(window.Asc.scope,scope);return new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(Error('El editor no respondió. Vuelve a abrir el asistente.')),15000);
 plugin.callCommand(fn,false,true,value=>{clearTimeout(timer);if(value?.error)reject(Error(value.error));else if(!value)reject(Error('No se pudo obtener una respuesta del editor.'));else resolve(value);});
});}
async function api(body,signal){
 return (standalone?window.parent.__arlesPDFAI:window.top.__arlesEditorAI).request(body,signal);
}
function clearProposal(){proposal=null;snapshot=null;$('proposal').hidden=true;$('preview').replaceChildren();$('applied').textContent='';}
function renderProposal(value){
 const host=$('preview');host.replaceChildren();$('replace').hidden=true;
 if(type==='word'){
  const area=document.createElement('textarea');area.value=value.text;area.maxLength=8000;area.setAttribute('aria-label','Texto propuesto');host.append(area);
  $('apply').textContent='Añadir al final';$('target').textContent='Puedes ajustar el texto antes de aplicarlo.';
  $('replace').hidden=!snapshot.target?.text||!editable;
 }else if(type==='cell'){
  const table=document.createElement('table'),head=document.createElement('tr');for(const label of ['Celda','Propuesta']){const th=document.createElement('th');th.textContent=label;head.append(th);}table.append(head);
  for(const cell of value.cells){const row=document.createElement('tr');for(const text of [cell.address,cell.formula||String(cell.value)]){const td=document.createElement('td');td.textContent=text;row.append(td);}table.append(row);}host.append(table);
  $('target').textContent=snapshot.context.sheet+' · '+snapshot.context.range+' · Se sustituirán las celdas indicadas.';$('apply').textContent='Aplicar a la selección';
 }else{
  for(const slide of value.slides){const card=document.createElement('article'),h=document.createElement('h3'),list=document.createElement('ul');card.className='slide-preview';h.textContent=slide.title;for(const bullet of slide.bullets){const li=document.createElement('li');li.textContent=bullet;list.append(li);}card.append(h,list);host.append(card);}
  $('target').textContent='Las diapositivas nuevas se añadirán al final de la presentación.';$('apply').textContent='Añadir diapositivas';
 }
 $('proposal').hidden=false;
}
async function ask(event){
 event.preventDefault();if(busy||!ready)return;const question=$('question').value.trim();if(!question)return;
 if(!$('result').hidden)message('assistant',$('answer').textContent);message('user',question);
 const id=++requestId;controller=new AbortController();error('');clearProposal();$('result').hidden=true;setBusy(true);$('status').textContent='Leyendo el contenido abierto…';scrollChat();
 const timeout=setTimeout(()=>controller?.abort(),40000);
 try{
  const captured=await command(readEditorContext,{arlesType:type});if(id!==requestId)return;
  $('status').textContent=type==='cell'?'Consultando '+captured.context.sheet+' · '+captured.context.range:'Consultando el fragmento abierto…';
  const result=await api({operation:$('mode').value,question,context:captured.context,history:normalizeHistory(history)},controller.signal);if(id!==requestId)return;
  history.push({role:'user',content:question},{role:'assistant',content:result.answer});if(history.length>12)history.splice(0,history.length-12);if($('question').value.trim()===question)$('question').value='';
  editable=result.editable;proposal=result.proposal;snapshot=captured;$('answer').textContent=result.answer;$('result').hidden=false;
  if(proposal)renderProposal(proposal);$('status').textContent=captured.context.truncated?'Respuesta lista · Se consultó un fragmento del contenido.':'Respuesta lista · Groq';
 }catch(e){if(id===requestId){error(e.name==='AbortError'?'La consulta se canceló o superó el tiempo de espera.':e.message);$('status').textContent='Puedes volver a intentarlo.';}}
 finally{clearTimeout(timeout);if(id===requestId){setBusy(false);scrollChat();}}
}
async function apply(replace){
 if(busy||!proposal||!editable)return;error('');setBusy(true);$('cancel').hidden=true;
 try{
  const next=validateProposal(type,type==='word'?{text:$('preview').querySelector('textarea').value}:proposal,snapshot.context);
  await api({operation:'authorize'},AbortSignal.timeout(12000));
  await command(applyEditorProposal,{arlesApply:{type,proposal:next,target:snapshot.target,replace}});
  proposal=null;$('applied').textContent='Cambios aplicados al editor. Se guardarán con el autoguardado habitual.';$('status').textContent='Propuesta aplicada';
 }catch(e){error(e.message);}finally{setBusy(false);}
}
plugin.init=function(){
 try{
  type=plugin.info.editorType;identity=standalone?window.parent.__arlesPDFAI:window.top.__arlesEditorAI;
  if(!identity||identity.type!==type||!identity.documentId||!identity.versionId||typeof identity.request!=='function')throw Error('Abre este archivo desde la biblioteca de Arles.');
  editable=identity.editable;identity={documentId:identity.documentId,versionId:identity.versionId};
  $('editor-name').textContent=names[type]+' · Documento abierto';$('propose-mode').textContent={word:'Preparar texto',cell:'Preparar valores o fórmulas',slide:'Preparar diapositivas',pdf:'Solo consulta'}[type];$('propose-mode').disabled=!editable;
  const examples={pdf:[['Resumir página','Resume la página consultada.','ask']],word:[['Resumir','Resume el contenido consultado en cinco puntos.','ask'],['Mejorar texto','Mejora la redacción del texto seleccionado manteniendo su significado.','propose']],cell:[['Explicar fórmulas','Explica las fórmulas y los valores del rango seleccionado.','ask'],['Crear fórmula','Propón una fórmula para la celda seleccionada. ','propose']],slide:[['Resumir','Resume las ideas de la diapositiva actual.','ask'],['Crear diapositivas','Prepara tres diapositivas a partir del contenido actual.','propose']]}[type];
  for(const [label,question,mode] of examples){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=mode==='propose'&&!editable;b.onclick=()=>{$('question').value=question;$('mode').value=mode;$('question').focus();};$('examples').append(b);}
  if(!editable)$('intro').textContent='Esta versión permite consultar su contenido. Abre un borrador editable para aplicar propuestas.';
  ready=true;setBusy(false);$('status').textContent='Listo · Selecciona el contenido que quieres consultar.';
 }catch(e){error(e.message);$('status').textContent='No se pudo conectar el asistente.';}
};
plugin.button=function(){plugin.executeCommand('close','');};
$('compose').onsubmit=ask;$('apply').onclick=()=>apply(false);$('replace').onclick=()=>apply(true);
$('cancel').onclick=()=>{controller?.abort();++requestId;clearProposal();setBusy(false);$('status').textContent='Consulta cancelada';};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('answer').textContent);$('status').textContent='Respuesta copiada';}catch{error('Selecciona el texto de la respuesta para copiarlo.');}};

$('new-chat').onclick=()=>{if(busy)return;history.length=0;$('messages').replaceChildren();$('result').hidden=true;$('answer').textContent='';clearProposal();error('');$('question').value='';$('status').textContent='Nueva conversación';$('question').focus();};

if(standalone)plugin.init();
