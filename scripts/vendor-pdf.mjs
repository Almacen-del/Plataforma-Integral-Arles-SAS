// Run from the repository root. Versions are pinned; resources are copied unchanged.
import {mkdir,copyFile,cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const staging=path.resolve('tmp/pdf-vendor'),target=path.resolve('public/vendor/pdf');
await mkdir(staging,{recursive:true});await mkdir(target,{recursive:true});
const npm=process.platform==='win32'?'npm.cmd':'npm';
function pack(spec){execFileSync(npm,['pack',spec,'--pack-destination',staging],{stdio:'inherit',shell:process.platform==='win32'});}
pack('pdfjs-dist@6.3.289');pack('pdf-lib@1.17.1');
for(const [folder,archive] of [['reader','pdfjs-dist-6.3.289.tgz'],['writer','pdf-lib-1.17.1.tgz']]){await mkdir(path.join(staging,folder),{recursive:true});execFileSync('tar',['-xf',path.join(staging,archive),'-C',path.join(staging,folder)],{stdio:'inherit'});}
const reader=path.join(staging,'reader/package'),writer=path.join(staging,'writer/package');
for(const [from,to] of [['build/pdf.mjs','pdf-6.3.289.mjs'],['build/pdf.worker.mjs','pdf.worker-6.3.289.mjs'],['LICENSE','pdfjs-LICENSE.txt']])await copyFile(path.join(reader,from),path.join(target,to));
for(const folder of ['cmaps','standard_fonts','wasm'])await cp(path.join(reader,folder),path.join(target,folder),{recursive:true});
await copyFile(path.join(writer,'dist/pdf-lib.esm.min.js'),path.join(target,'pdf-lib-1.17.1.mjs'));
await copyFile(path.join(writer,'LICENSE.md'),path.join(target,'pdf-lib-LICENSE.md'));
console.log('PDF.js 6.3.289 and pdf-lib 1.17.1 copied with their licenses.');
