import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const stage=path.resolve('tmp/xlsx-vendor'),target=path.resolve('public/vendor/xlsx');
await mkdir(stage,{recursive:true});await mkdir(target,{recursive:true});
for(const [name,version] of [['exceljs','4.4.0'],['ssf','0.11.2'],['jszip','3.10.1']]){
 execFileSync(process.platform==='win32'?'npm.cmd':'npm',['pack',name+'@'+version,'--pack-destination','.','--quiet'],{cwd:stage,stdio:'inherit',shell:process.platform==='win32'});
 const folder=path.join(stage,name);await mkdir(folder,{recursive:true});execFileSync('tar',['-xf',path.join(stage,name+'-'+version+'.tgz'),'-C',folder]);
 await copyFile(path.join(folder,'package',name==='exceljs'?'dist/exceljs.min.js':name==='jszip'?'dist/jszip.min.js':'ssf.js'),path.join(target,name+'-'+version+'.js'));
 const license=await readFile(path.join(folder,'package',name==='exceljs'?'LICENSE':name==='jszip'?'LICENSE.markdown':'LICENSE'),'utf8');await writeFile(path.join(target,name+'-LICENSE.txt'),license.trimEnd()+'\n');
}
