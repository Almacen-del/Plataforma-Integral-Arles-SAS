import {cloudClient,encodeCloudValue} from './platform-cloud.js';

// Keep the upload path across retries. A lost network acknowledgement must not
// delete a file that Supabase already accepted or create a second library copy.
export async function stagePDFCopy(result,db=cloudClient()){
 const verified=await db.auth.getUser();if(verified.error||!verified.data?.user)throw Error('La sesión venció. Inicia sesión nuevamente.');const userId=verified.data.user.id,key='file:document:'+result.fileId,bucket=db.storage.from('integral-files');
 const manifest=async()=>{const response=await db.from('integral_state').select('payload,revision').eq('key',key).maybeSingle();if(response.error)throw Error(response.error.message);return response.data;};
 const existing=await manifest();if(existing){if(!result.stagedPath||existing.payload?.path!==result.stagedPath)throw Error('El identificador de esta copia ya está ocupado. Se conserva el resultado para descargar.');result.uploaded=true;return;}
 result.stagedPath||=userId+'/'+crypto.randomUUID()+'.gz';
 if(!result.stagedUploaded){
  const encoded=JSON.stringify(await encodeCloudValue(result.file)),blob=await new Response(new Blob([encoded]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
  const upload=await bucket.upload(result.stagedPath,blob,{contentType:'application/gzip',upsert:false});if(upload.error){const received=await bucket.download(result.stagedPath);if(received.error||!(received.data instanceof Blob))throw Error(upload.error.message);const a=new Uint8Array(await blob.arrayBuffer()),b=new Uint8Array(await received.data.arrayBuffer());if(a.length!==b.length||a.some((value,index)=>value!==b[index]))throw Error('No se pudo verificar la copia subida. El resultado se conserva.');}result.stagedUploaded=true;
 }
 const response=await db.rpc('integral_save_batch',{changes:[{key,payload:{path:result.stagedPath,encoding:'arles-json-gzip-v1'},revision:0}]});if(response.error){const confirmed=await manifest();if(confirmed?.payload?.path!==result.stagedPath)throw Error(response.error.message);}
 result.uploaded=true;
}
