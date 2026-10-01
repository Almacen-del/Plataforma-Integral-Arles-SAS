import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFormula,functions,canonical,parseFormula,transformFormulaReferences} from '../sheet-formula-engine.js';
import {bindWorkbook,prepareCalculation,recalculateWorkbook,defineName,dependencies,previewFormula,evaluateCellSteps} from '../sheet-calculation.js';
import {newBook,newSheet,writeCells,value,resizeStructure,shiftCells,translateFormula,renameBookSheet,removeSheet,transferCells} from '../sheet-model.js';
const scalar=formula=>{const v=evaluateFormula(formula);return v instanceof Error?v.message:v;};
const make=()=>{const b=newBook();bindWorkbook(b);return [b,b.sheets[0]];};
const close=(v,expected)=>assert.ok(Math.abs(v-expected)<1e-8,`${v} != ${expected}`);
test('Catálogo oficial incluye funciones actuales y distingue disponibilidad',()=>{
 assert.equal(functions.length,518);assert.equal(new Set(functions.map(f=>f.id)).size,518);
 for(const id of ['GROUPBY','PIVOTBY','REGEXEXTRACT','LAMBDA','XLOOKUP','LET','SEQUENCE'])assert.ok(functions.some(f=>f.id===id));
 assert.ok(functions.filter(f=>f.available).length>430);assert.equal(functions.find(f=>f.id==='CUBEVALUE').available,false);
 for(const f of functions)assert.equal(canonical(f.name),f.id,'Alias ambiguo: '+f.id);
 assert.equal(scalar('=CUBEVALUE("conexión";"medida")'),'#NO.COMPATIBLE!');assert.equal(scalar('=INVENTADA(1)'),'#¿NOMBRE?');
});
test('Parser rechaza código ejecutable y maneja fórmulas mal formadas como errores',()=>{
 assert.equal(scalar('=SUMA('),'#FÓRMULA!');assert.equal(scalar('=globalThis.alert(1)'),'#¿NOMBRE?');assert.throws(()=>parseFormula('=A1["constructor"]'),/./);
 assert.equal(scalar('=SI(VERDADERO;7;1/0)'),7);assert.equal(scalar('=SI.ERROR(1/0;42)'),42);
 assert.equal(scalar('=SI.ND(1/0;42)'),'#¡DIV/0!');assert.equal(scalar('=2^3^2'),64);
 assert.equal(scalar('=SUMA(1,25;2,75)'),4);
});
test('Funciones de texto, matemáticas, estadísticas, ingeniería y finanzas',()=>{
 assert.equal(scalar('=MAYUSC("Arles")'),'ARLES');assert.equal(scalar('=EXTRAE("Arles";2;3)'),'rle');
 assert.equal(scalar('=REDONDEAR(-2,555;2)'),-2.56);assert.equal(scalar('=FACT(5)'),120);
 close(scalar('=DESVEST.M(1;2;3)'),1);close(scalar('=VAR.P(1;2;3)'),2/3);
 assert.equal(scalar('=DEC2BIN(10)'),'1010');close(scalar('=PAGO(0;10;1000)'),-100);
 assert.equal(scalar('=CONV.DECIMAL("FF";16)'),255);assert.equal(scalar('=_xlfn.DECIMAL("FF";16)'),255);assert.equal(scalar('=DECIMAL(12,5;2;VERDADERO)'),'12,50');
 close(scalar('=VA(0;10;-100)'),1000);close(scalar('=VF(0;10;-100)'),1000);
 close(scalar('=VNA(0,1;100;100)'),173.55371900826447);
});
test('Fechas seriales de Excel y validación estricta de fecha',()=>{
 assert.equal(scalar('=FECHA(1900;1;1)'),1);assert.equal(scalar('=FECHA(1900;2;29)'),60);
 assert.equal(scalar('=FECHA(1900;3;1)'),61);assert.equal(scalar('=FECHANUMERO("2026-02-30")'),'#¡VALOR!');
 assert.equal(scalar('=FECHA(1900;2;30)'),61);assert.equal(scalar('=FECHA(1900;3;0)'),60);assert.equal(scalar('=FECHA(2008;14;2)'),scalar('=FECHA(2009;2;2)'));
 assert.equal(scalar('=FECHANUMERO("2026-09-30")'),scalar('=FECHA(2026;9;30)'));
 assert.equal(scalar('=AÑO(FECHA(2026;9;30))'),2026);
 assert.equal(scalar('=DIA(60)'),29);assert.equal(scalar('=MES(60)'),2);assert.equal(scalar('=AÑO(60)'),1900);assert.equal(scalar('=DIA(1)'),1);assert.equal(scalar('=DIA(59)'),28);assert.equal(scalar('=DIA(0)'),0);
 assert.equal(scalar('=FECHA.MES(FECHA(2026;1;31);1)'),scalar('=FECHA(2026;2;28)'));assert.equal(scalar('=FIN.MES(FECHA(1900;2;1);0)'),60);assert.equal(scalar('=HORA(NSHORA(13;30;55))'),13);assert.equal(scalar('=SEGUNDO(NSHORA(13;30;55))'),55);
});
test('Criterios, búsquedas exactas, aproximadas y errores con datos de rangos',()=>{
 const [b,s]=make();writeCells(s,{A1:'10',A2:'20',A3:'30',B1:'uno',B2:'dos',B3:'tres',D1:'=SUMAR.SI(A1:A3;">15";A1:A3)',D2:'=CONTAR.SI.CONJUNTO(A1:A3;">10";B1:B3;"d*")',D3:'=BUSCARV(20;A1:B3;2;FALSO)',D4:'=BUSCARX(25;A1:A3;B1:B3;"vacío";-1)',D5:'=COINCIDIRX(20;A1:A3;0;-1)',D6:'=BUSCARX(1;A1:A3;B1:B3;"vacío")'});prepareCalculation(b);
 assert.equal(value(s,'D1'),50);assert.equal(value(s,'D2'),1);assert.equal(value(s,'D3'),'dos');assert.equal(value(s,'D4'),'dos');assert.equal(value(s,'D5'),2);assert.equal(value(s,'D6'),'vacío');
});
test('Referencias entre hojas, nombres de ámbito local y global, LET',()=>{
 const [b,s]=make(),t=newSheet("Datos d'Arles");b.sheets.push(t);bindWorkbook(b);writeCells(t,{A1:'10',A2:'20'});
 defineName(b,{name:'Datos',refersTo:"='Datos d''Arles'!A1:A2"});defineName(b,{name:'Tasa',refersTo:'=2'});defineName(b,{name:'Tasa',scope:s.id,refersTo:'=3'});
 writeCells(s,{A1:'=SUMA(Datos)*Tasa',B1:"='Datos d''Arles'!A1+1",C1:'=LET(cantidad;10;precio;5;cantidad*precio)'});writeCells(t,{B1:'=Tasa'});prepareCalculation(b);
 assert.equal(value(s,'A1'),90);assert.equal(value(s,'B1'),11);assert.equal(value(t,'B1'),2);assert.equal(value(s,'C1'),50);
 assert.deepEqual(dependencies(b,s,'A1').filter(t=>t.sheetId===b.sheets[1].id).map(t=>t.ref),['A1','A2']);
});
test('Ciclos de celdas y nombres se detectan sin bloqueo',()=>{
 const [b,s]=make(),t=newSheet('Otra');b.sheets.push(t);bindWorkbook(b);writeCells(s,{A1:'=Otra!A1'});writeCells(t,{A1:"='Hoja 1'!A1"});prepareCalculation(b);assert.equal(value(s,'A1'),'#CIRCULAR!');
 defineName(b,{name:'Ciclo',refersTo:'=Ciclo'});writeCells(s,{B1:'=Ciclo'});prepareCalculation(b);assert.equal(value(s,'B1'),'#CIRCULAR!');
});
test('Matrices dinámicas, referencias #, SI matricial y celdas derivadas protegidas',()=>{
 const [b,s]=make();writeCells(s,{A1:'=SECUENCIA(3;2;10;1)',D1:'=SUMA(A1#)',G1:'=SI(A1:A3>11;A1:A3*2;0)'});prepareCalculation(b);
 assert.equal(value(s,'B3'),15);assert.equal(value(s,'D1'),75);assert.equal(value(s,'G1'),0);assert.equal(value(s,'G2'),24);assert.equal(value(s,'G3'),28);
 assert.throws(()=>writeCells(s,{B2:'99'}),/matriz/);assert.equal(s.cells.B2,undefined);assert.equal(s.cells.A1.raw,'=SECUENCIA(3;2;10;1)');
 writeCells(s,{A1:'=SECUENCIA(2;1)'});prepareCalculation(b);assert.equal(value(s,'B3'),'');
});
test('Derrames bloqueados o fuera del diseño producen error sin sobrescribir datos',()=>{
 const [b,s]=make();writeCells(s,{A1:'=SECUENCIA(3)',A2:'original',Z100:'=SECUENCIA(2;2)'});prepareCalculation(b);
 assert.equal(value(s,'A1'),'#¡DESBORDAMIENTO!');assert.equal(value(s,'A2'),'original');assert.equal(value(s,'Z100'),'#¡DESBORDAMIENTO!');
 writeCells(s,{D1:'=SECUENCIA(2)'});s.merges=['D1:E1'];prepareCalculation(b);assert.equal(value(s,'D1'),'#¡DESBORDAMIENTO!');
});
test('FILTRAR, ORDENAR, UNICOS, apilado y conversión de matrices',()=>{
 const [b,s]=make();writeCells(s,{A1:'3',A2:'1',A3:'3',B1:'c',B2:'a',B3:'c',D1:'=ORDENAR(A1:B3)',G1:'=UNICOS(A1:A3)',I1:'=FILTRAR(A1:B3;A1:A3>1)',L1:'=APILARV(A1:B1;A2:B2)'});prepareCalculation(b);
 assert.equal(value(s,'D1'),1);assert.equal(value(s,'E1'),'a');assert.equal(value(s,'G2'),1);assert.equal(value(s,'J2'),'c');assert.equal(value(s,'M2'),'a');
 assert.deepEqual(scalar('=TOCOL({1\\2;3\\4})'),[[1],[2],[3],[4]]);assert.deepEqual(scalar('=DIVIDIRTEXTO("Arles;Excel";";")'),[['Arles','Excel']]);
});
test('SUBTOTALES distingue filas ocultas y excluye filtros y subtotales anidados',()=>{
 const [b,s]=make();writeCells(s,{A1:'Grupo',A2:'A',A3:'B',A4:'A',B1:'Valor',B2:'10',B3:'20',B4:'30',B5:'=SUBTOTALES(9;B2:B4)',D1:'=SUBTOTALES(9;B2:B5)',D2:'=SUBTOTALES(109;B2:B5)'});s.hiddenRows=[3];s.filters=[{range:'A1:B4',column:0,op:'equals',query:'A'}];prepareCalculation(b);
 assert.equal(value(s,'B5'),40);assert.equal(value(s,'D1'),40);assert.equal(value(s,'D2'),10);
});
test('Modo manual conserva resultados y Calcular hoja no cambia otros resultados',()=>{
 const [b,s]=make(),t=newSheet('Otra');b.sheets.push(t);bindWorkbook(b);writeCells(s,{A1:'2',B1:'=A1*3'});writeCells(t,{A1:"='Hoja 1'!B1*2"});recalculateWorkbook(b);b.calculation={mode:'manual',beforeSave:false};writeCells(s,{A1:'5'});prepareCalculation(b);
 assert.equal(value(s,'B1'),6);assert.equal(value(t,'A1'),12);recalculateWorkbook(b,s.id);assert.equal(value(s,'B1'),15);assert.equal(value(t,'A1'),12);recalculateWorkbook(b);assert.equal(value(t,'A1'),30);
 const loaded=JSON.parse(JSON.stringify(b));prepareCalculation(loaded);assert.equal(value(loaded.sheets[1],'A1'),30);
});
test('Auditoría y vista previa no modifican datos ni fórmulas',()=>{
 const [b,s]=make();writeCells(s,{A1:'4',B1:'=SUMA(A1;6)*2'});const before=JSON.stringify(b);assert.equal(previewFormula(b,s,'C1','=B1+1'),21);assert.equal(JSON.stringify(b),before);
 const steps=evaluateCellSteps(b,s,'B1');assert.equal(steps.result,20);assert.ok(steps.trace.some(t=>t.expression.includes('SUMA')));assert.equal(JSON.stringify(b),before);
 assert.equal(dependencies(b,s,'A1',true)[0].ref,'B1');
});
test('Inserción, eliminación y renombrado mantienen referencias y nombres de otras hojas',()=>{
 const [b,s]=make(),t=newSheet('Otra');b.sheets.push(t);bindWorkbook(b);writeCells(s,{A1:'4',B1:'=A1+LARGO("A1")',C1:'=Otra!A1'});writeCells(t,{A1:'2',B1:"=SUMA('Hoja 1'!$A$1;LARGO(\"A1\"))"});defineName(b,{name:'Dato',refersTo:"='Hoja 1'!$A$1"});resizeStructure(s,'A1','row');prepareCalculation(b);
 assert.equal(s.cells.B2.raw,'=A2+LARGO("A1")');assert.equal(s.cells.C2.raw,'=Otra!A1');assert.equal(t.cells.B1.raw,"=SUMA('Hoja 1'!$A$2;LARGO(\"A1\"))");assert.equal(b.names[0].refersTo,"='Hoja 1'!$A$2");assert.equal(value(t,'B1'),6);
 renameBookSheet(b,s,"Nueva d'Arles");prepareCalculation(b);assert.ok(t.cells.B1.raw.includes("'Nueva d''Arles'!$A$2"));assert.equal(value(t,'B1'),6);resizeStructure(s,'A2','row',true);prepareCalculation(b);assert.equal(value(t,'B1'),'#¡REF!');
});
test('Copiar y desplazar referencias conserva textos, nombres de hoja y funciones con dígitos',()=>{
 assert.equal(translateFormula('=ATAN2(A1;B1)+LOG10(C1)+LARGO("A1""B2")',1,1),'=ATAN2(B2;C2)+LOG10(D2)+LARGO("A1""B2")');
 assert.equal(translateFormula("='A1'!$B1+Otra!C$2",1,1),"='A1'!$B2+Otra!D$2");
 const [b,s]=make(),t=newSheet('Otra');b.sheets.push(t);bindWorkbook(b);writeCells(s,{A1:'5',C1:'=A1+Otra!A1'});writeCells(t,{A1:'2',B1:"='Hoja 1'!A1"});shiftCells(s,'A1','down');prepareCalculation(b);assert.equal(s.cells.C1.raw,'=A2+Otra!A1');assert.equal(t.cells.B1.raw,"='Hoja 1'!A2");assert.equal(value(s,'C1'),7);
});
test('No se expone FORMULATEXTO de una fórmula oculta en una hoja protegida',()=>{
 const [b,s]=make();writeCells(s,{A1:'=2+3',B1:'=FORMULATEXTO(A1)'});s.cells.A1.hiddenFormula=true;s.protected=true;prepareCalculation(b);assert.equal(value(s,'B1'),'#N/D');assert.equal(value(s,'A1'),5);
});
test('LAMBDA, MAP, BYROW, SCAN, REDUCE y MAKEARRAY funcionan con argumentos y matrices',()=>{
 assert.equal(scalar('=LAMBDA(x;x*2)(4)'),8);assert.equal(scalar('=LAMBDA(x;x*2)'), '#CALC!');
 assert.deepEqual(scalar('=MAP({1;2;3};LAMBDA(x;x*2))'),[[2],[4],[6]]);
 assert.deepEqual(scalar('=BYROW({1\\2;3\\4};LAMBDA(fila;SUMA(fila)))'),[[3],[7]]);
 assert.deepEqual(scalar('=SCAN(0;{1;2;3};LAMBDA(acum;v;acum+v))'),[[1],[3],[6]]);
 assert.equal(scalar('=REDUCE(0;{1;2;3};LAMBDA(acum;v;acum+v))'),6);
 assert.deepEqual(scalar('=MAKEARRAY(2;2;LAMBDA(fila;col;fila*col))'),[[1,2],[2,4]]);
 const [b,s]=make();defineName(b,{name:'Doble',refersTo:'=LAMBDA(x;x*2)'});writeCells(s,{A1:'=Doble(9)'});prepareCalculation(b);assert.equal(value(s,'A1'),18);
 defineName(b,{name:'Recursiva',refersTo:'=LAMBDA(x;Recursiva(x))'});writeCells(s,{B1:'=Recursiva(1)'});prepareCalculation(b);assert.equal(value(s,'B1'),'#LÍMITE!');
});
test('Álgebra matricial, porcentaje de total y conversiones de texto',()=>{
 assert.equal(scalar('=MDETERM({1\\2;3\\4})'),-2);
 const inverse=scalar('=MINVERSE({1\\2;3\\4})');close(inverse[0][0],-2);close(inverse[0][1],1);close(inverse[1][0],1.5);close(inverse[1][1],-.5);
 assert.equal(scalar('=MINVERSE({1\\2;2\\4})'),'#¡NUM!');assert.equal(scalar('=PERCENTOF({1;2};{1;2;3})'),.5);
 assert.equal(scalar('=ENCODEURL("Arles SAS")'),'Arles%20SAS');assert.equal(scalar('=ARRAYTOTEXT({1\\"Arles"};1)'),'{1\\"Arles"}');
});
test('Un nombre que derrama calcula referencias a destinos leídos antes de su origen',()=>{
 const [b,s]=make();defineName(b,{name:'Matriz',refersTo:'=SECUENCIA(3;1;10)'});writeCells(s,{D1:'=A2+1',A1:'=Matriz'});prepareCalculation(b);assert.equal(value(s,'D1'),12);assert.equal(value(s,'A3'),12);
});
test('Una fórmula nueva conserva su primer resultado en cálculo manual',()=>{
 const [b,s]=make();b.calculation={mode:'manual',beforeSave:false};writeCells(s,{A1:'2',B1:'=A1*3'});prepareCalculation(b);writeCells(s,{A1:'5'});prepareCalculation(b);assert.equal(value(s,'B1'),6);recalculateWorkbook(b);assert.equal(value(s,'B1'),15);
});
test('Cortar en la hoja actualiza otras hojas y nombres sin tocar cadenas literales',()=>{
 const [b,s]=make(),t=newSheet('Otra');b.sheets.push(t);bindWorkbook(b);writeCells(s,{A1:'5',C1:'=A1+LARGO("A1")'});writeCells(t,{A1:"='Hoja 1'!$A$1"});defineName(b,{name:'Dato',refersTo:"='Hoja 1'!A1"});transferCells(s,s,'A1','B1',true);prepareCalculation(b);
 assert.equal(value(s,'C1'),7);assert.equal(t.cells.A1.raw,"='Hoja 1'!$B$1");assert.equal(value(t,'A1'),5);assert.equal(b.names[0].refersTo,"='Hoja 1'!B1");
});
test('Eliminar una hoja convierte referencias en errores permanentes y quita nombres locales',()=>{
 const [b,s]=make(),t=newSheet('Otra');b.sheets.push(t);bindWorkbook(b);writeCells(t,{A1:'5'});writeCells(s,{A1:'=Otra!A1'});defineName(b,{name:'Local',scope:t.id,refersTo:'=A1'});defineName(b,{name:'Global',refersTo:'=Otra!A1'});removeSheet(b,1);b.sheets.push(newSheet('Otra'));prepareCalculation(b);
 assert.equal(s.cells.A1.raw,'=#¡REF!');assert.equal(value(s,'A1'),'#¡REF!');assert.equal(b.names.length,1);assert.equal(b.names[0].refersTo,'=#¡REF!');
});
test('Auditoría respeta ámbito local y no interpreta textos, nombres de hoja o variables LET como nombres definidos',()=>{
 const [b,s]=make(),t=newSheet('Otra');b.sheets.push(t);bindWorkbook(b);defineName(b,{name:'Dato',refersTo:'=Otra!A1'});defineName(b,{name:'Dato',scope:s.id,refersTo:'=B1'});writeCells(s,{C1:'=Dato',C2:'=LET(Dato;2;Dato+1)',C3:'=LARGO("Dato")'});prepareCalculation(b);
 assert.deepEqual(dependencies(b,s,'C1').map(t=>t.ref),['B1']);assert.equal(dependencies(b,s,'C2').length,0);assert.equal(dependencies(b,s,'C3').length,0);
});
test('Información distingue vacío real de texto vacío; INDEX y ROW/COLUMN expanden rangos',()=>{
 const [b,s]=make();writeCells(s,{A2:'=""',A3:'3',C1:'=ESBLANCO(A1)',C2:'=ESBLANCO(A2)',C3:'=ESTEXTO(A1)',C4:'=ESTEXTO(A2)',E1:'=ESNUMERO(A1:A3)',G1:'=FILA(A1:A3)'});prepareCalculation(b);
 assert.equal(value(s,'C1'),true);assert.equal(value(s,'C2'),false);assert.equal(value(s,'C3'),false);assert.equal(value(s,'C4'),true);assert.equal(value(s,'E3'),true);assert.equal(value(s,'G3'),3);
 assert.equal(scalar('=INDICE({10\\20\\30};2)'),20);assert.deepEqual(scalar('=INDICE({1\\2;3\\4};2)'),[[3,4]]);assert.deepEqual(scalar('=COLUMNA(A1:C1)'),[[1,2,3]]);
});
test('TEXTO admite formatos numéricos y fechas/horas conocidos sin inventar formatos avanzados',()=>{
 const [b,s]=make();writeCells(s,{A1:'=TEXTO(12,5;"0,00")',A2:'=TEXTO(FECHA(2026;9;30);"yyyy-mm-dd")',A3:'=TEXTO(NSHORA(13;30;0);"hh:mm")',A4:'=TEXTO(1;"[Color42]0")'});prepareCalculation(b);
 assert.equal(value(s,'A1'),'12,50');assert.equal(value(s,'A2'),'2026-09-30');assert.equal(value(s,'A3'),'13:30');assert.equal(value(s,'A4'),'#NO.COMPATIBLE!');
});
test('Los errores de matrices se conservan por celda y los criterios excluyen datos no elegidos',()=>{
 const [b,s]=make();writeCells(s,{A1:'=1',A2:'=1/0',A3:'3',B1:'Sí',B2:'No',B3:'Sí',D1:'=SUMAR.SI(B1:B3;"Sí";A1:A3)',F1:'=SECUENCIA(3)/{1;0;1}',H1:'=SI.ERROR(F1#;0)',J1:'=FILTRAR(A1:A3;B1:B3="Sí")'});prepareCalculation(b);
 assert.equal(value(s,'D1'),4);assert.equal(value(s,'F1'),1);assert.equal(value(s,'F2'),'#¡DIV/0!');assert.equal(value(s,'F3'),3);assert.equal(value(s,'H2'),0);assert.equal(value(s,'J2'),3);
});
