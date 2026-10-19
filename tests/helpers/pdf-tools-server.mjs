import http from 'node:http';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fakeCloud} from './onlyoffice-fake-cloud.mjs';
import {encodeCloudValue,decodeCloudValue} from '../../platform-cloud.js';
import {ensureLibraryRoot,ISO_ROOT} from '../../model.js';
import {createPDFToolRoutes} from '../../onlyoffice/pdf-tools.mjs';

export async function pdfToolsFixture({port=0,serveFrontend=false}={}){
 const original=await readFile('tmp/pdfs/source.pdf'),cloud=await fakeCloud(new File([original],'Procedimiento.pdf',{type:'application/pdf'}));
 const doc=(id,fileId,name)=>({id,name,folder:ISO_ROOT,type:'PDF',status:'Borrador',documentKind:'Documento',origin:'internal',ownerArea:'General',code:'',version:'01',modified:'2026-10-04T15:00:00Z',imported:true,managed:true,shared:[],linkedFolders:[],versions:[{id:'v1',number:'01',fileId,fileName:name+'.pdf',status:'draft'}]});
 const state={folders:[],documents:[doc('document','original','Procedimiento'),doc('extra','extra-original','Otro PDF'),doc('scan','scan-original','Escaneo')],favorites:[]};ensureLibraryRoot(state);cloud.rows.set('state:arles-documental-prototipo-v1',{revision:1,payload:JSON.stringify(state)});
 const put=async(key,file,owner='')=>{const name=(owner?owner+'/':'')+key+'.gz';cloud.files.set(name,gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue(file)))));cloud.rows.set('file:document:'+key,{revision:1,payload:{path:name,encoding:'arles-json-gzip-v1'}});};
 await put('extra-original',new File([await readFile('tmp/pdfs/extra.pdf')],'Extra.pdf',{type:'application/pdf'}));await put('scan-original',new File([await readFile('tmp/pdfs/ocr-scanned.pdf')],'Escaneo.pdf',{type:'application/pdf'}));
 const getManifest=async(db,key)=>(await db.from('integral_state').select().eq('key',key).maybeSingle()).data;
 const getCloudFile=async(db,row)=>{if(!row)return null;const response=await db.storage.from('integral-files').download(row.payload.path);if(response.error)throw Error('Missing fixture file');return decodeCloudValue(JSON.parse(gunzipSync(Buffer.from(await response.data.arrayBuffer())).toString()));};
 const source=async(actor,id,vid)=>{const state=JSON.parse((await getManifest(actor.db,'state:arles-documental-prototipo-v1')).payload),doc=state.documents.find(doc=>doc.id===id&&!doc.demo),version=doc?.versions?.find(version=>version.id===vid);if(!version)throw Object.assign(Error('Unavailable source'),{status:404});return {doc,version,canEdit:!doc.retired&&doc.documentKind!=='Registro diligenciado'&&!['obsolete','rejected'].includes(version.status)};};
 const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));},bearer=req=>{const token=/^Bearer (\S+)$/.exec(req.headers.authorization||'')?.[1];if(!token)throw Object.assign(Error('Unauthorized'),{status:401});return token;},readJSON=async req=>{let body='';for await(const bytes of req){body+=bytes;if(body.length>64000)throw Object.assign(Error('Too large'),{status:413});}return JSON.parse(body);};
 const handle=createPDFToolRoutes({auth:cloud.auth,source,getManifest,getCloudFile,readJSON,send,bearer}),publicRoot=path.resolve('dist');
 const server=http.createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;try{
  if(await handle(req,res,pathname))return;
  if(pathname==='/api/onlyoffice/session'){const input=await readJSON(req),{doc,version,canEdit}=await source(await cloud.auth(bearer(req)),input.documentId,input.versionId);send(res,200,{sessionId:'test-session',title:doc.name,editable:canEdit,config:{document:{fileType:'pdf',title:version.fileName},editorConfig:{}}});return;}
  if(pathname.startsWith('/api/onlyoffice/state/')){send(res,200,{pending:false,savedAt:null,error:''});return;}
  if(pathname==='/onlyoffice/web-apps/apps/api/documents/api.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end('window.DocsAPI={DocEditor:class{constructor(id,config){document.getElementById(id).textContent="Sesión de edición aislada para pruebas";queueMicrotask(()=>config.events.onDocumentReady());}}};');return;}
  if(!serveFrontend){res.writeHead(404);res.end();return;}
  const file=path.resolve(publicRoot,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(publicRoot+path.sep))throw Error('Invalid path');const data=await readFile(file);res.writeHead(200,{'Content-Type':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.wasm')?'application/wasm':'application/octet-stream'});res.end(data);
 }catch(error){send(res,error.status||500,{error:error.message});}});
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;return {...cloud,original,put,getManifest,getCloudFile,url,close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
