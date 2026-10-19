import http from 'node:http';
import crypto from 'node:crypto';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createClient} from '@supabase/supabase-js';
import {cloudConfig,encodeCloudValue,decodeCloudValue} from '../platform-cloud.js';
import {createPDFToolRoutes} from './pdf-tools.mjs';
import {AI_PLUGIN_GUID} from '../editor-ai-model.js';

const libraryKey='state:arles-documental-prototipo-v1';
const maxBytes=25*1024*1024;
const fail=(status,message)=>Object.assign(new Error(message),{status});
const parse=v=>typeof v==='string'?JSON.parse(v):v;
const draftKey=fileId=>'file:document:editor-onlyoffice:'+fileId;
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
export function signToken(payload,secret){
 const a=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const b=Buffer.from(JSON.stringify(payload)).toString('base64url');
 return a+'.'+b+'.'+crypto.createHmac('sha256',secret).update(a+'.'+b).digest('base64url');
}
export function verifyToken(token,secret){
 const [a,b,c,...extra]=String(token||'').replace(/^Bearer\s+/i,'').split('.');
 if(!a||!b||!c||extra.length)throw fail(401,'Firma del editor inválida.');
 const expected=crypto.createHmac('sha256',secret).update(a+'.'+b).digest();
 const actual=Buffer.from(c,'base64url');
 if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))throw fail(401,'Firma del editor inválida.');
 if(JSON.parse(Buffer.from(a,'base64url')).alg!=='HS256')throw fail(401,'Algoritmo de firma inválido.');
 const value=JSON.parse(Buffer.from(b,'base64url'));
 if(value.exp&&value.exp<Math.floor(Date.now()/1000))throw fail(401,'Firma vencida.');
 return value;
}
async function readJSON(req){
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>64000)throw fail(413,'Solicitud demasiado grande.');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw fail(400,'Solicitud inválida.');}
}
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
function bearer(req){const match=/^Bearer ([^\s]+)$/.exec(req.headers.authorization||'');if(!match)throw fail(401,'Inicia sesión en Arles.');return match[1];}
async function atomic(file,bytes){const temp=file+'.'+crypto.randomUUID()+'.tmp';await writeFile(temp,bytes,{mode:0o600});await rename(temp,file);}

export async function createOnlyofficeBridge({root,secret,publicURL,storageDir,authenticate,allowedOrigins,engineURL='http://127.0.0.1:8088'}={}){
 const configDir=path.join(root,'infra','onlyoffice-local');
 const env=Object.fromEntries((await readFile(path.join(configDir,'.env'),'utf8').catch(()=>'' )).split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
 secret||=env.ONLYOFFICE_JWT_SECRET;
 const origins=new Set(['http://127.0.0.1:4174',...(allowedOrigins||String(env.ONLYOFFICE_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean))]);
 for(const value of origins){const url=new URL(value);if(url.origin!==value||(url.protocol!=='https:'&&value!=='http://127.0.0.1:4174'))throw Error('Origen de la plataforma inválido en la configuración del editor.');}
 if(!secret||secret.length<32)throw Error('Falta el secreto privado de ONLYOFFICE. Ejecuta el lanzador local.');
 storageDir||=path.join(configDir,'private');await mkdir(storageDir,{recursive:true});
 const cipherKey=crypto.createHash('sha256').update(secret).digest();
 const seal=bytes=>{const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',cipherKey,iv);const encrypted=Buffer.concat([cipher.update(bytes),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]);};
 const unseal=bytes=>{const cipher=crypto.createDecipheriv('aes-256-gcm',cipherKey,bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]);};
 const encryptedRead=async file=>unseal(await readFile(path.join(storageDir,file)));
 const encryptedWrite=async(file,bytes)=>atomic(path.join(storageDir,file),seal(bytes));
 const sessions=new Map(),locks=new Map();
 for(const name of await readdir(storageDir)){if(/^[a-f0-9]{32}\.session$/.test(name)){const s=JSON.parse((await encryptedRead(name)).toString());sessions.set(s.id,s);}}
 const saveSession=s=>encryptedWrite(s.id+'.session',Buffer.from(JSON.stringify(s)));
 async function origin(){
  const value=publicURL||(await readFile(path.join(configDir,'runtime','public-url.txt'),'utf8').catch(()=>'' )).trim();
  if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(value))throw fail(503,'El enlace HTTPS temporal todavía no está listo.');
  return value;
 }
 const auth=authenticate||async function(token){
  const db=createClient(cloudConfig.url,cloudConfig.key,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const user=await db.auth.getUser(token);if(user.error||!user.data?.user)throw fail(401,'La sesión de Arles venció. Inicia sesión nuevamente.');
  const member=await db.from('integral_members').select('display_name,active').eq('user_id',user.data.user.id).maybeSingle();
  if(member.error||!member.data?.active)throw fail(403,'Esta cuenta no tiene acceso a Plataforma Integral.');
  return {db,user:user.data.user,name:member.data.display_name};
 };
 async function getManifest(db,key){const r=await db.from('integral_state').select('payload,revision').eq('key',key).maybeSingle();if(r.error)throw fail(503,'No se pudo consultar Supabase.');return r.data;}
 async function getCloudFile(db,row){
  if(!row?.payload?.path)return null;if(row.payload.encoding!=='arles-json-gzip-v1')throw fail(409,'Formato de almacenamiento desconocido.');
  const r=await db.storage.from('integral-files').download(row.payload.path);if(r.error)throw fail(503,'No se pudo leer el archivo de Supabase.');
  return decodeCloudValue(JSON.parse(gunzipSync(Buffer.from(await r.data.arrayBuffer()),{maxOutputLength:100*1024*1024}).toString()));
 }
 async function source(actor,documentId,versionId){
  const row=await getManifest(actor.db,libraryKey);const data=parse(row?.payload)||{};
  const doc=data.documents?.find(d=>d.id===documentId&&!d.demo);
  const version=doc?.versions?.find(v=>v.id===versionId);
  if(!version?.fileId)throw fail(404,'El documento o la versión no están disponibles en Supabase.');
  if(!/\.(xlsx|docx|pptx|pdf)$/i.test(version.fileName||''))throw fail(400,'Este enlace abre archivos XLSX, DOCX, PPTX y PDF.');
  return {doc,version,canEdit:!doc.retired&&!['obsolete','rejected'].includes(version.status)&&doc.documentKind!=='Registro diligenciado'};
 }
 async function serialized(id,fn){
  const before=locks.get(id)||Promise.resolve();const job=before.catch(()=>{}).then(fn);locks.set(id,job);
  try{return await job;}finally{if(locks.get(id)===job)locks.delete(id);}
 }
 async function persist(s){
  if(!s.pending)return;
  let actor;for(const token of Object.values(s.tokens||{})){try{actor=await auth(token);break;}catch{}}
  if(!actor)throw fail(401,'Guardado pendiente: vuelve a abrir el documento e inicia sesión.');
  const current=await source(actor,s.documentId,s.versionId);
  if(!current.canEdit||current.version.fileId!==s.sourceFileId)throw fail(409,'El documento cambió de estado; se conserva una copia pendiente.');
  const key=draftKey(s.sourceFileId),row=await getManifest(actor.db,key);
  if((row?.revision||0)!==s.cloudRevision){
   if(row?.payload?.path===s.previousUploadPath){s.cloudRevision=row.revision;s.previousUploadPath=null;await saveSession(s);}
   else if(row?.payload?.path!==s.pendingUpload?.path)throw fail(409,'Otro editor actualizó el borrador en Supabase. Se conserva la copia pendiente.');
  }
  const bytes=await encryptedRead(s.id+'.draft');
  const value={kind:'arles-onlyoffice-draft-v1',documentId:s.documentId,versionId:s.versionId,sourceFileId:s.sourceFileId,editorSession:s.id,sequence:s.sequence,savedAt:s.pendingAt,updatedBy:actor.user.id,blob:new File([bytes],s.fileName)};
  const object=gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue(value))));
  if(object.length>50*1024*1024)throw fail(413,'El archivo supera el límite de Supabase.');
  let objectPath=s.pendingUpload?.path;
  if(!objectPath){objectPath=actor.user.id+'/'+crypto.randomUUID()+'.gz';const upload=await actor.db.storage.from('integral-files').upload(objectPath,object,{contentType:'application/gzip',upsert:false});if(upload.error)throw fail(503,'Supabase no pudo recibir el archivo; se conserva para reintentar.');s.pendingUpload={path:objectPath};await saveSession(s);}
  if(row?.payload?.path===objectPath)s.cloudRevision=row.revision;
  else{const update=await actor.db.rpc('integral_save_batch',{changes:[{key,payload:{path:objectPath,encoding:'arles-json-gzip-v1'},revision:s.cloudRevision}]});if(update.error)throw fail(409,'Supabase no confirmó el guardado; se conserva para reintentar.');s.cloudRevision=update.data[0].revision;}
  s.savedAt=s.pendingAt;s.pending=false;s.pendingUpload=null;s.previousUploadPath=null;s.error='';await encryptedWrite(s.id+'.source',bytes);await saveSession(s);
 }
 async function open(actor,input,token,platformOrigin){
  const {doc,version,canEdit}=await source(actor,input.documentId,input.versionId);
  const base=await origin(),identity=hash(doc.id+'|'+version.id+'|'+version.fileId);
  return serialized(identity,async()=>{
   let s=[...sessions.values()].find(x=>x.identity===identity&&!x.closed);
   if(!s){
    if([...sessions.values()].filter(x=>!x.closed).length>=20)throw fail(429,'Cierra documentos abiertos antes de abrir otro.');
    const row=await getManifest(actor.db,draftKey(version.fileId));
    const draft=await getCloudFile(actor.db,row);
    if(draft&&(draft.kind!=='arles-onlyoffice-draft-v1'||draft.sourceFileId!==version.fileId||!(draft.blob instanceof Blob)))throw fail(409,'El borrador no se pudo validar; se conserva sin sobrescribirlo.');
    const original=await getCloudFile(actor.db,await getManifest(actor.db,'file:document:'+version.fileId));
    if(!(original instanceof Blob)||original.size>maxBytes)throw fail(413,'Archivo no disponible o mayor de 25 MB.');
    const id=crypto.randomBytes(16).toString('hex');
    s={id,identity,documentId:doc.id,versionId:version.id,sourceFileId:version.fileId,fileName:version.fileName,title:doc.name+' · V'+version.number,key:'arles-'+id,capability:crypto.randomBytes(32).toString('hex'),createdAt:new Date().toISOString(),cloudRevision:row?.revision||0,sequence:draft?.sequence||0,savedAt:draft?.savedAt||null,pending:false,closed:false,tokens:{}};
    await encryptedWrite(id+'.source',Buffer.from(await (draft?.blob||original).arrayBuffer()));sessions.set(id,s);
   }
   s.tokens[actor.user.id]=token;await saveSession(s);
   if(s.pending){try{await serialized(s.id,()=>persist(s));}catch(e){s.error=e.message;await saveSession(s);}}
   const fileType=version.fileName.split('.').at(-1).toLowerCase();
   const config={document:{fileType,key:s.key,title:version.fileName,url:base+'/api/onlyoffice/source/'+s.id+'/'+s.capability,permissions:{edit:canEdit,download:true,print:true}},documentType:{xlsx:'cell',docx:'word',pptx:'slide',pdf:'pdf'}[fileType],editorConfig:{mode:canEdit?'edit':'view',lang:'es',user:{id:actor.user.id,name:actor.name},callbackUrl:base+'/api/onlyoffice/callback/'+s.id+'/'+s.capability,coEditing:{mode:'fast',change:false},customization:{autosave:true,forcesave:true,compactHeader:true,uiTheme:'theme-light'}},height:'100%',width:'100%'};
   if(fileType!=='pdf'){
    const appOrigin=platformOrigin||[...origins].find(value=>value.startsWith('https://'))||'http://127.0.0.1:4174';
    if(!origins.has(appOrigin)&&appOrigin!==base)throw fail(403,'Origen del asistente no autorizado.');
    config.editorConfig.plugins={autostart:[AI_PLUGIN_GUID],pluginsData:[appOrigin+'/office-ai/config.json']};
   }
   config.token=signToken(config,secret);
   return {sessionId:s.id,title:s.title,editable:canEdit,config,savedAt:s.savedAt,pending:s.pending};
  });
 }
 function callbackDownload(value,base){
  const url=new URL(value),engine=new URL(engineURL);
  let pathname=url.pathname;
  if(url.origin===base&&pathname.startsWith('/onlyoffice/cache/files/'))pathname=pathname.slice('/onlyoffice'.length);
  else if(url.origin!==engine.origin||!pathname.startsWith('/cache/files/'))throw fail(400,'Origen de guardado inválido.');
  if(url.username||url.password||url.hash||decodeURIComponent(pathname).split('/').includes('..'))throw fail(400,'Ruta de guardado inválida.');
  return engine.origin+pathname+url.search;
 }
 async function callback(s,body,header){
  const signed=verifyToken(body.token||header,secret);const value=signed.payload||signed;
  if(value.key!==s.key)throw fail(409,'La sesión de edición no coincide.');
  if(![2,6].includes(value.status)){if(value.status===4){s.closed=true;await saveSession(s);}if([3,7].includes(value.status)){s.error='ONLYOFFICE informó un error de guardado.';await saveSession(s);}return {error:0};}
  return serialized(s.id,async()=>{
   const url=callbackDownload(value.url,await origin());
   const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(60000)});
   if(!response.ok||Number(response.headers.get('content-length'))>maxBytes)throw fail(502,'No se pudo recuperar el documento editado.');
   const chunks=[];let length=0;for await(const part of response.body){length+=part.length;if(length>maxBytes)throw fail(413,'El documento editado supera 25 MB.');chunks.push(Buffer.from(part));}
   const bytes=Buffer.concat(chunks);if(!bytes.length)throw fail(502,'El editor devolvió un archivo vacío.');
   const checksum=hash(bytes);
   if(checksum!==s.lastChecksum){
    if(s.pending){try{await persist(s);}catch(e){s.error=e.message;s.previousUploadPath=s.pendingUpload?.path||s.previousUploadPath;}}
    s.sequence++;s.pendingAt=new Date().toISOString();s.lastChecksum=checksum;s.pending=true;s.pendingUpload=null;await encryptedWrite(s.id+'.draft',bytes);await saveSession(s);
   }
   try{await persist(s);}catch(e){s.error=e.message;await saveSession(s);return {error:1};}
   if(value.status===2){s.closed=true;await saveSession(s);}
   return {error:0};
  });
 }
 async function owned(req,id){
  const token=bearer(req),actor=await auth(token),s=sessions.get(id);if(!s)throw fail(404,'Sesión no disponible.');
  const current=await source(actor,s.documentId,s.versionId);if(current.version.fileId!==s.sourceFileId)throw fail(409,'La versión cambió.');
  s.tokens[actor.user.id]=token;await saveSession(s);return {actor,s};
 }
 const pdfTools=createPDFToolRoutes({auth,source,getManifest,getCloudFile,readJSON,send,bearer});
 function proxy(req,res){
  const target=new URL(engineURL),headers={...req.headers,host:target.host,'x-forwarded-host':req.headers.host+'/onlyoffice','x-forwarded-proto':req.headers['x-forwarded-proto']==='https'?'https':'http'};
  const remote=http.request({hostname:target.hostname,port:target.port,path:req.url.slice('/onlyoffice'.length),method:req.method,headers},upstream=>{const output={...upstream.headers};delete output['set-cookie'];res.writeHead(upstream.statusCode,output);upstream.pipe(res);});
  remote.on('error',()=>{if(!res.headersSent)send(res,503,{error:'El motor se está iniciando.'});else res.destroy();});req.pipe(remote);
 }
 async function handle(req,res){
  const url=new URL(req.url,'http://localhost'),route=url.pathname;
  if(route.startsWith('/onlyoffice/')){if(/\/(example|admin)(\/|$)/i.test(route)){send(res,404,{error:'No disponible.'});return true;}proxy(req,res);return true;}
  if(!route.startsWith('/api/onlyoffice/'))return false;
  try{
   if(req.headers.origin){const base=await origin();if(req.headers.origin!==base&&!origins.has(req.headers.origin))throw fail(403,'Origen no autorizado.');res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
   if(req.method==='OPTIONS'){
    if(!req.headers.origin||!['GET','POST'].includes(req.headers['access-control-request-method']))throw fail(403,'Solicitud de conexión inválida.');
    const headers=String(req.headers['access-control-request-headers']||'').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);if(headers.some(h=>!['authorization','content-type'].includes(h)))throw fail(403,'Cabecera de conexión no autorizada.');
    res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600','Cache-Control':'no-store'});res.end();return true;
   }
   if(route==='/api/onlyoffice/health'&&req.method==='GET'){const r=await fetch(engineURL+'/healthcheck',{signal:AbortSignal.timeout(4000)});send(res,r.ok?200:503,{enabled:true,ready:r.ok&&(await r.text()).trim()==='true',publicURL:await origin()});return true;}
   if(await pdfTools(req,res,route))return true;
   if(route==='/api/onlyoffice/session'&&req.method==='POST'){const token=bearer(req);send(res,200,await open(await auth(token),await readJSON(req),token,req.headers.origin));return true;}
   const cap=/^\/api\/onlyoffice\/(source|callback)\/([a-f0-9]{32})\/([a-f0-9]{64})$/.exec(route);
   if(cap){const s=sessions.get(cap[2]);if(!s||s.capability!==cap[3])throw fail(404,'Enlace inválido.');
    if(cap[1]==='source'&&req.method==='GET'){if(s.closed||Date.now()-Date.parse(s.createdAt)>86400000)throw fail(410,'El enlace de apertura venció. Vuelve a abrir el documento.');const bytes=await encryptedRead(s.id+'.source');res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store'});res.end(bytes);return true;}
    if(cap[1]==='callback'&&req.method==='POST'){send(res,200,await callback(s,await readJSON(req),req.headers.authorizationjwt));return true;}
   }
   const match=/^\/api\/onlyoffice\/(state|save|pending)\/([a-f0-9]{32})$/.exec(route);
   if(match){const {s}=await owned(req,match[2]);
    if(match[1]==='state'&&req.method==='GET'){if(s.pending)await serialized(s.id,()=>persist(s)).catch(e=>{s.error=e.message;});send(res,200,{savedAt:s.savedAt,sequence:s.sequence,pending:s.pending,error:s.error||'',closed:s.closed});return true;}
    if(match[1]==='pending'&&req.method==='GET'&&s.pending){const bytes=await encryptedRead(s.id+'.draft');res.writeHead(200,{'Content-Type':'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);return true;}
    if(match[1]==='save'&&req.method==='POST'){const payload={c:'forcesave',key:s.key};payload.token=signToken(payload,secret);const r=await fetch(engineURL+'/coauthoring/CommandService.ashx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});const result=await r.json();if(![0,4].includes(result.error))throw fail(503,'El editor no pudo iniciar el guardado.');send(res,200,{requested:true,noChanges:result.error===4});return true;}
   }
   throw fail(404,'Ruta no disponible.');
  }catch(e){send(res,e.status||503,{error:e.status?e.message:'El servidor temporal no pudo completar la operación.'});return true;}
 }
 function upgrade(req,socket,head){
  if(!req.url.startsWith('/onlyoffice/'))return socket.destroy();
  const target=new URL(engineURL),headers={...req.headers,host:target.host,'x-forwarded-host':req.headers.host+'/onlyoffice','x-forwarded-proto':req.headers['x-forwarded-proto']==='https'?'https':'http'};
  const request=http.request({hostname:target.hostname,port:target.port,path:req.url.slice('/onlyoffice'.length),headers});
  request.on('upgrade',(response,remote,remoteHead)=>{socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(response.headers).map(([key,value])=>key+': '+value).join('\r\n')+'\r\n\r\n');if(remoteHead.length)socket.write(remoteHead);if(head.length)remote.write(head);remote.pipe(socket);socket.pipe(remote);remote.on('error',()=>socket.destroy());socket.on('error',()=>remote.destroy());});
  request.on('response',()=>socket.destroy());request.on('error',()=>socket.destroy());request.end();
 }
 return {handle,upgrade,open,callback,sessions};
}
