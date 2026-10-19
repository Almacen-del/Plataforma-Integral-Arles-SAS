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
let wasmRequests=0;page.on('request',request=>{if(request.url().endsWith('/magick.wasm'))wasmRequests++;});
const result=await page.evaluate(async()=>{
 const {decodeImage}=await import('/image-engine.js');
 const psd=new File([await(await fetch('/tmp/image-engine/sample.psd')).blob()],'same.psd');
 const first=await decodeImage(psd),repeat=await decodeImage(new File([psd],'same.psd'));
 const tiff=new File([await(await fetch('/tmp/image-engine/sample.tiff')).blob()],'other.tiff');await decodeImage(tiff);
 let invalid=false;try{await decodeImage(new File(['corrupted'],'same.psd'));}catch{invalid=true;}
 const controller=new AbortController();controller.abort();let cancelled=false;try{await decodeImage(psd,{signal:controller.signal});}catch(error){cancelled=error.name==='AbortError';}
 return {reused:first===repeat,invalid,cancelled};
});
assert.deepEqual(result,{reused:true,invalid:true,cancelled:true});assert.equal(wasmRequests,1);console.log('PASS reuse, one WASM load, changed content, cancellation');
}finally{await browser.close();server.close();}

