import {normalizePage} from './native-page-layout.js';
import {identitySettings} from './native-identity.js';
const NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const xmlText=p=>[...p.getElementsByTagNameNS(NS,'t')].map(n=>n.textContent).join('');
const parseHTML=html=>{const root=document.createElement('div');root.innerHTML=html;return root;};
const attributes=n=>JSON.stringify([...n.attributes].filter(a=>!(n.tagName==='IMG'&&a.name==='src')&&!(a.name==='id'&&/^H[1-6]$/.test(n.tagName)&&/^ref_[a-z0-9_]+$/.test(a.value))).map(a=>[a.name,a.value]).sort());
function sameStructure(a,b,changed){
 if(a.nodeType!==b.nodeType)return false;
 if(a.nodeType===3){if(a.data!==b.data){const p=a.parentElement.closest('p,h1,h2,h3,h4,h5,h6,li');if(!p)return false;changed.add(p);}return true;}
 if(a.nodeType!==1)return a.isEqualNode(b);
 if(a.tagName!==b.tagName||attributes(a)!==attributes(b))return false;
 if(!a.children.length&&!b.children.length){if(a.textContent!==b.textContent){const p=a.closest('p,h1,h2,h3,h4,h5,h6,li');if(!p)return false;changed.add(p);}return true;}
 if(a.childNodes.length!==b.childNodes.length)return false;
 return [...a.childNodes].every((n,i)=>sameStructure(n,b.childNodes[i],changed));
}
// Modify text only inside the original package. Uninterpreted parts are copied intact.
// Reject ambiguous mappings or structural changes instead of silently dropping them.
export async function preserveOriginalWord(original,baseline,current){
 const fail=reason=>({mode:'rebuild',reason});
 if(!baseline)return fail('Este borrador no tiene una referencia de importación.');
 if(JSON.stringify(normalizePage(baseline.page))!==JSON.stringify(normalizePage(current.page))||JSON.stringify(identitySettings(baseline.identity))!==JSON.stringify(identitySettings(current.identity)))return fail('Cambió la configuración de página o encabezados.');
 if(baseline.sourceHeader!==current.sourceHeader||baseline.sourceFooter!==current.sourceFooter)return fail('Cambió el encabezado o pie.');
 const before=parseHTML(baseline.html),after=parseHTML(current.html),changed=new Set();
 if(!sameStructure(before,after,changed))return fail('Cambió la estructura, el formato o los objetos del documento.');
 if(!changed.size)return {mode:'original',blob:original,paragraphs:0};
 const {loadXlsxReader}=await import('./sheet-xlsx.js');await loadXlsxReader();const zip=await JSZip.loadAsync(await original.arrayBuffer()),part=zip.file('word/document.xml');if(!part)return fail('No se encontró el contenido original.');
 const xml=new DOMParser().parseFromString(await part.async('string'),'application/xml');if(xml.querySelector('parsererror'))return fail('No se pudo interpretar el contenido original.');
 const paragraphs=[...xml.getElementsByTagNameNS(NS,'p')],allBefore=[...before.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li')],allAfter=[...after.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li')],patches=[];
 for(const p of changed){const target=allAfter[allBefore.indexOf(p)],text=p.textContent,replacement=target?.textContent,matches=paragraphs.filter(n=>xmlText(n)===text);
  if(matches.length!==1||replacement==null||p.querySelector('img,ul,ol,table')||/\n|\t/.test(replacement))return fail('Una corrección de texto requiere reconstrucción para evitar una correspondencia ambigua.');
  const source=matches[0];if(['fldChar','fldSimple','instrText','drawing','object','tab','br','ins','del'].some(tag=>source.getElementsByTagNameNS(NS,tag).length))return fail('El párrafo editado contiene campos, objetos o control de cambios.');
  const runs=[...source.getElementsByTagNameNS(NS,'t')];if(!runs.length)return fail('No se encontró el texto original del párrafo.');
  let start=0,end=text.length,newEnd=replacement.length;while(start<end&&start<newEnd&&text[start]===replacement[start])start++;while(end>start&&newEnd>start&&text[end-1]===replacement[newEnd-1]){end--;newEnd--;}
  let offset=0,inserted=false;const values=runs.map((run,i)=>{const from=offset,to=offset+run.textContent.length;offset=to;let value=run.textContent.slice(0,Math.max(0,Math.min(to,start)-from));if(!inserted&&start>=from&&(start<to||i===runs.length-1)){value+=replacement.slice(start,newEnd);inserted=true;}value+=run.textContent.slice(Math.max(0,end-from));return value;});
  if(!inserted||values.join('')!==replacement)return fail('No se pudo conservar la distribución del texto con seguridad.');patches.push({runs,values});
 }
 for(const {runs,values} of patches)runs.forEach((run,i)=>{run.textContent=values[i];run.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');});
 zip.file('word/document.xml',new XMLSerializer().serializeToString(xml));return {mode:'preserved',paragraphs:patches.length,blob:await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})};
}
