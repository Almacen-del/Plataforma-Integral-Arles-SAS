import test from 'node:test';
import assert from 'node:assert/strict';
import {formatNumber,display,newSheet,writeCells,value,NUMBER_FORMATS} from '../sheet-model.js';
test('Formatos numéricos preservan valores, fechas seriales y fracciones',()=>{
 assert.equal(NUMBER_FORMATS.length,11);
 assert.equal(formatNumber(1,{format:'date-short'}),'01/01/1900');
 assert.equal(formatNumber(60,{format:'date-short'}),'29/02/1900');
 assert.equal(formatNumber(61,{format:'date-short'}),'01/03/1900');
 assert.equal(formatNumber(.5,{format:'time'}),'12:00:00');
 assert.equal(formatNumber(-2.75,{format:'fraction'}),'-2 3/4');
 assert.equal(formatNumber(1000,{format:'scientific'}),'1,00E+03');
 assert.equal(formatNumber(0,{format:'accounting'}),'$  —');
 assert.equal(formatNumber(-10,{format:'accounting'}),'$  (10,00)');
 const s=newSheet();writeCells(s,{A1:'=1/2'});for(const [format] of NUMBER_FORMATS){s.cells.A1.format=format;assert.ok(display(s,'A1'));assert.equal(value(s,'A1'),.5);assert.equal(s.cells.A1.raw,'=1/2');}
});
test('Texto conserva las entradas nuevas como texto sin convertir fórmulas existentes',()=>{const s=newSheet();s.cells.A1={format:'text'};writeCells(s,{A1:'=1+2'});assert.equal(value(s,'A1'),'=1+2');writeCells(s,{A1:'00123'});assert.equal(value(s,'A1'),'00123');});
