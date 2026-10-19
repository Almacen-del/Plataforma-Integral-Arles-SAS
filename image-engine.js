import {imageExtension,nativeImageTypes,isLibraryImage} from './image-formats.js';
// Session-only, content-addressed previews: no stale results after a file changes.
const previews=new Map();let cachedBytes=0,idleWorker,idleTimer;
function remember(key,result){
 if(result.blob.size>32*1024*1024)return;
 if(previews.has(key))cachedBytes-=previews.get(key).blob.size;
 previews.delete(key);previews.set(key,result);cachedBytes+=result.blob.size;
 while(cachedBytes>32*1024*1024||previews.size>8){const oldest=previews.keys().next().value;cachedBytes-=previews.get(oldest).blob.size;previews.delete(oldest);}
}
function release(worker){
 idleWorker?.terminate();clearTimeout(idleTimer);idleWorker=worker;
 worker.onmessage=null;worker.onerror=null;
 idleTimer=setTimeout(()=>{idleWorker?.terminate();idleWorker=null;},30000);
}
export async function decodeImage(file,{signal}={}){
 if(!isLibraryImage(file.name))throw Error('Este formato no está reconocido.');
 if(!file.size||file.size>50*1024*1024)throw Error('Selecciona una imagen de hasta 50 MB.');
 signal?.throwIfAborted();const extension=imageExtension(file.name),type=nativeImageTypes[extension];
 // Prefer the camera's saved appearance for view-only Canon files.
 // If no valid preview exists, the RAW decoder below still gets a chance.
 if(extension==='cr3'){
  const {extractCR3Preview}=await import('./image-cr3.js');
  const preview=extractCR3Preview(await file.arrayBuffer());signal?.throwIfAborted();
  if(preview){
   const blob=new Blob([preview],{type:'image/jpeg'}),url=URL.createObjectURL(blob);
   try{const image=new Image();image.src=url;await image.decode();signal?.throwIfAborted();return {blob,width:image.naturalWidth,height:image.naturalHeight,format:'CR3',native:true,preview:true};}
   catch(error){if(signal?.aborted)throw error;}
   finally{URL.revokeObjectURL(url);}
  }
 }
 if(type){
  const blob=file.slice(0,file.size,type),url=URL.createObjectURL(blob);
  try{const image=new Image();image.src=url;await image.decode();signal?.throwIfAborted();return {blob,width:image.naturalWidth,height:image.naturalHeight,format:extension.toUpperCase(),native:true};}
  catch(error){if(signal?.aborted)throw error;if(extension==='svg')throw Error('El SVG no contiene una imagen válida.');}
  finally{URL.revokeObjectURL(url);}
 }
 const bytes=await file.arrayBuffer();signal?.throwIfAborted();
 const digest=await crypto.subtle.digest('SHA-256',bytes);signal?.throwIfAborted();
 const key=extension+':'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(previews.has(key)){const result=previews.get(key);previews.delete(key);previews.set(key,result);return result;}
 return new Promise((resolve,reject)=>{
  const worker=idleWorker||new Worker(new URL('./image-worker.js',import.meta.url),{type:'module'});idleWorker=null;clearTimeout(idleTimer);
  const finish=(error,result)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);if(error){worker.terminate();reject(error);}else{remember(key,result);release(worker);resolve(result);}};
  const abort=()=>finish(new DOMException('Lectura cancelada','AbortError'));
  const timer=setTimeout(()=>finish(Error('La lectura tardó demasiado. Puedes descargar el original.')),60000);
  signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=()=>finish(Error('No se pudo iniciar el lector de imágenes.'));
  worker.onmessage=({data})=>data.error?finish(Error('No se pudo interpretar esta variante del archivo. '+data.error)):finish(null,{width:data.width,height:data.height,format:data.format,blob:new Blob([data.bytes],{type:'image/png'}),native:false});
  worker.postMessage({bytes,extension},[bytes]);
 });
}
