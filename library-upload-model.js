import {createFolder,ROOT,ancestors,LIBRARY_ROOTS} from './model.js';
export const MAX_UPLOAD_FILE=50*1024*1024,MAX_UPLOAD_TOTAL=200*1024*1024,MAX_UPLOAD_ITEMS=1000;
export function pathParts(path){const parts=String(path).split('/');if(parts.some(p=>!p||p==='.'||p==='..'||/[\\\x00-\x1f]/.test(p)))throw Error('Ruta de archivo no válida.');return parts;}
export async function readDroppedEntries(roots){
 const result=[];async function walk(entry,parent=''){
  const path=parent+entry.name;pathParts(path);if(result.length>=MAX_UPLOAD_ITEMS)throw Error('El lote supera 1.000 archivos y carpetas. Divide la carga.');
  if(entry.isDirectory){result.push({path,directory:true});const reader=entry.createReader();while(true){const batch=await new Promise((ok,no)=>reader.readEntries(ok,no));if(!batch.length)break;for(const child of batch)await walk(child,path+'/');}}
  else if(entry.isFile){const file=await new Promise((ok,no)=>entry.file(ok,no));result.push({path,file});}
  else throw Error('El navegador no permite leer uno de los elementos.');
 }for(const root of roots)await walk(root);return result;
}
export function planUpload(original,destination,entries){
 if(destination===ROOT||!ancestors(original.folders,destination).some(f=>LIBRARY_ROOTS.includes(f.id)))throw Error('Elige una carpeta de destino dentro de la biblioteca.');
 if(!entries.length)throw Error('No se encontraron archivos. Para conservar carpetas vacías utiliza el arrastre.');
 if(entries.length>MAX_UPLOAD_ITEMS)throw Error('Máximo 1.000 archivos y carpetas por carga.');
 const state=structuredClone(original),paths=new Map(),folders=new Map([['',destination]]),files=[],renamed=[];let bytes=0;
 for(const entry of entries){const parts=pathParts(entry.path);if(paths.has(entry.path))throw Error('Ruta repetida en el lote: '+entry.path);paths.set(entry.path,entry);if(!entry.directory){if(!entry.file)throw Error('No se pudo leer '+entry.path);if(entry.file.size>MAX_UPLOAD_FILE)throw Error(entry.path+': pesa '+(entry.file.size/1024/1024).toFixed(1)+' MB y supera el máximo de 50 MB por archivo. Divide ese archivo o retíralo del lote para continuar.');bytes+=entry.file.size;}}
 if(bytes>MAX_UPLOAD_TOTAL)throw Error('El lote supera 200 MB. Divide la carga.');
 function unique(name,exists,file=false){let result=name,n=2;const dot=file?name.lastIndexOf('.'):-1,base=dot>0?name.slice(0,dot):name,ext=dot>0?name.slice(dot):'';while(exists(result))result=base+' ('+n+++')'+ext;return result;}
 function directory(parts){const path=parts.join('/');if(folders.has(path))return folders.get(path);if(paths.get(path)&&!paths.get(path).directory)throw Error('Una ruta contiene un archivo como carpeta: '+path);const parent=directory(parts.slice(0,-1)),name=parts.at(-1),chosen=unique(name,n=>state.folders.some(f=>f.parent===parent&&f.name.toLocaleLowerCase()===n.toLocaleLowerCase()));const folder=createFolder(state,parent,chosen);folders.set(path,folder.id);if(chosen!==name)renamed.push(path+' → '+chosen);return folder.id;}
 for(const entry of entries){const parts=pathParts(entry.path);if(entry.directory){directory(parts);continue;}const parent=directory(parts.slice(0,-1)),name=unique(parts.at(-1),n=>state.documents.some(d=>d.folder===parent&&d.name.toLocaleLowerCase()===n.toLocaleLowerCase()),true),id=crypto.randomUUID(),fileId=crypto.randomUUID(),at=new Date().toISOString();if(name!==parts.at(-1))renamed.push(entry.path+' → '+name);
  state.documents.push({id,name,folder:parent,code:'',version:'01',status:'Borrador',type:/\.[a-z0-9]{1,12}$/i.test(entry.file.name)?entry.file.name.split('.').at(-1).toUpperCase():'ARCHIVO',shared:[],linkedFolders:[],description:'Archivo importado desde el equipo.',modified:at,origin:'internal',documentKind:'Otro',ownerArea:state.folders.find(f=>f.id===parent)?.area||'General',imported:true,managed:true,demo:false,versions:[{id:crypto.randomUUID(),number:'01',status:'draft',created:at,reason:'Carga desde el equipo',fileId,fileName:entry.file.name,fileSize:entry.file.size}]});files.push({...entry,fileId,name});
 }return {state,files,renamed,bytes,folderCount:state.folders.length-original.folders.length};
}
