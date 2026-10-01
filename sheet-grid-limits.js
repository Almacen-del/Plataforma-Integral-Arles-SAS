export const MAX_ROWS=100000,MAX_COLS=256;
export let ROWS=100,COLS=26;
export function setGridBounds(rows=100,columns=26){
 if(!Number.isInteger(rows)||!Number.isInteger(columns)||rows<1||columns<1||rows>MAX_ROWS||columns>MAX_COLS)throw Error('El libro supera el límite de lectura: 100.000 filas o 256 columnas.');
 ROWS=Math.max(100,rows);COLS=Math.max(26,columns);
}
export function columnName(index){let name='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))name=String.fromCharCode(65+(n-1)%26)+name;return name;}
export function columnIndex(name){let n=0;for(const c of name.toUpperCase())n=n*26+c.charCodeAt(0)-64;return n-1;}
export function workbookBounds(book){setGridBounds(Math.max(100,...book.sheets.map(s=>s.rowCount||100)),Math.max(26,...book.sheets.map(s=>s.columnCount||26)));}
