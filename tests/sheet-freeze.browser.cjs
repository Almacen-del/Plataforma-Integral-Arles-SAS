const {chromium}=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch();try{
 const p=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 const cells={A1:{raw:'12'},B1:{raw:'=A1*2'},C2:{raw:'7'},E4:{raw:'Fuera'}};
 await p.context().addInitScript(cells=>{if(localStorage.getItem('arles-sheet-design-v1'))return;localStorage.setItem('arles-sheet-design-v1',JSON.stringify({version:1,id:'freeze-qa',name:'QA Inmovilizar',active:0,sheets:[
  {id:'main',name:'Datos',cells,rules:[],grid:true,columnWidths:{0:180,1:150,2:130},rowHeights:{0:45,1:35},page:{size:'A4',orientation:'portrait'}},
  {id:'hidden',name:'Ocultos',cells:{B2:{raw:'Visible'},C3:{raw:'=12*2'}},rules:[],grid:true,hiddenRows:[0],hiddenColumns:[0],view:{mode:'normal',zoom:100,freeze:{rows:2,columns:2}},page:{size:'A4',orientation:'portrait'}},
  {id:'merged',name:'Combinadas',cells:{A1:{raw:'Título'},A2:{raw:'8'}},merges:['A1:C1'],rules:[],grid:true,page:{size:'A4',orientation:'portrait'}}
 ]}));},cells);
 await p.goto('http://127.0.0.1:4173/?editor=hojas');await p.locator('.sx-window').waitFor();
 const action=id=>p.locator('[data-sx="'+id+'"]').first().click(),field=id=>p.locator('[data-vw="'+id+'"]'),grid=p.locator('.sx-grid-scroll'),cell=ref=>p.locator('[data-sx-cell="'+ref+'"]'),go=async ref=>{await p.locator('[data-address]').fill(ref);await p.locator('[data-address]').press('Enter');},preview=()=>p.locator('[data-vw-freeze-preview]').textContent(),message=()=>p.locator('[data-sx-message]').textContent();
 const scroll=async(left=600,top=500)=>{await grid.evaluate((n,{left,top})=>n.scrollTo(left,top),{left,top});await p.evaluate(()=>new Promise(requestAnimationFrame));};
 const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<3,`${actual} != ${expected}`);
 async function corner(ref,left,top){const g=await grid.boundingBox(),r=await cell(ref).boundingBox();if(left!==null)near(r.x-g.x,left);if(top!==null)near(r.y-g.y,top);return {g,r};}
 async function state(){await action('save');return p.evaluate(()=>JSON.parse(localStorage.getItem('arles-sheet-design-v1')).sheets[0].view.freeze);}
 async function drag(from,to){const a=await from.boundingBox(),b=await to.boundingBox();await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});await p.mouse.up();}
 await action('panel-close');await p.locator('[data-sx-tab=view]').click();await action('view-freeze');
 // A1 is not a division point. A native command must replace the previous error with success.
 assert.equal(await p.locator('[data-sx=view-freeze-selection]').isEnabled(),false);
 await field('freeze-ref').press('Enter');assert.match(await message(),/Selecciona/);
 await action('view-freeze-column');assert.match(await message(),/Inmovilización aplicada.*Columnas A–A/);assert.deepEqual(await state(),{rows:0,columns:1});
 await scroll();const first=await corner('A20',43,null);assert.ok(first.r.y<first.g.y+100);assert.equal(await cell('B20').evaluate(n=>getComputedStyle(n).position),'relative');
 await action('view-freeze-column');assert.deepEqual(await state(),{rows:0,columns:1});
 await action('freeze');await action('freeze');assert.deepEqual(await state(),{rows:1,columns:0});await scroll();await corner('E1',null,25);assert.equal(await cell('A20').evaluate(n=>getComputedStyle(n).position),'relative');
 await action('view-unfreeze');await scroll(0,0);
 // Real drag / Shift selections while the panel remains open feed the entire range.
 const col=n=>p.locator('.sx-grid [data-col="'+n+'"]'),row=n=>p.locator('.sx-grid [data-row="'+n+'"]');
 await col(0).click();assert.equal(await field('freeze-ref').inputValue(),'A1:A100');assert.match(await preview(),/Columnas A–A/);await action('view-freeze-selection');assert.deepEqual(await state(),{rows:0,columns:1});
 await action('view-unfreeze');await scroll(0,0);await drag(col(0),col(2));assert.equal(await field('freeze-ref').inputValue(),'A1:C100');assert.match(await preview(),/Columnas A–C/);assert.doesNotMatch(await preview(),/Filas/);await action('view-freeze-selection');assert.deepEqual(await state(),{rows:0,columns:3});await scroll();await corner('C20',373,null);
 await action('view-unfreeze');await scroll(0,0);await row(0).click();await row(3).click({modifiers:['Shift']});assert.equal(await field('freeze-ref').inputValue(),'A1:Z4');assert.match(await preview(),/Filas 1–4/);assert.doesNotMatch(await preview(),/Columnas/);await action('view-freeze-selection');assert.deepEqual(await state(),{rows:4,columns:0});await scroll();await corner('E4',null,132);
 await action('view-unfreeze');await scroll(0,0);await drag(cell('A1'),cell('C3'));assert.equal(await field('freeze-kind').inputValue(),'range');assert.match(await preview(),/Filas 1–3.*Columnas A–C/);await action('view-freeze-selection');await scroll();await corner('C3',373,105);
 // A division cell keeps Excel's preceding rows/columns; typed ranges stay intact after applying.
 await go('C4');assert.equal(await field('freeze-ref').inputValue(),'C4');assert.equal(await field('freeze-kind').inputValue(),'selection');await action('view-freeze-selection');assert.deepEqual(await state(),{rows:3,columns:2});await scroll();await corner('B3',223,105);
 await field('freeze-ref').fill('A:C');await action('view-freeze-selection');assert.equal(await field('freeze-ref').inputValue(),'A:C');assert.deepEqual(await state(),{rows:0,columns:3});
 await field('freeze-ref').fill('1:4');await field('freeze-ref').press('Enter');assert.deepEqual(await state(),{rows:4,columns:0});
 await field('freeze-ref').fill('A1:B3');await field('freeze-kind').selectOption('range');await action('view-freeze-selection');assert.deepEqual(await state(),{rows:3,columns:2});
 await field('freeze-ref').fill('A:Z');assert.equal(await p.locator('[data-sx=view-freeze-selection]').isEnabled(),false);await field('freeze-ref').press('Enter');assert.match(await message(),/libres/);assert.deepEqual(await state(),{rows:3,columns:2});
 await action('view-freeze-column');assert.match(await message(),/Inmovilización aplicada/);await action('view-freeze-use-selection');assert.equal(await field('freeze-ref').inputValue(),'C4');
 // Measured sticky offsets at zoom and on a narrow viewport, including both axes.
 await field('freeze-ref').fill('A1:B3');await field('freeze-kind').selectOption('range');await action('view-freeze-selection');await action('zoom-in');await action('zoom-in');await scroll();await corner('B3',223*1.2,105*1.2);await action('zoom-reset');
 await p.setViewportSize({width:1100,height:850});await scroll();await corner('B3',223,105);await p.locator('.sx-panel').evaluate(n=>n.scrollTop=0);await p.screenshot({path:'tmp/sheet-freeze-range.png'});
 await action('view-unfreeze');await scroll();assert.equal(await p.locator('.sx-grid .sx-vw-frozen').count(),0);const released=await cell('A1').boundingBox(),g=await grid.boundingBox();assert.ok(released.x<g.x&&released.y<g.y);await action('undo');await scroll();await corner('B3',223,105);await action('redo');assert.equal(await p.locator('.sx-grid .sx-vw-frozen').count(),0);await action('undo');
 await action('save');const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('arles-sheet-design-v1')));assert.deepEqual(stored.sheets[0].cells,cells);
 await p.reload();await p.locator('.sx-window').waitFor();await action('panel-close');await p.locator('[data-sx-tab=view]').click();await scroll();await corner('B3',223,105);assert.equal(await cell('B1').textContent(),'24');
 // Hidden headings and hidden first rows/columns must not leave gaps in the fixed area.
 await p.locator('[data-sheet="1"]').click();await scroll();await corner('B2',43,25);await field('headings').uncheck();await scroll();await corner('B2',0,0);await field('headings').check();
 // A merged cell cannot be split by freezing; the valid outer boundary can be used instead.
 await p.locator('[data-sheet="2"]').click();await scroll(0,0);await action('view-freeze');await field('freeze-ref').fill('A1:B3');await field('freeze-kind').selectOption('range');assert.match(await preview(),/combinación/);assert.equal(await p.locator('[data-sx=view-freeze-selection]').isEnabled(),false);
 await field('freeze-ref').press('Enter');assert.equal(await p.locator('.sx-grid .sx-vw-frozen').count(),0);await field('freeze-ref').fill('A1:C3');await action('view-freeze-selection');await scroll();await corner('A1',43,25);
 assert.deepEqual(errors,[]);console.log('PASS freeze: standalone row/column, real header/range selection with live panel, typed bounds, success/error states, merged and hidden cells, measured zoom/narrow scrolling, unfreeze/undo/redo, persistence and unchanged values/formulas.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
