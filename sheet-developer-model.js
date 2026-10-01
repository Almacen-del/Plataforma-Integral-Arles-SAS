import {ROWS,COLS,range,position,address,value,display,writeCells,writable} from './sheet-model.js';
import {cellEditable} from './sheet-protection.js';

export const CONTROL_TYPES={checkbox:'Casilla',radio:'Botón de opción',combo:'Cuadro combinado',list:'Cuadro de lista',spin:'Control de número',scroll:'Barra de desplazamiento',label:'Etiqueta',group:'Cuadro de grupo',button:'Botón',text:'Entrada de texto (web)'};
const bound=new Set(['checkbox','radio','combo','list','spin','scroll','text']);
const numeric=new Set(['spin','scroll']);
export const controlItems=(s,o)=>o.inputRange?range(o.inputRange).map(ref=>display(s,ref)):[];
export function controlPosition(s,ref){const [r,c]=position(ref);return {x:(s.hideHeadings?0:43)+Array.from({length:c},(_,i)=>(s.hiddenColumns||[]).includes(i)?0:s.columnWidths?.[i]||s.defaultWidth||112).reduce((a,b)=>a+b,0),y:(s.hideHeadings?0:25)+Array.from({length:r},(_,i)=>(s.hiddenRows||[]).includes(i)?0:s.rowHeights?.[i]||27).reduce((a,b)=>a+b,0)};}
export function validateControl(s,draft,id=null){
 const o={...structuredClone(draft)};
 if(!CONTROL_TYPES[o.kind])throw Error('Selecciona un control disponible.');
 o.title=String(o.title||CONTROL_TYPES[o.kind]).trim();if(!o.title||o.title.length>100)throw Error('El título debe tener entre 1 y 100 caracteres.');
 for(const [key,min,max] of [['x',0,14000],['y',0,20000],['width',80,1000],['height',28,800]]){o[key]=Number(o[key]);if(!Number.isFinite(o[key])||o[key]<min||o[key]>max)throw Error('Revisa posición y tamaño del control.');}
 o.font=o.font||'Arial';o.fontSize=Number(o.fontSize||11);o.color=o.color||'#203d31';o.fill=o.fill||'#ffffff';if(!['Arial','Calibri','Verdana','Georgia','Courier New'].includes(o.font)||!Number.isFinite(o.fontSize)||o.fontSize<8||o.fontSize>36||![o.color,o.fill].every(c=>/^#[a-f\d]{6}$/i.test(c)))throw Error('Revisa fuente, tamaño y colores del control.');
 o.linkedCell=String(o.linkedCell||'').trim().toUpperCase();o.inputRange=['combo','list'].includes(o.kind)?String(o.inputRange||'').trim().toUpperCase():'';if(['group','button'].includes(o.kind))o.linkedCell='';
 if(o.linkedCell){if(range(o.linkedCell).length!==1)throw Error('El vínculo debe ser una sola celda.');position(o.linkedCell);}
 if(bound.has(o.kind)&&!o.linkedCell)throw Error('El control necesita una celda vinculada.');
 if(bound.has(o.kind)&&!cellEditable(s,o.linkedCell))throw Error('La celda vinculada está protegida.');
 if(bound.has(o.kind)&&String(s.cells[o.linkedCell]?.raw||'').startsWith('=')&&!s.cells[o.linkedCell]?.textValue)throw Error('El vínculo no puede reemplazar una fórmula.');
 if((s.merges||[]).some(m=>range(m).includes(o.linkedCell)&&range(m)[0]!==o.linkedCell))throw Error('Vincula la esquina superior izquierda de la combinación.');
 if(bound.has(o.kind)&&(s.formControls||[]).some(v=>v.id!==id&&v.linkedCell===o.linkedCell&&!(v.kind==='radio'&&o.kind==='radio')))throw Error('Otro control ya escribe en esa celda. Los botones de opción sí pueden compartirla.');
 if(['combo','list'].includes(o.kind)){const refs=range(o.inputRange);if(new Set(refs.map(r=>position(r)[0])).size>1&&new Set(refs.map(r=>position(r)[1])).size>1)throw Error('El rango de entrada debe ser una fila o una columna.');if(refs.includes(o.linkedCell))throw Error('El vínculo no debe formar parte de la lista de entrada.');}
 if(numeric.has(o.kind)){for(const k of ['min','max','step','pageStep'])o[k]=Number(o[k]);if(![o.min,o.max,o.step,o.pageStep].every(Number.isInteger)||o.min<0||o.max>30000||o.min>=o.max||o.step<1||o.step>o.max-o.min||o.pageStep<1||o.pageStep>o.max-o.min)throw Error('Usa límites enteros entre 0 y 30000 e incrementos positivos dentro del intervalo.');}
 if(o.kind==='radio'){o.option=Number(o.option);if(!Number.isInteger(o.option)||o.option<1||o.option>100)throw Error('El número de opción debe estar entre 1 y 100.');if((s.formControls||[]).some(v=>v.id!==id&&v.kind==='radio'&&v.linkedCell===o.linkedCell&&v.option===o.option))throw Error('Ese número de opción ya existe en el grupo vinculado.');}
 if(o.kind==='button'){if(!['navigate','save','calculate'].includes(o.action))throw Error('Selecciona una acción disponible.');if(o.action==='navigate')position(o.destination);}
 o.enabled=o.enabled!==false;o.print=o.print!==false;o.orientation=o.orientation==='vertical'?'vertical':'horizontal';
 return o;
}
export function setControlValue(s,o,input){
 if(!o.enabled)throw Error('El control está deshabilitado.');if(!bound.has(o.kind))throw Error('Este control no escribe valores.');
 if(String(s.cells[o.linkedCell]?.raw||'').startsWith('=')&&!s.cells[o.linkedCell]?.textValue)throw Error('La celda vinculada contiene una fórmula.');
 let raw;
 if(o.kind==='checkbox'){if(typeof input!=='boolean')throw Error('Selecciona verdadero o falso.');raw=input?'VERDADERO':'FALSO';}
 else if(o.kind==='text')raw="'"+String(input);
 else {const n=Number(input);if(!Number.isInteger(n))throw Error('El valor debe ser entero.');if(['combo','list'].includes(o.kind)&&(n<0||n>controlItems(s,o).length))throw Error('La opción no pertenece a la lista.');if(o.kind==='radio'&&n!==o.option)throw Error('La opción no coincide con el control.');if(numeric.has(o.kind)&&(n<o.min||n>o.max))throw Error('El valor queda fuera de los límites.');raw=String(n);}
 writeCells(s,{[o.linkedCell]:raw});
}
export function saveControl(s,draft,id=null){
 writable(s);const o=validateControl(s,draft,id),empty=o.linkedCell&&(s.cells[o.linkedCell]?.raw??'')==='';o.id=id||crypto.randomUUID();const at=(s.formControls||[]).findIndex(v=>v.id===o.id);if(id&&at<0)throw Error('El control ya no existe.');
 if(bound.has(o.kind)&&!empty){const current=value(s,o.linkedCell);if(o.kind==='checkbox'&&typeof current!=='boolean')throw Error('La celda vinculada debe estar vacía o contener un valor lógico.');if(['combo','list','spin','scroll','radio'].includes(o.kind)&&(!Number.isInteger(current)||current<(numeric.has(o.kind)?o.min:0)||current>(numeric.has(o.kind)?o.max:o.kind==='radio'?100:controlItems(s,o).length)))throw Error('El valor de la celda vinculada no es compatible con el control.');}
 if(bound.has(o.kind)&&empty){if(o.kind==='radio')writeCells(s,{[o.linkedCell]:'0'});else setControlValue(s,{...o,enabled:true},o.kind==='checkbox'?false:o.kind==='text'?'':numeric.has(o.kind)?o.min:0);}
 s.formControls||=[];if(at<0)s.formControls.push(o);else s.formControls[at]=o;return o;
}

export const XML_TYPES={string:'Texto',decimal:'Decimal',integer:'Entero',boolean:'Lógico',date:'Fecha ISO'};
export const xmlFieldKey=f=>(f.attribute?'@':'')+'{'+(f.ns||'')+'}'+f.name;
const name=n=>{if(!/^[\p{L}_][\p{L}\p{N}\p{M}_.-]*$/u.test(n||''))throw Error('Los nombres XML deben usar letras, números, punto, guion o guion bajo.');return n;};
const nodeName=n=>({name:n.localName,ns:n.namespaceURI||''});
const same=(n,f)=>n.localName===f.name&&(n.namespaceURI||'')===(f.ns||'');
export function parseXML(text,Parser=globalThis.DOMParser){
 if(!Parser)throw Error('Se necesita el parser XML del navegador.');if(String(text).length>1000000)throw Error('El XML supera 1 MB.');
 if(/<!\s*(DOCTYPE|ENTITY)/i.test(text))throw Error('No se admiten DTD ni entidades externas.');
 const doc=new Parser().parseFromString(String(text),'application/xml');if(doc.querySelector('parsererror')||!doc.documentElement)throw Error('El archivo XML no es válido.');return doc;
}
export function readXML(text,Parser,expected){
 const doc=parseXML(text,Parser),root=doc.documentElement;name(root.localName);
 if(root.namespaceURI==='http://www.w3.org/2001/XMLSchema')return readSchema(text,Parser);
 const children=[...root.children];if(!children.length){if(expected?.row)return {...structuredClone(expected),root:nodeName(root),records:[],rootAttributes:[...root.attributes].filter(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/').map(nodeName),template:String(text),schema:false};if(![...root.attributes].some(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/'))throw Error('El XML está vacío. Añade un esquema XSD para definir sus campos.');}
 let rows,row=null;if(expected?.row&&children.every(n=>same(n,expected.row))){row=expected.row;rows=children;}else if(children.every(n=>!n.children.length)&&!children.some(n=>[...n.attributes].some(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/')))rows=[root];else {row=nodeName(children[0]);if(children.some(n=>!same(n,row)))throw Error('Se admite un único tipo de registro plano debajo de la raíz.');rows=children;}
 const fields=new Map(),records=[];
 for(const element of rows){if([...element.childNodes].some(n=>[3,4].includes(n.nodeType)&&n.textContent.trim()))throw Error('El registro contiene texto mezclado con campos o atributos.');const record={};for(const n of element.children){name(n.localName);if(n.children.length||[...n.attributes].some(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/'))throw Error('Los campos XML deben ser simples, sin elementos anidados ni atributos.');const field={...nodeName(n),type:'string',required:false},key=xmlFieldKey(field);if(Object.hasOwn(record,key))throw Error('Un registro repite un campo XML.');fields.set(key,field);record[key]=n.textContent;}
  for(const a of element.attributes){if(a.namespaceURI==='http://www.w3.org/2000/xmlns/')continue;name(a.localName);const field={...nodeName(a),attribute:true,type:'string',required:false},key=xmlFieldKey(field);fields.set(key,field);record[key]=a.value;}records.push(record);
 }
 if(!fields.size||fields.size>COLS)throw Error('El mapa necesita entre 1 y 26 campos.');return {root:nodeName(root),row,fields:[...fields.values()],records,rootAttributes:[...root.attributes].filter(a=>a.namespaceURI!=='http://www.w3.org/2000/xmlns/').map(nodeName),template:String(text),schema:false};
}
function readSchema(text,Parser){
 const doc=parseXML(text,Parser),schema=doc.documentElement,NS='http://www.w3.org/2001/XMLSchema',allowed=new Set(['schema','element','complexType','sequence','attribute','annotation','documentation']);
 for(const n of doc.querySelectorAll('*'))if(n.namespaceURI===NS&&!allowed.has(n.localName))throw Error('El esquema usa '+n.localName+', que no pertenece al subconjunto XSD plano admitido.');
 const xs=(n,kind)=>[...n.children].filter(c=>c.namespaceURI===NS&&c.localName===kind),elements=xs(schema,'element');if(elements.length!==1)throw Error('El esquema debe tener una sola raíz global.');
 const ns=schema.getAttribute('targetNamespace')||'',qualified=schema.getAttribute('elementFormDefault')==='qualified',rootElement=elements[0],root={name:name(rootElement.getAttribute('name')),ns};
 const complex=e=>{if(e.hasAttribute('ref')||e.getAttribute('nillable')==='true')throw Error('No se admiten referencias ni elementos nulos en este esquema.');const inline=xs(e,'complexType')[0];if(inline)return inline;const type=e.getAttribute('type')?.split(':').at(-1);return xs(schema,'complexType').find(n=>n.getAttribute('name')===type);};
 const outer=complex(rootElement);if(!outer)throw Error('La raíz necesita un tipo complejo con una secuencia de campos.');const sequence=xs(outer,'sequence')[0];if(!sequence)throw Error('La raíz necesita una secuencia XSD.');let leafParent=outer,leafSequence=sequence,row=null,minRows=1;
 let maxRows=1;const first=xs(sequence,'element');if(first.length===1&&complex(first[0])){row={name:name(first[0].getAttribute('name')),ns:qualified?ns:''};leafParent=complex(first[0]);leafSequence=xs(leafParent,'sequence')[0];minRows=Number(first[0].getAttribute('minOccurs')||1);maxRows=first[0].getAttribute('maxOccurs')==='unbounded'?ROWS:Number(first[0].getAttribute('maxOccurs')||1);if(xs(outer,'attribute').length)throw Error('Los atributos de la raíz junto a registros repetidos no se admiten en este subconjunto XSD.');if(!leafSequence)throw Error('El registro debe contener una secuencia de campos simples.');}
 const fields=[];for(const e of [...xs(leafSequence,'element'),...xs(leafParent,'attribute')]){if(complex(e)||e.hasAttribute('ref')||e.getAttribute('nillable')==='true'||e.getAttribute('maxOccurs')&&e.getAttribute('maxOccurs')!=='1')throw Error('Los campos deben ser simples y no repetidos.');const original=e.getAttribute('type')?.split(':').at(-1)||'string',type=({int:'integer',long:'integer',short:'integer',float:'decimal',double:'decimal'})[original]||original;if(!XML_TYPES[type])throw Error('Tipo XSD no disponible: '+original);const attribute=e.localName==='attribute';fields.push({name:name(e.getAttribute('name')),ns:attribute?(schema.getAttribute('attributeFormDefault')==='qualified'?ns:''):(qualified?ns:''),attribute,type,xsdType:original,required:attribute?e.getAttribute('use')==='required':e.getAttribute('minOccurs')!=='0'});}
 if(!fields.length||fields.length>COLS||new Set(fields.map(xmlFieldKey)).size!==fields.length)throw Error('El esquema necesita entre 1 y 26 campos diferentes.');if(!Number.isInteger(minRows)||!Number.isInteger(maxRows)||minRows<0||maxRows<minRows||maxRows<1)throw Error('Revisa la cantidad de registros del esquema.');return {root,row,fields,records:[],template:'',schema:true,schemaText:String(text),minRows,maxRows};
}
export function validateXMLValue(input,field){const text=String(input??'');if(field.xsdType==='decimal'&&/[eE]/.test(text))throw Error(field.name+': el tipo xs:decimal no admite exponentes.');if(['int','short'].includes(field.xsdType)&&Number.isFinite(Number(text))&&(Number(text)<(field.xsdType==='int'?-2147483648:-32768)||Number(text)>(field.xsdType==='int'?2147483647:32767)))throw Error(field.name+': el número supera los límites del tipo XSD.');if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/.test(text)||text.isWellFormed&&!text.isWellFormed())throw Error(field.name+': el texto contiene caracteres no válidos para XML 1.0.');if(text===''){if(field.required)throw Error(field.name+': falta un valor obligatorio.');return '';}
 switch(field.type){case 'integer':if(!/^[+-]?\d+$/.test(text)||!Number.isSafeInteger(Number(text)))throw Error(field.name+': se necesita un entero seguro.');return Number(text);case 'decimal':if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)||!Number.isFinite(Number(text)))throw Error(field.name+': se necesita un decimal XML.');return Number(text);case 'boolean':if(!['true','false','1','0'].includes(text))throw Error(field.name+': usa true, false, 1 o 0.');return text==='true'||text==='1';case 'date':if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(Date.parse(text))||new Date(text).toISOString().slice(0,10)!==text)throw Error(field.name+': usa una fecha válida AAAA-MM-DD.');return text;default:return text;}
}
export function createXMLMap(s,source,{title='Mapa XML',start='A1',headers=true,rowCount=source.records.length||1}={}){
 writable(s);position(start);title=String(title).trim();if(!title||title.length>80||(s.xmlMaps||[]).some(m=>m.title.toLowerCase()===title.toLowerCase()))throw Error('Usa un nombre de mapa único, de hasta 80 caracteres.');
 const m={id:crypto.randomUUID(),...structuredClone(source),title,start,headers,rowCount:Number(rowCount),structureRevision:s.structureRevision||0,loaded:{}};mapRefs(s,m);s.xmlMaps||=[];s.xmlMaps.push(m);return m;
}
export function mapRefs(s,m,count=m.rowCount){
 if((m.structureRevision||0)!==(s.structureRevision||0))throw Error('La estructura cambió. Recrea el mapa para revisar sus destinos.');const [r,c]=position(m.start);if(!Number.isInteger(count)||count<0||count>ROWS||count>(m.maxRows??ROWS)||r+count+(m.headers?1:0)>ROWS||c+m.fields.length>COLS||!m.row&&count>1)throw Error('El mapa no cabe en A1:Z100 o el XML limita la cantidad de registros.');
 const rows=Array.from({length:count},(_,i)=>m.fields.map((_,j)=>address(r+i+(m.headers?1:0),c+j))),head=m.headers?m.fields.map((_,j)=>address(r,c+j)):[];return {rows,head,refs:[...head,...rows.flat()]};
}
export function loadXMLMap(s,m,incoming,{overwrite=false}={}){
 writable(s);if(JSON.stringify(incoming.root)!==JSON.stringify(m.root)||JSON.stringify(incoming.row)!==JSON.stringify(m.row))throw Error('La raíz, los registros o el espacio de nombres no coinciden con el mapa.');
 if(incoming.schema)throw Error('Importa un archivo XML de datos, no un esquema.');if(incoming.records.length<(m.minRows??0))throw Error('El esquema exige registros.');if(m.schema){const keys=m.fields.map(xmlFieldKey);if(incoming.fields.some(f=>!keys.includes(xmlFieldKey(f)))||m.row&&incoming.rootAttributes?.length)throw Error('El XML contiene campos o atributos que no pertenecen al esquema.');for(const record of incoming.records){const order=Object.keys(record).filter(k=>!k.startsWith('@')).map(k=>keys.indexOf(k));if(order.some((n,i)=>i&&n<order[i-1]))throw Error('El orden de los campos no coincide con la secuencia XSD.');}}
 const {rows,head,refs}=mapRefs(s,m,incoming.records.length),changes={};
 head.forEach((ref,i)=>changes[ref]="'"+(m.fields[i].attribute?'@':'')+m.fields[i].name);
 rows.forEach((row,i)=>row.forEach((ref,j)=>{const field=m.fields[j],v=validateXMLValue(incoming.records[i][xmlFieldKey(field)]??'',field);changes[ref]=typeof v==='boolean'?(v?'VERDADERO':'FALSO'):typeof v==='number'?String(v):"'"+v;}));
 for(const [ref,raw] of Object.entries(changes)){const old=s.cells[ref]?.raw||'';if(old===raw)continue;if(old.startsWith('=')&&!s.cells[ref]?.textValue)throw Error(ref+': el destino contiene una fórmula.');if(old&&old!==m.loaded[ref]&&!overwrite)throw Error(ref+': el destino contiene datos. Marca Reemplazar valores para continuar.');}
 for(const [ref,raw] of Object.entries(m.loaded||{}))if(!refs.includes(ref)&&s.cells[ref]?.raw===raw)changes[ref]='';
 for(const other of s.xmlMaps||[])if(other.id!==m.id&&(other.structureRevision||0)===(s.structureRevision||0)&&mapRefs(s,other).refs.some(ref=>refs.includes(ref)))throw Error('El destino se superpone a otro mapa XML.');
 writeCells(s,changes);m.rowCount=incoming.records.length;m.loaded=Object.fromEntries(refs.map(ref=>[ref,changes[ref]]));m.template=incoming.template;m.records=structuredClone(incoming.records);return refs;
}
export function exportXMLMap(s,m,{Parser=globalThis.DOMParser,Serializer=globalThis.XMLSerializer}={}){
 const {rows}=mapRefs(s,m);if(rows.length<(m.minRows??0))throw Error('El esquema exige registros.');
 let doc=m.template?parseXML(m.template,Parser):new Parser().parseFromString('<root/>','application/xml');
 if(!m.template){const root=doc.createElementNS(m.root.ns||null,m.root.name);if(m.root.ns)root.setAttribute('xmlns',m.root.ns);doc.replaceChild(root,doc.documentElement);}
 const root=doc.documentElement,old=m.row?[...root.children].filter(n=>same(n,m.row)):[root],output=[];
 for(let i=0;i<rows.length;i++){const element=m.row?(old[i]?.cloneNode(true)||doc.createElementNS(m.row.ns||null,m.row.name)):root;for(let j=0;j<m.fields.length;j++){const field=m.fields[j],ref=rows[i][j],v=value(s,ref);if(String(s.cells[ref]?.raw||'').startsWith('=')&&String(v).startsWith('#'))throw Error(ref+': la fórmula devuelve un error.');let text=typeof v==='boolean'?(v?'true':'false'):String(v);const parsed=validateXMLValue(text,field);if(parsed==='')text='';
   if(m.schema&&parsed===''&&!field.required){if(field.attribute)element.removeAttributeNS(field.ns||null,field.name);else [...element.children].find(n=>same(n,field))?.remove();continue;}
   if(field.attribute){if(field.ns){const prefix=root.lookupPrefix(field.ns)||'a'+j;root.setAttributeNS('http://www.w3.org/2000/xmlns/','xmlns:'+prefix,field.ns);element.setAttributeNS(field.ns,prefix+':'+field.name,text);}else element.setAttribute(field.name,text);}else{let node=[...element.children].find(n=>same(n,field));if(!node){node=doc.createElementNS(field.ns||null,field.name);if(!field.ns&&element.namespaceURI)node.setAttribute('xmlns','');element.append(node);}node.textContent=text;}}
  if(m.schema)for(const f of m.fields.filter(f=>!f.attribute)){const n=[...element.children].find(n=>same(n,f));if(n)element.append(n);}
  if(m.row)output.push(element);
 }
 if(m.row){old.forEach(n=>n.remove());output.forEach(n=>root.append(n));}
 return '<?xml version="1.0" encoding="UTF-8"?>\n'+new Serializer().serializeToString(doc);
}
