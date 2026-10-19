import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.ARLES_TEST_URL||'http://127.0.0.1:4187';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('requestfailed',request=>failed.push(request.url()));
 if(process.env.ARLES_TEST_COOKIE_FILE){const headers=await readFile(process.env.ARLES_TEST_COOKIE_FILE,'utf8');await context.addCookies([...headers.matchAll(/^set-cookie:\s*([^=;]+)=([^;]*)/gmi)].map(m=>({name:m[1],value:m[2],url:base})));}
 await page.goto(base+'/?editor=hojas',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Explorar la biblioteca',exact:true}).click();
 for(const id of ['new-text-document','new-text-example','open-sheet-workspace','open-pdf-workspace'])assert.equal(await page.locator('#'+id).count(),0,id);
 for(const id of ['new-word-office','new-excel-office','new-powerpoint-office'])assert.equal(await page.locator('#'+id).count(),1,id);
 assert.equal(await page.locator('.nd-window,.dw-window,.sx-window,.pdf-window').count(),0);
 const reader=await page.evaluate(async()=>{
  const {loadXlsxReader}=await import('/xlsx-reader.js');await loadXlsxReader();
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Historial');sheet.addRows([['Versión','Fecha de actualización','Razón del cambio'],[2,'05/10/2026','Contenido conservado']]);sheet.getCell('D2').value={formula:'1+2',result:3};
  const file=new File([await book.xlsx.writeBuffer()],'consulta.xlsx');
  const {readOriginalHistory}=await import('/document-source-history.js'),{extractDocumentText}=await import('/assistant-documents.js');
  const history=await readOriginalHistory(file,file.name),text=await extractDocumentText(file,file.name);
  const zip=new JSZip();zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Texto conservado de Word</w:t></w:r></w:p></w:body></w:document>');
  const word=await extractDocumentText(new Blob([await zip.generateAsync({type:'uint8array'})]),'consulta.docx');
  const {ocrImageSize}=await import('/pdf-text-recognition.js');return {history,text,word,ocr:ocrImageSize(600,800)};
 });
 assert.equal(reader.history[0].number,'2');assert.equal(reader.history[0].reason,'Contenido conservado');assert.match(JSON.stringify(reader.text),/D2: 3/);assert.match(reader.word[0].text,/Texto conservado de Word/);assert.ok(reader.ocr.width>0);
 // The dashboard groups this navigation button inside its application drawer.
 // Invoke its existing handler to inspect the document-control view directly.
 await page.locator('#nav-doc-control').evaluate(button=>button.click());assert.equal(await page.locator('[data-workspace]').count(),0);
 await page.goto(base+'/?editor=pdf',{waitUntil:'networkidle'});assert.equal(await page.locator('.pdf-window').count(),0);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const removed=['native-document.js','native-docx-import.js','native-docx.js','document-workspace.js','document-workspace.css','sheet-workspace.js','sheet-workspace.css','sheet-model.js','sheet-xlsx.js','pdf-workspace.js','pdf-workspace.css','pdf-model.js','editor-policy.js','demo-personalizacion.html'];
 for(const file of removed){const response=await context.request.get(base+'/'+file);assert.equal(response.status(),404,file);}
 await page.getByRole('button',{name:'Explorar la biblioteca',exact:true}).click();await mkdir('tmp',{recursive:true});await page.screenshot({path:'tmp/legacy-editors-removed.png',fullPage:true});
 await writeFile('tmp/legacy-removal-browser-verification.json',JSON.stringify({at:new Date().toISOString(),base,oldButtonsRemoved:true,oldEditorRequests:removed.length,modernCreationButtons:true,historyAndAIReaders:true,ocrReader:true,errors},null,2));
 console.log('Verificado: motores y accesos antiguos ausentes; creación Word/Excel/PowerPoint, lectura de historial, IA y OCR conservadas.');
}finally{await browser.close();}
