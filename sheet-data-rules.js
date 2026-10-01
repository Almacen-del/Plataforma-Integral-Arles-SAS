// Shared by grid filtering, SUBTOTAL and query transformations.
export const comparisonOps={between:'Entre',notbetween:'No está entre',equals:'Igual a',ne:'Distinto de',gt:'Mayor que',ge:'Mayor o igual',lt:'Menor que',le:'Menor o igual'};
export function dateTimeInput(raw,type){
 const text=String(raw);if(type==='date'&&/^\d{4}-\d{2}-\d{2}$/.test(text)){const d=new Date(text+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==text||+d<Date.UTC(1900,0,1))throw Error('Fecha no válida. Usa AAAA-MM-DD.');const n=(+d-Date.UTC(1899,11,31))/864e5;return {raw:String(n>=60?n+1:n),format:'date-short'};}
 if(type==='time'&&/^\d{1,2}:\d{2}(?::\d{2})?$/.test(text)){const [h,m,s=0]=text.split(':').map(Number);if(h>23||m>59||s>59)throw Error('Hora no válida. Usa HH:MM o HH:MM:SS.');return {raw:String((h*3600+m*60+s)/86400),format:'time'};}return {raw:text};
}
export function statisticalFilter(rule,values){
 if(!['top','bottom','topPercent','bottomPercent','aboveAverage','belowAverage'].includes(rule.op))return rule;const nums=values.filter(v=>typeof v==='number'&&Number.isFinite(v)).sort((a,b)=>a-b);if(!nums.length)return {...rule,op:'values',values:[]};
 if(rule.op.endsWith('Average'))return {...rule,op:rule.op==='aboveAverage'?'gt':'lt',query:nums.reduce((a,b)=>a+b,0)/nums.length};
 const n=Number(rule.query);if(!Number.isFinite(n)||n<=0||!rule.op.endsWith('Percent')&&!Number.isInteger(n)||rule.op.endsWith('Percent')&&n>100)throw Error('Escribe una cantidad positiva o un porcentaje hasta 100.');const count=Math.min(nums.length,rule.op.endsWith('Percent')?Math.ceil(nums.length*n/100):n),top=rule.op.startsWith('top');return {...rule,op:top?'ge':'le',query:nums[top?nums.length-count:count-1]};
}
export function matchesData(v,rule,cell={}){
 const text=String(v??'').toLocaleLowerCase('es'),q=String(rule.query??'').toLocaleLowerCase('es'),n=Number(String(rule.query).replace(',','.'));
 if(rule.op==='values')return (rule.values||[]).some(x=>String(x).toLocaleLowerCase('es')===text);
 if(rule.op==='fill'||rule.op==='color')return String(cell[rule.op]||(rule.op==='fill'?'#ffffff':'#203d31')).toLowerCase()===q;
 if(rule.op==='blank')return v===''||v==null;if(rule.op==='notblank')return v!==''&&v!=null;
 if(['gt','ge','lt','le','between','notbetween'].includes(rule.op)){if(typeof v!=='number'||!Number.isFinite(n))return false;const b=Number(String(rule.second).replace(',','.'));return rule.op==='gt'?v>n:rule.op==='ge'?v>=n:rule.op==='lt'?v<n:rule.op==='le'?v<=n:rule.op==='between'?v>=n&&v<=b:!(v>=n&&v<=b);}
 if(rule.op==='equals')return text===q;if(rule.op==='ne')return text!==q;if(rule.op==='starts')return text.startsWith(q);if(rule.op==='ends')return text.endsWith(q);if(rule.op==='notcontains')return !text.includes(q);
 if(rule.op==='wildcard'){let pattern='';for(let i=0;i<q.length;i++){let c=q[i];if(c==='~'&&i+1<q.length)c=q[++i];else if(c==='*'){pattern+='.*';continue;}else if(c==='?'){pattern+='.';continue;}pattern+=c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}return new RegExp('^'+pattern+'$','iu').test(String(v));}
 return text.includes(q);
}
export function compareValidation(v,rule,bound){
 if(v===''&&rule.ignoreBlank!==false)return true;if(rule.type==='any')return true;
 if(rule.type==='custom')return bound(rule.formula)===true;
 if(rule.type==='list'){const items=rule.source?bound(rule.source):rule.items||[];return (Array.isArray(items)?items.flat(Infinity):[items]).some(x=>String(x)===String(v));}
 const n=rule.type==='length'?String(v).length:v;if(typeof n!=='number'||!Number.isFinite(n)||rule.type==='integer'&&!Number.isInteger(n)||rule.type==='time'&&(n<0||n>=1))return false;
 const a=rule.a!==undefined?bound(rule.a):rule.min??(rule.type==='length'?0:-Infinity),b=rule.b!==undefined?bound(rule.b):rule.max??Infinity;
 if(typeof a!=='number'||['between','notbetween'].includes(rule.op||'between')&&typeof b!=='number')return false;
 const op=rule.op||'between';return op==='between'?n>=a&&n<=b:op==='notbetween'?!(n>=a&&n<=b):op==='equals'?n===a:op==='ne'?n!==a:op==='gt'?n>a:op==='ge'?n>=a:op==='lt'?n<a:n<=a;
}
export function outlineHidden(sheet,index,axis='row'){return (sheet.outline||[]).some(g=>g.axis===axis&&g.collapsed&&index>=g.from&&index<=g.to);}
export function dataRowVisible(sheet,row,get,address,range){
 const within=ref=>{const ids=range(ref),first=Number(ids[0].slice(1))-1,last=Number(ids.at(-1).slice(1))-1;return row>first&&row<=last;};
 if(!(sheet.filters||[]).every(f=>{if(!within(f.range))return true;const ids=range(f.range),first=Number(ids[0].slice(1)),last=Number(ids.at(-1).slice(1));const rule=['top','bottom','topPercent','bottomPercent','aboveAverage','belowAverage'].includes(f.op)?statisticalFilter(f,Array.from({length:last-first},(_,i)=>get(address(first+i,f.column)))):f;return matchesData(get(address(row,f.column)),rule,sheet.cells[address(row,f.column)]);}))return false;
 const f=sheet.advancedFilter;if(f&&within(f.range)){if(f.excludedRows?.includes(row))return false;return f.groups.some(g=>g.every(rule=>matchesData(get(address(row,rule.column)),rule,sheet.cells[address(row,rule.column)])));}return true;
}
