const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const attr=(n,key)=>n.getAttributeNS(W,key)||'';
export async function readWordComments(zip,parse){
 const rels=zip.file('word/_rels/document.xml.rels');let path='word/comments.xml';
 if(rels){const rel=[...parse(await rels.async('string')).getElementsByTagNameNS('*','Relationship')].find(n=>n.getAttribute('Type')?.endsWith('/comments')&&n.getAttribute('TargetMode')!=='External');if(rel)path=new URL(rel.getAttribute('Target'),'https://word.invalid/word/document.xml').pathname.slice(1);}
 const part=zip.file(path);if(!part)return [];
 return [...parse(await part.async('string')).getElementsByTagNameNS(W,'comment')].map(node=>({id:'wc_'+crypto.randomUUID().replaceAll('-',''),sourceId:attr(node,'id'),author:attr(node,'author')||'Autor no indicado',initials:attr(node,'initials'),role:'Importado de Word',at:attr(node,'date'),status:'open',text:[...node.getElementsByTagNameNS(W,'p')].map(p=>[...p.getElementsByTagNameNS(W,'t')].map(n=>n.textContent).join('')).join('\n'),quote:null,replies:[]}));
}
export function prepareCommentMarkers(xml,comments){
 const ids=new Map(comments.map(c=>[c.sourceId,c.id])),tokens=new Map();
 for(const [tag,kind] of [['commentRangeStart','start'],['commentRangeEnd','end'],['commentReference','reference']])for(const node of [...xml.getElementsByTagNameNS(W,tag)]){
  const id=ids.get(attr(node,'id'));if(!id)continue;const token='ARLESCOMMENT'+crypto.randomUUID().replaceAll('-','')+'END',text=xml.createElementNS(W,'w:t');text.textContent=token;tokens.set(token,{id,kind});
  if(node.parentElement?.localName==='r')node.replaceWith(text);else{const run=xml.createElementNS(W,'w:r');run.append(text);node.replaceWith(run);}
 }
 return root=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const hits=[...node.data.matchAll(/ARLESCOMMENT[a-f0-9]{32}END/g)].filter(m=>tokens.has(m[0]));if(!hits.length)continue;const fragment=document.createDocumentFragment();let offset=0;for(const hit of hits){const {id,kind}=tokens.get(hit[0]),marker=document.createElement('span');marker.dataset.wordComment=id;marker.dataset.wordCommentKind=kind;marker.hidden=true;marker.contentEditable='false';fragment.append(document.createTextNode(node.data.slice(offset,hit.index)),marker);offset=hit.index+hit[0].length;}fragment.append(document.createTextNode(node.data.slice(offset)));node.replaceWith(fragment);}};
}
export function importedCommentRange(root,id){
 const markers=[...root.querySelectorAll('[data-word-comment]')].filter(n=>n.dataset.wordComment===id),start=markers.find(n=>n.dataset.wordCommentKind==='start'),end=markers.find(n=>n.dataset.wordCommentKind==='end');
 if(!start||!end||!(start.compareDocumentPosition(end)&Node.DOCUMENT_POSITION_FOLLOWING))return null;
 const range=document.createRange();range.setStartAfter(start);range.setEndBefore(end);return range;
}
export function commentQuotes(html,comments){const root=document.createElement('div');root.innerHTML=html;for(const c of comments){const range=importedCommentRange(root,c.id),text=range?.toString();if(text)c.quote={text,prefix:'',suffix:''};}return comments;}
