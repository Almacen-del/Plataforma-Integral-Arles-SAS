import http from 'node:http';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createOnlyofficeBridge,signToken} from '../onlyoffice/bridge.mjs';
import {encodeCloudValue,decodeCloudValue} from '../platform-cloud.js';
import {editorAnswer} from '../api/editor-assistant.js';
import {fakeCloud} from './helpers/onlyoffice-fake-cloud.mjs';
import {wordFixture} from './helpers/word-fixture.mjs';
import {powerpointFixture} from './helpers/powerpoint-fixture.mjs';
const root=path.resolve('.'),run=promisify(execFile),require=createRequire(import.meta.url);
const frontend=process.env.EDITOR_AI_TEST_FRONTEND||'';
const engineTransport=process.env.EDITOR_AI_TEST_ENGINE_URL||'';
const secret=(await readFile('infra/onlyoffice-local/.env','utf8')).match(/^ONLYOFFICE_JWT_SECRET=(.+)$/m)[1].trim();
const context={module:{exports:{}},exports:{},setTimeout,clearTimeout,setImmediate,clearImmediate,Buffer,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder};vm.runInNewContext(await readFile('public/vendor/xlsx/jszip-3.10.1.js','utf8'),context);const JSZip=context.module.exports;
const zip=new JSZip();
zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Prueba" sheetId="1" r:id="rId1"/></sheets></workbook>');
zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
zip.file('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>ORIGINAL EXCEL</t></is></c></row><row r="2"><c r="A2"><v>11</v></c></row><row r="3"><c r="A3"><v>22</v></c></row></sheetData></worksheet>');
const fixtures={word:await wordFixture(JSZip),cell:Buffer.from(await zip.generateAsync({type:'nodebuffer'})),slide:await powerpointFixture(JSZip)},extensions={word:'docx',cell:'xlsx',slide:'pptx'};
const cloud=await fakeCloud(new File([fixtures.cell],'fixture.xlsx'));cloud.rows.clear();cloud.files.clear();const documents=[];
for(const type of Object.keys(fixtures)){documents.push({id:'d-'+type,name:'Prueba IA '+type,versions:[{id:'v1',fileId:'f-'+type,fileName:'fixture.'+extensions[type],number:'01',status:'draft'}]});cloud.rows.set('file:document:f-'+type,{revision:1,payload:{path:type+'.gz',encoding:'arles-json-gzip-v1'}});cloud.files.set(type+'.gz',gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue(new File([fixtures[type]],'fixture.'+extensions[type]))))));}
cloud.rows.set('state:arles-documental-prototipo-v1',{revision:1,payload:{documents}});
const originals=new Map([...cloud.files].map(([key,value])=>[key,Buffer.from(value)])),queries=[],errors=[];let bridge,base,tunnel,browser,lastPage,opened=new Map();
const storage=await mkdtemp(path.join(os.tmpdir(),'arles-ai-live-'));
const server=http.createServer(async(req,res)=>{
 try{
  const route=new URL(req.url,'http://localhost').pathname;
  if(base&&route.startsWith('/onlyoffice/')){req.headers.host=new URL(base).host;req.headers['x-forwarded-proto']='https';}
  if(bridge&&await bridge.handle(req,res))return;
  if(route==='/api/editor-assistant'){
   let raw='';for await(const chunk of req)raw+=chunk;const input=JSON.parse(raw);queries.push(input);
   const result=await editorAnswer(input,req.headers.authorization,{env:{AI_ENABLED:'true',GROQ_API_KEY:'fake-key'},fetcher:async(url,options)=>{
    if(url.endsWith('/auth/v1/user'))return Response.json({id:'test-user-1'});
    if(url.includes('/integral_members'))return Response.json([{active:true}]);
    if(url.includes('/integral_state'))return Response.json([{payload:{documents}}]);
    const proposal=input.type==='word'?{text:'TEXTO NUEVO IA ARLES'}:input.type==='cell'?{cells:[{address:'B4',formula:'=SUM(A2:A3)'}]}:{slides:[{title:'DIAPOSITIVA IA ARLES',bullets:['Primera idea','Segunda idea']}]};
    return Response.json({choices:[{message:{content:JSON.stringify({answer:'Propuesta aislada para verificar el editor.',proposal})}}]});
   }});res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));return;
  }
  const match=/^\/test\/(word|cell|slide)$/.exec(route);
  if(match){const type=match[1],config=await bridge.open(await cloud.auth('test-user-1'),{documentId:'d-'+type,versionId:'v1'},'test-user-1',base);opened.set(type,config);res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body style="margin:0;height:100vh"><div id="editor" style="height:100%"></div><script src="/onlyoffice/web-apps/apps/api/documents/api.js"></script><script>window.__arlesEditorAI='+JSON.stringify({documentId:'d-'+type,versionId:'v1',type,editable:true})+';window.__arlesEditorAI.request=async(body,signal)=>{const r=await fetch("/api/editor-assistant",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer test-user-1"},body:JSON.stringify({...window.__arlesEditorAI,...body}),signal});const v=await r.json();if(!r.ok)throw Error(v.error);return v;};const config='+JSON.stringify(config.config).replaceAll('<','\\u003c')+';config.events={onDocumentReady:()=>window.officeReady=true,onError:e=>window.officeError=e.data};window.officeEditor=new DocsAPI.DocEditor("editor",config);</script></body></html>');return;}
  const files=new Set(['/platform-cloud.js','/editor-ai-model.js','/editor-ai-host.js','/onlyoffice-editor.html','/onlyoffice-editor.js','/onlyoffice-editor.css','/onlyoffice-connection.js','/public/vendor/supabase-2.117.2.js','/public/logo-arles-sas.png']);
  if(files.has(route)||/^\/office-ai\/[a-z0-9.-]+$/.test(route)){const body=await readFile(path.join(root,route));res.setHeader('Content-Type',route.endsWith('.html')?'text/html':route.endsWith('.css')?'text/css':route.endsWith('.json')?'application/json':route.endsWith('.svg')?'image/svg+xml':'text/javascript');res.end(body);return;}
  res.end('Prueba aislada del asistente. No utiliza documentos reales.');
 }catch(e){res.statusCode=e.status||500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:e.message}));console.log('Servidor de prueba: '+e.message);}
});
await new Promise(resolve=>server.listen(4188,'127.0.0.1',resolve));server.on('upgrade',(req,socket,head)=>{if(base){req.headers.host=new URL(base).host;req.headers['x-forwarded-proto']='https';}bridge?bridge.upgrade(req,socket,head):socket.destroy();});
try{
 console.log('Servidor de prueba listo en http://127.0.0.1:4188; ventana para verificación inicial.');
 await new Promise(resolve=>setTimeout(resolve,20000));
 tunnel=spawn('infra/onlyoffice-local/runtime/cloudflared.exe',['tunnel','--url','http://127.0.0.1:4188','--protocol','http2','--no-autoupdate'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
 base=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('No se abrió el túnel de prueba')),60000);tunnel.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match){clearTimeout(timer);resolve(match[0]);}});});
 // Real engine assets use its stable public origin. Keep that origin for signed
 // cache-download validation; synthetic source/callback links use our test tunnel.
 bridge=await createOnlyofficeBridge({root,secret,publicURL:engineTransport||base,storageDir:storage,authenticate:cloud.auth,allowedOrigins:frontend?[new URL(frontend).origin]:[]});
 console.log('Túnel de prueba preparado');
 for(let i=0;i<30;i++){try{if((await fetch(base+'/api/onlyoffice/health',{signal:AbortSignal.timeout(5000)})).ok)break;}catch{}await new Promise(r=>setTimeout(r,1000));}
 const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu','--renderer-process-limit=3']});
 const browserContext=await browser.newContext({viewport:{width:1440,height:1000}}),session={access_token:'test-user-1',refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'test-user-1',email:'test@example.com'}};
 await browserContext.addInitScript(s=>{try{localStorage.setItem('integral-auth-v1',JSON.stringify(s));}catch{}},session);
 if(frontend&&process.env.ARLES_TEST_COOKIE_FILE){const headers=await readFile(process.env.ARLES_TEST_COOKIE_FILE,'utf8'),cookies=[...headers.matchAll(/^set-cookie:\s*([^=;]+)=([^;]*)/gmi)].map(m=>({name:m[1],value:m[2],url:frontend}));await browserContext.addCookies(cookies);}
 await browserContext.route('**/*.supabase.co/**',async route=>{const url=new URL(route.request().url());let value={};if(url.pathname==='/auth/v1/user')value=session.user;else if(url.pathname.includes('integral_members'))value=[{active:true,display_name:'Prueba aislada'}];else if(url.pathname.includes('integral_state'))value=[...cloud.rows].map(([key,row])=>({key,...row}));await route.fulfill({json:value});});
 if(frontend){
  if(process.env.ARLES_TEST_COOKIE_FILE)for(const pattern of [frontend+'/office-ai/**',frontend+'/editor-ai-model.js'])await browserContext.route(pattern,async route=>{
   const response=await browserContext.request.get(route.request().url());assert.ok(response.ok());if(route.request().url().includes('/office-ai/'))assert.equal(response.headers()['access-control-allow-origin'],'*');await route.fulfill({response});
  });
  await browserContext.route(frontend+'/api/onlyoffice/health',r=>r.fulfill({json:{enabled:true,ready:true,serverURL:engineTransport||base}}));
  if(engineTransport){
   await browserContext.route(engineTransport+'/api/onlyoffice/session',async route=>{
    const input=route.request().postDataJSON(),value=await bridge.open(await cloud.auth('test-user-1'),input,'test-user-1',frontend);
    value.config.document.url=value.config.document.url.replace(engineTransport,base);
    value.config.editorConfig.callbackUrl=value.config.editorConfig.callbackUrl.replace(engineTransport,base);
    delete value.config.token;value.config.token=signToken(value.config,secret);
    opened.set(input.documentId.replace('d-',''),value);await route.fulfill({json:value,headers:{'Access-Control-Allow-Origin':frontend}});
   });
   await browserContext.route(engineTransport+'/api/onlyoffice/state/**',async route=>{const id=new URL(route.request().url()).pathname.split('/').at(-1),s=bridge.sessions.get(id);await route.fulfill({json:{savedAt:s?.savedAt,pending:s?.pending,sequence:s?.sequence},headers:{'Access-Control-Allow-Origin':frontend}});});
  }
  await browserContext.route(frontend+'/api/editor-assistant',async r=>{const response=await fetch(base+'/api/editor-assistant',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-user-1'},body:r.request().postData()});await r.fulfill({status:response.status,json:await response.json()});});
 }
 const report={at:new Date().toISOString(),frontend:frontend||base,engineTransport:engineTransport||base,realEngine:true,provider:'isolated stub',formats:{}};
 for(const type of (process.env.EDITOR_AI_TEST_FORMATS||'word,cell,slide').split(',')){
  const page=await browserContext.newPage();lastPage=page;page.on('pageerror',e=>errors.push(e.stack||e.message));
  console.log('Abriendo '+type+' con el motor real y el complemento nuevo');
  await page.goto(frontend?frontend+'/onlyoffice-editor.html?document=d-'+type+'&version=v1':base+'/test/'+type,{waitUntil:'domcontentloaded',timeout:90000});
  if(frontend){const s=[...bridge.sessions.values()].find(s=>s.documentId==='d-'+type);opened.set(type,{sessionId:s?.id});}
  let plugin;await page.waitForFunction(()=>window.officeReady||document.getElementById('message')?.hidden,null,{timeout:120000});
  const deadline=Date.now()+60000;while(!plugin&&Date.now()<deadline){plugin=page.frames().find(f=>f.url().includes('/office-ai/index.html'));if(!plugin)await new Promise(r=>setTimeout(r,500));}
  assert.ok(plugin,'El complemento no se abrió');await plugin.locator('#status').waitFor();await plugin.waitForFunction(()=>document.getElementById('status')?.textContent.startsWith('Listo'),null,{timeout:30000});console.log(type+': complemento conectado');
  if(type==='cell')await plugin.evaluate(()=>new Promise(resolve=>Asc.plugin.callCommand(function(){Api.GetActiveSheet().GetRange('B4').Select();return true;},false,true,resolve)));
  await plugin.locator('#mode').selectOption('propose');await plugin.locator('#question').fill(type==='cell'?'Sumar A2 y A3 en B4':'Preparar una propuesta de prueba.');await plugin.locator('#send').click();await plugin.locator('#proposal').waitFor({state:'visible',timeout:45000});
  assert.equal(await plugin.locator('#error').isVisible(),false);
  if(type==='cell'){
   await plugin.evaluate(()=>new Promise(resolve=>Asc.plugin.callCommand(function(){Api.GetActiveSheet().GetRange('B4').SetValue(99);return true;},false,true,resolve)));
   await plugin.locator('#apply').click();await plugin.locator('#error').waitFor({state:'visible'});assert.match(await plugin.locator('#error').innerText(),/cambiaron/);
   await plugin.locator('#send').click();await plugin.locator('#proposal').waitFor({state:'visible',timeout:45000});
  }
  await plugin.locator('#apply').click();await plugin.waitForFunction(()=>document.getElementById('applied').textContent.includes('Cambios aplicados'),null,{timeout:25000});assert.equal(await plugin.locator('#apply').isEnabled(),false);
  console.log(type+': propuesta aplicada');
  const after=await plugin.evaluate(async type=>{const {readEditorContext}=await import('./commands.js');Asc.scope.arlesType=type;return new Promise(resolve=>Asc.plugin.callCommand(readEditorContext,false,true,resolve));},type);
  if(type==='word'){
   assert.match(after.context.text,/TEXTO NUEVO IA ARLES/);
   await plugin.evaluate(()=>new Promise(resolve=>Asc.plugin.callCommand(function(){Api.GetDocument().GetElement(1).Select();return true;},false,true,resolve)));
   await plugin.locator('#send').click();await plugin.locator('#proposal').waitFor({state:'visible',timeout:45000});await plugin.locator('#replace').waitFor({state:'visible'});
   await plugin.locator('#replace').click();await plugin.waitForFunction(()=>document.getElementById('applied').textContent.includes('Cambios aplicados'),null,{timeout:25000});
  }
  if(type==='cell'){assert.equal(after.context.cells[0].value,33);assert.equal(after.context.cells[0].formula,'=SUM(A2:A3)');}
  if(type==='slide'){const slides=await plugin.evaluate(()=>new Promise(resolve=>Asc.plugin.callCommand(function(){return Api.GetPresentation().GetAllSlides().map(slide=>slide.GetAllShapes().map(shape=>{const d=shape.GetDocContent();if(!d)return '';let text='';for(let i=0;i<d.GetElementsCount();i++){const p=d.GetElement(i);if(p.GetText)text+=p.GetText();}return text;}).join(' '));},false,true,resolve)));assert.equal(slides.length,3);assert.match(slides[2],/DIAPOSITIVA IA ARLES/);}
  await page.screenshot({path:'tmp/editor-ai-'+type+'.png'});
  const s=bridge.sessions.get(opened.get(type).sessionId),command={c:'forcesave',key:s.key};command.token=signToken(command,secret);await new Promise(r=>setTimeout(r,2500));
  const save=await fetch('http://127.0.0.1:8088/coauthoring/CommandService.ashx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(command)});const saved=await save.json();assert.equal(saved.error,0);
  const saveDeadline=Date.now()+120000;while(!s.savedAt&&Date.now()<saveDeadline)await new Promise(r=>setTimeout(r,1000));assert.ok(s.savedAt,'No llegó el guardado nativo');
  const row=cloud.rows.get('file:document:editor-onlyoffice:f-'+type),draft=decodeCloudValue(JSON.parse(gunzipSync(cloud.files.get(row.payload.path)))),result=await JSZip.loadAsync(await draft.blob.arrayBuffer());
  if(type==='word'){const xml=await result.file('word/document.xml').async('string');assert.match(xml,/TEXTO NUEVO IA ARLES/);assert.match(xml,/<w:tbl[ >]/);assert.match(xml,/Contenido original/);}
  if(type==='cell'){const xml=await result.file('xl/worksheets/sheet1.xml').async('string');assert.match(xml,/SUM\(A2:A3\)/);assert.match(xml,/<v>33<\/v>/);}
  if(type==='slide'){assert.ok(result.file('ppt/slides/slide3.xml'));assert.match(await result.file('ppt/slides/slide1.xml').async('string'),/<a:tbl[ >]/);const xml=await result.file('ppt/slides/slide3.xml').async('string');assert.match(xml,/DIAPOSITIVA IA ARLES/);assert.match(xml,/173E36/i);assert.match(xml,/sz="2800"/);}
  report.formats[type]={nativePlugin:true,preview:true,applied:true,nativeSave:true,wordReplacement:type==='word'||undefined,staleCellsBlocked:type==='cell'||undefined,pptVisibleText:type==='slide'||undefined,originalPreserved:true};
  await page.close();console.log(type+': propuesta, aplicación y guardado verificados');
 }
 for(const [name,bytes] of originals)assert.ok(cloud.files.get(name).equals(bytes));report.errors=errors;report.realSupabaseWrites=false;assert.deepEqual(errors,[]);await writeFile('tmp/editor-ai-live-verification.json',JSON.stringify(report,null,2));
 }catch(e){
 console.log('Último contexto de prueba: '+JSON.stringify(queries.at(-1)?.context));
 if(lastPage){await lastPage.screenshot({path:'tmp/editor-ai-error.png'}).catch(()=>{});for(const frame of lastPage.frames())console.log('Marco '+new URL(frame.url()||'http://localhost').pathname+': '+(await frame.locator('body').innerText().catch(()=>'' )).slice(0,650));}console.log('Errores: '+JSON.stringify(errors));throw e;
}finally{
 if(browser)await browser.close();if(tunnel)tunnel.kill();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(storage,{recursive:true,force:true});
}
