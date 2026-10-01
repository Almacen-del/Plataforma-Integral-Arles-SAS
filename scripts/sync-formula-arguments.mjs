// Extract factual parameter names from the MIT-licensed Formula.js declarations.
import {readFile,writeFile} from 'node:fs/promises';
const source=(await readFile('tmp/formulas/package/types/esm/index.d.mts','utf8')).replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
const tokens=/\b(?:export\s+)?namespace\s+(\w+)\s*\{|\b(?:export\s+)?function\s+(\w+)\(([^)]*)\)[^;]*;|[{}]/g,stack=[],signatures={};
for(const m of source.matchAll(tokens)){
 if(m[1])stack.push(m[1]);else if(m[2])signatures[[...stack.filter(Boolean),m[2]].join('.')]=m[3].split(',').map(p=>p.trim()).filter(Boolean).map(p=>({name:p.split(':')[0].replace(/[?.]/g,''),optional:p.includes('?')||p.startsWith('...'),repeat:p.startsWith('...')}));else if(m[0]==='{')stack.push(null);else stack.pop();
}
await writeFile('sheet-function-arguments.js','// Parameter names from Formula.js 4.6.1 (MIT); no documentation prose copied.\nexport const functionArguments='+JSON.stringify(signatures)+';\n');
console.log(Object.keys(signatures).length+' argument signatures extracted.');
