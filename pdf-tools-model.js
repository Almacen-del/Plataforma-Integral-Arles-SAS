import * as PDF from './public/vendor/pdf/pdf-lib-1.17.1.mjs';

export const PDF_TOOL_LIMITS={bytes:25*1024*1024,pages:300,sources:8,results:100,totalBytes:200*1024*1024};
export const PDF_TOOL_NAMES={merge:'Unir PDF',split:'Dividir PDF',compress:'Comprimir PDF',ocr:'Reconocer texto con OCR'};
export function pdfResultName(value){const name=String(value||'').trim().replace(/\.pdf$/i,'');if(!name||name.length>100||/[\\/:*?"<>|\x00-\x1f]/.test(name))throw Error('Escribe un nombre de hasta 100 caracteres, sin caracteres especiales de archivos.');return name;}
export function pdfPageRange(value,count){
 const pages=[];for(const token of String(value).split(',')){const match=/^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(token);if(!match)throw Error('Escribe páginas como 1, 3-5.');const start=Number(match[1]),end=Number(match[2]||start);if(start<1||end<start||end>count)throw Error('El rango debe quedar dentro de las páginas del PDF.');for(let index=start-1;index<end;index++)if(!pages.includes(index))pages.push(index);}
 return pages;
}
export function pdfSplitGroups(count,{mode='each',pagesPerPart=1,ranges=''}={}){
 let groups;if(mode==='ranges'){groups=String(ranges).split(';').map(part=>pdfPageRange(part,count));const selected=groups.flat();if(new Set(selected).size!==selected.length)throw Error('Una página no puede repetirse entre las partes.');}
 else if(mode==='each'){const size=Number(pagesPerPart);if(!Number.isInteger(size)||size<1||size>count)throw Error('Elige una cantidad de páginas por parte entre 1 y '+count+'.');groups=[];for(let start=0;start<count;start+=size)groups.push(Array.from({length:Math.min(size,count-start)},(_,i)=>start+i));}
 else throw Error('Selecciona un modo de división válido.');
 if(!groups.length||groups.length>PDF_TOOL_LIMITS.results)throw Error('Puedes generar hasta 100 partes por operación. Aumenta las páginas por parte.');return groups;
}
export async function loadToolPDF(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input instanceof Blob?await input.arrayBuffer():input);if(!bytes.length||bytes.length>PDF_TOOL_LIMITS.bytes)throw Error('Las herramientas admiten PDF de hasta 25 MB por archivo.');if(!new TextDecoder('ascii').decode(bytes.subarray(0,1024)).includes('%PDF-'))throw Error('El archivo no contiene un PDF válido.');
 let document;try{document=await PDF.PDFDocument.load(bytes,{updateMetadata:false});}catch(error){if(/encrypt/i.test(error.message))throw Error('Este PDF tiene contraseña. Usa una copia sin contraseña para estas herramientas.');throw Error('No se pudo leer el PDF. Comprueba que el archivo esté completo.');}
 const count=document.getPageCount();if(!count||count>PDF_TOOL_LIMITS.pages)throw Error('Puedes trabajar con PDF de entre 1 y 300 páginas.');
 let forms=false,signed=false;for(const [,object] of document.context.enumerateIndirectObjects())if(object instanceof PDF.PDFDict){const field=object.get(PDF.PDFName.of('FT'))?.toString(),type=object.get(PDF.PDFName.of('Type'))?.toString(),value=object.get(PDF.PDFName.of('V'));if(type==='/Sig'||field==='/Sig'&&value&&value!==PDF.PDFNull)signed=true;if(field||object.get(PDF.PDFName.of('Subtype'))?.toString()==='/Widget')forms=true;}
 if(signed)throw Error('Este PDF contiene una firma digital. Las herramientas conservan su consulta y descarga; utiliza una copia sin firma para modificarlo.');if(forms)throw Error('Este PDF contiene campos de formulario. Utiliza una copia sin campos para unir, dividir, comprimir o añadir OCR.');return {document,bytes,count};
}
export async function transformPDF({operation,files,splitMode,pagesPerPart,ranges}){
 if(!['merge','split','compress'].includes(operation))throw Error('Selecciona una herramienta PDF válida.');if(!files?.length||files.length>PDF_TOOL_LIMITS.sources)throw Error('Puedes combinar hasta 8 PDF.');if(files.reduce((sum,file)=>sum+file.byteLength,0)>PDF_TOOL_LIMITS.totalBytes)throw Error('El lote supera 200 MB.');
 const sources=[];for(const bytes of files)sources.push(await loadToolPDF(bytes));
 if(operation==='merge'){
  if(sources.length<2)throw Error('Añade al menos otro PDF para unir.');const count=sources.reduce((sum,item)=>sum+item.count,0);if(count>PDF_TOOL_LIMITS.pages)throw Error('El resultado puede contener hasta 300 páginas.');const output=await PDF.PDFDocument.create();for(const source of sources)for(const page of await output.copyPages(source.document,source.document.getPageIndices()))output.addPage(page);return [{bytes:await output.save(),pageCount:count,suffix:'',detail:count+' páginas unidas'}];
 }
 const source=sources[0];if(operation==='split'){
  const groups=pdfSplitGroups(source.count,{mode:splitMode,pagesPerPart,ranges}),results=[];for(const [index,group] of groups.entries()){const output=await PDF.PDFDocument.create();for(const page of await output.copyPages(source.document,group))output.addPage(page);results.push({bytes:await output.save(),pageCount:group.length,suffix:'-parte-'+String(index+1).padStart(2,'0'),detail:'Páginas '+group.map(n=>n+1).join(', ')});}return results;
 }
 const rewritten=await source.document.save({useObjectStreams:true}),bytes=rewritten.length<source.bytes.length?rewritten:source.bytes.slice();return [{bytes,pageCount:source.count,suffix:'',before:source.bytes.length,after:bytes.length,detail:bytes.length<source.bytes.length?'Estructura optimizada sin reducir la calidad de las imágenes.':'El PDF ya está optimizado; se conserva su calidad.'}];
}
// PDF text rendering mode 3 adds searchable words without painting over the scan.
export async function addSearchableOCR(input,records){
 const {document}=await loadToolPDF(input),font=await document.embedFont(PDF.StandardFonts.Helvetica);let words=0;
 for(const [index,record] of records){const page=document.getPage(index),fontName=page.node.newFontDictionary('ArlesOCR',font.ref);for(const word of record.words){let text=word.text;try{font.encodeText(text);}catch{ text=[...text].filter(character=>{try{font.encodeText(character);return true;}catch{return false;}}).join('');}if(!text)continue;
   const [topLeft,,bottomRight,bottomLeft]=word.quad,dx=bottomRight[0]-bottomLeft[0],dy=bottomRight[1]-bottomLeft[1],width=Math.hypot(dx,dy),height=Math.hypot(topLeft[0]-bottomLeft[0],topLeft[1]-bottomLeft[1]);if(!width||!height)continue;const size=height/.9,advance=font.widthOfTextAtSize(text,size),cos=dx/width,sin=dy/width,factor=width/Math.max(advance,.01);
   page.pushOperators(PDF.pushGraphicsState(),PDF.beginText(),PDF.setFontAndSize(fontName,size),PDF.setTextRenderingMode(PDF.TextRenderingMode.Invisible),PDF.setTextMatrix(cos*factor,sin*factor,-sin,cos,bottomLeft[0],bottomLeft[1]+height*.12),PDF.showText(font.encodeText(text)),PDF.endText(),PDF.popGraphicsState());words++;
  }}return {bytes:words?await document.save():new Uint8Array(input).slice(),words};
}
