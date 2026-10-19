import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),server=http.createServer(async(req,res)=>{try{const route=new URL(req.url,'http://localhost').pathname;const file=path.join(root,route==='/'?'index.html':route);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(4196,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto('http://127.0.0.1:4196/');
for(const format of ['png','jpeg','tiff','psd','bmp','webp','avif','tga','qoi','jp2','exr']){
 const result=await page.evaluate(async format=>{const {decodeImage}=await import('/image-engine.js');const blob=await(await fetch('/tmp/image-engine/sample.'+format)).blob();const image=await decodeImage(new File([blob],'sample.'+format));const bitmap=await createImageBitmap(image.blob);const c=new OffscreenCanvas(1,1),ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0,1,1);return {width:image.width,height:image.height,pixel:[...ctx.getImageData(0,0,1,1).data]};},format);
 assert.equal(result.width,48);assert.equal(result.height,48);assert(result.pixel[0]>200&&result.pixel[1]<30,JSON.stringify(result));console.log('PASS',format,result.pixel);
}
for(const format of ['heic','dng','cr3']){const result=await page.evaluate(async format=>{const blob=await(await fetch('/tmp/image-engine/sample.'+format)).blob();const image=await(await import('/image-engine.js')).decodeImage(new File([blob],'sample.'+format));return {width:image.width,height:image.height};},format);assert(result.width>100);console.log('PASS real sample',format,result);}
const cr3=await page.evaluate(async()=>{const blob=await(await fetch('/tmp/image-engine/full.cr3')).blob();const result=await(await import('/image-engine.js')).decodeImage(new File([blob],'Canon.CR3'));return {width:result.width,height:result.height,preview:result.preview};});assert.deepEqual(cr3,{width:1620,height:1080,preview:true});console.log('PASS Canon M50 CRAW preview');
await page.evaluate(async()=>{const blob=await(await fetch('/tmp/image-engine/sample.psd')).blob();await(await import('/image-library-reader.js')).openLibraryImageReader({name:'Prueba PSD'},{fileName:'sample.psd'},{file:blob});});
await page.locator('.arles-image-reader img:not([hidden])').waitFor();await page.getByRole('button',{name:'Girar'}).click();await page.getByRole('button',{name:'Acercar',exact:true}).click();await page.screenshot({path:'tmp/image-engine/viewer.png'});
await page.getByRole('button',{name:'Cerrar visor'}).click();await page.locator('.arles-image-reader').waitFor({state:'detached'});
await page.evaluate(async()=>{const {blobOperation}=await import('/document-control.js');const blob=await(await fetch('/tmp/image-engine/sample.png')).blob();await blobOperation('put','image-test',blob);await(await import('/document-editor.js')).openDocumentEditor({id:'image-doc',name:'Imagen desde biblioteca',versions:[{id:'v1',status:'current',fileId:'image-test',fileName:'original.png'}]});});
await page.locator('.arles-image-reader img:not([hidden])').waitFor();
const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar original'}).click();const download=await downloadPromise;assert.deepEqual(await readFile(await download.path()),await readFile('tmp/image-engine/sample.png'));console.log('PASS library route and original bytes');
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/image-engine/mobile.png'});await page.getByRole('button',{name:'Cerrar visor'}).click();await page.locator('.arles-image-reader').waitFor({state:'detached'});
const failure=await page.evaluate(async()=>{try{await(await import('/image-engine.js')).decodeImage(new File(['bad'],'bad.psd'));return false;}catch{return true;}});assert(failure);console.log('PASS corrupt file, controls and close');
}finally{await browser.close();server.close();}

