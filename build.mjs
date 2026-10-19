import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {applicationFiles} from './app-assets.mjs';
const output=path.resolve('dist');if(path.dirname(output)!==process.cwd())throw Error('Directorio de compilación inválido');
await rm(output,{recursive:true,force:true});
await mkdir(path.join(output,'public'),{recursive:true});
for(const file of applicationFiles){await mkdir(path.dirname(path.join(output,file)),{recursive:true});await copyFile(file,path.join(output,file));}
for(const folder of ['office-ai','public/vendor','public/fsst053'])await cp(folder,path.join(output,folder),{recursive:true});
