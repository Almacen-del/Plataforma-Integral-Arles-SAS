import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),server=http.createServer(async(req,res)=>{try{const route=new URL(req.url,'http://localhost').pathname;const file=path.join(root,route==='/'?'index.html':route);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.wasm')?'application/wasm':'text/html');let body=await readFile(file);if(file.endsWith('index.html'))body=body.toString().replace('<script type="module" src="/platform-boot.js"></script>','<script type="module">await import("/app.js");await import("/turnos.js");await import("/document-control.js");await import("/platform.js");</script>');res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(4200,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>console.log('PAGE ERROR',e.message));page.setDefaultTimeout(10000);await page.goto('http://127.0.0.1:4200/');
await page.locator('#nav-doc-control').waitFor({state:'attached'});await page.evaluate(async()=>{
 const blob=await(await fetch('/tmp/image-engine/sample.png')).blob();await(await import('/document-control.js')).blobOperation('put','open-test-image',blob);
 const key='arles-documental-prototipo-v1',state=JSON.parse(localStorage.getItem(key));
 state.documents.push({id:'open-test',name:'Prueba apertura.png',folder:state.folders[0].id,type:'PNG',version:'01',status:'Borrador',code:'',shared:[],linkedFolders:[],managed:true,imported:true,versions:[{id:'v1',number:'01',status:'draft',fileName:'Prueba apertura.png',fileId:'open-test-image'}]});localStorage.setItem(key,JSON.stringify(state));
});await page.reload();await page.locator('[data-home-link]').first().waitFor();await page.locator('#all').click();await page.locator('#search').fill('Prueba apertura');
const row=page.locator('[data-doc="open-test"]');await row.waitFor();
await row.dblclick();await page.locator('.arles-image-reader img:not([hidden])').waitFor();assert(await page.locator('#document-view').isVisible());
await page.getByRole('button',{name:'Cerrar visor'}).click();await page.locator('.arles-image-reader').waitFor({state:'detached'});
await row.click();await page.locator('#open-preview').click();await page.locator('.arles-image-reader img:not([hidden])').waitFor();assert(await page.locator('#document-view').isVisible());
await page.getByRole('button',{name:'Cerrar visor'}).click();await page.locator('.arles-image-reader').waitFor({state:'detached'});
await row.focus();await page.keyboard.press('Enter');await page.locator('.arles-image-reader img:not([hidden])').waitFor();assert(await page.locator('#document-view').isVisible());
console.log('PASS double click, preview and Enter open image without leaving library');
}finally{await browser.close();server.close();}



