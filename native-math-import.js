import {validateMath,t,seq} from './native-math-model.js';
import {equationElement} from './native-equations.js';
const M='http://schemas.openxmlformats.org/officeDocument/2006/math';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const child=(n,name)=>[...(n?.children||[])].find(c=>c.namespaceURI===M&&c.localName===name);
const value=(n,fallback)=>n?.getAttributeNS(M,'val')??fallback;
// Reject unknown operators rather than silently changing a formula's meaning.
export function readWordMath(node){
 let visited=0;
 function read(n,depth=0){
  if(++visited>1500||depth>32)throw Error('Ecuación demasiado compleja');
  if(!n)return t('');
  const part=name=>read(child(n,name),depth+1),wrap=()=>{const c=[...n.children].filter(x=>x.namespaceURI===M&&!/Pr$/.test(x.localName)).map(x=>read(x,depth+1));return c.length===1?c[0]:c.length?seq(...c):t('');};
  switch(n.localName){
   case'oMath':case'oMathPara':case'e':case'num':case'den':case'sup':case'sub':case'deg':case'lim':case'fName':return wrap();
   case'r':return t([...n.getElementsByTagNameNS(M,'t')].map(x=>x.textContent).join(''));
   case't':return t(n.textContent);
   case'f':return {type:'frac',children:[part('num'),part('den')]};
   case'sSup':return {type:'sup',children:[part('e'),part('sup')]};
   case'sSub':return {type:'sub',children:[part('e'),part('sub')]};
   case'sSubSup':return {type:'subsup',children:[part('e'),part('sub'),part('sup')]};
   case'rad':return {type:'root',children:[part('deg'),part('e')]};
   case'nary':return {type:'op',symbol:value(child(child(n,'naryPr'),'chr'),'∫'),children:[part('sub'),part('sup'),part('e')]};
   case'acc':case'bar':{const raw=n.localName==='bar'?'¯':value(child(child(n,'accPr'),'chr'),'̂');const symbol=({'̂':'^','̃':'~','̅':'¯','⃗':'→','̇':'˙','̈':'¨'})[raw]||raw;if(n.localName==='bar'&&value(child(child(n,'barPr'),'pos'),'top')!=='top')throw Error('Barra inferior');return {type:'accent',symbol,children:[part('e')]};}
   case'd':{const pr=child(n,'dPr'),a=value(child(pr,'begChr'),'('),b=value(child(pr,'endChr'),')'),elements=[...n.children].filter(x=>x.localName==='e');if(elements.length!==1)throw Error('Delimitadores múltiples');return {type:'bracket',kind:a==='{'&&b===''?'cases':a+b,children:[part('e')]};}
   case'm':{const rows=[...n.children].filter(x=>x.localName==='mr').map(r=>[...r.children].filter(x=>x.localName==='e'));const cols=rows[0]?.length;if(!cols||rows.some(r=>r.length!==cols))throw Error('Matriz irregular');return {type:'matrix',rows:rows.length,cols,children:rows.flat().map(x=>read(x,depth+1))};}
   case'func':return seq(part('fName'),part('e'));
   default:throw Error('Estructura matemática no compatible: '+n.localName);
  }
 }
 return validateMath(read(node));
}
export function prepareWordMath(xml,warnings){
 const copy=xml.cloneNode(true),replacements=new Map();
 for(const equation of [...copy.getElementsByTagNameNS(M,'oMath')]){
  const token='ARLESMATH'+crypto.randomUUID().replaceAll('-','')+'END';let el;
  try{el=equationElement(readWordMath(equation));}catch{el=document.createElement('span');el.textContent='[Ecuación compleja: consultar el Word original]';warnings.push('Una ecuación no pudo convertirse a una estructura editable; se indica su ubicación y se conserva completa en el original.');}
  replacements.set(token,el);const run=copy.createElementNS(W,'w:r'),text=copy.createElementNS(W,'w:t');text.textContent=token;run.append(text);equation.replaceWith(run);
 }
 for(const block of [...copy.getElementsByTagNameNS(M,'oMathPara')]){const runs=[...block.children].filter(n=>n.namespaceURI===W);if(block.parentElement?.localName==='body'){const p=copy.createElementNS(W,'w:p');p.append(...runs);block.replaceWith(p);}else block.replaceWith(...runs);}
 return {xml:copy,restore(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const matches=[...node.data.matchAll(/ARLESMATH[a-f0-9]{32}END/g)].filter(m=>replacements.has(m[0]));if(!matches.length)continue;const fragment=document.createDocumentFragment();let offset=0;for(const match of matches){fragment.append(document.createTextNode(node.data.slice(offset,match.index)),replacements.get(match[0]).cloneNode(true));offset=match.index+match[0].length;}fragment.append(document.createTextNode(node.data.slice(offset)));node.replaceWith(fragment);}}};
}
