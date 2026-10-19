import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createOfficeHealthHandler} from '../api/onlyoffice/health.js';
import {officeServerURL} from '../onlyoffice-connection.js';
async function response(t,env,fetcher,method='GET'){
 const handler=createOfficeHealthHandler({env,fetcher}),server=http.createServer(handler);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const result=await fetch('http://127.0.0.1:'+server.address().port,{method});
 return {status:result.status,cache:result.headers.get('cache-control'),body:await result.json()};
}
test('health never contacts an unconfigured or malformed editor address',async t=>{
 let requests=0;const fetcher=()=>{requests++;throw Error('Unexpected request');};
 assert.equal((await response(t,{},fetcher)).body.enabled,false);
 for(const value of ['http://localhost:8088','https://user:password@example.com','https://docs.example.com/path','https://docs.example.com?token=value'])assert.throws(()=>officeServerURL(value));
 assert.equal((await response(t,{ONLYOFFICE_SERVER_URL:'http://127.0.0.1:8088'},fetcher)).status,503);
 assert.equal(requests,0);
});
test('health requires a ready engine at the configured HTTPS origin',async t=>{
 const env={ONLYOFFICE_SERVER_URL:'https://docs.example.com'};
 let remote={enabled:true,ready:true,publicURL:'https://docs.example.com'};
 const fetcher=async(url,options)=>{assert.equal(url,'https://docs.example.com/api/onlyoffice/health');assert.equal(options.redirect,'error');return new Response(JSON.stringify(remote));};
 const good=await response(t,env,fetcher);assert.equal(good.cache,'no-store');assert.deepEqual(good.body,{enabled:true,ready:true,serverURL:env.ONLYOFFICE_SERVER_URL});
 remote.publicURL='https://other.example.com';assert.equal((await response(t,env,fetcher)).body.ready,false);
 assert.equal((await response(t,env,async()=>{throw Error('Offline');})).body.ready,false);
 assert.equal((await response(t,env,fetcher,'POST')).status,405);
});
