import http from 'node:http';
import {readFile,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {createOnlyofficeBridge,signToken,verifyToken} from '../onlyoffice/bridge.mjs';
import {decodeCloudValue} from '../platform-cloud.js';
import {fakeCloud} from './helpers/onlyoffice-fake-cloud.mjs';
import {wordFixture} from './helpers/word-fixture.mjs';
import {powerpointFixture} from './helpers/powerpoint-fixture.mjs';
const root=path.resolve('.'),runtime=path.join(root,'infra/onlyoffice-local/runtime');
const frontend=process.env.ONLYOFFICE_TEST_FRONTEND||'';
const pdfTest=process.env.ONLYOFFICE_TEST_PDF==='true';
const wordTest=process.env.ONLYOFFICE_TEST_WORD==='true';
const powerpointTest=process.env.ONLYOFFICE_TEST_POWERPOINT==='true';
const secret=(await readFile(path.join(root,'infra/onlyoffice-local/.env'),'utf8')).match(/^ONLYOFFICE_JWT_SECRET=(.+)$/m)[1].trim();
const context={module:{exports:{}},exports:{},setTimeout,clearTimeout,setImmediate,clearImmediate,Buffer,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder};
vm.runInNewContext(await readFile('public/vendor/xlsx/jszip-3.10.1.js','utf8'),context);
const JSZip=context.module.exports,zip=new JSZip();
zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
zip.file('xl/workbook.xml','<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Prueba" sheetId="1" r:id="rId1"/></sheets></workbook>');
zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
zip.file('xl/worksheets/sheet1.xml','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Prueba aislada</t></is></c></row><row r="2"><c r="A2"><v>11</v></c></row><row r="3"><c r="A3"><v>22</v></c><c r="B3"><f>SUM(A2:A3)</f><v>33</v></c></row></sheetData></worksheet>');
let fixture=Buffer.from(await zip.generateAsync({type:'nodebuffer'}));
if(wordTest)fixture=await wordFixture(JSZip);
if(powerpointTest)fixture=await powerpointFixture(JSZip);
if(pdfTest){const {PDFDocument,StandardFonts}=await import('../public/vendor/pdf/pdf-lib-1.17.1.mjs');const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);pdf.addPage([595,842]).drawText('PRUEBA AISLADA PDF ARLES',{x:60,y:750,size:18,font});fixture=Buffer.from(await pdf.save());}
const filename=pdfTest?'fixture.pdf':wordTest?'fixture.docx':powerpointTest?'fixture.pptx':'fixture.xlsx';
const cloud=await fakeCloud(new File([fixture],filename));
cloud.rows.get('state:arles-documental-prototipo-v1').payload.documents[0].versions[0].fileName=filename;
const originalBytes=Buffer.from(cloud.files.get('original.gz'));
const temp=await mkdtemp(path.join(os.tmpdir(),'arles-onlyoffice-live-'));
let bridge,browser,tunnel,base,ready=[],lastPage,errors=[],callbacks=[];
function proxyHost(req){if(base&&req.url.startsWith('/onlyoffice/')){req.headers.host=new URL(base).host;req.headers['x-forwarded-proto']='https';}}
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url.startsWith('/api/onlyoffice/callback/')){let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw),signed=verifyToken(body.token||req.headers.authorizationjwt,secret),value=signed.payload||signed;callbacks.push({status:value.status,key:value.key});const session=bridge.sessions.get(req.url.split('/')[4]);assert.equal(req.url.split('/')[5],session.capability);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(await bridge.callback(session,body)));return;}
  proxyHost(req);
  if(bridge&&await bridge.handle(req,res))return;
  const match=/^\/test\/([123])$/.exec(req.url);
  if(match){const opened=await bridge.open(await cloud.auth('test-user-'+match[1]),{documentId:'document',versionId:'v1'},'test-user-'+match[1]);ready.push(opened);res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><title>Prueba aislada · ONLYOFFICE</title></head><body style="margin:0;height:100vh"><div id="editor" style="height:100%"></div><script src="/onlyoffice/web-apps/apps/api/documents/api.js"></script><script>const config='+JSON.stringify(opened.config).replaceAll('<','\\u003c')+';config.events={onDocumentReady:()=>window.officeReady=true,onError:e=>window.officeError=e.data};window.officeEditor=new DocsAPI.DocEditor("editor",config);</script></body></html>');return;}
  res.end('Prueba tecnica aislada. Sin documentos reales.');
 }catch(e){console.log('Error en servidor de prueba: '+e.message);res.statusCode=500;res.end('Prueba no disponible');}
});
await new Promise(resolve=>server.listen(4184,'127.0.0.1',resolve));
server.on('upgrade',(req,socket,head)=>{proxyHost(req);bridge?bridge.upgrade(req,socket,head):socket.destroy();});
try{
 if(process.env.ONLYOFFICE_TEST_TUNNEL_URL){const url=new URL(process.env.ONLYOFFICE_TEST_TUNNEL_URL);assert.ok(url.protocol==='https:'&&/^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname)&&url.pathname==='/'&&!url.username&&!url.password&&!url.search&&!url.hash);base=url.origin;}
 else{
  tunnel=spawn(path.join(runtime,'cloudflared.exe'),['tunnel','--url','http://127.0.0.1:4184','--protocol','http2','--no-autoupdate'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  base=await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error('No se genero el enlace aislado de prueba')),90000);tunnel.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match){clearTimeout(timeout);resolve(match[0]);}});tunnel.on('exit',code=>reject(Error('El tunel de prueba termino: '+code)));});
 }
 bridge=await createOnlyofficeBridge({root,secret,publicURL:base,storageDir:temp,authenticate:cloud.auth,allowedOrigins:frontend?[new URL(frontend).origin]:[]});
 const tunnelDeadline=Date.now()+60000;let tunnelReady=false;
 while(!tunnelReady&&Date.now()<tunnelDeadline){try{const health=await fetch(base+'/api/onlyoffice/health',{signal:AbortSignal.timeout(10000)});tunnelReady=health.ok&&(await health.json()).ready===true;}catch{}if(!tunnelReady)await new Promise(resolve=>setTimeout(resolve,1000));}
 assert.ok(tunnelReady,'El tunel aislado de prueba no quedo disponible');
 const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-dev-shm-usage','--disable-gpu','--renderer-process-limit=3']});
 const pages=[],browserContext=await browser.newContext({viewport:{width:1365,height:900}});
 const browserOrigin=frontend||(process.env.ONLYOFFICE_TEST_INTERNET==='true'?base:'http://127.0.0.1:4184');
 if(frontend&&process.env.ARLES_TEST_COOKIE_FILE){const headers=await readFile(process.env.ARLES_TEST_COOKIE_FILE,'utf8'),cookies=[...headers.matchAll(/^set-cookie:\s*([^=;]+)=([^;]*)/gmi)].map(match=>({name:match[1],value:match[2],url:frontend}));await browserContext.addCookies(cookies);}
 for(let i=1;i<=(pdfTest?1:3);i++){
  const page=await browserContext.newPage();lastPage=page;page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('requestfailed',request=>{if(/\.(js|css)(\?|$)|\/api\/onlyoffice\//i.test(request.url()))errors.push('Recurso: '+new URL(request.url()).pathname+' · '+request.failure()?.errorText);});pages.push(page);console.log('Abriendo editor real: usuario '+i);
  if(frontend){
   ready.push(await bridge.open(await cloud.auth('test-user-'+i),{documentId:'document',versionId:'v1'},'test-user-'+i));
   await page.addInitScript(user=>{
    const db={auth:{getSession:async()=>({data:{session:{access_token:user,user:{id:user}}}}),getUser:async()=>({data:{user:{id:user}}}),onAuthStateChange:()=>({})},from(){return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{display_name:user,active:true}}),like:async()=>({data:[]})};}};
    Object.defineProperty(globalThis,'supabase',{configurable:true,get:()=>({createClient:()=>db}),set:()=>{}});
   },'test-user-'+i);
   await page.route(frontend+'/api/onlyoffice/health',route=>route.fulfill({json:{enabled:true,ready:true,serverURL:base}}));
   await page.goto(frontend+'/onlyoffice-editor.html?document=document&version=v1',{timeout:90000});
   await page.waitForFunction(()=>document.querySelector('#message')?.hidden,null,{timeout:150000});
  }else{
   await page.goto(browserOrigin+'/test/'+i,{timeout:90000});await page.waitForFunction(()=>window.officeReady||window.officeError,null,{timeout:150000});const error=await page.evaluate(()=>window.officeError);assert.ok(!error,JSON.stringify(error));
  }
  console.log('Editor real listo: usuario '+i);
 }
 assert.equal(new Set(ready.map(x=>x.config.document.key)).size,1);
 if(pdfTest){
  assert.equal(ready[0].config.documentType,'pdf');assert.equal(ready[0].config.document.fileType,'pdf');
  const pdfFrame=pages[0].frames().find(frame=>frame.url().includes('/pdfeditor/'));assert.ok(pdfFrame);
  await pdfFrame.waitForFunction(()=>!document.body.innerText.includes('Cargando documento'),null,{timeout:120000});
  await pdfFrame.waitForFunction(()=>document.querySelectorAll('canvas').length>0,null,{timeout:120000});
  assert.ok(pages[0].frames().length>1);assert.ok(cloud.files.get('original.gz').equals(originalBytes));
  await pages[0].screenshot({path:path.join(runtime,'pdf-onlyoffice-vercel.png')});
  await writeFile(path.join(runtime,'verificacion-pdf.json'),JSON.stringify({at:new Date().toISOString(),frontend,realEngineOpen:true,format:'pdf',originalPreserved:true,isolatedAuthentication:true},null,2));
  console.log('PDF sintetico abierto con el motor real de ONLYOFFICE desde Vercel. Original intacto; Supabase real no modificado.');
 }else{
 const first=pages[0],editorPath=wordTest?'/web-apps/apps/documenteditor/':powerpointTest?'/web-apps/apps/presentationeditor/':'/web-apps/apps/spreadsheeteditor/';const frame=first.frames().find(f=>f.url().includes(editorPath));assert.ok(frame,'No se encontro el editor del documento');
 await first.bringToFront();
 if(powerpointTest){
  assert.equal(ready[0].config.documentType,'slide');assert.equal(ready[0].config.document.fileType,'pptx');
  await frame.waitForFunction(()=>!document.body.innerText.includes('Cargando documento')&&document.querySelectorAll('canvas').length>0,null,{timeout:120000});
  for(const label of ['Entiendo','Entendido']){const tip=frame.getByText(label,{exact:true});if(await tip.isVisible())await tip.click();}
  const geometry=await frame.evaluate(()=>{const logic=Asc.editor.WordControl.m_oLogicDocument;return {canvas:[...document.querySelectorAll('canvas')].map(c=>c.id),shapes:logic.Slides[0].cSld.spTree.map(shape=>({text:!!shape.txBody,paragraph:typeof shape.txBody?.content?.Content[0]?.GetSelectedText}))};});console.log('PowerPoint preparado: '+JSON.stringify(geometry));
  await first.screenshot({path:path.join(runtime,'powerpoint-before-edit.png')});
  const canvas=frame.locator('#id_viewer_overlay'),bounds=await canvas.boundingBox();await canvas.dblclick({position:{x:bounds.width*.18,y:bounds.height*.30}});
  await first.keyboard.press('Control+A');await first.keyboard.type('COEDICION_POWERPOINT_VERIFICADA');await first.keyboard.press('Escape');
 }else if(wordTest){
  assert.equal(ready[0].config.documentType,'word');assert.equal(ready[0].config.document.fileType,'docx');
  await frame.waitForFunction(()=>!document.body.innerText.includes('Cargando documento')&&document.querySelectorAll('canvas').length>0,null,{timeout:120000});
  console.log('Word preparado: '+JSON.stringify(await frame.evaluate(()=>({canvas:[...document.querySelectorAll('canvas')].map(c=>c.id),selectedText:typeof Asc.editor.asc_getSelectedText,logicSelectedText:typeof Asc.editor.WordControl?.m_oLogicDocument?.GetSelectedText}))));
  for(const label of ['Entiendo','Entendido']){const tip=frame.getByText(label,{exact:true});if(await tip.isVisible())await tip.click();}
  await frame.locator('#id_viewer_overlay').click({position:{x:350,y:160}});
  await first.keyboard.press('Control+Home');await first.keyboard.type('COEDICION_WORD_VERIFICADA');await first.keyboard.press('Enter');
 }else{
 const name=frame.locator('#ce-cell-name');await name.fill('A1');await name.press('Enter');
 const tip=frame.getByText('Entiendo',{exact:true});if(await tip.isVisible())await tip.click();
 await frame.locator('#ws-canvas-graphic-overlay').click({position:{x:150,y:32}});
 await first.keyboard.press('Control+Home');await first.keyboard.type('COEDICION_ARLES_VERIFICADA');await first.keyboard.press('Enter');
 }
 const s=bridge.sessions.get(ready[0].sessionId);
 const command={c:'forcesave',key:s.key};command.token=signToken(command,secret);
 await new Promise(resolve=>setTimeout(resolve,2500));
 const saved=await fetch('http://127.0.0.1:8088/coauthoring/CommandService.ashx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(command)});console.log('Comando de guardado: '+JSON.stringify(await saved.json()));
 const deadline=Date.now()+240000;while(!s.savedAt&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,1000));assert.ok(s.savedAt,'No llego el guardado real del motor');
 const row=cloud.rows.get('file:document:editor-onlyoffice:original');assert.ok(row);
 const draft=decodeCloudValue(JSON.parse(gunzipSync(cloud.files.get(row.payload.path))));
 const result=await JSZip.loadAsync(Buffer.from(await draft.blob.arrayBuffer()));let texts='';for(const name of Object.keys(result.files))if(name.endsWith('.xml'))texts+=await result.file(name).async('string');
 if(powerpointTest){
  const slideXML=await result.file('ppt/slides/slide1.xml').async('string');assert.match(slideXML,/COEDICION_POWERPOINT_VERIFICADA/);assert.match(slideXML,/Verificacion de PPTX/);assert.match(slideXML,/<a:tbl[ >]/);assert.match(slideXML,/<p:pic[ >]/);assert.match(slideXML,/<p:transition[ >]/);assert.match(texts,/SEGUNDA DIAPOSITIVA DE PRUEBA/);assert.match(texts,/NOTAS PPTX DE PRUEBA/);assert.ok(Object.keys(result.files).some(name=>/^ppt\/charts\/chart\d+\.xml$/.test(name)));assert.equal(Object.keys(result.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name)).length,2);
 }else if(wordTest){
  const documentXML=await result.file('word/document.xml').async('string');assert.match(documentXML,/COEDICION_WORD_VERIFICADA/);assert.match(documentXML,/Verificacion de Word/);assert.match(documentXML,/<w:tbl[ >]/);assert.match(documentXML,/<w:drawing[ >]/);assert.match(documentXML,/SEGUNDA PAGINA DE PRUEBA/);assert.match(texts,/ENCABEZADO ARLES DE PRUEBA/);assert.match(texts,/PIE ARLES DE PRUEBA/);assert.ok(Object.keys(result.files).some(name=>/^word\/media\/.+\.png$/.test(name)));
 }else{assert.match(texts,/COEDICION_ARLES_VERIFICADA/);assert.ok(texts.includes('SUM(A2:A3)'));}
 for(const page of pages.slice(1)){
  const other=page.frames().find(f=>f.url().includes(editorPath));let text;
  if(powerpointTest){await page.bringToFront();for(const label of ['Entiendo','Entendido']){const tip=other.getByText(label,{exact:true});if(await tip.isVisible())await tip.click();}const canvas=other.locator('#id_viewer_overlay'),bounds=await canvas.boundingBox();await canvas.dblclick({position:{x:bounds.width*.18,y:bounds.height*.30}});await page.keyboard.press('Control+A');text=await other.evaluate(()=>Asc.editor.asc_GetSelectedText(true,{}));await page.keyboard.press('Escape');assert.match(text,/COEDICION_POWERPOINT_VERIFICADA/,'Los otros usuarios deben ver el cambio sin recargar');}
  else if(wordTest){await page.bringToFront();for(const label of ['Entiendo','Entendido']){const tip=other.getByText(label,{exact:true});if(await tip.isVisible())await tip.click();}await other.locator('#id_viewer_overlay').click({position:{x:350,y:160}});await page.keyboard.press('Control+Home');await page.keyboard.press('Control+Shift+ArrowDown');text=await other.evaluate(()=>Asc.editor.asc_getSelectedText?.()??Asc.editor.WordControl.m_oLogicDocument.GetSelectedText());assert.match(text,/COEDICION_WORD_VERIFICADA/,'Los otros usuarios deben ver el cambio sin recargar');}
  else{text=await other.evaluate(()=>window.Asc?.editor?.asc_getCellInfo?.()?.asc_getText?.());assert.equal(text,'COEDICION_ARLES_VERIFICADA','Los otros usuarios deben ver el cambio sin recargar');}
  console.log('Lectura del otro editor: '+text);
 }
 assert.ok(cloud.files.get('original.gz').equals(originalBytes),'El original debe permanecer intacto');
 await first.screenshot({path:path.join(runtime,powerpointTest?'powerpoint-onlyoffice-vercel.png':wordTest?'word-onlyoffice-vercel.png':'editor-real-tres-usuarios.png')});
 let aiReadable;
 if(wordTest&&frontend){const blocks=await first.evaluate(async encoded=>{const {extractDocumentText}=await import('./assistant-documents.js');const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));return extractDocumentText(new Blob([bytes]),'fixture.docx');},Buffer.from(await draft.blob.arrayBuffer()).toString('base64'));assert.ok(blocks.some(block=>block.text.includes('COEDICION_WORD_VERIFICADA')));assert.ok(blocks.some(block=>block.text.includes('Verificacion de Word')));aiReadable=true;}
 if(powerpointTest&&frontend){const blocks=await first.evaluate(async encoded=>{const {extractDocumentText}=await import('./assistant-documents.js');const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));return extractDocumentText(new Blob([bytes]),'fixture.pptx');},Buffer.from(await draft.blob.arrayBuffer()).toString('base64'));assert.ok(blocks.some(block=>block.location==='Diapositiva 1'&&block.text.includes('COEDICION_POWERPOINT_VERIFICADA')));assert.ok(blocks.some(block=>block.location==='Diapositiva 2'&&block.text.includes('SEGUNDA DIAPOSITIVA DE PRUEBA')));assert.ok(blocks.some(block=>block.location==='Notas de diapositiva 1'&&block.text.includes('NOTAS PPTX DE PRUEBA')));aiReadable=true;}
 await writeFile(path.join(runtime,powerpointTest?'verificacion-powerpoint.json':wordTest?'verificacion-word.json':frontend?'verificacion-vercel.json':'verificacion-real.json'),JSON.stringify({at:new Date().toISOString(),editors:3,browserTransport:frontend?'vercel':browserOrigin===base?'internet':'local',frontend:frontend||undefined,isolatedAuthentication:!!frontend,callbacksHTTPS:true,sharedKey:true,realEngineSave:true,editedText:true,liveCoediting:true,formulaPreserved:wordTest||powerpointTest?undefined:true,wordStructurePreserved:wordTest||undefined,powerpointStructurePreserved:powerpointTest||undefined,aiReadable,originalPreserved:true},null,2));
 console.log('Prueba real del motor terminada: 3 usuarios, edicion, guardado '+(powerpointTest?'PPTX y estructura conservada':wordTest?'DOCX y estructura conservada':'XLSX y formula conservada')+'. Supabase real no modificado.');
 }
}catch(error){
 if(lastPage){await lastPage.screenshot({path:path.join(runtime,'editor-error.png')}).catch(()=>{});console.log('Estado de la pagina: '+JSON.stringify(await lastPage.evaluate(()=>({text:document.body.innerText.slice(0,800),api:typeof window.DocsAPI,editor:!!window.officeEditor,frames:document.querySelectorAll('iframe').length})).catch(()=>({}))));for(const frame of lastPage.frames().slice(1))console.log('Estado del marco: '+(await frame.locator('body').innerText().catch(()=>'' )).slice(0,1200));}
 console.log('Errores del navegador: '+JSON.stringify(errors));console.log('Estados del motor: '+JSON.stringify(callbacks));throw error;
}finally{
 if(browser)await browser.close();if(tunnel)tunnel.kill();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});
}
