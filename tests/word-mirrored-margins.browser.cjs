const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');
 const bytes=await fs.readFile('output/word-corpus-50/originales/30.docx');
 const result=await page.evaluate(async b64=>{
  const {importWord}=await import('/native-docx-import.js'),{buildNativePrintHTML}=await import('/native-document.js'),{renderPrintFrame}=await import('/native-print.js');
  const source=await importWord(new File([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],'30.docx'));
  const html=await buildNativePrintHTML({name:'Prueba de encuadernación',editorContent:source},source.html,source.page,{enabled:false});
  const frame=document.createElement('iframe');frame.style='width:1000px;height:1000px';document.body.append(frame);await renderPrintFrame(frame,html);
  return {page:source.page,areas:[...frame.contentDocument.querySelectorAll('.pagedjs_page')].map(p=>{const paper=p.querySelector('.pagedjs_pagebox').getBoundingClientRect(),area=p.querySelector('.pagedjs_area').getBoundingClientRect();return {left:(area.left-paper.left)*25.4/96,right:(paper.right-area.right)*25.4/96};})};
 },bytes.toString('base64'));
 assert.equal(result.page.mirror,true);assert.equal(result.areas.length,2);
 for(const [i,a] of result.areas.entries()){
  const inside=result.page.left+result.page.gutter,outside=result.page.right;
  assert.ok(Math.abs(a.left-(i%2?outside:inside))<.15,JSON.stringify(a));
  assert.ok(Math.abs(a.right-(i%2?inside:outside))<.15,JSON.stringify(a));
 }
 console.log('PASS actual PDF composition alternates inside gutter and outside margins on both pages');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
