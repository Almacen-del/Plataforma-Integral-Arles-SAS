import test from 'node:test';
import assert from 'node:assert/strict';
import {setGridBounds,columnName,columnIndex} from '../sheet-grid-limits.js';
import {newBook,newSheet,address,position,translateFormula,writeCells,value} from '../sheet-model.js';
import {xlsxColumnPixels,xlsxAnchor,xlsxListItems,checkXlsxArchive,xlsxFormula,importCellStyle} from '../sheet-xlsx.js';
import {prepareCalculation} from '../sheet-calculation.js';
test('Referencias amplias y fórmulas entre hojas no recortan datos después de la fila 100',()=>{
 setGridBounds(6858,64);try{assert.equal(address(4000,27),'AB4001');assert.deepEqual(position('AB4001'),[4000,27]);assert.equal(columnName(255),'IV');assert.equal(columnIndex('IV'),255);const b=newBook(),s=b.sheets[0];writeCells(s,{AB4001:'17',AB4002:'=AB4001*2'});prepareCalculation(b);assert.equal(value(s,'AB4002'),34);assert.equal(translateFormula('=$AB4001+AB$4001',1,1),'=$AB4002+AC$4001');assert.throws(()=>position('BM1'));}finally{setGridBounds();}
});
test('Separadores XLSX y tablas estructuradas calculan sin reescribir la fórmula original',()=>{
 setGridBounds(1000,26);try{const b=newBook(),s=b.sheets[0],lookup=newSheet('A S');b.sheets.push(lookup);b.xlsxTables=[{name:'Tabla_1',sheetName:lookup.name,ref:'A1:B3',headers:true,columns:['LOTE','AÑO']}];writeCells(lookup,{A1:'LOTE',B1:'AÑO',A2:'001',B2:'2026',A3:'002',B3:'2025'});lookup.cells.A2.textValue=true;writeCells(s,{F900:'001'});s.cells.F900.textValue=true;const raw='=VLOOKUP(F900, Tabla_1[], 2, FALSE)';s.cells.E900={raw,formulaSyntax:'xlsx'};prepareCalculation(b);assert.equal(value(s,'E900'),2026);assert.equal(s.cells.E900.raw,raw);writeCells(lookup,{B2:'2099'});prepareCalculation(b);assert.equal(value(s,'E900'),2099);assert.equal(xlsxFormula('=IF(A1=1,"a,b",SUM(1,2.5))',b),'=IF(A1=1;"a,b";SUM(1;2.5))');}finally{setGridBounds();}
});
test('Los errores originales de Excel se conservan en la presentación importada',()=>{
 const b=newBook(),s=b.sheets[0];s.cells.A1={raw:'=VLOOKUP(99,B1:C2,2,FALSE)',formulaSyntax:'xlsx'};prepareCalculation(b);assert.equal(value(s,'A1'),'#N/A');
});
test('Estilos importados mantienen fuente, bordes, colores, formato y protección',()=>{
 const style=importCellStyle({font:{name:'Calibri',size:10,bold:true,color:{argb:'FFFF0000'}},fill:{type:'pattern',pattern:'solid',fgColor:{argb:'FFC6EFCE'}},border:{bottom:{style:'double',color:{argb:'FF123456'}}},numFmt:'00000',alignment:{vertical:'center',wrapText:true},protection:{locked:false,hidden:true}});assert.equal(style.font,'Calibri');assert.equal(style.color,'#ff0000');assert.equal(style.fill,'#c6efce');assert.equal(style.border.bottom.style,'double');assert.equal(style.valign,'middle');assert.equal(style.xlsxNumFmt,'00000');assert.equal(style.locked,false);assert.equal(style.hiddenFormula,true);
});
test('Archivos inválidos o demasiado grandes se rechazan antes de descomprimir',()=>{
 assert.throws(()=>checkXlsxArchive(new ArrayBuffer(22)),/válido/);const buffer=new ArrayBuffer(98),v=new DataView(buffer);v.setUint32(0,0x04034b50,true);v.setUint32(30,0x02014b50,true);v.setUint32(76,0x06054b50,true);v.setUint16(86,1,true);v.setUint32(92,30,true);v.setUint32(54,151*1024*1024,true);assert.throws(()=>checkXlsxArchive(buffer),/150 MB/);v.setUint32(54,0,true);v.setUint16(38,1,true);assert.throws(()=>checkXlsxArchive(buffer),/cifrados/);
});

test('Las medidas OOXML no duplican el relleno ni desplazan las imágenes',()=>{
 assert.equal(xlsxColumnPixels(6.43),45);assert.equal(xlsxColumnPixels(7.29),51);assert.equal(xlsxColumnPixels(25.71),180);assert.equal(xlsxColumnPixels(8.7109375),61);
 assert.deepEqual(xlsxAnchor({nativeCol:0,nativeRow:0,nativeColOff:104775,nativeRowOff:57150}),{col:0,row:0,colOffset:11,rowOffset:6});
});
test('Las listas largas concatenadas conservan las opciones completas',()=>{
 assert.deepEqual(xlsxListItems('"uno,do"&"s,tres"'),['uno','dos','tres']);assert.deepEqual(xlsxListItems('"Texto ""citado"",otro"'),['Texto "citado"','otro']);assert.equal(xlsxListItems("'Otra hoja'!A1:A5"),null);
});
