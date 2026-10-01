import test from 'node:test';
import assert from 'node:assert/strict';
import {newSheet,writeCells,value,formatNumber,numberFormatColor,validateCustomFormat,mergeCells,fillSeries,pasteSpecial,sortCells,autoAggregate,createTable,rowPassesFilters,resizeStructure,display} from '../sheet-model.js';
test('Formatos avanzados no cambian valores y rechazan códigos no soportados',()=>{
 assert.equal(formatNumber(-1234.5,{format:'number',useGrouping:false,negativeStyle:'paren'}),'(1234,50)');
 assert.equal(numberFormatColor(-1,{format:'currency',negativeStyle:'red-minus'}),'#ff0000');
 assert.equal(formatNumber(2.3,{format:'fraction',fractionType:'/8'}),'2 2/8');
 assert.equal(formatNumber(1.5,{format:'time',timeType:'elapsed'}),'36:00:00');
 assert.equal(formatNumber(.5,{format:'time',timeType:'ampm'}),'12:00:00 p. m.');
 assert.equal(formatNumber(7,{format:'custom',customCode:'00000'}),'00007');
 assert.equal(formatNumber(-5,{format:'custom',customCode:'0,00;[Rojo](0,00)'}),'(5,00)');
 assert.equal(formatNumber(0,{format:'custom',customCode:'0;[Rojo]-0;"—"'}),'—');
 assert.equal(formatNumber('abc',{format:'custom',customCode:'0;0;0;"Código: "@'}),'Código: abc');
 assert.throws(()=>validateCustomFormat('[>=100]0'));assert.throws(()=>validateCustomFormat('dd/mm/yyyy'));
 const s=newSheet();writeCells(s,{A1:'=1/2'});s.cells.A1.format='custom';s.cells.A1.customCode='0,00%';assert.equal(display(s,'A1'),'50,00%');assert.equal(s.cells.A1.raw,'=1/2');assert.equal(value(s,'A1'),.5);
});
test('Pegado especial transpone, ajusta fórmulas, omite blancos y es atómico ante errores',()=>{
 const source=newSheet(),target=newSheet();writeCells(source,{A1:'2',B1:'3',A2:'=A1*2'});pasteSpecial(source,target,'A1:B2','C3',{transpose:true});assert.equal(value(target,'D3'),4);assert.equal(value(target,'C4'),3);
 pasteSpecial(source,target,'A2','B5',{mode:'formulas'});assert.equal(target.cells.B5.raw,'=B4*2');
 writeCells(target,{A1:'4'});pasteSpecial(source,target,'A1','A1',{operation:'multiply'});assert.equal(value(target,'A1'),8);
 source.cells.B2={raw:'0'};const before=JSON.stringify(target);assert.throws(()=>pasteSpecial(source,target,'B2','A1',{operation:'divide'}));assert.equal(JSON.stringify(target),before);
});
test('Series, combinación por fila y autosuma horizontal y vertical',()=>{
 const s=newSheet();writeCells(s,{A1:'2'});fillSeries(s,'A1:D1',{axis:'row',type:'growth',step:3});assert.equal(value(s,'D1'),54);assert.equal(autoAggregate(s,'A1:D1'),'E1');assert.equal(value(s,'E1'),80);
 writeCells(s,{A3:'10'});fillSeries(s,'A3:A7',{step:2,limit:14});assert.equal(value(s,'A5'),14);assert.equal(value(s,'A6'),'');assert.equal(autoAggregate(s,'A6','PROMEDIO'),'A6');assert.equal(value(s,'A6'),12);
 mergeCells(s,'G1:I2','across');assert.deepEqual(s.merges,['G1:I1','G2:I2']);mergeCells(s,'G1:I2','unmerge');assert.deepEqual(s.merges,[]);
 writeCells(s,{H1:'conservar'});assert.throws(()=>mergeCells(s,'G1:I1'));assert.equal(value(s,'H1'),'conservar');
});
test('Ordenar fórmulas junto a sus filas, filtros y tablas con cambios de estructura',()=>{
 const s=newSheet();writeCells(s,{A1:'Nombre',B1:'Cantidad',C1:'Total',A2:'B',B2:'2',C2:'=B2*10',A3:'A',B3:'3',C3:'=B3*10'});
 sortCells(s,'A1:C3',[{column:0,direction:1}]);assert.equal(value(s,'A2'),'A');assert.equal(s.cells.C2.raw,'=B2*10');assert.equal(value(s,'C2'),30);
 createTable(s,'A1:C3',{name:'Ventas'});s.filters=[{range:'A1:C3',column:1,op:'gt',query:'2'}];assert.equal(rowPassesFilters(s,1),true);assert.equal(rowPassesFilters(s,2),false);
 resizeStructure(s,'A1','row',false);assert.equal(s.tables[0].range,'A2:C4');assert.deepEqual(s.filters,[]);
 s.protected=true;s.cells.C3.hiddenFormula=true;s.showFormulas=true;assert.equal(display(s,'C3'),'30');
});
