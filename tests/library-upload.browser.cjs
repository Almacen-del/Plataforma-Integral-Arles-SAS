const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{const base=path.resolve('tmp/upload-fixture/Carpeta'),browser=await chromium.launch();try{
 await fs.mkdir(path.join(base,'Sub'),{recursive:true});await fs.writeFile(path.join(base,'uno.txt'),'original uno');await fs.writeFile(path.join(base,'Sub','dos.txt'),'original dos');
 const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173');await page.getByRole('button',{name:'Explorar la biblioteca'}).click();
 async function audit(){const gate=page.locator('dialog[open]').filter({hasText:'Registrar cambio'});await gate.locator('[name=actor]').fill('Responsable de prueba');await gate.locator('[name=role]').fill('Prueba local');await gate.locator('[name=reason]').fill('Verificar importación local');await gate.getByRole('button',{name:'Confirmar y registrar'}).click();}
 await page.locator('[data-library-folder-input]').setInputFiles(base);await page.locator('#library-upload-dialog').waitFor();assert.match(await page.locator('[data-upload-preview]').textContent(),/2 archivos/);await page.locator('[data-upload-start]').click();await audit();await page.locator('[data-upload-status]').filter({hasText:'Carga terminada'}).waitFor();
 const imported=await page.evaluate(async()=>{const s=JSON.parse(localStorage.getItem('arles-documental-prototipo-v1'));const {blobOperation}=await import('/document-control.js');return {names:s.folders.map(f=>f.name),files:await Promise.all(s.documents.map(async d=>({name:d.name,body:await (await blobOperation('get',d.versions[0].fileId)).text()})))};});assert.ok(imported.names.includes('Sub'));assert.deepEqual(imported.files.map(f=>f.body).sort(),['original dos','original uno']);
 await page.locator('[data-upload-close]').click();
 // OS-style file drop, including an empty file.
 await page.locator('.explorer').evaluate(el=>{const data=new DataTransfer();data.items.add(new File([],'vacio.txt'));el.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:data}));});
 await page.locator('[data-upload-start]').click();await audit();await page.locator('[data-upload-status]').filter({hasText:'Carga terminada'}).waitFor();await page.locator('[data-upload-close]').click();
 // A failure on the second binary must not publish partial metadata.
 await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(value instanceof File&&value.name==='bad.txt')throw Error('Fallo de almacenamiento de prueba');return put.call(this,value,...args);};});
 await page.locator('[data-library-file-input]').setInputFiles([{name:'good.txt',mimeType:'text/plain',buffer:Buffer.from('first')},{name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('second')}]);await page.locator('[data-upload-start]').click();await audit();await page.locator('[data-upload-status]').filter({hasText:'Fallo de almacenamiento'}).waitFor();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('arles-documental-prototipo-v1')));assert.equal(state.documents.length,3);assert.ok(!state.documents.some(d=>d.name==='good.txt'));assert.deepEqual(errors,[]);
 console.log('PASS folder picker, nested file byte identity, native file drop, empty file, audit and atomic metadata on binary failure.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
