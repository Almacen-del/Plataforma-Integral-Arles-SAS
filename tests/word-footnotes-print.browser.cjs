const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{const p=await browser.newPage();await p.goto(process.env.TEST_URL||'http://127.0.0.1:4173');
 for(const [columns,long,blocked] of [[1,true,false],[2,false,false],[2,true,true]]){
 const result=await p.evaluate(async ({columns,long})=>{
  const {buildNativePrintHTML}=await import('/native-document.js'),{renderPrintFrame}=await import('/native-print.js');
  const root=document.createElement('div');
  const add=(text,kind,n)=>{const p=document.createElement('p');p.textContent=text;const note=document.createElement('sup');note.dataset.refNote=JSON.stringify({kind,text:kind==='foot'?'Nota '+n+': '+('Texto de comprobación sin pérdidas. '.repeat(n===3&&long?80:2)):'Nota final separada.'});note.textContent=String(n);p.append(note);root.append(p);};
  add('Primera llamada','foot',1);add('Referencia final','end',2);for(let i=0;i<35;i++){const p=document.createElement('p');p.textContent='Párrafo '+i+'. '+('Contenido principal para comprobar la reserva de espacio. '.repeat(8));root.append(p);}add('Última llamada','foot',3);
  const html=root.innerHTML,frame=document.createElement('iframe');frame.style='width:1200px;height:1000px';document.body.append(frame);
  const print=await buildNativePrintHTML({name:'Notas de prueba',editorContent:{}},html,{size:'A4',top:20,bottom:20,left:20,right:20,columns},{enabled:false});let composed;try{composed=await renderPrintFrame(frame,print);}catch(e){throw Error(e.message+' '+JSON.stringify([...frame.contentDocument.querySelectorAll('.pagedjs_footnote_area [data-print-note]')].map(n=>({key:n.dataset.printNote,len:n.textContent.length,text:n.textContent.slice(0,40)}))));}const d=frame.contentDocument;
  const notes=[...d.querySelectorAll('.pagedjs_footnote_area [data-print-note]')];
  const calls=[...d.querySelectorAll('.pagedjs_page_content [data-footnote-call]')];
  const rows=calls.map(call=>{const note=d.querySelector('.pagedjs_footnote_area [data-ref="'+call.dataset.ref+'"]'),page=call.closest('.pagedjs_page');return {found:!!note,samePage:note?.closest('.pagedjs_page')===page,below:note?.getBoundingClientRect().top>=call.getBoundingClientRect().bottom,number:frame.contentWindow.getComputedStyle(call,'::after').content};});
  const text=notes.map(n=>n.textContent).join(''),expected=[...root.querySelectorAll('[data-ref-note]')].map(n=>JSON.parse(n.dataset.refNote)).filter(n=>n.kind==='foot').map(n=>n.text).join('');
  const answer={columns,pages:composed.pages,rows,complete:text===expected,endCount:(d.querySelector('.pagedjs_pages').textContent.match(/Nota final separada/g)||[]).length,unchanged:html===root.innerHTML};frame.remove();return answer;
 },{columns,long}).catch(e=>{if(blocked&&e.message.includes("no conservó el texto completo de una nota"))return {blocked:true};throw e;});
 if(blocked){assert.equal(result.blocked,true);console.log("PASS oversized two-column note blocks printing instead of losing text");continue;}
 assert.equal(result.rows.length,2);assert.ok(result.rows.every(r=>r.found&&r.samePage&&r.below),JSON.stringify(result));assert.deepEqual(result.rows.map(r=>r.number),['"1"','"3"']);assert.equal(result.complete,true);assert.equal(result.endCount,1);assert.equal(result.unchanged,true);console.log('PASS',JSON.stringify(result));
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
