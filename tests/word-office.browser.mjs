import http from 'node:http';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {fakeCloud} from './helpers/onlyoffice-fake-cloud.mjs';
import {decodeCloudValue} from '../platform-cloud.js';
const root=path.resolve('.'),publicRoot=path.join(root,'dist'),frontend=process.env.ARLES_TEST_URL||'http://127.0.0.1:4186';
const office=process.env.ARLES_TEST_OFFICE||'word',powerpoint=office==='powerpoint',excel=office==='excel',label=powerpoint?'PowerPoint':excel?'Excel':'Word',fileName=powerpoint?'Presentación PowerPoint de prueba.pptx':excel?'Libro Excel de prueba.xlsx':'Procedimiento Word de prueba.docx';
let server;
if(!process.env.ARLES_TEST_URL){
 server=http.createServer(async(req,res)=>{const route=new URL(req.url,'http://localhost').pathname,target=path.resolve(publicRoot,'.'+(route==='/'?'/index.html':route));if(!target.startsWith(publicRoot+path.sep)){res.statusCode=404;res.end();return;}try{const data=await readFile(target);res.setHeader('Content-Type',target.endsWith('.html')?'text/html':target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}});await new Promise(resolve=>server.listen(4186,'127.0.0.1',resolve));
}
const cloud=await fakeCloud(new File(['unused'],'unused.xlsx'));cloud.rows.clear();cloud.files.clear();
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],opened=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.ARLES_TEST_COOKIE_FILE){const headers=await readFile(process.env.ARLES_TEST_COOKIE_FILE,'utf8'),cookies=[...headers.matchAll(/^set-cookie:\s*([^=;]+)=([^;]*)/gmi)].map(match=>({name:match[1],value:match[2],url:frontend}));await context.addCookies(cookies);}
 await page.exposeFunction('wordTestRows',async key=>key?cloud.rows.get(key)||null:[...cloud.rows].filter(([key])=>key.startsWith('state:')).map(([key,row])=>({key,...row})));
 await page.exposeFunction('wordTestCommit',async changes=>cloud.db.rpc('integral_save_batch',{changes}));
 await page.exposeFunction('wordTestUpload',async(name,encoded)=>{cloud.files.set(name,Buffer.from(encoded,'base64'));return {};});
 await page.addInitScript(()=>{
  const user={id:'test-user-1',email:'test@example.invalid'};
  const db={auth:{getSession:async()=>({data:{session:{access_token:user.id,user}}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({})},from(table){let key;return {select(){return this;},eq(_field,value){key=value;return this;},maybeSingle:async()=>({data:table==='integral_members'?{display_name:'Prueba Word',active:true}:await window.wordTestRows(key)}),like:async()=>({data:await window.wordTestRows()})};},rpc:(_name,{changes})=>window.wordTestCommit(changes),storage:{from:()=>({upload:async(name,blob)=>{const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return window.wordTestUpload(name,btoa(binary));}})}};
  Object.defineProperty(globalThis,'supabase',{configurable:true,get:()=>({createClient:()=>db}),set:()=>{}});
 });
 await page.route(frontend+'/api/onlyoffice/health',route=>route.fulfill({json:{enabled:true,ready:true,serverURL:'https://isolated-test.example.com'}}));
 await context.route('**/onlyoffice-editor.html?*',route=>{opened.push(new URL(route.request().url()));return route.fulfill({contentType:'text/html',body:'<!doctype html><p>Word creado: apertura de ONLYOFFICE capturada por la prueba aislada.</p>'});});
 await page.goto(frontend);await page.waitForSelector('#new-'+office+'-office',{state:'attached'});await page.waitForSelector('#integral-cloud-account',{state:'attached'});
 const explore=page.getByRole('button',{name:'Explorar la biblioteca',exact:true});if(await explore.isVisible())await explore.click();
 assert.equal(await page.locator('#new-'+office+'-office').isDisabled(),false);
 for(const id of ['new-text-document','open-sheet-workspace','open-pdf-workspace'])assert.equal(await page.locator('#'+id).isDisabled(),true);
 assert.deepEqual(await page.locator('.library-upload-bar .primary').allTextContents(),['＋ Nuevo Word','＋ Nuevo Excel','＋ Nuevo PowerPoint']);
 await page.locator('#new-'+office+'-office').click();await page.locator('#new-'+office+'-office-dialog input').fill(fileName.replace(/\.(docx|pptx|xlsx)$/,''));await page.locator('#new-'+office+'-office-dialog [type=submit]').click();
 await page.waitForFunction(office=>document.querySelector('#library-upload-dialog')?.open||document.querySelector('#new-'+office+'-office-dialog [role=alert]')?.textContent,office);assert.equal(await page.locator('#new-'+office+'-office-dialog [role=alert]').textContent(),'');await page.waitForSelector('#library-upload-dialog[open]');await page.locator('#library-upload-dialog select').selectOption('iso-9001-2015');
 await page.getByRole('button',{name:'Crear y abrir '+label,exact:true}).click();
 const gate=page.locator('dialog[open]').filter({hasText:'Motivo de la modificación'});await gate.waitFor();await gate.locator('textarea').fill('Verificación aislada de creación de '+label);await gate.getByRole('button',{name:'Confirmar y registrar',exact:true}).click();
 const deadline=Date.now()+30000;while(!opened.length&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,100));if(!opened.length)console.log(JSON.stringify({errors,dialogs:await page.locator('dialog').allTextContents(),rows:[...cloud.rows.keys()],pages:context.pages().map(p=>p.url())}));assert.equal(opened.length,1);
 const state=JSON.parse(cloud.rows.get('state:arles-documental-prototipo-v1').payload),doc=state.documents.find(doc=>doc.id===opened[0].searchParams.get('document'));
 assert.equal(doc.name,fileName);assert.equal(doc.documentKind,'Documento');assert.equal(doc.status,'Borrador');assert.equal(doc.imported,false);
 const version=doc.versions[0];assert.equal(opened[0].searchParams.get('version'),version.id);
 const manifest=cloud.rows.get('file:document:'+version.fileId),file=decodeCloudValue(JSON.parse(gunzipSync(cloud.files.get(manifest.payload.path))));assert.equal(file.name,doc.name);assert.equal(await file.slice(0,2).text(),'PK');
 if(excel){
  assert.equal(file.type,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const workbook=await page.evaluate(async encoded=>{const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer);return {sheets:workbook.worksheets.map(sheet=>({name:sheet.name,rows:sheet.actualRowCount,columns:sheet.actualColumnCount,activeCell:sheet.views[0]?.activeCell}))};},Buffer.from(await file.arrayBuffer()).toString('base64'));
  assert.deepEqual(workbook,{sheets:[{name:'Hoja 1',rows:0,columns:0,activeCell:'A1'}]});
  await mkdir(path.join(root,'tmp'),{recursive:true});await writeFile(path.join(root,'tmp','excel-office-created.xlsx'),Buffer.from(await file.arrayBuffer()));
  await page.locator('.library-upload-bar').screenshot({path:path.join(root,'tmp','excel-office-library.png')});
 }
 if(powerpoint){
  const initial=await page.evaluate(async encoded=>{const zip=await JSZip.loadAsync(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))),xml=await zip.file('ppt/presentation.xml').async('string');return {slideCount:new DOMParser().parseFromString(xml,'application/xml').getElementsByTagNameNS('*','sldId').length,slides:Object.keys(zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name)).length};},Buffer.from(await file.arrayBuffer()).toString('base64'));assert.deepEqual(initial,{slideCount:1,slides:1});
  const reader=await page.evaluate(async encoded=>{
   const {extractDocumentText}=await import('./assistant-documents.js'),zip=await JSZip.loadAsync(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))),p='http://schemas.openxmlformats.org/presentationml/2006/main',a='http://schemas.openxmlformats.org/drawingml/2006/main',r='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
   const shape=(text,number=false)=>`<p:sp><p:nvSpPr>${number?'<p:nvPr><p:ph type="sldNum"/></p:nvPr>':''}</p:nvSpPr><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
   zip.file('ppt/presentation.xml',`<p:presentation xmlns:p="${p}" xmlns:r="${r}"><p:sldIdLst><p:sldId id="256" r:id="second"/><p:sldId id="257" r:id="first"/></p:sldIdLst></p:presentation>`);
   const relationships=`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="first" Type="${r}/slide" Target="slides/slide1.xml"/><Relationship Id="second" Type="${r}/slide" Target="slides/slide2.xml"/></Relationships>`;zip.file('ppt/_rels/presentation.xml.rels',relationships);
   for(const [i,text] of [[1,'DIAPOSITIVA UNO'],[2,'DIAPOSITIVA DOS']])zip.file(`ppt/slides/slide${i}.xml`,`<p:sld xmlns:p="${p}" xmlns:a="${a}"><p:cSld><p:spTree>${shape(text)}</p:spTree></p:cSld></p:sld>`);
   zip.file('ppt/slides/_rels/slide1.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="notes" Type="${r}/notesSlide" Target="../notesSlides/notesSlide1.xml"/></Relationships>`);
   zip.file('ppt/notesSlides/notesSlide1.xml',`<p:notes xmlns:p="${p}" xmlns:a="${a}"><p:cSld><p:spTree>${shape('NOTAS ASOCIADAS A UNO')}${shape('NUMERO QUE NO DEBE EXTRAERSE',true)}</p:spTree></p:cSld></p:notes>`);
   const read=async()=>extractDocumentText(new Blob([await zip.generateAsync({type:'uint8array'})]),'reader.pptx'),blocks=await read();
   zip.file('ppt/_rels/presentation.xml.rels',relationships.replace('Id="second"','Id="second" TargetMode="External"'));let externalRejected=false;try{await read();}catch{externalRejected=true;}
   zip.file('ppt/_rels/presentation.xml.rels',relationships);zip.file('ppt/slides/slide2.xml','<broken');let malformedRejected=false;try{await read();}catch{malformedRejected=true;}
   return {blocks,externalRejected,malformedRejected};
  },Buffer.from(await file.arrayBuffer()).toString('base64'));
  assert.deepEqual(reader.blocks,[{location:'Diapositiva 1',text:'DIAPOSITIVA DOS'},{location:'Diapositiva 2',text:'DIAPOSITIVA UNO'},{location:'Notas de diapositiva 2',text:'NOTAS ASOCIADAS A UNO'}]);assert.equal(reader.externalRejected,true);assert.equal(reader.malformedRejected,true);console.log('Lector PPTX: orden real de diapositivas, notas y rechazo de referencias externas/XML corrupto comprobados.');
 }
 assert.deepEqual(errors,[]);console.log(label+' creado desde la biblioteca, archivo y auditoría guardados en memoria, apertura con ONLYOFFICE y motores antiguos bloqueados. Supabase real no modificado.');
}finally{await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
