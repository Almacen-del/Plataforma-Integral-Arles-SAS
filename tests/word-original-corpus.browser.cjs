const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve('output/word-corpus-50'),out=path.join(root,'comparacion-originales');
fs.mkdirSync(out,{recursive:true});
const refs=JSON.parse(fs.readFileSync(path.join(root,'referencia-microsoft-word/resultados.json'),'utf8').replace(/^\uFEFF/,'')),results=[];
for(const item of JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'))){
 if(process.env.CORPUS_IDS&&!process.env.CORPUS_IDS.split(',').map(Number).includes(item.id))continue;
 const folder=path.join(out,String(item.id).padStart(2,'0'));
 const run=spawnSync(process.execPath,['tests/word-ipevr.browser.cjs'],{env:{...process.env,WORD_TEST_FILE:path.join(root,'originales',item.filename),WORD_TEST_OUTPUT:folder},encoding:'utf8',timeout:180000});
 const ref=refs.find(r=>r.id===item.id),report=fs.existsSync(path.join(folder,'resultado.json'))?JSON.parse(fs.readFileSync(path.join(folder,'resultado.json'),'utf8')):null;
 const result={id:item.id,wordPages:ref?.pages??null,referenceError:ref?.error??null,motorPages:report?.print.pages??null,originalIntact:report?.originalIntact??false,missing:report?.missing??null,status:run.status,error:run.error?.message||run.stderr,visualFidelity:ref?.error?'invalid-reference':'pending'};
 results.push(result);fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(result));
 if(run.status!==0)process.exitCode=1;
}
