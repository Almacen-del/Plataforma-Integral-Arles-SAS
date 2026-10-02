/** Read declared change-control tables, never manufacture historical file revisions. */
const normalized=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function extractDocumentHistory(book,format=cell=>String(cell?.raw??'')){
 const entries=[];
 for(const sheet of book.sheets||[]){
  const rows=new Map();
  for(const [ref,cell] of Object.entries(sheet.cells||{})){const m=/^([A-Z]+)(\d+)$/.exec(ref);if(!m)continue;const row=Number(m[2]);if(!rows.has(row))rows.set(row,new Map());rows.get(row).set(m[1],{cell,ref});}
  let columns=null;
  for(const [row,cells] of [...rows].sort((a,b)=>a[0]-b[0])){
   const find=re=>[...cells].find(([,v])=>re.test(normalized(v.cell.raw)))?.[0];
   const version=find(/^(?:(?:no|numero) )?(version|revision|edicion)( no| numero)?$/),date=find(/^fecha( de)?( actualizacion| modificacion| cambio| revision)?$/),reason=find(/^(razon|motivo|descripcion|resumen)(?:( de| del| de los| de la)?( cambio| cambios| modificacion))?$/);
   if(version&&date&&reason){columns={version,date,reason};continue;}
   if(!columns)continue;
   const v=cells.get(columns.version),d=cells.get(columns.date),r=cells.get(columns.reason);
   const number=format(v?.cell,book).trim(),dateText=format(d?.cell,book).trim(),reasonText=format(r?.cell,book).trim();
   if(!/^(?:v(?:ersion)?\s*)?\d+(?:[.\-]\d+)*$/i.test(number)||!dateText||!reasonText)continue;
   entries.push({number,date:dateText,reason:reasonText,sheet:sheet.name,row,range:`${columns.version}${row}:${columns.reason}${row}`});
  }
 }
 return entries;
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function readOriginalHistory(blob,name){
 const {readXlsx,loadXlsxReader,checkXlsxArchive}=await import('./sheet-xlsx.js');
 if(/\.docx$/i.test(name)){
  if(blob.size>25*1024*1024)throw Error('La lectura del historial Word admite archivos de hasta 25 MB.');
  await loadXlsxReader();const bytes=await blob.arrayBuffer();try{checkXlsxArchive(bytes);}catch(e){throw Error(e.message.replaceAll('XLSX','DOCX'));}
  const zip=await window.JSZip.loadAsync(bytes),part=zip.file('word/document.xml');
  if(!part)throw Error('El archivo no contiene un documento DOCX válido.');
  const xml=new DOMParser().parseFromString(await part.async('string'),'application/xml');
  if(xml.querySelector('parsererror'))throw Error('El contenido del Word no se pudo interpretar.');
  const children=(node,name)=>[...node.children].filter(c=>c.localName===name);
  const sheets=[...xml.getElementsByTagNameNS('*','tbl')].map((table,index)=>{
   const cells={};children(table,'tr').forEach((row,r)=>{let col=0;children(row,'tc').forEach(cell=>{
    let letters='',n=col+1;while(n){letters=String.fromCharCode(65+(n-1)%26)+letters;n=Math.floor((n-1)/26);}
    const text=children(cell,'p').map(p=>[...p.getElementsByTagNameNS('*','t')].map(t=>t.textContent).join('')).join(' ');
    cells[letters+(r+1)]={raw:text};const span=cell.getElementsByTagNameNS('*','gridSpan')[0];col+=Math.max(1,Number(span?.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','val'))||1);
   });});return {name:'Tabla '+(index+1),cells};
  });
  return extractDocumentHistory({sheets});
 }
 const {book}=await readXlsx(new File([blob],name));
 return extractDocumentHistory(book,(cell,b)=>{if(!cell)return '';const value=cell.formulaSyntax?cell.xlsxCached:cell.raw;if(value==null)return '';if(cell.xlsxNumFmt&&String(value).trim()!==''&&Number.isFinite(Number(value))){try{return window.SSF.format(cell.xlsxNumFmt,Number(value),{date1904:!!b.xlsxImport?.date1904});}catch{}}return String(value);});
}
export async function renderSourceHistory(container,doc){
 const versions=doc.versions||[],v=versions.find(v=>v.status==='current')||versions.at(-1);
 if(!v?.fileId||!/\.(xlsx|docx)$/i.test(v.fileName||'')){container.textContent='El historial anterior no se ha extraído de este archivo.';return;}
 container.textContent='Leyendo el historial del archivo original…';
 try{
  const {blobOperation}=await import('./document-control.js');
  const blob=await blobOperation('get',v.fileId);if(!blob)throw Error('No se encuentra el archivo original.');
  const entries=await readOriginalHistory(blob,v.fileName);
  if(!container.isConnected)return;
  container.innerHTML=entries.length?'<p class="doc-code">Transcrito del archivo original. Estas entradas no incluyen copias recuperables de las versiones anteriores ni acreditan su aprobación.</p>'+entries.map(e=>`<div class="history-entry"><b>Versión ${esc(e.number)} · Documentada en el archivo</b><span>${esc(e.date)}</span><p>${esc(e.reason)}</p><small>Origen: ${esc(e.sheet)} · ${esc(e.range)}</small></div>`).join(''):'<p>No se encontró una tabla reconocible con versión, fecha y razón del cambio. Esto no significa que el documento carezca de historial.</p>';
 }catch(e){if(container.isConnected)container.textContent='No se pudo leer el historial: '+e.message;}
}
