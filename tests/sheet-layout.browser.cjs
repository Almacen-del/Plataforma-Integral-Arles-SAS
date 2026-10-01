const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1800,height:1100}}),p=await context.newPage(),errors=[];
  await context.addInitScript(()=>{window.print=()=>{window.__printed=true;};});
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/?editor=hojas');await p.locator('.sx-window').waitFor();
  const click=a=>p.locator('[data-sx="'+a+'"]').first().click(),go=async r=>{await p.locator('[data-address]').fill(r);await p.locator('[data-address]').press('Enter');};
  await click('close');
  await p.evaluate(async()=>{
   const {newBook,address}=await import('/sheet-model.js'),b=newBook(),s=b.sheets[0];b.name='Prueba de disposición';s.name='Datos';s.printRanges=['A1:H60'];s.printRange='A1:H60';s.rowHeights={};s.columnWidths={};
   for(let r=0;r<60;r++){s.rowHeights[r]=24;for(let c=0;c<8;c++)s.cells[address(r,c)]={raw:r===0?['Registro','Cantidad','Doble','Detalle','Zona','Lote','Estado','Control'][c]:c===0?'R'+String(r+1).padStart(3,'0'):c===1?String(r+1):c===2?'=B'+(r+1)+'*2':'Dato '+(r+1)+'-'+c};}
   for(let c=0;c<8;c++)s.columnWidths[c]=100;
   s.cells.A1.fill='#ffeeaa';s.cells.A1.bold=true;s.cells.A1.font='Georgia';s.cells.D3.raw='Combinación completa';delete s.cells.E3;s.merges=['D3:E3'];s.cells.D3.border={bottom:{color:'#21804a',width:3,style:'double'}};
   s.cells.D5.raw='Un texto extenso que debe quedar dentro de la altura elegida para esta fila sin desplazar las demás filas';s.cells.D5.wrap=true;
   s.insertObjects=[{id:'text-one',kind:'text',title:'Objeto uno',text:'Texto flotante',x:80,y:120,width:220,height:85,fontSize:18,color:'#21804a'},{id:'text-two',kind:'text',title:'Objeto dos',text:'Segundo objeto',x:420,y:250,width:220,height:85,fontSize:18,color:'#21804a'}];
   localStorage.setItem('arles-sheet-design-v1',JSON.stringify(b));await (await import('/sheet-workspace.js')).openSheetWorkspace();
  });
  await click('panel-close');await p.locator('[data-sx-tab=layout]').click();
  for(const a of ['layout-themes','layout-colors','layout-fonts','layout-effects','layout-margins','layout-orientation','layout-size','layout-areas','layout-breaks','layout-background','layout-titles','layout-selection','layout-align','layout-group','layout-rotate'])assert.equal(await p.locator('[data-sx="'+a+'"]').count(),1,a);
  await click('page-settings');await p.locator('[data-layout=orientation]').selectOption('landscape');await p.locator('[data-layout=scale]').fill('100');
  await p.locator('[data-layout-section=margins] summary').click();await p.locator('[data-page-margin]').fill('20');
  await p.locator('[data-layout=margin-left]').fill('18');
  await p.locator('[data-layout-section=titles] summary').click();await p.locator('[data-layout=repeatRows]').fill('1:1');await p.locator('[data-layout=repeatColumns]').fill('A:A');await p.locator('.sx-layout-form [data-layout=printGrid]').check();await p.locator('.sx-layout-form [data-layout=printHeadings]').check();await p.locator('[data-layout=firstPage]').fill('5');
  await p.locator('[data-layout-section=footer] summary').click();await p.locator('[data-layout=header]').fill('{libro} · {hoja}');await p.locator('[data-layout=footer]').fill('Página {pagina} de {paginas}');await click('apply-page-settings');assert.equal(await p.locator('[data-layout-error]').textContent(),'');
  await go('A31');await click('layout-breaks');await click('layout-insert-break');assert.equal(await p.locator('[data-sx-cell=A31]').evaluate(n=>n.classList.contains('sx-page-rowbreak')),true);
  const stored=async()=>{await click('save');return p.evaluate(()=>JSON.parse(localStorage.getItem('arles-sheet-design-v1')));};
  let book=await stored();assert.equal(book.sheets[0].page.margins.left,18);assert.equal(book.sheets[0].cells.C2.raw,'=B2*2');
  let plan=await p.evaluate(async s=>(await import('/sheet-layout-model.js')).printPlan(s),book.sheets[0]);assert.ok(plan.pages.length>1);assert.ok(plan.pages.every(pg=>pg.allRows[0]===0&&pg.allCols[0]===0));
  await click('print-preview');const frame=p.frameLocator('.sx-layout-preview iframe');await frame.locator('.sp-paper').first().waitFor();assert.equal(await frame.locator('.sp-paper').count(),plan.pages.length);
  assert.equal(await frame.locator('.sp-paper>header').first().textContent(),'Prueba de disposición · Datos');assert.equal(await frame.locator('.sp-paper>footer').first().textContent(),'Página 5 de '+plan.pages.length);
  assert.equal(await frame.locator('.sp-paper>header').count(),plan.pages.length);assert.equal(await frame.locator('.sp-grid tbody tr:first-child').count(),plan.pages.length);
  const geometry=await frame.locator('.sp-paper').evaluateAll(nodes=>nodes.map(n=>({paper:[n.offsetWidth,n.offsetHeight],clip:n.querySelector('.sp-clip').getBoundingClientRect().height,content:n.querySelector('.sp-content').getBoundingClientRect().height,table:n.querySelector('.sp-grid').getBoundingClientRect().height})));
  for(const g of geometry)assert.ok(Math.abs(g.table-g.content)<1,'La tabla debe conservar las alturas del plan: '+JSON.stringify(g));
  await p.screenshot({path:'tmp/sheet-layout-preview.png'});
  await p.locator('[data-layout-close]').click();
  const popupEvent=p.waitForEvent('popup');await click('print-sheet');const popup=await popupEvent;await popup.waitForFunction(()=>window.__printed);assert.equal(await popup.locator('.sp-paper').count(),plan.pages.length);
  fs.mkdirSync('tmp/pdfs',{recursive:true});await popup.pdf({path:'tmp/pdfs/sheet-layout-qa.pdf',preferCSSPageSize:true,printBackground:true});fs.writeFileSync('tmp/pdfs/sheet-layout-plan.json',JSON.stringify({pages:plan.pages.length,paper:plan.paper,labels:plan.pages.map(pg=>pg.number)}));await popup.close();
  // Ajustar ignora saltos; columnas y títulos continúan completos.
  await p.locator('[data-layout-direct=fitWidth]').selectOption('1');await p.locator('[data-layout-direct=fitHeight]').selectOption('1');assert.equal(await p.locator('[data-layout-direct=scale]').isDisabled(),true);
  await click('print-preview');await frame.locator('.sp-paper').waitFor();assert.equal(await frame.locator('.sp-paper').count(),1);assert.match(await p.locator('.sx-layout-preview>p').textContent(),/ignora los saltos/);await p.locator('[data-layout-close]').click();
  // Fondo guardado, separado de la impresión.
  await click('layout-background');await p.locator('[data-layout-background]').setInputFiles({name:'fondo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQWQAAAAASUVORK5CYII=','base64')});await p.waitForFunction(()=>document.querySelector('.sx-grid-scroll').style.backgroundImage.includes('data:image'));
  await click('print-preview');await frame.locator('.sp-paper').waitFor();assert.equal(await frame.locator('img').count(),0);await p.locator('[data-layout-close]').click();
  // Tema: vínculo explícito, formatos manuales conservados y persistencia.
  await go('B1');await click('layout-colors');await click('layout-theme-fill');await click('layout-theme-font');await p.locator('[data-layout-theme-preset=office]').click();assert.equal(await p.locator('[data-sx-cell=B1]').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(68, 114, 196)');assert.equal(await p.locator('[data-sx-cell=A1]').evaluate(n=>n.style.fontFamily),'Georgia');assert.equal(await p.locator('[data-sx-cell=A1]').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 238, 170)');
  await p.locator('[data-layout=themeName]').fill('Tema de prueba');await click('layout-save-theme');
  await p.locator('[data-sx-tab=home]').click();await click('style-good');assert.equal(await p.locator('[data-sx-cell=B1]').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(198, 239, 206)');await p.locator('[data-sx-tab=layout]').click();
  // Organización, grupo coherente con teclado, visibilidad y transformaciones.
  await click('layout-selection');await p.locator('[data-layout-object=text-one]').check();await p.locator('[data-layout-object=text-two]').check();await p.locator('[data-layout-organize=left]').click();book=await stored();assert.equal(book.sheets[0].insertObjects[0].x,book.sheets[0].insertObjects[1].x);
  await p.locator('[data-layout-organize=group]').click();const beforeMove=await p.locator('[data-io-id=text-two]').evaluate(n=>parseFloat(n.style.left));await p.locator('[data-io-id=text-one] [data-io-drag]').press('ArrowRight');assert.equal(await p.locator('[data-io-id=text-two]').evaluate(n=>parseFloat(n.style.left)),beforeMove+1);
  await p.locator('[data-layout-organize=rotate-right]').click();assert.match(await p.locator('[data-io-id=text-one]').getAttribute('style'),/rotate\(90deg\)/);await p.locator('[data-layout-organize=flip-x]').click();assert.match(await p.locator('[data-io-id=text-one] .sx-io-body').getAttribute('style'),/scale\(-1,1\)/);
  await p.locator('[data-layout-visibility=text-two]').click();assert.equal(await p.locator('[data-io-id=text-two]').count(),0);await click('undo');assert.equal(await p.locator('[data-io-id=text-two]').count(),1);
  // Dos áreas sin superposición; cada una empieza en página independiente.
  await click('layout-areas');await p.locator('[data-layout-areas]').fill('A1:E20\nF1:H20');await click('layout-save-areas');assert.equal(await p.locator('[data-layout-error]').textContent(),'');await click('print-preview');await frame.locator('.sp-paper').first().waitFor();assert.equal(await frame.locator('.sp-paper').count(),2);await p.locator('[data-layout-close]').click();
  await p.locator('[data-layout-areas]').fill('A1:C20\nB2:D20');await click('layout-save-areas');assert.match(await p.locator('[data-layout-error]').textContent(),/superpon/);
  await click('layout-areas');await p.locator('[data-layout-areas]').fill('A1:H60');await click('layout-save-areas');await click('layout-breaks');await click('layout-reset-breaks');
  await p.locator('[data-layout-direct=viewGrid]').uncheck();await p.locator('[data-layout-direct=viewHeadings]').uncheck();assert.equal(await p.locator('.sx-grid thead').isVisible(),false);assert.equal(await p.locator('.sx-grid').evaluate(n=>n.classList.contains('sx-no-grid')),true);
  book=await stored();assert.equal(book.customThemes.length,1);assert.ok(book.sheets[0].background);assert.equal(book.sheets[0].cells.C2.raw,'=B2*2');assert.deepEqual(book.sheets[0].pageBreaks,{rows:[],columns:[]});
  await click('close');await p.evaluate(async()=>(await import('/sheet-workspace.js')).openSheetWorkspace());await click('panel-close');await p.locator('[data-sx-tab=layout]').click();assert.equal(await p.locator('[data-sx-cell=C2]').textContent(),'4');assert.equal(await p.locator('.sx-grid thead').isVisible(),false);assert.equal(await p.locator('.sx-insert-object').count(),2);
  await p.screenshot({path:'tmp/sheet-layout-final.png'});
  // Una combinación conserva su valor al ocultar la fila y columna del ancla.
  await click('close');await p.evaluate(async()=>{const {newBook}=await import('/sheet-model.js'),b=newBook(),s=b.sheets[0];s.cells={A1:{raw:'Combinación con ancla oculta'},C4:{raw:'Final'}};s.merges=['A1:B2'];s.hiddenRows=[0];s.hiddenColumns=[0];s.printRange='A1:C4';localStorage.setItem('arles-sheet-design-v1',JSON.stringify(b));await (await import('/sheet-workspace.js')).openSheetWorkspace();});
  await p.locator('[data-sx-tab=layout]').click();await click('print-preview');await frame.locator('.sp-paper').waitFor();assert.match(await frame.locator('.sp-grid').textContent(),/Combinación con ancla oculta/);await p.locator('[data-layout-close]').click();assert.deepEqual(errors,[]);
  console.log('PASS Disposición de página: papel, márgenes, títulos, saltos, vista previa/PDF, ajuste, áreas, fondo, tema, organización, Deshacer y guardado');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
