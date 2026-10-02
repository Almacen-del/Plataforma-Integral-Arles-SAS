const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{for(const edited of [false,true]){
 const context=await browser.newContext(),page=await context.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');await page.getByRole('button',{name:'Explorar la biblioteca'}).click();
 const result=await page.evaluate(async edited=>{
  const W=await import('/public/vendor/docx-9.6.1.js'),{importWord,openLibraryWord}=await import('/native-docx-import.js'),{cleanDocumentHTML}=await import('/native-document.js'),{blobOperation}=await import('/document-control.js');
  const word=new W.Document({sections:[{children:[new W.Paragraph({children:[new W.TextRun('Texto original'),new W.FootnoteReferenceRun(1)]})]}],footnotes:{1:{children:[new W.Paragraph('Nota original recuperada')]}}}),file=await W.Packer.toBlob(word),source=await importWord(new File([file],'fixture.docx'));
  const root=document.createElement('div');root.innerHTML=cleanDocumentHTML(source.html);root.querySelectorAll('[data-ref-note],[data-ref-generated]').forEach(n=>n.remove());
  const baseline={html:root.innerHTML,page:source.page,sourceHeader:cleanDocumentHTML(source.sourceHeader),sourceFooter:cleanDocumentHTML(source.sourceFooter),identity:{enabled:false},comments:source.comments};
  const previous={...structuredClone(baseline),html:baseline.html+(edited?'<p>Corrección anterior protegida</p>':''),revision:edited?2:1,sourceFormatVersion:6,sourceBaseline:baseline};
  if(edited)previous.page={...previous.page,left:31};
  const state=JSON.parse(localStorage.getItem('arles-documental-prototipo-v1')),doc={id:'upgrade-doc',name:'Prueba de actualización',folder:state.folders[0].id,status:'Borrador',version:'01',versions:[{id:'v1',fileId:'upgrade-original',fileName:'fixture.docx'}]};state.documents.push(doc);localStorage.setItem('arles-documental-prototipo-v1',JSON.stringify(state));
  const draft={kind:'library-docx-v1',fileId:'upgrade-original',document:{...doc,editorContent:previous,editorHistory:[]}};await blobOperation('put','editor-docx:upgrade-original',draft);await blobOperation('put','upgrade-original',file);await openLibraryWord(doc,doc.versions[0],file);
  const paper=document.querySelector('#nd-paper');return {notes:paper.querySelectorAll('[data-ref-note]').length,text:paper.textContent,warnings:document.querySelector('.nd-window').textContent,left:paper.style.paddingLeft,stored:JSON.stringify(await blobOperation('get','editor-docx:upgrade-original'))===JSON.stringify(draft)};
 },edited);
 assert.equal(result.stored,true,'Opening must not overwrite the saved draft');
 if(edited){assert.ok(result.text.includes('Corrección anterior protegida'));assert.equal(result.left,'31mm');assert.ok(result.warnings.includes('conserva tus cambios anteriores'));}
 else assert.equal(result.notes,1,'Unchanged old draft must recover newly supported original objects');
 await context.close();
}console.log('PASS parser upgrade refreshes unchanged drafts, preserves edited text/layout, and never overwrites storage on open');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
