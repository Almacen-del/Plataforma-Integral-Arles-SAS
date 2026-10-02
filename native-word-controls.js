const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export function wordControlData(node){try{const c=JSON.parse(node.dataset.wordControl);if(!['block','inline'].includes(c.kind)||typeof c.properties!=='string'||c.properties.length>40000)return null;const xml=new DOMParser().parseFromString(c.properties,'application/xml');if(xml.querySelector('parsererror')||xml.documentElement.localName!=='sdtPr'||xml.documentElement.namespaceURI!==W)return null;return {kind:c.kind,properties:c.properties};}catch{return null;}}
export function prepareWordControls(xml,warnings){
 const entries=new Map();
 // Inner controls first, so nested controls keep their individual boundaries.
 for(const sdt of [...xml.getElementsByTagNameNS(W,'sdt')].reverse()){
  const content=[...sdt.children].find(n=>n.localName==='sdtContent'),properties=[...sdt.children].find(n=>n.localName==='sdtPr');if(!content||!properties)continue;
  const kind=sdt.parentElement?.localName==='p'?'inline':['body','tc','sdtContent'].includes(sdt.parentElement?.localName)?'block':null;if(!kind){warnings.push('Un control de contenido dentro de una estructura especial conserva su contenido y permanece completo en el original.');continue;}
  const id=crypto.randomUUID().replaceAll('-',''),tokens=[];
  for(const boundary of ['START','END']){const token='ARLESCONTROL'+id+boundary,run=xml.createElementNS(W,'w:r'),text=xml.createElementNS(W,'w:t');text.textContent=token;run.append(text);let n=run;if(kind==='block'){n=xml.createElementNS(W,'w:p');n.append(run);}tokens.push(n);}
  entries.set(id,{kind,properties:new XMLSerializer().serializeToString(properties)});sdt.replaceWith(tokens[0],...content.childNodes,tokens[1]);
 }
 return root=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),leaves=[];while(walker.nextNode())leaves.push(walker.currentNode);for(const n of leaves){const hits=[...n.data.matchAll(/ARLESCONTROL([a-f0-9]{32})(START|END)/g)].filter(m=>entries.has(m[1]));if(!hits.length)continue;const f=document.createDocumentFragment();let at=0;for(const hit of hits){f.append(document.createTextNode(n.data.slice(at,hit.index)));const marker=document.createElement('span');marker.dataset.controlBoundary=hit[1]+hit[2];f.append(marker);at=hit.index+hit[0].length;}f.append(document.createTextNode(n.data.slice(at)));n.replaceWith(f);}
  for(const [id,data] of entries){const start=root.querySelector('[data-control-boundary="'+id+'START"]'),end=root.querySelector('[data-control-boundary="'+id+'END"]');if(!start||!end)throw Error('No se pudo recuperar un control de contenido sin perder su ubicación.');const a=data.kind==='block'?start.closest('p'):start,b=data.kind==='block'?end.closest('p'):end,range=document.createRange();range.setStartAfter(a);range.setEndBefore(b);const wrapper=document.createElement(data.kind==='block'?'div':'span');wrapper.dataset.wordControl=JSON.stringify(data);wrapper.append(range.extractContents());range.insertNode(wrapper);a.remove();b.remove();}
 };
}
