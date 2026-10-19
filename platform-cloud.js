// Only a publishable key is shipped. Authorization is enforced by Supabase RLS.
export const cloudConfig={url:'https://dziwhbjyvxdbplthpazt.supabase.co',key:'sb_publishable_-xU5BouTnJdcFFCykq6gtg_kymU5JdF'};
let client,user,member,values=new Map(),revisions=new Map(),pending=new Map(),running,timer,problem='';
const blockedObjects=new Set();
const native=()=>globalThis.localStorage;
const journalKey=()=>`integral-pending-v1:${user.id}`;
const tracked=key=>String(key).startsWith('arles-');
const notify=()=>{if(typeof document!=='undefined')document.dispatchEvent(new Event('integral-cloud-status'));};
const fail=error=>{throw Error(error.message||String(error));};
export const cloudActive=()=>!!user&&!!member;
export const cloudActor=()=>cloudActive()?{userId:user.id,name:member.display_name,role:'Usuario autenticado'}:null;
export const cloudStatus=()=>({connected:cloudActive(),name:member?.display_name,email:user?.email,pending:pending.size,busy:!!running,error:problem});
export function cloudClient(){if(!client){if(!globalThis.supabase)throw Error('No se pudo cargar la conexión. Recarga la página.');client=globalThis.supabase.createClient(cloudConfig.url,cloudConfig.key,{auth:{storageKey:'integral-auth-v1',detectSessionInUrl:false}});}return client;}
function journal(){native().setItem(journalKey(),JSON.stringify([...pending]));}
export async function initializeCloud(){
 const db=cloudClient(),session=await db.auth.getSession();if(session.error)fail(session.error);if(!session.data.session)return;
 const verified=await db.auth.getUser();if(verified.error)fail(verified.error);user=verified.data.user;
 const membership=await db.from('integral_members').select('display_name,active').eq('user_id',user.id).maybeSingle();if(membership.error)fail(membership.error);
 if(!membership.data?.active)throw Error('Esta cuenta no tiene acceso a Plataforma Integral. Su acceso a censos no cambia.');member=membership.data;
 const state=await db.from('integral_state').select('key,payload,revision').like('key','state:%');if(state.error)fail(state.error);
 for(const row of state.data){revisions.set(row.key,row.revision);if(row.payload!==null)values.set(row.key.slice(6),row.payload);}
 const saved=JSON.parse(native().getItem(journalKey())||'[]');pending=new Map(saved);
 for(const [key,item] of pending){if((revisions.get('state:'+key)||0)!==item.revision)problem='Hay cambios pendientes y otra versión en la nube. Descarga tus pendientes antes de resolver el conflicto.';if(item.payload===null)values.delete(key);else values.set(key,item.payload);}
 if(pending.size&&!problem)timer=setTimeout(()=>flushCloud().catch(()=>{}),300);
 db.auth.onAuthStateChange((_event,session)=>{if(user&&session?.user?.id!==user.id)location.reload();});notify();
}
export const platformStorage={
 getItem(key){return cloudActive()&&tracked(key)?values.get(key)??null:native().getItem(key);},
 setItem(key,value){value=String(value);if(!cloudActive()||!tracked(key))return native().setItem(key,value);queue(key,value);},
 removeItem(key){if(!cloudActive()||!tracked(key))return native().removeItem(key);queue(key,null);}
};
function queue(key,payload){
 const before=pending.get(key);pending.set(key,{payload,revision:before?.revision??revisions.get('state:'+key)??0});
 try{journal();}catch(e){if(before)pending.set(key,before);else pending.delete(key);throw e;}
 if(payload===null)values.delete(key);else values.set(key,payload);notify();clearTimeout(timer);if(!problem)timer=setTimeout(()=>flushCloud().catch(()=>{}),200);
}
export async function flushCloud(){
 if(!cloudActive())return;if(running){await running;if(pending.size)return flushCloud();return;}if(!pending.size)return;
 if(problem.startsWith('CONFLICT:')||problem.startsWith('Hay cambios pendientes'))throw Error(problem);
 const batch=[...pending].slice(0,100);problem='';
 running=(async()=>{const result=await client.rpc('integral_save_batch',{changes:batch.map(([key,item])=>({key:'state:'+key,...item}))});if(result.error)fail(result.error);
 for(const row of result.data){const key=row.key.slice(6),sent=batch.find(([k])=>k===key)[1];revisions.set(row.key,row.revision);if(pending.get(key)===sent)pending.delete(key);else if(pending.has(key))pending.get(key).revision=row.revision;}journal();
 })();notify();try{await running;}catch(e){problem=e.message;throw e;}finally{running=null;notify();}
 if(pending.size)return flushCloud();
}
export async function signInCloud(email,password){const r=await cloudClient().auth.signInWithPassword({email,password});if(r.error)fail(r.error);}
export async function signOutCloud(){const r=await cloudClient().auth.signOut({scope:'local'});if(r.error)fail(r.error);}
export const pendingCloudDownload=()=>native().getItem(journalKey())||'[]';
const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
const un64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
export async function encodeCloudValue(v){
 if(v instanceof Date)return ['date',v.toISOString()];
 if(v instanceof Blob)return ['blob',v instanceof File?v.name:null,v.type,b64(new Uint8Array(await v.arrayBuffer()))];
 if(v instanceof ArrayBuffer)return ['bytes',b64(new Uint8Array(v))];
 if(ArrayBuffer.isView(v))return ['bytes',b64(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))];
 if(Array.isArray(v))return ['array',await Promise.all(v.map(encodeCloudValue))];
 if(v&&typeof v==='object')return ['object',await Promise.all(Object.entries(v).map(async([k,x])=>[k,await encodeCloudValue(x)]))];
 return ['value',v];
}
export function decodeCloudValue(v){const [type,value]=v;if(type==='date')return new Date(value);if(type==='blob')return value===null?new Blob([un64(v[3])],{type:v[2]}):new File([un64(v[3])],value,{type:v[2]});if(type==='bytes')return un64(value);if(type==='array')return value.map(decodeCloudValue);if(type==='object')return Object.fromEntries(value.map(([k,x])=>[k,decodeCloudValue(x)]));if(type==='value')return value;throw Error('Archivo de nube inválido.');}
async function manifest(key){const r=await client.from('integral_state').select('payload,revision').eq('key',key).maybeSingle();if(r.error)fail(r.error);revisions.set(key,r.data?.revision||0);return r.data?.payload;}
export async function cloudObject(scope,action,id,value){
 if(!cloudActive())throw Error('Inicia sesión para utilizar la nube.');const key=`file:${scope}:${id}`;
 if(action==='get'){try{const meta=await manifest(key);if(!meta){blockedObjects.delete(key);return undefined;}const r=await client.storage.from('integral-files').download(meta.path);if(r.error)fail(r.error);const json=await new Response(r.data.stream().pipeThrough(new DecompressionStream('gzip'))).text();const result=decodeCloudValue(JSON.parse(json));blockedObjects.delete(key);return result;}catch(e){blockedObjects.add(key);throw e;}}
 if(blockedObjects.has(key))throw Error('No se pudo leer la versión existente. Recarga y recupera el archivo antes de guardar cambios.');
 if(!revisions.has(key))await manifest(key);
 let path,payload=null;if(action==='put'){
 const json=JSON.stringify(await encodeCloudValue(value));const blob=await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
 if(blob.size>50*1024*1024)throw Error('Este archivo supera el límite de nube de 50 MB.');path=user.id+'/'+crypto.randomUUID()+'.gz';const upload=await client.storage.from('integral-files').upload(path,blob,{contentType:'application/gzip',upsert:false});if(upload.error)fail(upload.error);payload={path,encoding:'arles-json-gzip-v1'};
 }
 const r=await client.rpc('integral_save_batch',{changes:[{key,payload,revision:revisions.get(key)||0}]});if(r.error){if(path)await client.storage.from('integral-files').remove([path]);fail(r.error);}revisions.set(key,r.data[0].revision);return value;
}
export async function fieldSummary(){if(!cloudActive())throw Error('Inicia sesión.');const result=[];for(const type of ['FLORACION','FRUTOS','PRODUCCION']){const r=await client.from('campo_records').select('id',{count:'exact',head:true}).eq('tipo',type);if(r.error)fail(r.error);result.push({type,count:r.count});}return result;}
export async function officeDraft(fileId){
 if(!cloudActive())return null;
 const value=await cloudObject('document','get','editor-onlyoffice:'+fileId);
 if(value&&(value.kind!=='arles-onlyoffice-draft-v1'||value.sourceFileId!==fileId||!(value.blob instanceof Blob)))throw Error('No se pudo validar el borrador compartido.');
 return value||null;
}
export async function refreshCloudLibrary(){
 if(!cloudActive())return false;const keys=['arles-documental-prototipo-v1','arles-audit-v1'];if(keys.some(key=>pending.has(key)))return false;
 const rows=await Promise.all(keys.map(async key=>({key,row:await client.from('integral_state').select('payload,revision').eq('key','state:'+key).maybeSingle()})));for(const {key,row} of rows){if(row.error)fail(row.error);if(pending.has(key))return false;}
 for(const {key,row} of rows){revisions.set('state:'+key,row.data?.revision||0);if(row.data?.payload==null)values.delete(key);else values.set(key,row.data.payload);}if(typeof document!=='undefined'){document.dispatchEvent(new Event('library-updated'));document.dispatchEvent(new Event('platform-data-changed'));}return true;
}
let scheduleRefresh;
export async function refreshCloudSchedule(){
 if(!cloudActive())return false;if(scheduleRefresh)return scheduleRefresh;
 const keys=['arles-turnos-v1','arles-audit-v1'];if(keys.some(key=>pending.has(key)))return false;
 scheduleRefresh=(async()=>{
  const rows=await Promise.all(keys.map(async key=>({key,row:await client.from('integral_state').select('payload,revision').eq('key','state:'+key).maybeSingle()})));
  for(const {key,row} of rows){if(row.error)fail(row.error);if(pending.has(key)||(row.data?.revision||0)<(revisions.get('state:'+key)||0))return false;}
  const changed=rows.some(({key,row})=>values.get(key)!==(row.data?.payload??undefined));
  for(const {key,row} of rows){revisions.set('state:'+key,row.data?.revision||0);if(row.data?.payload==null)values.delete(key);else values.set(key,row.data.payload);}
  if(changed&&typeof document!=='undefined')document.dispatchEvent(new CustomEvent('platform-data-changed',{detail:{key:'arles-turnos-v1',remote:true}}));
  return changed;
 })();try{return await scheduleRefresh;}finally{scheduleRefresh=null;}
}
