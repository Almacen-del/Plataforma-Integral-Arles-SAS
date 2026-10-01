// Reproducible local language tools. Install nspell@2.1.5 and esbuild@0.25.10
// under tmp/review-vendor before running this script. Dictionaries stay separate
// and unmodified so users can replace them under their respective licenses.
import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises';
import {build} from '../tmp/review-vendor/node_modules/esbuild/lib/main.js';
const target='public/vendor/review';
await mkdir(target,{recursive:true});
const commit=process.argv[2]||(await (await fetch('https://api.github.com/repos/LibreOffice/dictionaries/commits/master')).json()).sha;
if(!/^[a-f0-9]{40}$/.test(commit))throw Error('Missing dictionary revision');
for(const file of ['es_CO.aff','es_CO.dic','th_es_v2.dat','README_hunspell_es.txt','README_th_es.txt','LICENSE.md','MPL-1.1.txt','LGPLv2.1.txt']){
 const response=await fetch('https://raw.githubusercontent.com/LibreOffice/dictionaries/'+commit+'/es/'+file);
 if(!response.ok)throw Error(file+': '+response.status);
 await writeFile(target+'/'+file,new Uint8Array(await response.arrayBuffer()));
}
await build({entryPoints:['tmp/review-vendor/node_modules/nspell/lib/index.js'],bundle:true,format:'esm',platform:'browser',minify:true,outfile:target+'/nspell-2.1.5.js'});
await copyFile('tmp/review-vendor/node_modules/nspell/license',target+'/nspell.LICENSE.txt');
await copyFile('tmp/review-vendor/node_modules/is-buffer/LICENSE',target+'/is-buffer.LICENSE.txt');
await writeFile(target+'/SOURCES.json',JSON.stringify({nspell:'2.1.5',bundler:'esbuild 0.25.10',dictionaryCommit:commit,source:'https://github.com/LibreOffice/dictionaries/tree/'+commit+'/es',spellingLicense:'MPL-1.1',thesaurusLicense:'LGPL-2.1',dictionaryBytes:(await readFile(target+'/es_CO.dic')).length},null,2)+'\n');
console.log('Vendored spelling and thesaurus: '+commit);
