import test from 'node:test';
import assert from 'node:assert/strict';
import {newSheet,writeCells,resizeStructure,shiftCells,normalizeSheetLink} from '../sheet-model.js';
import {aggregate,pivotData,chartSeries,dateKey,timelinePeriods,filteredRecords,validateObject} from '../sheet-insert-model.js';
import {histogramBins,boxSummary,paretoData,chartTypes,renderChart} from '../sheet-insert-charts.js';
function fixture(){
 const s=newSheet();writeCells(s,{A1:'Zona',B1:'Producto',C1:'Ventas',D1:'Costos',E1:'Mes',F1:'Fecha',A2:'Norte',B2:'A',C2:'10',D2:'3',E2:'Enero',F2:"'2026-01-10",A3:'Norte',B3:'A',C3:'20',D3:'5',E3:'Enero',F3:"'2026-01-20",A4:'Norte',B4:'B',C4:'90',D4:'10',E4:'Febrero',F4:"'2026-02-10",A5:'Sur',B5:'A',C5:'40',D5:'8',E5:'Enero',F5:"'2026-01-12"});
 return s;
}
test('Varios campos, medidas y totales agregan registros originales, incluidos promedios',()=>{
 const s=fixture(),o={source:'A1:F5',rowFields:[0,1],colFields:[4],measures:[{field:2,operation:'average'},{field:3,operation:'sum'}],totals:true,subtotals:true},d=pivotData(s,o);
 assert.deepEqual(d.rows[0],['Norte','A',15,8,0,0,15,8]);
 assert.deepEqual(d.rows.find((r,i)=>d.rowKinds[i]==='subtotal'),['Total Norte','',15,8,90,10,40,18]);
 assert.deepEqual(d.rows.at(-1),['Total general','',70/3,16,90,10,40,26]);
 writeCells(s,{C4:'=C2*3'});assert.equal(pivotData(s,o).rows.at(-1).at(-2),25);
});
test('Porcentajes de fila, columna y general usan el denominador de cada medida',()=>{
 const s=fixture(),base={source:'A1:F5',rowFields:[0],colFields:[4],totals:true};
 const row=pivotData(s,{...base,measures:[{field:2,operation:'sum',showAs:'row'}]});
 assert.deepEqual(row.rows[0],['Norte',.25,.75,1]);assert.deepEqual(row.percentColumns,[1,2,3]);
 const col=pivotData(s,{...base,measures:[{field:2,operation:'sum',showAs:'column'}]});assert.equal(col.rows[0][1],30/70);assert.equal(col.rows.at(-1)[1],1);
 const grand=pivotData(s,{...base,measures:[{field:2,operation:'sum',showAs:'grand'}]});assert.equal(grand.rows.at(-1).at(-1),1);
});
test('Recuento, estadísticos y porcentajes con cero no inventan resultados',()=>{
 assert.equal(aggregate([1,2,'x',''],'count'),3);assert.equal(aggregate([1,2,'x'],'countNumbers'),2);
 assert.equal(aggregate([2,4],'average'),3);assert.equal(aggregate([2,4],'variance'),2);assert.equal(aggregate([2,4],'variancep'),1);assert.equal(aggregate([2,4],'stdevp'),1);
 assert.equal(aggregate([2],'stdev'),null);
 const s=fixture();writeCells(s,{C2:'0',C3:'0',C4:'0',C5:'0'});assert.equal(pivotData(s,{source:'A1:F5',rowFields:[0],measures:[{field:2,operation:'sum',showAs:'grand'}]}).rows[0][1],null);
});
test('Filtros conectados solo afectan a sus destinos y se combinan con filtros del informe',()=>{
 const s=fixture(),a={id:'a',source:'A1:F5',rowField:0,valueField:2},b={...a,id:'b'};
 s.insertObjects=[{kind:'slicer',source:a.source,field:0,selected:['Norte'],targetIds:['a']}];
 assert.equal(filteredRecords(s,a).rows.length,3);assert.equal(filteredRecords(s,b).rows.length,4);
 assert.equal(filteredRecords(s,{...a,reportFilters:[{field:1,selected:['A']}]}).rows.length,2);
 s.insertObjects[0].targetIds=[];assert.equal(filteredRecords(s,a).rows.length,4);
 delete s.insertObjects[0].targetIds;assert.equal(filteredRecords(s,b).rows.length,3);
});
test('Fechas validan calendarios y generan intervalos completos por mes, trimestre y año',()=>{
 assert.equal(dateKey('2026-02-30'),null);assert.equal(dateKey(60),null);assert.equal(dateKey(61),'1900-03-01');assert.equal(dateKey(1),'1900-01-01');assert.equal(dateKey(1e100),null);
 const s=fixture(),o={source:'A1:F5',field:5};
 assert.deepEqual(timelinePeriods(s,o).map(p=>p.to),['2026-01-31','2026-02-28']);
 assert.equal(timelinePeriods(s,{...o,period:'quarter'})[0].to,'2026-03-31');
 assert.equal(timelinePeriods(s,{...o,period:'year'})[0].to,'2026-12-31');
 s.insertObjects=[{...o,kind:'timeline',from:'2026-02-01',to:'2026-02-28'}];assert.equal(chartSeries(s,{...o,valueField:2}).series[0].values[0],90);
});
test('Series conservan categorías vacías y huecos sin convertir textos en ceros',()=>{
 const s=fixture();writeCells(s,{C3:'texto',D4:''});
 const d=chartSeries(s,{source:'A1:F5',rowField:1,seriesFields:[2,3]});
 assert.deepEqual(d.series[0].values,[10,null,90,40]);assert.deepEqual(d.series[1].values,[3,5,null,8]);assert.equal(d.categories.length,4);
 const html=renderChart(d,{chartType:'line'});assert.ok(!/NaN|Infinity/.test(html));assert.equal((html.match(/<polyline/g)||[]).length,4);
});
test('Referencias de varias series, medidas y filtros se remapean sin perder campos',()=>{
 const s=fixture();s.insertObjects=[{kind:'chart',source:'A1:F5',rowField:0,seriesFields:[2,3],xField:2,sizeField:3},{kind:'pivot',source:'A1:F5',rowFields:[0,1],colFields:[4],measures:[{field:2,operation:'sum'}],reportFilters:[{field:5,selected:['2026-01-10']}]}];
 resizeStructure(s,'B1:B100','column');assert.deepEqual(s.insertObjects[0].seriesFields,[3,4]);assert.deepEqual(s.insertObjects[1].rowFields,[0,2]);assert.equal(s.insertObjects[1].measures[0].field,3);assert.equal(s.insertObjects[1].reportFilters[0].field,6);
 const before=JSON.stringify(s);assert.throws(()=>resizeStructure(s,'D1:D100','column',true));assert.equal(JSON.stringify(s),before);
});
test('Histograma conserva cada observación y respeta bordes derechos inclusivos',()=>{
 const bins=histogramBins([0,2,2.1,4,6],{binWidth:2});assert.deepEqual(bins.map(b=>b.count),[2,2,1]);
 assert.equal(histogramBins([5,5,5])[0].count,3);
 assert.equal(histogramBins([0,1,4,8,10],{binCount:4}).reduce((n,b)=>n+b.count,0),5);
 assert.throws(()=>histogramBins([1,1000],{binWidth:.01}));assert.throws(()=>histogramBins([1],{binCount:0}));
});
test('Pareto agrupa categorías, ordena y termina en 100 %; cajas identifican atípicos',()=>{
 assert.deepEqual(paretoData(['A','B','A'],[2,3,4]),[{label:'A',value:6,cumulative:2/3},{label:'B',value:3,cumulative:1}]);
 assert.throws(()=>paretoData(['A'],[-1]));
 const b=boxSummary([1,2,3,4,100]);assert.deepEqual([b.q1,b.median,b.q3,b.low,b.high],[2,3,4,1,4]);assert.deepEqual(b.outliers,[100]);
 assert.equal(boxSummary([1,2,3,4],'exclusive').q1,1.25);
});
test('Todos los tipos renderizan SVG con datos válidos, y rechazan configuraciones inválidas',()=>{
 const d={categories:['A','B','C','D'],series:[{name:'<Ventas>',values:[2,4,3,8]},{name:'Costos',values:[1,2,1,4]}],xValues:[1,2,3,4],sizes:[2,4,3,8]};
 for(const chartType of Object.keys(chartTypes)){const svg=renderChart(d,{chartType,showLabels:true});assert.match(svg,/<svg/,chartType);assert.doesNotMatch(svg,/NaN|Infinity|<Ventas>/,chartType);}
 assert.match(renderChart({...d,series:[{name:'x',values:[-1,2]}]},{chartType:'percentColumns'}),/no negativos/);
 const s=fixture(),o={kind:'chart',source:'A1:F5',x:0,y:0,width:460,height:300,seriesFields:[2,6]};assert.throws(()=>validateObject(s,o));assert.throws(()=>validateObject(s,{...o,seriesFields:[2],binWidth:0}));
});
test('Vínculos web, de correo e internos se validan y ajustan con la estructura',()=>{
 assert.equal(normalizeSheetLink(' #b5 '),'#B5');assert.equal(normalizeSheetLink('mailto:equipo@example.com'),'mailto:equipo@example.com');
 assert.equal(normalizeSheetLink('https://example.com'),'https://example.com/');assert.throws(()=>normalizeSheetLink('javascript:alert(1)'));assert.throws(()=>normalizeSheetLink('#A1:B2'));assert.throws(()=>normalizeSheetLink('mailto:sin-correo'));
 const s=fixture();s.cells.A2.link='#C4';resizeStructure(s,'B1:B100','column');assert.equal(s.cells.A2.link,'#D4');
 shiftCells(s,'D4','down');assert.equal(s.cells.A2.link,'#D5');resizeStructure(s,'D1:D100','column',true);assert.equal(s.cells.A2.link,'#¡REF!');
});
