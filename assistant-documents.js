const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const stop=new Set('segun sobre como donde para debe deben cumplir funciones documento documentos archivo archivos cuales estos esta este tiene hacer puede puedes quiero saber dice dentro informacion'.split(' '));
export function questionTerms(question){return [...new Set(normalize(question).match(/[a-z0-9]+/g)||[])].filter(w=>w.length>2&&!stop.has(w));}
export function selectDocuments(documents,question){const words=questionTerms(question);return documents.filter(d=>!d.demo&&!d.retired&&d.status!=='Obsoleto').map(d=>({d,score:words.reduce((n,w)=>n+(normalize(`${d.name} ${d.code}`).includes(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.d);}
export function relevantFragments(blocks,question,limit=9000){const words=questionTerms(question);const scored=blocks.map((b,i)=>({b,i,score:words.reduce((n,w)=>n+(normalize(b.text).includes(w)?1:0),0)}));const ordered=scored.some(x=>x.score)?scored.sort((a,b)=>b.score-a.score||a.i-b.i):scored;let remaining=limit;const selected=[];for(const {b,i} of ordered){if(remaining<=0)break;const text=b.text.slice(0,Math.min(remaining,3000));if(text.trim()){selected.push({...b,text,i});remaining-=text.length;}}return selected.sort((a,b)=>a.i-b.i).map(({i,...b})=>b);}
export async function extractDocumentText(blob,name){
 if(blob.size>25*1024*1024)throw Error('El lector admite archivos de hasta 25 MB.');
 if(/\.pptx$/i.test(name)){const {readPptxText}=await import('./pptx-reader.js');return readPptxText(blob);}
 if(/\.xlsx$/i.test(name)){
  const {readXlsx}=await import('./xlsx-reader.js');const {book}=await readXlsx(new File([blob],name));const blocks=[];
  for(const s of book.sheets){const rows=new Map();for(const [ref,c] of Object.entries(s.cells)){const v=c.formulaSyntax?c.xlsxCached:c.raw;if(v==null||v==='')continue;const row=Number(ref.match(/\d+$/)?.[0]);if(!rows.has(row))rows.set(row,[]);rows.get(row).push(`${ref}: ${String(v)}`);}for(const [row,cells] of [...rows].sort((a,b)=>a[0]-b[0]))blocks.push({location:`Hoja ${s.name}, fila ${row}`,text:cells.join(' | ')});}return blocks;
 }
 if(/\.docx$/i.test(name)){
  const {loadXlsxReader,checkXlsxArchive}=await import('./xlsx-reader.js');await loadXlsxReader();const bytes=await blob.arrayBuffer();checkXlsxArchive(bytes);const zip=await window.JSZip.loadAsync(bytes),part=zip.file('word/document.xml');if(!part)throw Error('No contiene un Word DOCX válido.');const xml=new DOMParser().parseFromString(await part.async('string'),'application/xml');if(xml.querySelector('parsererror'))throw Error('El Word no se pudo interpretar.');
  return [...xml.getElementsByTagNameNS('*','p')].map((p,i)=>({location:`Párrafo ${i+1}`,text:[...p.getElementsByTagNameNS('*','t')].map(t=>t.textContent).join('')})).filter(b=>b.text.trim());
 }
 if(/\.pdf$/i.test(name)){
  const reader=await import('./public/vendor/pdf/pdf-6.3.289.mjs');reader.GlobalWorkerOptions.workerSrc='/public/vendor/pdf/pdf.worker-6.3.289.mjs';const task=reader.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});const pdf=await task.promise;
  try{const blocks=[];for(let i=1;i<=Math.min(pdf.numPages,100);i++){const page=await pdf.getPage(i),content=await page.getTextContent();blocks.push({location:`Página ${i}`,text:content.items.map(t=>t.str||'').join(' ')});}if(!blocks.some(b=>b.text.trim()))throw Error('PDF sin texto legible; requiere reconocimiento OCR.');if(pdf.numPages>100)blocks.push({location:'Límite de lectura',text:'Solo se leyeron las primeras 100 páginas.'});return blocks;}finally{await task.destroy();}
 }
 throw Error('Este formato todavía no tiene extracción de contenido para la IA.');
}
export async function collectDocumentContext(question,scope,progress=()=>{}){
 if(!['all','library'].includes(scope))return [];
 const {platformStorage,officeDraft}=await import('./platform-cloud.js');const state=JSON.parse(platformStorage.getItem('arles-documental-prototipo-v1')||'{}');
 const docs=selectDocuments(state.documents||[],question),result=[];
 for(const d of docs){progress('Leyendo '+d.name+'…');const versions=d.versions||[],v=versions.find(v=>v.status==='current')||versions.at(-1);const item={id:d.id,fileId:v?.fileId||null,revision:d.editorContent?.revision??null,fragments:[]};try{
  const draft=v?.fileId?await officeDraft(v.fileId):null;let blocks;
  if(draft){blocks=await extractDocumentText(draft.blob,v.fileName);item.savedDraft={savedAt:draft.savedAt,sequence:draft.sequence};blocks=blocks.map(block=>({...block,location:'Borrador compartido guardado '+draft.savedAt+' · '+block.location}));}
  else if(d.editorContent){const template=document.createElement('template');template.innerHTML=d.editorContent.html||'';template.content.querySelectorAll('script,style').forEach(n=>n.remove());blocks=[...template.content.children].map((n,i)=>({location:`Bloque ${i+1}`,text:n.textContent}));}
  else{if(!v?.fileId)throw Error('No hay archivo asociado.');const {blobOperation}=await import('./document-control.js');const blob=await blobOperation('get',v.fileId);if(!blob)throw Error('El archivo no está disponible.');blocks=await extractDocumentText(blob,v.fileName);}
  item.fragments=relevantFragments(blocks,question);if(!item.fragments.length)item.error='No se encontró texto legible.';
 }catch(e){item.error=e.message;}result.push(item);}
 return result;
}
