import {writeFile} from 'node:fs/promises';
import {functions} from '../sheet-formula-engine.js';
import {catalogDate} from '../sheet-function-catalog.js';
for(const f of functions){const url=new URL(f.url);if(url.hostname!=='support.microsoft.com'||!url.pathname.startsWith('/es-es/excel/'))throw Error('Invalid help link: '+f.id);}
const available=functions.filter(f=>f.available).length;
const report=['# Catálogo de funciones — '+catalogDate,'','Índice oficial consultado: '+functions.length+' identificadores. Habilitados: '+available+'. Pendientes: '+(functions.length-available)+'. El estado habilitado no certifica todas las variantes de Excel. Véase [alcance y verificación](EXCEL_FORMULAS_2026-09-30.md).','','Fuente: [Microsoft Support](https://support.microsoft.com/en-us/excel/excel-functions-alphabetical). Nombres, categorías y enlaces son metadatos; las descripciones del índice no se copian.','','| Identificador | Nombre mostrado | Categoría | Estado | Ayuda |','| --- | --- | --- | --- | --- |',...functions.map(f=>'| '+f.id+' | '+f.name+' | '+f.category+' | '+(f.available?'Habilitada':'Pendiente')+' | [Microsoft]('+f.url+') |'),''];
await writeFile('docs/CATALOGO_FUNCIONES_2026-09-30.md',report.join('\n'));
console.log(functions.length+' catalogued; '+available+' enabled; '+(functions.length-available)+' pending; all help URL shapes valid.');
