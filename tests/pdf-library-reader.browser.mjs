import http from 'node:http';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {fakeCloud} from './helpers/onlyoffice-fake-cloud.mjs';
import {encodeCloudValue} from '../platform-cloud.js';
import {ensureLibraryRoot,ISO_ROOT} from '../model.js';

const root=path.resolve('.'),publicRoot=path.join(root,'dist'),frontend=process.env.ARLES_TEST_URL||'http://127.0.0.1:4187';
let server;
if(!process.env.ARLES_TEST_URL){
 server=http.createServer(async(req,res)=>{const route=new URL(req.url,'http://localhost').pathname,target=path.resolve(publicRoot,'.'+(route==='/'?'/index.html':route));if(!target.startsWith(publicRoot+path.sep)){res.writeHead(404);res.end();return;}try{const data=await readFile(target);res.setHeader('Content-Type',/\.m?js$/.test(target)?'text/javascript':target.endsWith('.html')?'text/html':target.endsWith('.css')?'text/css':target.endsWith('.wasm')?'application/wasm':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});await new Promise(resolve=>server.listen(4187,'127.0.0.1',resolve));
}
const original=await readFile('tmp/pdfs/source.pdf'),edited=await readFile('tmp/pdfs/extra.pdf'),cloud=await fakeCloud(new File([original],'Procedimiento.pdf',{type:'application/pdf'}));
const version={id:'v1',number:'01',fileId:'original',fileName:'Procedimiento.pdf',status:'draft'},base={id:'pdf-document',name:'Procedimiento PDF de prueba',folder:ISO_ROOT,type:'PDF',status:'Borrador',documentKind:'Documento',origin:'internal',ownerArea:'General',code:'',version:'01',modified:'2026-10-04T15:00:00.000Z',imported:true,managed:true,shared:[],linkedFolders:[],versions:[version]};
const state={folders:[],documents:[base,...['retired','obsolete','rejected','record'].map(kind=>({...base,id:kind,name:'Lectura '+kind,retired:kind==='retired',documentKind:kind==='record'?'Registro diligenciado':'Documento',versions:[{...version,fileId:kind+'-original',status:['obsolete','rejected'].includes(kind)?kind:'draft'}]})),{...base,id:'corrupt',name:'Archivo inválido',versions:[{...version,fileId:'corrupt-original'}]}],favorites:[]};ensureLibraryRoot(state);
cloud.rows.set('state:arles-documental-prototipo-v1',{revision:1,payload:JSON.stringify(state)});
for(const kind of ['retired','obsolete','rejected','record'])cloud.rows.set('file:document:'+kind+'-original',{revision:1,payload:{path:'original.gz',encoding:'arles-json-gzip-v1'}});
cloud.rows.set('file:document:corrupt-original',{revision:1,payload:{path:'corrupt.gz',encoding:'arles-json-gzip-v1'}});cloud.files.set('corrupt.gz',gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue(new File(['not a PDF'],'invalid.pdf'))))));
const initialOriginal=Buffer.from(cloud.files.get('original.gz')),initialPayload=cloud.rows.get('state:arles-documental-prototipo-v1').payload;
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],opened=[];let healthReady=false,healthReads=0,writes=0,bootstrapping=true,bootstrapWrites=0;
 page.on('pageerror',error=>errors.push(error.message));
 if(process.env.ARLES_TEST_COOKIE_FILE){const headers=await readFile(process.env.ARLES_TEST_COOKIE_FILE,'utf8'),cookies=[...headers.matchAll(/^set-cookie:\s*([^=;]+)=([^;]*)/gmi)].map(match=>({name:match[1],value:match[2],url:frontend}));await context.addCookies(cookies);}
 await page.exposeFunction('pdfTestRows',async key=>key?cloud.rows.get(key)||null:[...cloud.rows].filter(([key])=>key.startsWith('state:')).map(([key,row])=>({key,...row})));
 await page.exposeFunction('pdfTestDownload',async name=>cloud.files.get(name)?.toString('base64')||null);
 await page.exposeFunction('pdfTestWrite',async details=>{
  // app.js persists its unchanged library once at startup, before any PDF is opened.
  if(bootstrapping&&details.operation==='rpc'&&details.name==='integral_save_batch'){
   assert.equal(details.args.changes.length,1);const change=details.args.changes[0];assert.equal(change.key,'state:arles-documental-prototipo-v1');assert.equal(change.payload,initialPayload);bootstrapWrites++;return cloud.db.rpc(details.name,details.args);
  }
  writes++;throw Error('El lector no debe escribir documentos.');
 });
 await page.addInitScript(()=>{
  const user={id:'test-user-1',email:'test@example.invalid'};
  const db={auth:{getSession:async()=>({data:{session:{access_token:user.id,user}}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({})},from(table){let key;return {select(){return this;},eq(_field,value){key=value;return this;},maybeSingle:async()=>({data:table==='integral_members'?{display_name:'Prueba PDF',active:true}:await window.pdfTestRows(key)}),like:async()=>({data:await window.pdfTestRows()})};},rpc:(name,args)=>window.pdfTestWrite({operation:'rpc',name,args}),storage:{from:()=>({download:async name=>{const encoded=await window.pdfTestDownload(name);return encoded?{data:new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))])}:{error:{message:'Archivo de prueba no disponible'}};},upload:(name)=>window.pdfTestWrite({operation:'upload',name}),remove:(paths)=>window.pdfTestWrite({operation:'remove',paths})})}};
  Object.defineProperty(globalThis,'supabase',{configurable:true,get:()=>({createClient:()=>db}),set:()=>{}});
 });
 await page.route(frontend+'/api/onlyoffice/health',route=>{healthReads++;return route.fulfill({json:{enabled:true,ready:healthReady,serverURL:'https://isolated-test.example.com'}});});
 await context.route('**/onlyoffice-editor.html?*',route=>{opened.push(new URL(route.request().url()));return route.fulfill({contentType:'text/html',body:'<!doctype html><p>Apertura de edición PDF capturada.</p>'});});
 await page.goto(frontend);try{await page.waitForSelector('#integral-cloud-account',{state:'attached'});}catch(error){console.error(JSON.stringify({errors,body:(await page.locator('body').textContent()).slice(-2200)}));throw error;}const explore=page.getByRole('button',{name:'Explorar la biblioteca',exact:true});if(await explore.isVisible())await explore.click();
 await page.evaluate(async()=>{await (await import('./platform-cloud.js')).flushCloud();});bootstrapping=false;assert.equal(bootstrapWrites,1);const initialState=JSON.stringify(cloud.rows.get('state:arles-documental-prototipo-v1'));
 await page.locator('.tree-name[data-folder="'+ISO_ROOT+'"]').dblclick();await page.locator('.doc-row[data-doc="pdf-document"]').dblclick();
 const reader=page.locator('#arles-pdf-reader');await reader.locator('[data-rendered-page="1"]').waitFor();
 assert.equal(opened.length,0);assert.equal(healthReads,0);assert.match(await reader.locator('[data-pr-source]').textContent(),/Original/);assert.equal(await reader.locator('[data-pr-edit]').isDisabled(),false);
 assert.match(await reader.locator('.textLayer').textContent(),/QA SOURCE 1/);assert.equal(await reader.locator('[data-pr-count]').textContent(),'de 3');
 const downloadPromise=page.waitForEvent('download');await reader.locator('[data-pr-download]').click();const download=await downloadPromise;assert.deepEqual(await readFile(await download.path()),original);
 await reader.locator('[data-pr-next]').click();await reader.locator('[data-rendered-page="2"]').waitFor();const geometry=await reader.locator('canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height}));assert.ok(geometry.width>geometry.height,'Se respeta la rotación y la caja de recorte de la página.');
 await reader.locator('[data-pr-next]').click();await reader.locator('[data-rendered-page="3"]').waitFor();await reader.locator('[data-pr-zoom]').selectOption('1.5');await reader.locator('[data-rendered-page="3"]').waitFor();assert.match(await reader.locator('.textLayer').textContent(),/QA SOURCE 3/);
 await reader.locator('[data-pr-edit]').click();await reader.locator('[data-pr-action]').filter({hasText:'no está disponible'}).waitFor();assert.equal(opened.length,0);assert.equal(await reader.isVisible(),true);
 healthReady=true;await reader.locator('[data-pr-edit]').click();await reader.locator('[data-pr-action]').filter({hasText:'otra pestaña'}).waitFor();assert.equal(opened.length,1);assert.equal(opened[0].searchParams.get('document'),base.id);assert.equal(opened[0].searchParams.get('version'),'v1');assert.deepEqual([...opened[0].searchParams.keys()],['document','version']);assert.equal(page.url(),frontend+'/');
 await page.evaluate(()=>{window.pdfTestOpen=window.open;window.open=()=>null;});await reader.locator('[data-pr-edit]').click();await reader.locator('[data-pr-action]').filter({hasText:'ventanas emergentes'}).waitFor();assert.equal(page.url(),frontend+'/');assert.equal(await reader.isVisible(),true);assert.equal(opened.length,1);await page.evaluate(()=>{window.open=window.pdfTestOpen;delete window.pdfTestOpen;});
 await reader.locator('[data-pr-previous]').click();await reader.locator('[data-rendered-page="2"]').waitFor();await reader.locator('[data-pr-previous]').click();await reader.locator('[data-rendered-page="1"]').waitFor();await reader.locator('[data-pr-zoom]').selectOption('fit');await reader.locator('[data-rendered-page="1"]').waitFor();await mkdir('tmp',{recursive:true});await reader.screenshot({path:'tmp/pdf-library-reader-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await reader.locator('[data-rendered-page="1"]').waitFor();assert.equal(await reader.locator('[data-pr-edit]').isVisible(),true);await reader.screenshot({path:'tmp/pdf-library-reader-mobile.png'});await page.setViewportSize({width:1440,height:1000});
 const draft={kind:'arles-onlyoffice-draft-v1',documentId:base.id,versionId:'v1',sourceFileId:'original',sequence:1,savedAt:'2026-10-04T15:00:00.000Z',blob:new File([edited],'Procedimiento.pdf',{type:'application/pdf'})};
 cloud.files.set('edited.gz',gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue(draft)))));cloud.rows.set('file:document:editor-onlyoffice:original',{revision:1,payload:{path:'edited.gz',encoding:'arles-json-gzip-v1'}});
 await reader.locator('[data-pr-refresh]').click();await reader.locator('[data-rendered-page="1"]').waitFor();assert.match(await reader.locator('[data-pr-source]').textContent(),/Borrador compartido/);assert.match(await reader.locator('.textLayer').textContent(),/QA EXTRA/);assert.equal(await reader.locator('[data-pr-count]').textContent(),'de 1');
 await reader.locator('[data-pr-close]').click();await reader.waitFor({state:'detached'});
 await page.evaluate(async()=>{await (await import('./document-control.js')).previewFile('pdf-document|v1');});await reader.locator('[data-rendered-page="1"]').waitFor();assert.match(await reader.locator('.textLayer').textContent(),/QA EXTRA/);await page.keyboard.press('Escape');await reader.waitFor({state:'detached'});
 for(const id of ['retired','obsolete','rejected','record']){
  await page.evaluate(async id=>{const {platformStorage}=await import('./platform-cloud.js'),doc=JSON.parse(platformStorage.getItem('arles-documental-prototipo-v1')).documents.find(d=>d.id===id);await (await import('./document-editor.js')).openDocumentEditor(doc);},id);await reader.locator('[data-rendered-page="1"]').waitFor();assert.equal(await reader.locator('[data-pr-edit]').isDisabled(),true,id);await reader.locator('[data-pr-edit]').evaluate(button=>button.click());assert.equal(opened.length,1);await reader.locator('[data-pr-close]').click();await reader.waitFor({state:'detached'});
 }
 await page.evaluate(async()=>{await (await import('./document-control.js')).previewFile('corrupt|v1');});await reader.locator('[data-pr-message]').filter({hasText:'PDF válido'}).waitFor();assert.equal(await reader.locator('[data-pr-edit]').isDisabled(),true);await reader.locator('[data-pr-close]').click();await reader.waitFor({state:'detached'});
 cloud.files.set('edited.gz',gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue({...draft,sourceFileId:'wrong-source'})))));
 await page.evaluate(async()=>{await (await import('./document-control.js')).previewFile('pdf-document|v1');});await reader.locator('[data-pr-message]').filter({hasText:'validar el borrador compartido'}).waitFor();assert.equal(await reader.locator('[data-pr-paper]').isVisible(),false);await page.keyboard.press('Escape');await reader.waitFor({state:'detached'});
 assert.equal(writes,0);assert.deepEqual(cloud.files.get('original.gz'),initialOriginal);assert.equal(JSON.stringify(cloud.rows.get('state:arles-documental-prototipo-v1')),initialState);assert.deepEqual(errors,[]);
 const report={previewInsidePlatform:true,opensEditorOnlyOnRequest:true,blockedPopupKeepsReader:true,worksWithoutEditorServer:true,pagesRotationZoomTextDownload:true,savedDraftRefresh:true,readonlyVersions:true,invalidPDFAndDraftRejected:true,existingBootstrapWrites:bootstrapWrites,readerSupabaseWrites:writes,originalUnchanged:true,pageErrors:errors};await writeFile('tmp/pdf-library-reader-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
