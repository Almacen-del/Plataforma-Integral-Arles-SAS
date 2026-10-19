import {checkXlsxArchive} from './xlsx-reader.js';
const nodes=(root,name)=>[...root.getElementsByTagNameNS('*',name)];
let zipLoading;
async function loadZip(){
 if(globalThis.JSZip)return globalThis.JSZip;
 zipLoading||=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/vendor/xlsx/jszip-3.10.1.js';script.onload=()=>{if(globalThis.JSZip)resolve(globalThis.JSZip);else{zipLoading=null;reject(Error('No se pudo cargar el lector de presentaciones.'));}};script.onerror=()=>{zipLoading=null;reject(Error('No se pudo cargar el lector de presentaciones. Intenta nuevamente.'));};document.head.append(script);});
 return zipLoading;
}
async function xmlPart(zip,name){
 const part=zip.file(name);if(!part)throw Error('La presentación no contiene todos sus componentes.');const xml=new DOMParser().parseFromString(await part.async('string'),'application/xml');if(nodes(xml,'parsererror').length)throw Error('La presentación contiene XML inválido.');return xml;
}
function relatedPart(source,relationship,directory){
 if(!relationship||relationship.getAttribute('TargetMode')==='External')throw Error('La presentación contiene una referencia de diapositiva inválida.');
 const url=new URL(relationship.getAttribute('Target')||'', 'https://pptx.invalid/'+source),name=decodeURIComponent(url.pathname.slice(1));
 if(url.origin!=='https://pptx.invalid'||url.search||url.hash||!name.startsWith('ppt/'+directory+'/')||name.slice(('ppt/'+directory+'/').length).includes('/')||!name.endsWith('.xml'))throw Error('La presentación contiene una referencia de diapositiva inválida.');return name;
}
const paragraphText=xml=>nodes(xml,'p').map(p=>nodes(p,'t').map(t=>t.textContent).join('')).filter(text=>text.trim());
export async function readPptxText(blob){
 if(blob.size>25*1024*1024)throw Error('El lector admite archivos de hasta 25 MB.');const bytes=await blob.arrayBuffer();try{checkXlsxArchive(bytes);}catch(error){throw Error(error.message.replaceAll('XLSX','PPTX'));}
 const Zip=await loadZip(),zip=await Zip.loadAsync(bytes),presentation=await xmlPart(zip,'ppt/presentation.xml'),rels=await xmlPart(zip,'ppt/_rels/presentation.xml.rels'),relationships=new Map(nodes(rels,'Relationship').map(rel=>[rel.getAttribute('Id'),rel])),slides=nodes(presentation,'sldId'),blocks=[];
 for(const [i,slide] of slides.slice(0,100).entries()){
  const id=[...slide.attributes].find(attribute=>attribute.localName==='id'&&attribute.namespaceURI)?.value,name=relatedPart('ppt/presentation.xml',relationships.get(id),'slides'),xml=await xmlPart(zip,name);
  for(const text of paragraphText(xml))blocks.push({location:`Diapositiva ${i+1}`,text});
  const slideRels=name.replace(/([^/]+)$/,'_rels/$1.rels');
  if(zip.file(slideRels)){const linked=await xmlPart(zip,slideRels),notesRel=nodes(linked,'Relationship').find(rel=>/\/notesSlide$/.test(rel.getAttribute('Type')||''));if(notesRel){const notes=await xmlPart(zip,relatedPart(name,notesRel,'notesSlides'));for(const shape of nodes(notes,'sp')){if(nodes(shape,'ph').some(ph=>ph.getAttribute('type')==='sldNum'))continue;for(const text of paragraphText(shape))blocks.push({location:`Notas de diapositiva ${i+1}`,text});}}}
 }
 if(slides.length>100)blocks.push({location:'Límite de lectura',text:'Solo se leyeron las primeras 100 diapositivas.'});return blocks;
}
