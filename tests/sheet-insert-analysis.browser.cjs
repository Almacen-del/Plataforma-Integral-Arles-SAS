const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try{
  const p=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/?editor=hojas');await p.locator('.sx-window').waitFor();
  const click=a=>p.locator('[data-sx="'+a+'"]').first().click();
  const go=async r=>{await p.locator('[data-address]').fill(r);await p.locator('[data-address]').press('Enter');};
  const set=async(r,v)=>{await go(r);await p.locator('[data-formula]').fill(v);await p.locator('[data-formula]').press('Enter');};
  const apply=async()=>{await p.locator('[data-io-apply]').click();assert.equal(await p.locator('[data-io-error]').textContent(),'');};
  await click('panel-close');
  for(const [r,v] of Object.entries({A1:'Zona',B1:'Producto',C1:'Ventas',D1:'Costos',E1:'Mes',F1:'Fecha',A2:'Norte',B2:'A',C2:'10',D2:'3',E2:'Enero',F2:"'2026-01-10",A3:'Norte',B3:'A',C3:'20',D3:'5',E3:'Enero',F3:"'2026-01-20",A4:'Norte',B4:'B',C4:'90',D4:'10',E4:'Febrero',F4:"'2026-02-10",A5:'Sur',B5:'A',C5:'40',D5:'8',E5:'Enero',F5:"'2026-01-12"}))await set(r,v);
  await go('A1:F5');await p.locator('[data-sx-tab=insert]').click();await click('io-pivot');
  await p.locator('[data-io=title]').fill('Análisis por zona');await p.locator('[data-io=valueField]').selectOption('2');
  await p.locator('[data-io=operation]').selectOption('average');await p.locator('[data-io=colField]').selectOption('4');
  await p.locator('[data-io-extra=rowFields][value="1"]').check();await p.locator('[data-io=subtotals]').check();
  await p.locator('[data-io-add-measure]').click();await p.locator('[data-io=measureField]').selectOption('3');
  await p.locator('[data-io=measureShowAs]').selectOption('grand');await p.locator('[data-io=tableStyle]').selectOption('blue');
  await p.locator('[data-io-preview]').click();assert.equal(await p.locator('.sx-insert-object').count(),0);assert.ok(await p.locator('[data-io-object-preview] .sx-io-table').count());
  await apply();assert.match(await p.locator('.sx-io-table tr.total').textContent(),/Total general/);assert.match(await p.locator('.sx-io-table tr.subtotal').first().textContent(),/Total Norte/);
  assert.match(await p.locator('.sx-io-table').textContent(),/%/);
  await p.locator('.sx-io-form summary').filter({hasText:'Filtros del informe'}).click();await p.locator('[data-io-add-report]').click();
  await p.locator('[data-io-report-value][value=Norte]').check();await apply();assert.doesNotMatch(await p.locator('.sx-io-table').textContent(),/Sur/);
  await p.locator('.sx-io-form summary').filter({hasText:'Filtros del informe'}).click();await p.locator('[data-io-remove-report]').click();await apply();assert.match(await p.locator('.sx-io-table').textContent(),/Sur/);
  await go('A1:F5');await click('io-chart');await p.locator('[data-io=title]').fill('Ventas y costos');
  await p.locator('[data-io=valueField]').selectOption('2');await p.locator('[data-io-extra=seriesFields][value="3"]').check();
  await p.locator('[data-io=x]').fill('580');await p.locator('[data-io=width]').fill('620');await p.locator('[data-io=height]').fill('380');
  await p.locator('[data-io=showLabels]').check();await p.locator('[data-io=palette]').selectOption('office');
  for(const type of ['columns','stackedColumns','percentColumns','bars','stackedBars','percentBars','line','area','stackedArea','pie','doughnut','radar','combo','histogram','pareto','waterfall','funnel','box','scatter','bubble']){
   await p.locator('[data-io=chartType]').selectOption(type);
   if(['scatter','bubble'].includes(type))await p.locator('[data-io=xField]').selectOption('2');
   if(type==='bubble')await p.locator('[data-io=sizeField]').selectOption('3');
   if(type==='histogram'){await p.locator('[data-io=binMode]').selectOption('count');await p.locator('[data-io=binCount]').fill('3');}
   await apply();assert.equal(await p.locator('.sx-insert-object').last().locator('.sx-io-chart').count(),1,type);
  }
  await p.locator('[data-io=chartType]').selectOption('columns');await apply();
  await set('C2','=D2*10');assert.match(await p.locator('.sx-io-chart').textContent(),/30/);
  await go('A1:F5');await click('io-slicer');await p.locator('[data-io=x]').fill('80');await p.locator('[data-io=y]').fill('520');await p.locator('[data-io=connectionMode]').selectOption('manual');
  assert.equal(await p.locator('[data-io-target]').count(),2);await p.locator('[data-io-target]').first().check();await apply();
  await p.locator('[data-io-filter][data-value=Norte]').click();assert.doesNotMatch(await p.locator('.sx-io-table').textContent(),/Sur/);assert.match(await p.locator('.sx-io-chart').textContent(),/Sur/);
  await p.locator('[data-io-clear]').click();assert.match(await p.locator('.sx-io-table').textContent(),/Sur/);
  await go('A1:F5');await click('io-timeline');await p.locator('[data-io=field]').selectOption('5');await p.locator('[data-io=period]').selectOption('month');await p.locator('[data-io=x]').fill('580');await p.locator('[data-io=y]').fill('520');await apply();
  assert.equal(await p.locator('[data-io-period]').count(),2);await p.locator('[data-io-period]').last().click();assert.doesNotMatch(await p.locator('.sx-io-chart').textContent(),/Sur/);
  await p.locator('[data-io-period]').first().click({modifiers:['Shift']});assert.match(await p.locator('.sx-io-chart').textContent(),/Sur/);
  await p.locator('[data-io-clear]').last().click();
  await click('io-diagram');await p.locator('[data-io=text]').fill('Inicio\nRevisión\nEntrega');await p.locator('[data-io=x]').fill('80');await p.locator('[data-io=y]').fill('850');await apply();
  assert.equal(await p.locator('.sx-io-connector').count(),2);
  await click('io-wordart');await p.locator('[data-io=text]').fill('Arles');await p.locator('[data-io=wordStyle]').selectOption('outline');await p.locator('[data-io=y]').fill('950');await apply();assert.equal(await p.locator('.sx-io-wordart.outline').textContent(),'Arles');
  await click('io-image');await p.locator('[data-io-image]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQWQAAAAASUVORK5CYII=','base64')});
  await p.waitForFunction(()=>document.querySelector('[data-io-error]').textContent==='');
  await p.locator('[data-io=imageFit]').selectOption('cover');await p.locator('[data-io=opacity]').fill('50');await p.locator('[data-io=y]').fill('1250');await apply();
  assert.equal(await p.locator('.sx-io-image').evaluate(n=>n.style.opacity),'0.5');
  const count=await p.locator('.sx-insert-object').count();await click('undo');assert.equal(await p.locator('.sx-insert-object').count(),count-1);await click('redo');assert.equal(await p.locator('.sx-insert-object').count(),count);
  await set('T10','Destino');await click('cell-link');await p.locator('[data-cell-link]').fill('#U12');await click('apply-cell-link');
  await p.locator('[data-sx-cell=T10] [data-sheet-link]').click();assert.equal(await p.locator('[data-address]').inputValue(),'U12');
  await click('cell-link');await p.locator('[data-cell-link]').fill('mailto:equipo@example.com');await click('apply-cell-link');assert.equal(await p.locator('[data-sx-cell=U12] a').getAttribute('href'),'mailto:equipo@example.com');
  await p.locator('[data-cell-link]').fill('javascript:alert(1)');await click('apply-cell-link');assert.equal(await p.locator('[data-sx-cell=U12] a').getAttribute('href'),'mailto:equipo@example.com');
  await go('T10');await click('symbols');assert.ok(await p.locator('[data-sx-symbol]').count()>400);await p.locator('[data-sheet-symbol-search]').fill('U+03A9');assert.equal(await p.locator('[data-sx-symbol]').count(),1);await p.locator('[data-sx-symbol]').click();assert.match(await p.locator('[data-sx-cell=T10]').textContent(),/DestinoΩ/);
  await set('T11','=1+2');await p.locator('[data-sx-symbol]').click();assert.equal(await p.locator('[data-formula]').inputValue(),'=1+2');
  await click('save');await click('close');await p.evaluate(async()=>(await import('/sheet-workspace.js')).openSheetWorkspace());
  assert.equal(await p.locator('.sx-insert-object').count(),count);await set('D2','4');assert.match(await p.locator('.sx-io-chart').textContent(),/40/);
  await p.locator('[data-sx-tab=insert]').click();await click('panel-close');await p.screenshot({path:'tmp/sheet-insert-analysis.png'});
  assert.deepEqual(errors,[]);console.log('PASS Insertar avanzado: 20 gráficos, multiseries, promedios, subtotales, porcentajes, conexiones, períodos, diseños, recálculo, undo/redo y guardado');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
