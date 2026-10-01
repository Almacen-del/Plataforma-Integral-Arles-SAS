import test from 'node:test';
import assert from 'node:assert/strict';
import {newSheet,writeCells,resizeStructure} from '../sheet-model.js';
import {pageSettings,titleIndices,normalizeAreas,printPlan,pageBreak,organizeObjects,themeCell,themePresets,validateTheme,PX_PER_MM,usedArea,overrideThemeFormat} from '../sheet-layout-model.js';
const fixture=()=>{const s=newSheet();writeCells(s,{A1:'Encabezado',H60:'Final',B2:'=2+3'});s.printRange='A1:H60';return s;};
test('Cambiar manualmente un estilo desvincula solo las propiedades modificadas del tema',()=>{
 const cell={raw:'=1+2',themeFill:0,themeColor:1,themeFont:'body'},next=overrideThemeFormat(cell,{fill:'#ffeeaa',bold:true});
 assert.equal(next.themeFill,undefined);assert.equal(next.themeColor,1);assert.equal(next.themeFont,'body');assert.equal(next.raw,cell.raw);assert.equal(themeCell(next,themePresets.office).fill,'#ffeeaa');
 assert.equal(overrideThemeFormat(cell,{font:'Georgia'}).themeFont,undefined);assert.equal(overrideThemeFormat(cell,{fill:'#ffeeaa',themeFill:2}).themeFill,2);
});
test('Una hoja con solo objetos incluye su inicio y su final en el área usada',()=>{
 const s=newSheet();s.insertObjects=[{id:'text',x:80,y:80,width:460,height:290}];assert.equal(usedArea(s),'A3:E13');
 const p=printPlan(s);assert.equal(p.pages[0].allCols[0],0);assert.equal(p.pages[0].allRows[0],2);
 s.insertObjects[0].hidden=true;assert.equal(usedArea(s),null);
});
test('Papel, orientación, márgenes y títulos se validan sin aceptar configuración imposible',()=>{
 const p=pageSettings({margin:20,size:'Carta',orientation:'landscape'});assert.deepEqual(p.margins,{top:20,right:20,bottom:20,left:20});
 assert.deepEqual(titleIndices('$1:$3','row'),[0,1,2]);assert.deepEqual(titleIndices('$A:$C','column'),[0,1,2]);
 assert.throws(()=>titleIndices('99:101','row'));assert.throws(()=>pageSettings({scale:0}));assert.throws(()=>pageSettings({size:'A5',margins:{left:90,right:90}}));assert.throws(()=>pageSettings({margin:5,header:'Encabezado'}));
});
test('Paginación cubre cada celda una vez y respeta las medidas físicas y el orden',()=>{
 const s=fixture(),before=JSON.stringify(s),p=printPlan(s);assert.equal(p.pages.length,4);
 const refs=p.pages.flatMap(pg=>pg.rows.flatMap(r=>pg.cols.map(c=>String(r)+':'+c)));
 assert.equal(new Set(refs).size,8*60);assert.equal(refs.length,8*60);assert.equal(JSON.stringify(s),before);
 for(const pg of p.pages){assert.ok(pg.width*pg.scale<=p.contentWidth+.01);assert.ok(pg.height*pg.scale<=p.contentHeight+.01);}
 assert.equal(p.paper[0],210*PX_PER_MM);assert.equal(p.pages[1].cols[0],0);
 s.page.order='over';const over=printPlan(s);assert.equal(over.pages[1].rows[0],0);assert.ok(over.pages[1].cols[0]>0);
});
test('Títulos se repiten en cada página y Ajustar a calcula una escala que cumple ambos límites',()=>{
 const s=fixture();s.page={...s.page,repeatRows:'1',repeatColumns:'A',printHeadings:true};
 const p=printPlan(s);for(const pg of p.pages){assert.equal(pg.allRows[0],0);assert.equal(pg.allCols[0],0);assert.equal(new Set(pg.allRows).size,pg.allRows.length);}
 s.page.scaleMode='fit';s.page.fitWidth=1;s.page.fitHeight=1;const fit=printPlan(s);assert.equal(fit.pages.length,1);assert.ok(fit.pages[0].scale<1);assert.ok(fit.pages[0].rows.includes(59));assert.ok(fit.pages[0].cols.includes(7));
});
test('Saltos manuales se muestran, se quitan y se ignoran solamente al ajustar a páginas',()=>{
 const s=fixture();pageBreak(s,'C11');const p=printPlan(s);assert.equal(p.pages[0].rows.at(-1),9);assert.equal(p.pages[0].cols.at(-1),1);
 s.page.scaleMode='fit';s.page.fitWidth=1;s.page.fitHeight=1;assert.equal(printPlan(s).pages.length,1);assert.match(printPlan(s).warnings[0],/saltos manuales/);
 pageBreak(s,'C11','remove');assert.deepEqual(s.pageBreaks,{rows:[],columns:[]});
 pageBreak(s,'B4');pageBreak(s,'A1','reset');assert.deepEqual(s.pageBreaks,{rows:[],columns:[]});assert.throws(()=>pageBreak(s,'A1'));
});
test('Áreas separadas, filas ocultas, filtros y columnas ocultas conservan el alcance de impresión',()=>{
 const s=fixture();s.printRanges=['A1:B8','F50:H60'];s.hiddenRows=[2];s.hiddenColumns=[6];
 const p=printPlan(s);assert.equal(p.pages.length,2);assert.ok(!p.pages[0].rows.includes(2));assert.ok(!p.pages[1].cols.includes(6));
 assert.throws(()=>normalizeAreas(['A1:B3','B2:C4'],s));s.hiddenColumns=[0,1,5,6,7];assert.throws(()=>printPlan(s));
});
test('Combinaciones no se cortan por áreas, saltos ni títulos; se mantienen juntas por página',()=>{
 const s=fixture();s.merges=['A9:B12'];assert.throws(()=>normalizeAreas(['A1:B10'],s));assert.throws(()=>pageBreak(s,'A11'));s.page.repeatRows='1:10';assert.throws(()=>printPlan(s));
 s.page.repeatRows='';pageBreak(s,'A9');const p=printPlan(s);const containing=p.pages.filter(pg=>pg.rows.includes(8));for(const pg of containing)assert.ok([8,9,10,11].every(r=>pg.rows.includes(r)));
 s.merges=['A1:H1'];assert.throws(()=>printPlan(s));s.page={...s.page,scaleMode:'fit',fitWidth:1,fitHeight:0};assert.ok(printPlan(s).pages.length>0);
});
test('Áreas, títulos y saltos se remapean al insertar filas y columnas',()=>{
 const s=fixture();s.printRanges=['A1:H60'];s.page.repeatRows='1:2';s.page.repeatColumns='A:B';s.pageBreaks={rows:[10],columns:[2]};
 resizeStructure(s,'A2:Z2','row');assert.deepEqual(s.printRanges,['A1:H61']);assert.equal(s.page.repeatRows,'1:3');assert.deepEqual(s.pageBreaks.rows,[11]);
 resizeStructure(s,'B1:B100','column');assert.equal(s.page.repeatColumns,'A:C');assert.deepEqual(s.pageBreaks.columns,[3]);assert.deepEqual(s.printRanges,['A1:I61']);
});
test('Temas cambian solamente propiedades vinculadas y conservan formatos manuales',()=>{
 const manual={raw:'=2+3',font:'Georgia',fill:'#ffffff'},bound={raw:'5',themeFill:0,themeFont:'body'};
 assert.equal(themeCell(manual,themePresets.office).font,'Georgia');assert.equal(themeCell(manual,themePresets.office).fill,'#ffffff');
 assert.equal(themeCell(bound,themePresets.office).fill,'#4472c4');assert.equal(themeCell(bound,themePresets.office).font,'Calibri');assert.equal(bound.raw,'5');
 assert.throws(()=>validateTheme({...themePresets.office,colors:['red']}));assert.equal(validateTheme(themePresets.office).name,'Office');
});
test('Objetos se alinean, distribuyen, agrupan, giran y cambian de orden sin alterar celdas',()=>{
 const s=fixture(),cells=JSON.stringify(s.cells);s.insertObjects=[{id:'a',x:10,y:20,width:160,height:100},{id:'b',x:250,y:50,width:160,height:100},{id:'c',x:500,y:100,width:160,height:100}];
 organizeObjects(s,['a','b','c'],'top');assert.deepEqual(s.insertObjects.map(o=>o.y),[20,20,20]);
 organizeObjects(s,['a','b','c'],'distribute-x');assert.equal(s.insertObjects[1].x,255);
 organizeObjects(s,['a','b'],'group');assert.equal(s.insertObjects[0].groupId,s.insertObjects[1].groupId);
 organizeObjects(s,['a'],'rotate-right');assert.equal(s.insertObjects[0].rotation,90);organizeObjects(s,['a'],'flip-x');assert.equal(s.insertObjects[0].flipH,true);
 organizeObjects(s,['a'],'front');assert.equal(s.insertObjects.at(-1).id,'a');organizeObjects(s,['a'],'backward');assert.equal(s.insertObjects[1].id,'a');
 organizeObjects(s,['a'],'ungroup');assert.ok(s.insertObjects.every(o=>!o.groupId));assert.equal(JSON.stringify(s.cells),cells);assert.throws(()=>organizeObjects(s,['a'],'left'));
 s.protected=true;assert.throws(()=>organizeObjects(s,['a'],'front'));
});
