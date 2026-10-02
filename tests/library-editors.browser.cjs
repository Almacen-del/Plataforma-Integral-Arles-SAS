const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.getByRole('button',{name:'Explorar la biblioteca'}).click();
 await page.evaluate(async()=>{
  const {loadXlsxReader}=await import('/sheet-xlsx.js');await loadXlsxReader();const {blobOperation}=await import('/document-control.js');const {newBook}=await import('/sheet-model.js');
  const standalone=newBook();standalone.name='Libro independiente';localStorage.setItem('arles-sheet-design-v1',JSON.stringify(standalone));
  const state=JSON.parse(localStorage.getItem('arles-documental-prototipo-v1'));
  for(const n of [1,2]){const wb=new ExcelJS.Workbook(),s=wb.addWorksheet('Datos');s.getCell('A1').value=n*10;s.getCell('B1').value={formula:'A1*2',result:n*20};s.getCell('A2').value='Texto original';s.getCell('A2').font={bold:true};const file=new File([await wb.xlsx.writeBuffer()],'Prueba'+n+'.xlsx');await blobOperation('put','qa-file-'+n,file);state.documents.push({id:'qa-doc-'+n,name:file.name,folder:state.folders[0].id,type:'XLSX',code:'',version:'01',status:'Borrador',shared:[],linkedFolders:[],managed:true,versions:[{id:'v1',number:'01',status:'draft',fileId:'qa-file-'+n,fileName:file.name}]});}
  localStorage.setItem('arles-documental-prototipo-v1',JSON.stringify(state));document.dispatchEvent(new Event('library-updated'));
 });
 const open=async n=>{await page.evaluate(async n=>{await (await import('/native-document.js')).openNativeDocument({id:'qa-doc-'+n});},n);await page.locator('.sx-window[open]').waitFor();};
 const cell=ref=>page.locator('[data-sx-cell='+ref+'] .sx-cell-text');
 await open(1);assert.equal(await cell('A1').textContent(),'10');assert.equal(await page.locator('[data-sx=xlsx-open]').count(),0);
 await page.locator('[data-address]').fill('A1');await page.locator('[data-address]').press('Enter');await page.locator('[data-formula]').fill('35');await page.locator('[data-formula]').press('Enter');assert.equal(await cell('B1').textContent(),'70');
 await page.locator('[data-sx=close]').click();await page.locator('.sx-window[open]').waitFor({state:'hidden'});
 await open(2);assert.equal(await cell('A1').textContent(),'20');await page.locator('[data-sx=close]').click();await open(1);assert.equal(await cell('A1').textContent(),'35');
 const download=page.waitForEvent('download');await page.locator('[data-sx=xlsx-original]').click();const d=await download;const bytes=await fs.readFile(await d.path());const original=await page.evaluate(async()=>Array.from(new Uint8Array(await (await (await import('/document-control.js')).blobOperation('get','qa-file-1')).arrayBuffer())));assert.deepEqual(bytes,Buffer.from(original));
 await page.locator('[data-sx=close]').click();await page.locator('#open-sheet-workspace').click();assert.equal(await page.locator('[data-book-name]').inputValue(),'Libro independiente');await page.locator('[data-sx=close]').click();
 await page.reload();await page.locator('#nav-doc-control').waitFor({state:'attached'});await open(1);assert.equal(await cell('A1').textContent(),'35');await page.locator('[data-sx=close]').click();
 // Damaged stored draft must not silently fall back to the original or overwrite it.
 const blocked=await page.evaluate(async()=>{const m=await import('/document-control.js');await m.blobOperation('put','editor-xlsx:qa-file-2',{broken:true});try{await m.previewFile('qa-doc-2|v1');return false;}catch(e){return e.message.includes('sin sobrescribirlo');}});assert.equal(blocked,true);assert.equal(await page.locator('.sx-window[open]').count(),0);
 // A failed save keeps the workbook open and preserves the previous draft.
 await open(1);await page.locator('[data-address]').fill('A1');await page.locator('[data-address]').press('Enter');await page.locator('[data-formula]').fill('99');await page.locator('[data-formula]').press('Enter');
 await page.evaluate(()=>{window.qaOriginalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(v,...args){if(v?.kind==='library-xlsx-v1')throw Error('Fallo de prueba');return window.qaOriginalPut.call(this,v,...args);};});
 await page.locator('[data-sx=close]').click();await page.locator('[data-sx-message]').filter({hasText:'No fue posible guardar'}).waitFor();assert.equal(await page.locator('.sx-window[open]').count(),1);
 assert.equal(await page.evaluate(async()=>(await(await import('/document-control.js')).blobOperation('get','editor-xlsx:qa-file-1')).book.sheets[0].cells.A1.raw),'35');
 await page.evaluate(()=>{IDBObjectStore.prototype.put=window.qaOriginalPut;});await page.locator('[data-sx=close]').click();await page.locator('.sx-window[open]').waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);console.log('PASS library XLSX routing, formulas, save on close, reload, isolated drafts, standalone preservation, immutable original download and corrupt-draft protection.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});

