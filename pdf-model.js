export const PDF_LIMITS={bytes:25*1024*1024,pages:300,sources:8,annotations:500};
export const newPDFSession=()=>({version:1,id:crypto.randomUUID(),name:'Documento PDF',sources:[],pages:[]});
export const normalRotation=n=>((n%360)+360)%360;
const pageIds=(state,ids)=>{const wanted=new Set(ids);if(!wanted.size||[...wanted].some(id=>!state.pages.some(p=>p.id===id)))throw Error('Selecciona páginas de este documento.');return wanted;};
export function editablePDF(state){const blocked=state.sources.find(s=>s.readOnlyReason);if(blocked)throw Error(blocked.readOnlyReason);}
export function validatePDFSession(state){
 if(state?.version!==1||!Array.isArray(state.sources)||!Array.isArray(state.pages)||state.sources.length>PDF_LIMITS.sources||state.pages.length>PDF_LIMITS.pages)throw Error('El borrador PDF no tiene una estructura válida.');
 if(!String(state.name).trim()||String(state.name).length>120)throw Error('Escribe un nombre de hasta 120 caracteres.');
 if(state.sources.some(s=>!s||typeof s.id!=='string'||!s.id||!Number.isInteger(s.pageCount)||s.pageCount<1||s.pageCount>PDF_LIMITS.pages))throw Error('Un archivo de origen del borrador no es válido.');
 const sources=new Map(state.sources.map(s=>[s.id,s]));if(sources.size!==state.sources.length)throw Error('Hay archivos de origen duplicados.');
 const ids=new Set();for(const p of state.pages){const source=sources.get(p?.sourceId);if(!p||typeof p.id!=='string'||!p.id||!source||ids.has(p.id)||!Number.isInteger(p.index)||p.index<0||p.index>=source.pageCount||![0,90,180,270].includes(p.rotation)||!Array.isArray(p.annotations)||p.annotations.length>PDF_LIMITS.annotations)throw Error('Una página del borrador PDF no es válida.');ids.add(p.id);for(const a of p.annotations)validateAnnotation(a);}
 return state;
}
export function appendPDFSource(state,source){
 if(state.pages.length)editablePDF(state);
 if(state.sources.length>=PDF_LIMITS.sources||state.pages.length+source.pageCount>PDF_LIMITS.pages)throw Error('Puedes trabajar con hasta 8 archivos y 300 páginas por sesión.');
 if(!source.id||state.sources.some(s=>s.id===source.id)||!Number.isInteger(source.pageCount)||source.pageCount<1)throw Error('El archivo PDF no contiene páginas válidas.');
 if(state.pages.length&&source.readOnlyReason)throw Error(source.readOnlyReason);
 const pages=Array.from({length:source.pageCount},(_,index)=>({id:crypto.randomUUID(),sourceId:source.id,index,rotation:0,annotations:[]}));state.sources.push(source);state.pages.push(...pages);return pages;
}
export function parsePDFRange(state,text){
 const numbers=new Set();for(const token of String(text).trim().split(',')){const match=/^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(token);if(!match)throw Error('Escribe páginas como 1, 3-5.');const a=+match[1],b=+(match[2]||a);if(a<1||b<a||b>state.pages.length)throw Error('El rango debe quedar dentro de las páginas del documento.');for(let i=a;i<=b;i++)numbers.add(i);}
 return [...numbers].sort((a,b)=>a-b).map(n=>state.pages[n-1].id);
}
export function rotatePDFPages(state,ids,delta=90){editablePDF(state);const wanted=pageIds(state,ids);if(!Number.isInteger(delta)||delta%90)throw Error('El giro debe ser de 90 grados.');for(const p of state.pages)if(wanted.has(p.id))p.rotation=normalRotation(p.rotation+delta);}
export function deletePDFPages(state,ids){editablePDF(state);const wanted=pageIds(state,ids);if(wanted.size===state.pages.length)throw Error('Conserva al menos una página en el documento.');state.pages=state.pages.filter(p=>!wanted.has(p.id));}
export function duplicatePDFPages(state,ids){editablePDF(state);const wanted=pageIds(state,ids);if(state.pages.length+wanted.size>PDF_LIMITS.pages)throw Error('El máximo es 300 páginas.');state.pages=state.pages.flatMap(p=>wanted.has(p.id)?[p,{...structuredClone(p),id:crypto.randomUUID(),annotations:p.annotations.map(a=>({...structuredClone(a),id:crypto.randomUUID()}))}]:[p]);}
export function movePDFPages(state,ids,delta){editablePDF(state);const wanted=pageIds(state,ids);if(!Number.isInteger(delta))throw Error('Elige una posición válida.');const first=state.pages.findIndex(p=>wanted.has(p.id)),moving=state.pages.filter(p=>wanted.has(p.id)),others=state.pages.filter(p=>!wanted.has(p.id)),at=Math.max(0,Math.min(others.length,first+delta));others.splice(at,0,...moving);state.pages=others;}
export function validateAnnotation(a){
 if(!a||!['text','highlight','rectangle','pen'].includes(a.kind)||!/^#[0-9a-f]{6}$/i.test(a.color)||!Number.isFinite(a.width)||a.width<.5||a.width>12)throw Error('La anotación no tiene un formato válido.');
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
 if(a.kind==='text'){if(!Array.isArray(a.lines)||!a.lines.length||a.lines.length>100||a.lines.some(s=>typeof s!=='string'||s.length>2000)||!Array.isArray(a.points)||a.points.length!==a.lines.length||!a.points.every(point)||!Number.isFinite(a.size)||a.size<8||a.size>72||![0,90,180,270].includes(a.rotation))throw Error('El texto o su posición no son válidos.');}
 else if(a.kind==='pen'){if(!Array.isArray(a.points)||a.points.length<2||a.points.length>3000||!a.points.every(point))throw Error('El trazo no es válido.');}
 else if(![a.x,a.y,a.w,a.h].every(Number.isFinite)||a.w<=0||a.h<=0)throw Error('Dibuja un área dentro de la página.');
 return a;
}
export function addPDFAnnotation(state,id,annotation){editablePDF(state);const p=state.pages.find(p=>p.id===id);if(!p||p.annotations.length>=PDF_LIMITS.annotations)throw Error('No se puede añadir otra anotación en esta página.');validateAnnotation(annotation);p.annotations.push({...structuredClone(annotation),id:crypto.randomUUID()});}
export function removePDFAnnotation(state,pageId,id){editablePDF(state);const p=state.pages.find(p=>p.id===pageId);if(!p||!p.annotations.some(a=>a.id===id))throw Error('La anotación ya no está disponible.');p.annotations=p.annotations.filter(a=>a.id!==id);}
export function makeTextAnnotation(text,x,y,viewport,{size=14,color='#174d38',font}={}){
 text=String(text).trim();if(!text||text.length>2000)throw Error('Escribe un texto de hasta 2000 caracteres.');if(!Number.isFinite(size)||size<8||size>72)throw Error('Usa un tamaño entre 8 y 72 puntos.');
 font.encodeText(text.replace(/\n/g,''));const maxWidth=(viewport.width-x)/viewport.scale-8;if(maxWidth<size*2)throw Error('Coloca el texto más lejos del borde derecho.');
 const lines=[];for(const paragraph of text.split('\n')){let line='';for(const character of paragraph){if(font.widthOfTextAtSize(line+character,size)>maxWidth&&line){lines.push(line);line='';}line+=character;}lines.push(line);}
 if(lines.length>100||y+(size+((lines.length-1)*size*1.3)+4)*viewport.scale>viewport.height)throw Error('El texto no cabe en esa posición. Colócalo más arriba o reduce su tamaño.');
 return validateAnnotation({kind:'text',lines,points:lines.map((_,i)=>viewport.convertToPdfPoint(x,y+(size+i*size*1.3)*viewport.scale)),size,color,width:1,rotation:normalRotation(viewport.rotation)});
}
export async function inspectPDFSource(bytes,name,lib){
 if(!(bytes instanceof Uint8Array)||bytes.length>PDF_LIMITS.bytes)throw Error('Cada PDF puede tener hasta 25 MB.');
 if(!new TextDecoder('ascii').decode(bytes.slice(0,1024)).includes('%PDF-'))throw Error('El archivo no es un PDF válido.');
 let doc;try{doc=await lib.PDFDocument.load(bytes,{updateMetadata:false});}catch(e){if(/encrypt/i.test(e.message))throw Error('El PDF está protegido con contraseña. Abre una copia sin contraseña para trabajar aquí.');throw Error('No se pudo leer el PDF. Comprueba que el archivo esté completo.');}
 if(!doc.getPageCount()||doc.getPageCount()>PDF_LIMITS.pages)throw Error('El documento puede tener entre 1 y 300 páginas.');
 let forms=false,signed=false;
 for(const [,obj] of doc.context.enumerateIndirectObjects())if(obj instanceof lib.PDFDict){const ft=obj.get(lib.PDFName.of('FT'))?.toString(),type=obj.get(lib.PDFName.of('Type'))?.toString(),value=obj.get(lib.PDFName.of('V'));if(type==='/Sig'||(ft==='/Sig'&&value&&value!==lib.PDFNull))signed=true;if(ft||obj.get(lib.PDFName.of('Subtype'))?.toString()==='/Widget')forms=true;}
 const reason=signed?'Este PDF contiene una firma digital. Puedes consultarlo y descargar el original.':forms?'Este PDF contiene campos de formulario. Puedes consultarlo y descargar el original.':'';
 return {id:crypto.randomUUID(),name:String(name).slice(0,200),pageCount:doc.getPageCount(),readOnlyReason:reason};
}
export async function exportPDFSession(state,originals,lib,{ids}={}){
 validatePDFSession(state);if(!state.pages.length)throw Error('Abre un PDF o crea una página antes de descargar.');const wanted=ids?pageIds(state,ids):null,pages=state.pages.filter(p=>!wanted||wanted.has(p.id));
 const original=originals.get(state.sources[0]?.id),same=state.sources.length===1&&pages.length===state.sources[0].pageCount&&pages.every((p,i)=>p.index===i&&p.rotation===0&&!p.annotations.length);
 if(same&&original)return original.bytes.slice();editablePDF(state);
 const output=await lib.PDFDocument.create(),loaded=new Map(),font=await output.embedFont(lib.StandardFonts.Helvetica);
 const rgb=hex=>lib.rgb(...hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255));
 for(const entry of pages){const source=originals.get(entry.sourceId);if(!source)throw Error('Falta el archivo original de una página. Vuelve a abrirlo.');if(!loaded.has(entry.sourceId))loaded.set(entry.sourceId,await lib.PDFDocument.load(source.bytes,{updateMetadata:false}));const [page]=await output.copyPages(loaded.get(entry.sourceId),[entry.index]);output.addPage(page);page.setRotation(lib.degrees(normalRotation(page.getRotation().angle+entry.rotation)));
  for(const a of entry.annotations){const color=rgb(a.color);if(a.kind==='text')a.lines.forEach((line,i)=>page.drawText(line,{x:a.points[i][0],y:a.points[i][1],font,size:a.size,color,rotate:lib.degrees(a.rotation)}));else if(a.kind==='pen')for(let i=1;i<a.points.length;i++)page.drawLine({start:{x:a.points[i-1][0],y:a.points[i-1][1]},end:{x:a.points[i][0],y:a.points[i][1]},color,thickness:a.width});else page.drawRectangle({x:a.x,y:a.y,width:a.w,height:a.h,...(a.kind==='highlight'?{color,opacity:.3}:{borderColor:color,borderWidth:a.width})});}
 }
 output.setTitle(state.name);output.setCreator('Arles · Motor PDF');return output.save();
}
