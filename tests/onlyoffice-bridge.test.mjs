import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createOnlyofficeBridge,signToken,verifyToken} from '../onlyoffice/bridge.mjs';
import {encodeCloudValue,decodeCloudValue} from '../platform-cloud.js';
const secret='test-only-secret-that-is-not-used-by-the-installed-server';
export async function fakeCloud(file=new File(['original bytes'],'fixture.xlsx')){
 const rows=new Map([['state:arles-documental-prototipo-v1',{revision:1,payload:{documents:[{id:'document',name:'Prueba aislada',versions:[{id:'v1',fileId:'original',fileName:'fixture.xlsx',number:'01',status:'draft'}]}]}}],['file:document:original',{revision:1,payload:{path:'original.gz',encoding:'arles-json-gzip-v1'}}]]);
 const files=new Map([['original.gz',gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue(file))))]]);
 const db={from(){let key;return {select(){return this;},eq(_field,value){key=value;return this;},async maybeSingle(){return {data:rows.get(key)||null};}};},storage:{from(){return {async download(name){return files.has(name)?{data:new Blob([files.get(name)])}:{error:{message:'missing'}};},async upload(name,bytes){files.set(name,Buffer.from(bytes));return {};}};}},async rpc(_name,{changes}){if(db.conflict)return {error:{message:'conflict'}};const data=[];for(const c of changes){if((rows.get(c.key)?.revision||0)!==c.revision)return {error:{message:'conflict'}};const r={...c,revision:c.revision+1};rows.set(c.key,r);data.push(r);}return {data};}};
 const auth=async token=>{if(!/^test-user-[123]$/.test(token)||db.revoked)throw Object.assign(Error('revoked'),{status:401});return {db,user:{id:token},name:token};};
 return {db,rows,files,auth};
}
async function fixture(t,allowedOrigins=[]){
 const folder=await mkdtemp(path.join(os.tmpdir(),'arles-onlyoffice-test-'));t.after(()=>rm(folder,{recursive:true,force:true}));
 const cloud=await fakeCloud();let bytes=Buffer.from('updated XLSX bytes');let requested=0;
 const engine=http.createServer((req,res)=>{requested++;res.end(bytes);});await new Promise(resolve=>engine.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>engine.close(resolve)));
 const engineURL='http://127.0.0.1:'+engine.address().port;
 const bridge=await createOnlyofficeBridge({root:path.resolve('.'),secret,publicURL:'https://docs.example.com',storageDir:folder,authenticate:cloud.auth,engineURL,allowedOrigins});
 const open=async(user='test-user-1')=>bridge.open(await cloud.auth(user),{documentId:'document',versionId:'v1'},user);
 const callback=(s,status=6,url=engineURL+'/cache/files/data/output.xlsx')=>bridge.callback(s,{token:signToken({key:s.key,status,url},secret)});
 return {cloud,bridge,open,callback,folder,setBytes:value=>bytes=Buffer.from(value),requests:()=>requested};
}
test('JWTs reject unsigned changes, expired tokens and unexpected algorithms',()=>{
 const token=signToken({key:'real'},secret);assert.equal(verifyToken(token,secret).key,'real');
 assert.throws(()=>verifyToken(token.replace(/.$/,'0'),secret));assert.throws(()=>verifyToken(signToken({exp:1},secret),secret));assert.throws(()=>verifyToken(token,'wrong secret'));
});
test('Vercel requests require an exact allowed origin and authenticated platform membership',async t=>{
 const f=await fixture(t,['https://platform.example.com']);
 const server=http.createServer((req,res)=>f.bridge.handle(req,res));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url='http://127.0.0.1:'+server.address().port+'/api/onlyoffice/session';
 const preflight={Origin:'https://platform.example.com','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization, content-type'};
 const allowed=await fetch(url,{method:'OPTIONS',headers:preflight});assert.equal(allowed.status,204);assert.equal(allowed.headers.get('access-control-allow-origin'),preflight.Origin);
 assert.equal((await fetch(url,{method:'OPTIONS',headers:{...preflight,Origin:'https://other.example.com'}})).status,403);
 assert.equal((await fetch(url,{method:'OPTIONS',headers:{...preflight,'Access-Control-Request-Headers':'x-secret'}})).status,403);
 assert.equal((await fetch(url,{method:'POST',headers:{Origin:preflight.Origin,'Content-Type':'application/json'},body:'{}'})).status,401);
 const opened=await fetch(url,{method:'POST',headers:{Origin:preflight.Origin,Authorization:'Bearer test-user-1','Content-Type':'application/json'},body:JSON.stringify({documentId:'document',versionId:'v1'})});
 assert.equal(opened.status,200);assert.equal(opened.headers.get('access-control-allow-origin'),preflight.Origin);assert.ok((await opened.json()).config.token);
 f.cloud.db.revoked=true;assert.equal((await fetch(url,{method:'POST',headers:{Origin:preflight.Origin,Authorization:'Bearer test-user-1','Content-Type':'application/json'},body:JSON.stringify({documentId:'document',versionId:'v1'})})).status,401);
});
test('three authenticated editors share a key; intermediate saves preserve it; final close rotates it',async t=>{
 const f=await fixture(t);const first=await f.open(),second=await f.open('test-user-2'),third=await f.open('test-user-3');assert.equal(first.config.document.key,second.config.document.key);assert.equal(first.config.document.key,third.config.document.key);
 const s=f.bridge.sessions.get(first.sessionId);assert.deepEqual(await f.callback(s),{error:0});assert.equal((await f.open()).config.document.key,first.config.document.key);
 const original=f.cloud.files.get('original.gz');assert.equal(decodeCloudValue(JSON.parse(gunzipSync(original))).size,14);
 const row=f.cloud.rows.get('file:document:editor-onlyoffice:original');const value=decodeCloudValue(JSON.parse(gunzipSync(f.cloud.files.get(row.payload.path))));assert.equal(await value.blob.text(),'updated XLSX bytes');assert.equal(value.sourceFileId,'original');
 assert.deepEqual(await f.callback(s),{error:0});assert.equal(s.sequence,1,'Repeated callbacks are idempotent');
 await f.callback(s,2);assert.notEqual((await f.open()).config.document.key,first.config.document.key);
});
test('callback signatures and cache URL restrictions prevent arbitrary requests',async t=>{
 const f=await fixture(t),opened=await f.open(),s=f.bridge.sessions.get(opened.sessionId);
 await assert.rejects(f.bridge.callback(s,{key:s.key,status:6,url:'http://169.254.169.254/latest/meta-data'}),{status:401});
 await assert.rejects(f.callback(s,6,'http://169.254.169.254/latest/meta-data'),{status:400});
 await assert.rejects(f.bridge.callback(s,{token:signToken({key:'different',status:6,url:'https://docs.example.com/onlyoffice/cache/files/a'},secret)}),{status:409});
 assert.equal(f.requests(),0);
});
test('a rejected cloud commit preserves an encrypted pending file and can recover without replacing the original',async t=>{
 const f=await fixture(t),opened=await f.open(),s=f.bridge.sessions.get(opened.sessionId);f.cloud.db.conflict=true;
 assert.deepEqual(await f.callback(s),{error:1});assert.equal(s.pending,true);assert.ok(!f.cloud.rows.has('file:document:editor-onlyoffice:original'));
 const encrypted=await readFile(path.join(f.folder,s.id+'.draft'));assert.ok(!encrypted.includes(Buffer.from('updated XLSX bytes')));
 const uploaded=f.cloud.files.size;assert.deepEqual(await f.callback(s),{error:1});assert.equal(f.cloud.files.size,uploaded,'Retries reuse the uploaded object');
 f.cloud.db.conflict=false;await f.open();assert.equal(s.pending,false);assert.ok(f.cloud.files.has('original.gz'));
});

test('an acknowledgement lost after a successful commit recovers without duplicate uploads',async t=>{
 const f=await fixture(t),opened=await f.open(),s=f.bridge.sessions.get(opened.sessionId),rpc=f.cloud.db.rpc;
 f.cloud.db.rpc=async(...args)=>{await rpc(...args);return {error:{message:'lost acknowledgement'}};};
 assert.deepEqual(await f.callback(s),{error:1});assert.equal(s.pending,true);const uploaded=f.cloud.files.size;
 f.cloud.db.rpc=rpc;await f.open();assert.equal(s.pending,false);assert.equal(s.cloudRevision,1);assert.equal(f.cloud.files.size,uploaded);
});

test('newer edits survive a continuing cloud failure and recover the latest draft',async t=>{
 const f=await fixture(t),opened=await f.open(),s=f.bridge.sessions.get(opened.sessionId);f.cloud.db.conflict=true;
 assert.deepEqual(await f.callback(s),{error:1});f.setBytes('latest edited XLSX bytes');assert.deepEqual(await f.callback(s),{error:1});assert.equal(s.sequence,2);
 f.cloud.db.conflict=false;await f.open();assert.equal(s.pending,false);
 const row=f.cloud.rows.get('file:document:editor-onlyoffice:original'),value=decodeCloudValue(JSON.parse(gunzipSync(f.cloud.files.get(row.payload.path))));assert.equal(await value.blob.text(),'latest edited XLSX bytes');
});
test('retired documents are read only and membership revocation blocks cloud persistence',async t=>{
 const f=await fixture(t);f.cloud.rows.get('state:arles-documental-prototipo-v1').payload.documents[0].retired=true;
 const opened=await f.open();assert.equal(opened.config.document.permissions.edit,false);const s=f.bridge.sessions.get(opened.sessionId);
 f.cloud.db.revoked=true;assert.deepEqual(await f.callback(s),{error:1});assert.equal(s.pending,true);assert.ok(!f.cloud.rows.has('file:document:editor-onlyoffice:original'));
});
