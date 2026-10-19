import test from 'node:test';
import assert from 'node:assert/strict';
import {editorAnswer} from '../api/editor-assistant.js';
import {validateProposal,normalizeContext} from '../editor-ai-model.js';
import {createEditorAIHost} from '../editor-ai-host.js';
const base={documentId:'d',versionId:'v',type:'cell',operation:'propose',question:'Sumar A2 y A3 en B4',context:{type:'cell',sheet:'Hoja 1',range:'B4',cells:[{address:'B4',value:'',formula:''}]}};
function fixture({active=true,status='draft',kind,retired=false,extension='xlsx',output,providerStatus=200}={}){
 const calls=[],fetcher=async(url,options)=>{calls.push({url,options});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'editor-'+Math.random()});
  if(url.includes('/integral_members'))return Response.json([{active}]);
  if(url.includes('/integral_state'))return Response.json([{payload:{documents:[{id:'d',name:'Archivo de prueba',documentKind:kind,retired,versions:[{id:'v',fileId:'f',fileName:'prueba.'+extension,status}]}]}}]);
  return Response.json({choices:[{message:{content:JSON.stringify(output||{answer:'Fórmula propuesta',proposal:{cells:[{address:'B4',formula:'=SUM(A2:A3)'}]}})}}]},{status:providerStatus});
 };return {calls,fetcher,env:{AI_ENABLED:'true',GROQ_API_KEY:'private-test-key'}};
}
test('verifica identidad, membresía y documento antes de enviar a Groq; clave solo en upstream',async()=>{
 const f=fixture(),r=await editorAnswer(base,'Bearer user-token',f);assert.equal(r.proposal.cells[0].formula,'=SUM(A2:A3)');assert.equal(f.calls.length,4);
 assert.equal(f.calls[3].options.headers.Authorization,'Bearer private-test-key');assert.equal(f.calls[0].options.headers.Authorization,'Bearer user-token');assert.ok(!JSON.stringify(r).includes('private-test-key'));
 const sent=JSON.parse(f.calls[3].options.body);assert.equal(sent.response_format.type,'json_object');assert.equal(JSON.parse(sent.messages[1].content).context.range,'B4');
});
test('bloquea cuenta inactiva y solicitudes sin sesión antes del proveedor',async()=>{
 const f=fixture({active:false});await assert.rejects(editorAnswer(base,'Bearer user-token',f),{status:403});assert.equal(f.calls.length,2);
 await assert.rejects(editorAnswer(base,'',fixture()),{status:401});
 await assert.rejects(editorAnswer(base,'Bearer malformed-token',{...fixture(),fetcher:async()=>Response.json({error:'invalid JWT'},{status:400})}),{status:401});
});
test('propuestas y autorización denegadas para versiones de consulta; consulta sí disponible',async()=>{
 for(const setting of [{status:'obsolete'},{status:'rejected'},{kind:'Registro diligenciado'},{retired:true}]){
  const f=fixture(setting);await assert.rejects(editorAnswer(base,'Bearer user-token',f),{status:403});assert.equal(f.calls.length,3);
  await assert.rejects(editorAnswer({...base,operation:'authorize'},'Bearer user-token',fixture(setting)),{status:403});
  const r=await editorAnswer({...base,operation:'ask'},'Bearer user-token',fixture(setting));assert.equal(r.proposal,null);assert.equal(r.editable,false);
 }
});
test('autorización vuelve a consultar el documento sin llamar a Groq',async()=>{
 const f=fixture(),r=await editorAnswer({...base,operation:'authorize'},'Bearer user-token',f);assert.equal(r.editable,true);assert.equal(f.calls.length,3);
});
test('no acepta contextos de otro motor, rangos grandes o celdas ajenas',async()=>{
 await assert.rejects(editorAnswer({...base,type:'word'},'Bearer user-token',fixture()),{status:400});
 assert.throws(()=>normalizeContext('cell',{...base.context,cells:Array(201).fill(base.context.cells[0])}));
 assert.throws(()=>normalizeContext('cell',{...base.context,cells:[{address:'C1',value:1}]}));
 await assert.rejects(editorAnswer(base,'Bearer user-token',fixture({output:{answer:'Texto',proposal:{cells:[{address:'B5',value:3}]}}})),{status:502});
});
test('rechaza código y fórmulas externas; permite fórmulas normales y texto literal',()=>{
 for(const formula of ['=WEBSERVICE("https://example.com")','=SUM([book]Hoja!A1)','=HYPERLINK("https://example.com")','console.log(1)'])assert.throws(()=>validateProposal('cell',{cells:[{address:'B4',formula}]},base.context));
 assert.deepEqual(validateProposal('cell',{cells:[{address:'B4',value:'=texto literal'}]},base.context),{cells:[{address:'B4',value:'=texto literal'}]});
 assert.throws(()=>validateProposal('word',{code:'Api.RemoveAll()'},{}));
});
test('Word y PowerPoint devuelven propuestas limitadas y estructuradas',async()=>{
 const word=await editorAnswer({...base,type:'word',context:{type:'word',text:'Original'},operation:'propose'},'Bearer user-token',fixture({extension:'docx',output:{answer:'Texto',proposal:{text:'Texto mejorado'}}}));assert.equal(word.proposal.text,'Texto mejorado');
 const slide=await editorAnswer({...base,type:'slide',context:{type:'slide',slide:1,text:'Tema'}},'Bearer user-token',fixture({extension:'pptx',output:{answer:'Nueva diapositiva',proposal:{slides:[{title:'Tema',bullets:['Una idea']}]}}}));assert.equal(slide.proposal.slides.length,1);
 assert.throws(()=>validateProposal('slide',{slides:Array(6).fill({title:'Tema',bullets:[]})},{}));
});
test('límite de Groq conserva error y no cambia de proveedor ni reintenta',async()=>{
 const f=fixture({providerStatus:429});await assert.rejects(editorAnswer(base,'Bearer user-token',f),{status:429});assert.equal(f.calls.filter(c=>c.url.includes('groq.com')).length,1);
});
test('el panel usa la sesión de la página principal y no puede cambiar de documento',async()=>{
 let call;const host=createEditorAIHost({documentId:'d',versionId:'v',type:'word',editable:true},{getSession:async()=>({data:{session:{access_token:'parent-token'}}}),fetcher:async(url,options)=>{call={url,options};return Response.json({answer:'Respuesta',proposal:null});}});
 const value=await host.request({documentId:'otro',versionId:'otra',type:'cell',operation:'ask',question:'Resumen',context:{type:'word'}});
 assert.equal(JSON.parse(call.options.body).documentId,'d');assert.equal(JSON.parse(call.options.body).type,'word');assert.equal(call.options.headers.Authorization,'Bearer parent-token');assert.ok(!JSON.stringify(value).includes('parent-token'));assert.equal(Object.isFrozen(host),true);
});

test('sends bounded conversational history before the current context',async()=>{
 const f=fixture();await editorAnswer({...base,history:[{role:'user',content:'Primera pregunta'},{role:'assistant',content:'Respuesta previa'}]},'Bearer token',f);
 const sent=JSON.parse(f.calls.at(-1).options.body);assert.equal(sent.messages[1].content,'Primera pregunta');assert.equal(sent.messages[2].content,'Respuesta previa');assert.equal(JSON.parse(sent.messages[3].content).question,base.question);
 await assert.rejects(editorAnswer({...base,history:[{role:'system',content:'invalid'}]},'Bearer token',fixture()),{status:400});
});

test('PDF allows contextual conversation but cannot authorize edits',async()=>{
 const f=fixture({extension:'pdf',output:{answer:'Resumen de la página',proposal:null}}),body={...base,type:'pdf',operation:'ask',context:{type:'pdf',text:'Página uno',truncated:true}};
 const r=await editorAnswer(body,'Bearer token',f);assert.equal(r.editable,false);assert.equal(r.proposal,null);
 await assert.rejects(editorAnswer({...body,operation:'propose'},'Bearer token',fixture({extension:'pdf'})),{status:403});
});
