const urls=new Map();const pending=new Set();
async function files(){return (await import('./document-control.js')).blobOperation;}
export async function addImage(file,{preserveOriginal=false}={}){
 if(!file||!['image/png','image/jpeg','image/webp',...(preserveOriginal?['image/gif','image/bmp']:[])].includes(file.type))throw Error('Selecciona una imagen PNG, JPG o WebP.');
 if(preserveOriginal&&['image/png','image/jpeg'].includes(file.type)){if(file.size>50*1024*1024)throw Error('La imagen supera 50 MB.');const id=crypto.randomUUID();await (await files())('put',id,file);pending.add(id);return {id,alt:file.name.slice(0,180)};}
 if(file.size>(preserveOriginal?50:5)*1024*1024)throw Error('La imagen debe pesar como máximo '+(preserveOriginal?50:5)+' MB.');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>25000000)throw Error('La imagen supera los 25 megapíxeles. Reduce su tamaño.');
  const scale=preserveOriginal?1:Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,preserveOriginal||file.type==='image/png'?'image/png':'image/jpeg',.85));if(!blob)throw Error('No se pudo procesar la imagen.');
  const id=crypto.randomUUID();await (await files())('put',id,blob);pending.add(id);return {id,alt:file.name.slice(0,180)};
 }finally{bitmap.close();}
}
export async function hydrateImages(root){
 await Promise.all([...root.querySelectorAll('img[data-image-id]')].map(async img=>{
  const id=img.dataset.imageId;
  try{if(!urls.has(id)){const blob=await (await files())('get',id);if(!blob)throw Error('Imagen no disponible');urls.set(id,URL.createObjectURL(blob));}img.src=urls.get(id);img.removeAttribute('title');}
  catch{img.removeAttribute('src');img.title='Esta imagen no está disponible en este navegador.';}
 }));
}
export async function imagePrintHTML(html){const root=document.createElement('div');root.innerHTML=html;
 for(const img of root.querySelectorAll('img[data-image-id]')){const blob=await (await files())('get',img.dataset.imageId);if(!blob)throw Error('Falta una imagen del documento. No se imprimió una versión incompleta.');img.src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
 return root.innerHTML;
}
export function commitImages(html){const root=document.createElement('div');root.innerHTML=html;for(const img of root.querySelectorAll('[data-image-id]'))pending.delete(img.dataset.imageId);}
export async function clearImageSession(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();const ids=[...pending];pending.clear();for(const id of ids)try{await (await files())('delete',id);}catch{}}
