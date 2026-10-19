// Read-only sources supplied by the user; all generated copies go to output/.
const {spawnSync}=require('node:child_process');
const cases=[
 ['Anexo 13 Metodología de IPEVR.docx','word-ipevr'],
 ['Anexo 43 Lista de verificación Módulo 3.docx','word-anexo43'],
];
for(const [name,folder] of cases){
 const result=spawnSync(process.execPath,['tests/word-ipevr.browser.cjs'],{
  stdio:'inherit',env:{...process.env,
   WORD_TEST_FILE:require('node:path').join(process.env.USERPROFILE,'Downloads',name),
   WORD_TEST_OUTPUT:'output/'+folder,
  },
 });
 if(result.error)throw result.error;
 if(result.status!==0)process.exitCode=1;
}
console.log('Estas comprobaciones funcionales no certifican igualdad visual con Microsoft Word.');
