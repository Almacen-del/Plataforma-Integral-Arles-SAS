// Run from the repository root. OCR assets are self-hosted and versions are fixed.
import {mkdir,copyFile,writeFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';import path from 'node:path';
const stage=path.resolve('tmp/ocr-vendor'),target=path.resolve('public/vendor/ocr');
await mkdir(stage,{recursive:true});for(const folder of ['core','lang'])await mkdir(path.join(target,folder),{recursive:true});
const packages=[['reader','tesseract.js@7.0.0','tesseract.js-7.0.0.tgz'],['core','tesseract.js-core@7.0.0','tesseract.js-core-7.0.0.tgz'],['spa','@tesseract.js-data/spa@1.0.0','tesseract.js-data-spa-1.0.0.tgz'],['eng','@tesseract.js-data/eng@1.0.0','tesseract.js-data-eng-1.0.0.tgz']];
for(const [folder,spec,archive] of packages){execFileSync(process.platform==='win32'?'npm.cmd':'npm',['pack',spec,'--pack-destination',stage],{stdio:'inherit',shell:process.platform==='win32'});await mkdir(path.join(stage,folder),{recursive:true});execFileSync('tar',['-xf',path.join(stage,archive),'-C',path.join(stage,folder)],{stdio:'inherit'});}
for(const [file,name] of [['dist/tesseract.esm.min.js','tesseract-7.0.0.mjs'],['dist/worker.min.js','worker-7.0.0.js'],['LICENSE.md','tesseract-LICENSE.txt'],['dist/worker.min.js.LICENSE.txt','worker-LICENSE.txt'],['dist/tesseract.min.js.LICENSE.txt','bundle-LICENSE.txt']])await copyFile(path.join(stage,'reader/package',file),path.join(target,name));
for(const name of await readdir(path.join(stage,'core/package')))if(name.endsWith('.wasm.js'))await copyFile(path.join(stage,'core/package',name),path.join(target,'core',name));
await copyFile(path.join(stage,'core/package/LICENSE'),path.join(target,'core-LICENSE.txt'));
for(const language of ['spa','eng']){await copyFile(path.join(stage,language,'package/4.0.0_best_int',language+'.traineddata.gz'),path.join(target,'lang',language+'.traineddata.gz'));await copyFile(path.join(stage,language,'package/package.json'),path.join(target,'lang',language+'-PACKAGE.json'));}
// Language data originates in tessdata_best; retain its Apache 2.0 license.
const response=await fetch('https://raw.githubusercontent.com/tesseract-ocr/tessdata_best/main/LICENSE');if(!response.ok)throw Error('Cannot download language-data license');await writeFile(path.join(target,'lang/Apache-LICENSE.txt'),await response.text());
console.log('Vendored OCR 7.0.0 and Spanish/English best_int models 1.0.0.');
