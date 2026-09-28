import * as W from './public/vendor/docx-9.6.1.js';
import {validateMath} from './native-math-model.js';
// Native Office Math (OMML), including matrices and n-ary operators.
export function wordEquation(value){const ast=validateMath(value);
 const xml=(name,children=[],attrs)=>{const x=new W.XmlComponent(name);if(attrs)x.root.push(new W.XmlAttributeComponent(attrs));x.root.push(...children);return x;};
 const val=(name,value)=>xml(name,[],{'m:val':value});
 const group=(name,children)=>xml(name,children);
 function build(n){const c=n.children?.map(build)||[],e=i=>group('m:e',c[i]);switch(n.type){
 case'text':return [new W.MathRun(n.value||' ')];case'seq':return c.flat();
 case'frac':return [new W.MathFraction({numerator:c[0],denominator:c[1]})];
 case'sup':return [new W.MathSuperScript({children:c[0],superScript:c[1]})];
 case'sub':return [new W.MathSubScript({children:c[0],subScript:c[1]})];
 case'subsup':return [new W.MathSubSuperScript({children:c[0],subScript:c[1],superScript:c[2]})];
 case'root':return [new W.MathRadical({children:c[1],degree:n.children[0].value===''?undefined:c[0]})];
 case'op':return [xml('m:nary',[xml('m:naryPr',[val('m:chr',n.symbol),val('m:limLoc','undOvr'),val('m:subHide',n.children[0].value===''?'1':'0'),val('m:supHide',n.children[1].value===''?'1':'0')]),group('m:sub',c[0]),group('m:sup',c[1]),e(2)])];
 case'limit':return [new W.MathLimitLower({children:[new W.MathRun('lim')],limit:c[0]}),...c[1]];
 case'accent':return [xml('m:acc',[xml('m:accPr',[val('m:chr',n.symbol)]),e(0)])];
 case'bracket':{const [a,b]=n.kind==='cases'?['{','']:n.kind==='||'?['|','|']:n.kind.split('');return [xml('m:d',[xml('m:dPr',[val('m:begChr',a),val('m:endChr',b),val('m:grow','1')]),e(0)])];}
 case'matrix':return [xml('m:m',[xml('m:mPr',[xml('m:mcs',[xml('m:mc',[xml('m:mcPr',[val('m:count',String(n.cols)),val('m:mcJc','center')])])])]),...Array.from({length:n.rows},(_,i)=>xml('m:mr',c.slice(i*n.cols,(i+1)*n.cols).map(x=>group('m:e',x))))])];
 }}return new W.Math({children:build(ast)});
}
