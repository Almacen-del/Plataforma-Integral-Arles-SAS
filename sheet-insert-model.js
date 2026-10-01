import {range,position,address,value} from './sheet-model.js';
import {chartTypes,histogramBins} from './sheet-insert-charts.js';

export const operations={sum:'Suma',count:'Recuento',countNumbers:'Recuento de números',average:'Promedio',min:'Mínimo',max:'Máximo',product:'Producto',stdev:'Desviación estándar (muestra)',stdevp:'Desviación estándar (población)',variance:'Varianza (muestra)',variancep:'Varianza (población)'};
export const calculations={normal:'Valor',grand:'% del total general',row:'% del total de fila',column:'% del total de columna'};
const numeric=v=>typeof v==='number'&&Number.isFinite(v);
const tuple=values=>JSON.stringify(values);
const label=v=>v===''?'(Vacío)':String(v);

export function records(sheet,source){
 const points=range(source).map(position),rows=[...new Set(points.map(p=>p[0]))],cols=[...new Set(points.map(p=>p[1]))];
 if(rows.length<2)throw Error('Selecciona encabezados y al menos una fila de datos.');
 const headers=cols.map(c=>{const v=value(sheet,address(rows[0],c));return v===''?address(rows[0],c):String(v);});
 return {headers,cols,rows:rows.slice(1).map(r=>({r,values:cols.map(c=>value(sheet,address(r,c)))}))};
}

export function dateKey(v){
 if(numeric(v)){
  // Excel's fictitious 29/02/1900 has no ISO date.
  if(v<1||v>=2958466||Math.floor(v)===60)return null;
  const date=new Date(Date.UTC(1899,11,31)+(Math.floor(v)-(v>60?1:0))*86400000);
  return Number.isFinite(date.getTime())?date.toISOString().slice(0,10):null;
 }
 const text=String(v).slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return null;
 const date=new Date(text+'T00:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===text?text:null;
}

export function timelinePeriods(sheet,object){
 const groups=new Map();
 for(const row of records(sheet,object.source).rows){
  const date=dateKey(row.values[object.field||0]);if(!date)continue;
  const year=date.slice(0,4),month=Number(date.slice(5,7)),unit=object.period||'month';
  let key=date,from=date,to=date;
  if(unit==='year'){key=year;from=year+'-01-01';to=year+'-12-31';}
  if(unit==='quarter'){const q=Math.ceil(month/3);key=year+' · T'+q;from=year+'-'+String(q*3-2).padStart(2,'0')+'-01';to=new Date(Date.UTC(Number(year),q*3,0)).toISOString().slice(0,10);}
  if(unit==='month'){key=date.slice(0,7);from=key+'-01';to=new Date(Date.UTC(Number(year),month,0)).toISOString().slice(0,10);}
  groups.set(key,{key,from,to});
 }
 return [...groups.values()].sort((a,b)=>a.from.localeCompare(b.from));
}

export function filteredRecords(sheet,object){
 const data=records(sheet,object.source);
 const filters=(sheet.insertObjects||[]).filter(o=>['slicer','timeline'].includes(o.kind)&&o.source===object.source&&(o.targetIds==null||o.targetIds.includes(object.id)));
 data.rows=data.rows.filter(row=>filters.every(o=>{
  const v=row.values[o.field||0];
  if(o.kind==='slicer')return !o.selected?.length||o.selected.includes(String(v));
  if(!o.from&&!o.to)return true;
  const date=dateKey(v);return date&&(!o.from||date>=o.from)&&(!o.to||date<=o.to);
 })&&(object.reportFilters||[]).every(f=>!f.selected?.length||f.selected.includes(String(row.values[f.field]))));
 return data;
}

export function aggregate(items,operation='sum'){
 if(operation==='count')return items.filter(v=>v!==''&&v!=null).length;
 const nums=items.filter(numeric),n=nums.length;
 if(operation==='countNumbers')return n;
 if(!n)return 0;
 const sum=nums.reduce((a,b)=>a+b,0),mean=sum/n;
 if(operation==='average')return mean;
 if(operation==='min')return Math.min(...nums);
 if(operation==='max')return Math.max(...nums);
 if(operation==='product')return nums.reduce((a,b)=>a*b,1);
 if(['stdev','stdevp','variance','variancep'].includes(operation)){
  const sample=['stdev','variance'].includes(operation);if(sample&&n<2)return null;
  const variance=nums.reduce((a,b)=>a+(b-mean)**2,0)/(n-(sample?1:0));
  return operation.startsWith('stdev')?Math.sqrt(variance):variance;
 }
 return sum;
}

export function pivotData(sheet,object){
 const data=filteredRecords(sheet,object),rowFields=object.rowFields||[object.rowField??0],colFields=object.colFields||(object.colField>=0?[object.colField]:[]);
 const measures=object.measures?.length?object.measures:[{field:object.valueField??1,operation:object.operation||'sum',showAs:'normal'}];
 const groups=new Map(),columns=new Map();
 for(const row of data.rows){
  const rowValues=rowFields.map(f=>row.values[f]),colValues=colFields.map(f=>row.values[f]);
  const key=tuple(rowValues),col=tuple(colValues);
  if(!groups.has(key))groups.set(key,{labels:rowValues.map(label),rows:[],cells:new Map()});
  const g=groups.get(key);g.rows.push(row);if(!g.cells.has(col))g.cells.set(col,[]);g.cells.get(col).push(row);
  if(!columns.has(col))columns.set(col,{labels:colValues.map(label),rows:[]});columns.get(col).rows.push(row);
 }
 if(!colFields.length&&!columns.size)columns.set('[]',{labels:[],rows:[]});
 const totals=!!object.totals,advanced=!!object.measures,headers=rowFields.map(f=>data.headers[f]);
 for(const column of columns.values())for(const m of measures)headers.push([...column.labels,...(advanced||measures.length>1?[m.label||operations[m.operation]+' de '+data.headers[m.field]]:column.labels.length?[]:['Resultado'])].join(' / '));
 if(totals&&colFields.length)for(const m of measures)headers.push('Total'+(measures.length>1?' / '+(m.label||data.headers[m.field]):''));
 const rowKinds=[],rows=[];
 const calc=(source,m,rowSource,columnSource)=>{
  const result=aggregate(source.map(r=>r.values[m.field]),m.operation);
  if(!m.showAs||m.showAs==='normal')return result;
  const denominator=aggregate((m.showAs==='row'?rowSource:m.showAs==='column'?columnSource:data.rows).map(r=>r.values[m.field]),m.operation);
  return denominator&&result!=null?result/denominator:null;
 };
 const append=(labels,rowSource,kind)=>{
  const row=[...labels];
  for(const [col,column] of columns)for(const m of measures)row.push(calc(rowSource.filter(r=>tuple(colFields.map(f=>r.values[f]))===col),m,rowSource,column.rows));
  if(totals&&colFields.length)for(const m of measures)row.push(calc(rowSource,m,rowSource,data.rows));
  rows.push(row);rowKinds.push(kind);
 };
 const tree=(entries,depth=0)=>{
  if(!object.subtotals||rowFields.length<2){for(const g of entries)append(g.labels,g.rows,'data');return;}
  const branches=new Map();
  for(const g of entries){const key=tuple(rowFields.slice(0,depth+1).map(f=>g.rows[0].values[f]));if(!branches.has(key))branches.set(key,[]);branches.get(key).push(g);}
  for(const branch of branches.values()){
   if(depth===rowFields.length-1)for(const g of branch)append(g.labels,g.rows,'data');
   else{tree(branch,depth+1);append([...branch[0].labels.slice(0,depth+1).map((v,i)=>i===depth?'Total '+v:v),...Array(rowFields.length-depth-1).fill('')],branch.flatMap(g=>g.rows),'subtotal');}
  }
 };
 tree([...groups.values()]);
 if(totals)append(['Total general',...Array(Math.max(0,rowFields.length-1)).fill('')],data.rows,'total');
 const percentColumns=[];let i=rowFields.length;
 for(let c=0;c<columns.size+(totals&&colFields.length?1:0);c++)for(const m of measures){if(m.showAs&&m.showAs!=='normal')percentColumns.push(i);i++;}
 return {headers,rows,rowKinds,percentColumns,rowFieldCount:rowFields.length};
}

export function chartSeries(sheet,object){
 const data=filteredRecords(sheet,object),fields=object.seriesFields?.length?object.seriesFields:[object.valueField??1];
 return {categories:data.rows.map(r=>label(r.values[object.rowField??0])),series:fields.map(field=>({field,name:data.headers[field],values:data.rows.map(r=>numeric(r.values[field])?r.values[field]:null)})),xValues:data.rows.map(r=>numeric(r.values[object.xField??object.rowField??0])?r.values[object.xField??object.rowField??0]:null),sizes:data.rows.map(r=>numeric(r.values[object.sizeField??fields[0]])?r.values[object.sizeField??fields[0]]:null)};
}

export function chartData(sheet,object){
 const d=chartSeries(sheet,object);return d.categories.map((label,i)=>({label,value:d.series[0].values[i]})).filter(p=>p.value!=null);
}

export function validateObject(sheet,o){
 if(!Number.isFinite(o.x)||!Number.isFinite(o.y)||o.x<0||o.y<0||!Number.isFinite(o.width)||!Number.isFinite(o.height)||o.width<160||o.width>1400||o.height<100||o.height>1200)throw Error('Revisa la posición y el tamaño del objeto.');
 if(['chart','pivot','slicer','timeline'].includes(o.kind)){
  const data=records(sheet,o.source),field=f=>{if(!Number.isInteger(f)||f<0||f>=data.cols.length)throw Error('El campo seleccionado no pertenece al rango.');};
  for(const k of ['rowField','valueField','field','xField','sizeField'])if(o[k]!=null)field(o[k]);
  if(o.colField!=null&&o.colField!==-1)field(o.colField);
  for(const k of ['rowFields','colFields','seriesFields'])if(o[k]!=null){if(!Array.isArray(o[k])||new Set(o[k]).size!==o[k].length||((k==='rowFields'||k==='seriesFields')&&!o[k].length))throw Error('Selecciona campos distintos.');o[k].forEach(field);}
  for(const m of o.measures||[]){field(m.field);if(!operations[m.operation]||!calculations[m.showAs||'normal'])throw Error('Cálculo de valores inválido.');}
  for(const f of o.reportFilters||[])field(f.field);
  if(o.targetIds!=null&&!Array.isArray(o.targetIds))throw Error('Conexiones de filtro inválidas.');
  if(o.kind==='timeline'){
   if(o.period&&!['year','quarter','month','day'].includes(o.period))throw Error('Período inválido.');
   if((o.from&&!dateKey(o.from))||(o.to&&!dateKey(o.to))||(o.from&&o.to&&o.from>o.to))throw Error('Revisa el intervalo de fechas.');
   if(!timelinePeriods(sheet,o).length)throw Error('El campo no contiene fechas ISO ni números de fecha válidos.');
  }
  if(o.kind==='chart'){
   const data=chartSeries(sheet,o),nums=data.series.flatMap(s=>s.values.filter(numeric)),type=o.chartType||'columns';
   if(!chartTypes[type])throw Error('Tipo de gráfico no reconocido.');
   if(!nums.length)throw Error('Los campos seleccionados no contienen números para graficar.');
   if(o.binWidth!=null&&(!Number.isFinite(o.binWidth)||o.binWidth<=0))throw Error('El ancho de intervalo debe ser positivo.');
   if(o.binCount!=null&&(!Number.isInteger(o.binCount)||o.binCount<1||o.binCount>100))throw Error('Usa de 1 a 100 intervalos.');
   if(['scatter','bubble'].includes(type)&&!data.series.some(s=>s.values.some((v,i)=>v!=null&&data.xValues[i]!=null&&(type!=='bubble'||data.sizes[i]>0))))throw Error('Selecciona pares X/Y numéricos y, para burbujas, tamaños positivos.');
   if(['pie','doughnut','funnel','pareto'].includes(type)&&data.series[0].values.some(v=>v<0))throw Error('Este gráfico necesita una primera serie con valores no negativos.');
   if(['pie','doughnut'].includes(type)&&!data.series[0].values.some(v=>v>0))throw Error('El circular necesita un total positivo.');
   if(type==='radar'&&(data.categories.length<3||nums.some(v=>v<0)))throw Error('El radial necesita tres categorías y valores no negativos.');
   if(type.startsWith('percent')&&nums.some(v=>v<0))throw Error('El apilado al 100 % necesita valores no negativos.');
   if(type==='histogram')histogramBins(data.series[0].values,o);
  }
 }
 return o;
}
