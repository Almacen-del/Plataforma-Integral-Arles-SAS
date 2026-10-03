const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
// Print-only transformation. The editable note model and the DOCX stay untouched.
export function preparePrintNotes(doc){
 const expected=[],ends=[],rules=[];
 for(const [i,node] of [...doc.body.querySelectorAll('[data-ref-note]')].entries()){
  if(node.closest('.source-print-header,.source-print-footer'))continue;
  let note;try{note=JSON.parse(node.dataset.refNote);}catch{throw Error('No se pudo interpretar una nota para imprimir.');}
  const number=/^\d+$/.test(node.textContent.trim())?node.textContent.trim():String(i+1),text=String(note.text||'');
  if(note.kind==='end'){ends.push({number,text});continue;}
  const el=doc.createElement('span'),key='arles-footnote-'+i;el.className='arles-footnote '+key;el.dataset.printNote=key;el.textContent=text;node.replaceWith(el);
  rules.push(`.${key}::footnote-call{content:'${number}'} .${key}::footnote-marker{content:'${number}. '}`);expected.push({key,text});
 }
 for(const n of doc.querySelectorAll('[data-ref-generated]')){try{if(JSON.parse(n.dataset.refGenerated).kind==='notes')n.remove();}catch{}}
 if(ends.length){const list=doc.createElement('div'),title=doc.createElement('h2');title.textContent='Notas finales';list.append(title);for(const note of ends){const p=doc.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=note.number+'. '+note.text;list.append(p);}doc.body.append(list);}
 if(expected.length){const style=doc.createElement('style');style.textContent='.arles-footnote{float:footnote;footnote-policy:line;font:10pt/1.25 Arial;color:#000;white-space:pre-wrap;overflow-wrap:anywhere}.pagedjs_footnote_content{border-top:1px solid #888;padding-top:6px}.arles-footnote::footnote-call{vertical-align:super;font-size:70%}'+rules.join('');doc.head.append(style);}
 return expected;
}
export async function prepareWordNotes(xml,zip,warnings){
 const notes=new Map(),entries=new Map();
 for(const kind of ['foot','end']){const tag=kind==='foot'?'footnote':'endnote',part=zip.file('word/'+tag+'s.xml');if(!part)continue;const source=new DOMParser().parseFromString(await part.async('string'),'application/xml');
  for(const n of source.getElementsByTagNameNS(W,tag)){const id=n.getAttributeNS(W,'id');if(n.hasAttributeNS(W,'type'))continue;const text=[...n.getElementsByTagNameNS(W,'p')].map(p=>[...p.getElementsByTagNameNS(W,'t')].map(t=>t.textContent).join('')).join('\n');notes.set(kind+':'+id,{kind,text});if(n.getElementsByTagNameNS(W,'drawing').length||n.getElementsByTagNameNS(W,'tbl').length)warnings.push('Una nota contiene objetos o tablas: su texto es editable y su composición completa permanece en el original.');}
 }
 for(const kind of ['foot','end'])for(const n of [...xml.getElementsByTagNameNS(W,kind==='foot'?'footnoteReference':'endnoteReference')]){const entry=notes.get(kind+':'+n.getAttributeNS(W,'id'));if(!entry)throw Error('No se encuentra el contenido de una nota de Word.');const token='ARLESNOTE'+crypto.randomUUID().replaceAll('-','')+'END',text=xml.createElementNS(W,'w:t');text.textContent=token;n.replaceWith(text);entries.set(token,entry);}
 return root=>{let count=0;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),leaves=[];while(walker.nextNode())leaves.push(walker.currentNode);for(const n of leaves){const hits=[...n.data.matchAll(/ARLESNOTE[a-f0-9]{32}END/g)].filter(m=>entries.has(m[0]));if(!hits.length)continue;const f=document.createDocumentFragment();let at=0;for(const hit of hits){f.append(document.createTextNode(n.data.slice(at,hit.index)));const sup=document.createElement('sup');sup.id='ref_'+crypto.randomUUID().replaceAll('-','');sup.dataset.refNote=JSON.stringify(entries.get(hit[0]));sup.contentEditable='false';sup.textContent=String(++count);f.append(sup);at=hit.index+hit[0].length;}f.append(document.createTextNode(n.data.slice(at)));n.replaceWith(f);}if(count){const list=document.createElement('div');list.dataset.refGenerated=JSON.stringify({kind:'notes'});list.contentEditable='false';root.append(list);}};
}
