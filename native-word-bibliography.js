const B='http://schemas.openxmlformats.org/officeDocument/2006/bibliography',R='http://schemas.openxmlformats.org/package/2006/relationships',T='http://schemas.openxmlformats.org/package/2006/content-types';
function sourcesXML(value){if(typeof value!=='string')return null;const xml=new DOMParser().parseFromString(value,'application/xml');return !xml.querySelector('parsererror')&&xml.documentElement.localName==='Sources'&&xml.documentElement.namespaceURI===B&&xml.getElementsByTagNameNS(B,'Source').length?xml:null;}
export async function readWordBibliography(zip){const sources=[];for(const [name,part] of Object.entries(zip.files)){if(!/^customXml\/[^/]+\.xml$/.test(name)||part.dir)continue;const value=await part.async('string');if(sourcesXML(value))sources.push(value);}return sources;}
const parse=value=>new DOMParser().parseFromString(value,'application/xml');
const safePart=name=>/^customXml\/(?:_rels\/)?[^/]+\.(?:xml|rels)$/.test(name)&&!name.includes('..');
export async function readWordCustomParts(zip){
 const rels=parse(await zip.file('word/_rels/document.xml.rels')?.async('string')||'<Relationships/>'),types=parse(await zip.file('[Content_Types].xml').async('string')),roots=[],parts={};
 async function collect(name){
  if(parts[name])return;if(!safePart(name)||!zip.file(name))throw Error('No se pudo conservar un adjunto XML del Word.');
  const type=[...types.documentElement.children].find(n=>n.getAttribute('PartName')==='/'+name)?.getAttribute('ContentType')||'application/xml';
  parts[name]={data:await zip.file(name).async('base64'),type};
  const relPath='customXml/_rels/'+name.split('/').at(-1)+'.rels';
  if(zip.file(relPath)){
   parts[relPath]={data:await zip.file(relPath).async('base64'),type:'application/vnd.openxmlformats-package.relationships+xml'};
   for(const rel of parse(await zip.file(relPath).async('string')).documentElement.children){if(rel.getAttribute('TargetMode')==='External')continue;const target=rel.getAttribute('Target')||'';if(target.includes('/')||target.includes('..'))throw Error('El adjunto XML contiene una relación que requiere conservar el original.');await collect('customXml/'+target);}
  }
 }
 for(const rel of rels.documentElement.children){
  if(!rel.getAttribute('Type')?.endsWith('/customXml')||rel.getAttribute('TargetMode')==='External')continue;
  const target=rel.getAttribute('Target')||'',name=target.replace(/^\.\.\//,'').replace(/^\//,'');
  if(name==='customXml/arles-charts.xml')continue;
  if(!safePart(name)||!zip.file(name))throw Error('La relación del adjunto XML no es válida.');
  if(sourcesXML(await zip.file(name).async('string')))continue;
  roots.push(name);await collect(name);
 }
 return {roots,parts};
}
export async function exportWordCustomParts(blob,stored){
 if(!stored?.roots?.length)return blob;
 const {loadXlsxReader}=await import('./sheet-xlsx.js');await loadXlsxReader();const zip=await JSZip.loadAsync(await blob.arrayBuffer()),rels=parse(await zip.file('word/_rels/document.xml.rels').async('string')),types=parse(await zip.file('[Content_Types].xml').async('string'));
 for(const [name,part] of Object.entries(stored.parts||{})){
  if(!safePart(name)||zip.file(name))throw Error('No se puede conservar el adjunto XML sin sobrescribir otra parte.');
  zip.file(name,part.data,{base64:true});
  if(!name.endsWith('.rels')){const n=types.createElementNS(T,'Override');n.setAttribute('PartName','/'+name);n.setAttribute('ContentType',part.type);types.documentElement.append(n);}
 }
 for(const [i,name] of stored.roots.entries()){
  if(!safePart(name)||!zip.file(name))throw Error('Falta una parte del adjunto XML.');
  const n=rels.createElementNS(R,'Relationship');n.setAttribute('Id','rArlesCustomPart'+i);n.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml');n.setAttribute('Target','../'+name);rels.documentElement.append(n);
 }
 zip.file('word/_rels/document.xml.rels',new XMLSerializer().serializeToString(rels));zip.file('[Content_Types].xml',new XMLSerializer().serializeToString(types));return zip.generateAsync({type:'blob',mimeType:blob.type});
}
// Preserve the actual source records as well as CITATION/BIBLIOGRAPHY fields.
// Cached display text alone is insufficient for Word to update those fields.
export async function exportWordBibliography(blob,sources=[]){
 if(!sources.length)return blob;const {loadXlsxReader}=await import('./sheet-xlsx.js');await loadXlsxReader();const zip=await JSZip.loadAsync(await blob.arrayBuffer()),rels=new DOMParser().parseFromString(await zip.file('word/_rels/document.xml.rels').async('string'),'application/xml'),types=new DOMParser().parseFromString(await zip.file('[Content_Types].xml').async('string'),'application/xml');
 const override=(path,type)=>{const n=types.createElementNS(T,'Override');n.setAttribute('PartName','/'+path);n.setAttribute('ContentType',type);types.documentElement.append(n);};
 sources.forEach((value,i)=>{if(!sourcesXML(value))throw Error('La lista bibliográfica del Word no se pudo conservar.');const name='arles-bibliography-'+i+'.xml',props='arles-bibliography-props-'+i+'.xml',id='rArlesBibliography'+i,n=rels.createElementNS(R,'Relationship');n.setAttribute('Id',id);n.setAttribute('Type','http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml');n.setAttribute('Target','../customXml/'+name);rels.documentElement.append(n);zip.file('customXml/'+name,value);zip.file('customXml/'+props,`<ds:datastoreItem xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml" ds:itemID="{${crypto.randomUUID().toUpperCase()}}"><ds:schemaRefs><ds:schemaRef ds:uri="${B}"/></ds:schemaRefs></ds:datastoreItem>`);zip.file('customXml/_rels/'+name+'.rels',`<Relationships xmlns="${R}"><Relationship Id="rProperties" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="${props}"/></Relationships>`);override('customXml/'+name,'application/xml');override('customXml/'+props,'application/vnd.openxmlformats-officedocument.customXmlProperties+xml');});
 const serialize=n=>new XMLSerializer().serializeToString(n);zip.file('word/_rels/document.xml.rels',serialize(rels));zip.file('[Content_Types].xml',serialize(types));return zip.generateAsync({type:'blob',mimeType:blob.type});
}
