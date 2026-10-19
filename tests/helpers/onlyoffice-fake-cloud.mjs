import {gzipSync} from 'node:zlib';
import {encodeCloudValue} from '../../platform-cloud.js';
// Memoria aislada para las pruebas. Nunca escribe en el proyecto real de Supabase.
export async function fakeCloud(file){
 const rows=new Map([['state:arles-documental-prototipo-v1',{revision:1,payload:{documents:[{id:'document',name:'Prueba aislada',versions:[{id:'v1',fileId:'original',fileName:'fixture.xlsx',number:'01',status:'draft'}]}]}}],['file:document:original',{revision:1,payload:{path:'original.gz',encoding:'arles-json-gzip-v1'}}]]);
 const files=new Map([['original.gz',gzipSync(Buffer.from(JSON.stringify(await encodeCloudValue(file))))]]);
 const db={from(){let key;return {select(){return this;},eq(_field,value){key=value;return this;},async maybeSingle(){return {data:rows.get(key)||null};}};},storage:{from(){return {async download(name){return files.has(name)?{data:new Blob([files.get(name)])}:{error:{message:'missing'}};},async upload(name,bytes){files.set(name,Buffer.from(bytes));return {};}};}},async rpc(_name,{changes}){if(db.conflict)return {error:{message:'conflict'}};const data=[];for(const c of changes){if((rows.get(c.key)?.revision||0)!==c.revision)return {error:{message:'conflict'}};const r={...c,revision:c.revision+1};rows.set(c.key,r);data.push(r);}return {data};}};
 const auth=async token=>{if(!/^test-user-[123]$/.test(token)||db.revoked)throw Object.assign(Error('revoked'),{status:401});return {db,user:{id:token},name:token};};
 return {db,rows,files,auth};
}
