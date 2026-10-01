export const chartTypes={columns:'Columnas agrupadas',stackedColumns:'Columnas apiladas',percentColumns:'Columnas apiladas al 100 %',bars:'Barras agrupadas',stackedBars:'Barras apiladas',percentBars:'Barras apiladas al 100 %',line:'Líneas',area:'Área',stackedArea:'Área apilada',pie:'Circular',doughnut:'Anillos',radar:'Radial',scatter:'Dispersión XY',bubble:'Burbujas',combo:'Combinado: columnas y línea',histogram:'Histograma',pareto:'Pareto',waterfall:'Cascada',funnel:'Embudo',box:'Cajas y bigotes'};
export const palettes={arles:['#21804a','#3987be','#e8a135','#9255aa','#cc5555','#49a69a'],office:['#4472c4','#ed7d31','#a5a5a5','#ffc000','#5b9bd5','#70ad47'],soft:['#65a89b','#819cc9','#d5ac67','#ae94be','#ce909b','#96b575']};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n.toLocaleString('es-CO',{maximumFractionDigits:3});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const tag=(name,attrs,body='')=>'<'+name+' '+Object.entries(attrs).map(([k,v])=>k+'="'+escape(v)+'"').join(' ')+'>'+body+'</'+name+'>';
const text=(x,y,body,attrs={})=>tag('text',{x,y,'font-size':11,...attrs},escape(body));
const tooltip=(name,v)=>tag('title',{},escape(name+': '+fmt(v)));
const rectangle=(x,y,width,height,color,tip='')=>tag('rect',{x,y,width:Math.max(0,width),height:Math.max(0,height),fill:color},tip);

export function histogramBins(values,options={}){
 const nums=values.filter(finite);if(!nums.length)return [];
 const lo=Math.min(...nums),hi=Math.max(...nums),span=hi-lo;
 let count=options.binCount,width=options.binWidth;
 if(width!=null&&(!finite(width)||width<=0))throw Error('El ancho de intervalo debe ser positivo.');
 if(count!=null&&(!Number.isInteger(count)||count<1||count>100))throw Error('Usa de 1 a 100 intervalos.');
 if(!width){
  if(!count){const mean=nums.reduce((a,b)=>a+b,0)/nums.length,sd=nums.length>1?Math.sqrt(nums.reduce((a,b)=>a+(b-mean)**2,0)/(nums.length-1)):0;count=span?Math.min(100,Math.max(1,Math.ceil(span/(3.5*sd/Math.cbrt(nums.length)||1)))):1;}
  width=span/count||1;
 }
 count=width&&options.binWidth?Math.max(1,Math.ceil(span/width)):count;
 if(count>100)throw Error('Ese ancho produce más de 100 intervalos. Aumenta el ancho.');
 const bins=Array.from({length:count},(_,i)=>({from:lo+i*width,to:lo+(i+1)*width,count:0}));
 // Intervals are right-inclusive; the first interval also includes the minimum.
 for(const n of nums){const q=(n-lo)/width,index=Math.max(0,Math.min(count-1,Math.ceil(q-1e-12)-1));bins[index].count++;}
 return bins;
}

export function boxSummary(values,method='inclusive'){
 const a=values.filter(finite).sort((x,y)=>x-y);if(!a.length)return null;
 const quantile=p=>{const at=method==='exclusive'?(a.length+1)*p-1:(a.length-1)*p,low=Math.floor(at),fraction=at-low;if(at<=0)return a[0];if(at>=a.length-1)return a.at(-1);return a[low]+(a[low+1]-a[low])*fraction;};
 const q1=quantile(.25),median=quantile(.5),q3=quantile(.75),iqr=q3-q1,inliers=a.filter(v=>v>=q1-1.5*iqr&&v<=q3+1.5*iqr);
 return {q1,median,q3,low:inliers[0],high:inliers.at(-1),mean:a.reduce((x,y)=>x+y,0)/a.length,outliers:a.filter(v=>v<q1-1.5*iqr||v>q3+1.5*iqr)};
}

export function paretoData(categories,values){
 const groups=new Map();values.forEach((v,i)=>{if(finite(v)){if(v<0)throw Error('Pareto necesita valores no negativos.');groups.set(categories[i],(groups.get(categories[i])||0)+v);}});
 const data=[...groups].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value),total=data.reduce((a,b)=>a+b.value,0);let running=0;
 return data.map(p=>({...p,cumulative:total?(running+=p.value)/total:0}));
}

export function renderChart(data,o={}){
 try{return draw(data,o);}catch(error){return '<p role="status">'+escape(error.message)+'</p>';}
}
function draw(data,o){
 const type=o.chartType||'columns',colors=o.themeColors||palettes[o.palette]||palettes.arles;
 if(!chartTypes[type])throw Error('Tipo de gráfico no reconocido.');
 let categories=[...data.categories],series=data.series.map(s=>({...s,values:[...s.values]}));
 if(!series.some(s=>s.values.some(finite)))return '<p>Sin valores numéricos para este filtro.</p>';
 let special=null;
 if(type==='histogram'){const bins=histogramBins(series[0].values,o);categories=bins.map((b,i)=>(i?'(':'[')+fmt(b.from)+'; '+fmt(b.to)+']');series=[{name:'Frecuencia',values:bins.map(b=>b.count)}];}
 if(type==='pareto'){special=paretoData(categories,series[0].values);categories=special.map(p=>p.label);series=[{name:series[0].name,values:special.map(p=>p.value)}];}
 if(['pie','doughnut','waterfall','funnel'].includes(type))series=series.slice(0,1);
 const percent=type.startsWith('percent'),stacked=type.startsWith('stacked')||percent;
 if(percent&&series.some(s=>s.values.some(v=>v<0)))throw Error('El apilado al 100 % requiere valores no negativos.');
 if(percent)for(let i=0;i<categories.length;i++){const sum=series.reduce((a,s)=>a+(s.values[i]||0),0);for(const s of series)if(s.values[i]!=null)s.values[i]=sum?s.values[i]/sum:0;}
 const W=680,legend=o.showLegend!==false&&!['pie','doughnut'].includes(type),legendRows=legend?Math.ceil(series.length/4):0;
 let H=360,left=65,right=620,top=36+legendRows*22,bottom=280,svg='';
 if(legend)series.forEach((s,i)=>{const x=20+i%4*165,y=16+Math.floor(i/4)*22;svg+=rectangle(x,y-9,10,10,colors[i%colors.length])+text(x+15,y,s.name.slice(0,24));});
 const labelValue=v=>percent?fmt(v*100)+' %':fmt(v);
 const frame=body=>tag('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':chartTypes[type],class:'sx-io-chart'},body);
 const valueLabel=(x,y,v)=>o.showLabels?text(x,y,labelValue(v),{'text-anchor':'middle','font-size':10}):'';
 const cats=(x,y)=>categories.forEach((c,i)=>{const every=Math.ceil(categories.length/10);if(i%every===0||i===categories.length-1)svg+=text(x(i),y,c.slice(0,16),{'text-anchor':'middle','font-size':10});});
 if(['pie','doughnut'].includes(type)){
  const vals=series[0].values;if(vals.some(v=>v<0))throw Error('El circular necesita valores no negativos.');const sum=vals.reduce((a,v)=>a+(v||0),0);if(!sum)throw Error('El circular necesita un total positivo.');
  H=Math.max(360,categories.length*19+60);let angle=-Math.PI/2;const cx=170,cy=170,r=118;
  vals.forEach((v,i)=>{if(v==null)return;const end=angle+v/sum*Math.PI*2,color=colors[i%colors.length],tip=tooltip(categories[i],v);if(v===sum)svg+=tag('circle',{cx,cy,r,fill:color},tip);else if(v>0)svg+=tag('path',{d:'M'+cx+' '+cy+'L'+(cx+r*Math.cos(angle))+' '+(cy+r*Math.sin(angle))+'A'+r+' '+r+' 0 '+(end-angle>Math.PI?1:0)+' 1 '+(cx+r*Math.cos(end))+' '+(cy+r*Math.sin(end))+'Z',fill:color},tip);angle=end;svg+=rectangle(325,26+i*19,10,10,color)+text(341,36+i*19,categories[i].slice(0,30)+' · '+fmt(v)+(o.showLabels?' · '+fmt(v/sum*100)+' %':''));});
  if(type==='doughnut')svg+=tag('circle',{cx,cy,r:64,fill:'white'});return frame(svg);
 }
 if(type==='radar'){
  if(categories.length<3||series.some(s=>s.values.some(v=>v<0)))throw Error('El radial requiere al menos tres categorías y valores no negativos.');
  const max=Math.max(...series.flatMap(s=>s.values.filter(finite)))||1,cx=340,cy=top+115;
  const point=(i,r)=>[cx+Math.sin(i/categories.length*Math.PI*2)*r,cy-Math.cos(i/categories.length*Math.PI*2)*r];
  for(const f of [.25,.5,.75,1])svg+=tag('polygon',{points:categories.map((_,i)=>point(i,95*f).join(',')).join(' '),fill:'none',stroke:'#dce3e8'});
  categories.forEach((c,i)=>{const [x,y]=point(i,115);svg+=text(x,y,c.slice(0,12),{'text-anchor':'middle'});});
  series.forEach((s,j)=>{svg+=tag('polygon',{points:s.values.map((v,i)=>point(i,(v||0)/max*95).join(',')).join(' '),fill:colors[j%colors.length]+'22',stroke:colors[j%colors.length]},tag('title',{},escape(s.name)));});return frame(svg);
 }
 if(type==='box'){
  const boxes=series.map(s=>boxSummary(s.values,o.quartiles)),nums=series.flatMap(s=>s.values.filter(finite)),lo=Math.min(...nums),hi=Math.max(...nums),span=hi-lo||1,y=v=>bottom-(v-lo)/span*(bottom-top),step=(right-left)/boxes.length;
  svg+=text(2,top,fmt(hi))+text(2,bottom,fmt(lo));
  boxes.forEach((b,i)=>{if(!b)return;const x=left+step*(i+.5),half=Math.min(45,step*.28),color=colors[i%colors.length];svg+=tag('path',{d:'M'+x+' '+y(b.low)+'V'+y(b.high)+'M'+(x-half/2)+' '+y(b.low)+'H'+(x+half/2)+'M'+(x-half/2)+' '+y(b.high)+'H'+(x+half/2),stroke:color,fill:'none'});svg+=rectangle(x-half,y(b.q3),half*2,Math.max(1,y(b.q1)-y(b.q3)),color+'44',tag('title',{},escape(series[i].name+' · Q1 '+fmt(b.q1)+' · Mediana '+fmt(b.median)+' · Q3 '+fmt(b.q3))));svg+=tag('path',{d:'M'+(x-half)+' '+y(b.median)+'H'+(x+half),stroke:color,'stroke-width':3});svg+=tag('circle',{cx:x,cy:y(b.mean),r:3,fill:color},tooltip('Promedio',b.mean));for(const v of b.outliers)svg+=tag('circle',{cx:x,cy:y(v),r:3,fill:'white',stroke:color},tooltip('Atípico',v));svg+=text(x,bottom+20,series[i].name.slice(0,20),{'text-anchor':'middle'});});return frame(svg);
 }
 if(['scatter','bubble'].includes(type)){
  const points=series.flatMap((s,j)=>s.values.map((v,i)=>({x:data.xValues[i],y:v,i,j,size:data.sizes[i]})).filter(p=>finite(p.x)&&finite(p.y)&&(type!=='bubble'||finite(p.size)&&p.size>0)));
  if(!points.length)throw Error('No hay pares X/Y numéricos'+(type==='bubble'?' con tamaño positivo.':'.'));
  const xmin=Math.min(...points.map(p=>p.x)),xmax=Math.max(...points.map(p=>p.x)),ymin=Math.min(0,...points.map(p=>p.y)),ymax=Math.max(0,...points.map(p=>p.y)),x=v=>left+(v-xmin)/(xmax-xmin||1)*(right-left),y=v=>bottom-(v-ymin)/(ymax-ymin||1)*(bottom-top),maxSize=Math.max(...points.map(p=>p.size||1));
  svg+=tag('path',{d:'M'+left+' '+top+'V'+bottom+'H'+right,fill:'none',stroke:'#bac7cf'})+text(left,bottom+20,fmt(xmin))+text(right,bottom+20,fmt(xmax),{'text-anchor':'end'})+text(2,top,fmt(ymax))+text(2,bottom,fmt(ymin));
  for(const p of points)svg+=tag('circle',{cx:x(p.x),cy:y(p.y),r:type==='bubble'?4+24*Math.sqrt(p.size/maxSize):4,fill:colors[p.j%colors.length]+'99',stroke:colors[p.j%colors.length]},tag('title',{},escape(categories[p.i]+' · '+series[p.j].name+' · X '+fmt(p.x)+' · Y '+fmt(p.y)+(type==='bubble'?' · Tamaño '+fmt(p.size):''))));return frame(svg);
 }
 if(type==='funnel'){
  const vals=series[0].values;if(vals.some(v=>v<0))throw Error('El embudo requiere valores no negativos.');const max=Math.max(...vals.filter(finite))||1;
  H=Math.max(H,top+categories.length*28+50);const step=(H-top-40)/categories.length;
  vals.forEach((v,i)=>{if(v==null)return;const w=(right-left)*v/max;svg+=rectangle((left+right-w)/2,top+i*step,w,step*.85,colors[i%colors.length],tooltip(categories[i],v))+text(8,top+i*step+step*.55,categories[i].slice(0,10))+valueLabel((left+right)/2,top+i*step+step*.55,v);});return frame(svg);
 }
 const waterfall=[];
 if(type==='waterfall'){let running=0;series[0].values.forEach((v,i)=>{if(v==null)return;waterfall.push({label:categories[i],start:running,end:running+v,value:v});running+=v;});waterfall.push({label:'Total',start:0,end:running,value:running,total:true});categories=waterfall.map(p=>p.label);}
 const extremes=stacked?categories.flatMap((_,i)=>[series.reduce((a,s)=>a+Math.max(0,s.values[i]||0),0),series.reduce((a,s)=>a+Math.min(0,s.values[i]||0),0)]):type==='waterfall'?waterfall.flatMap(p=>[p.start,p.end]):series.flatMap(s=>s.values.filter(finite));
 const lo=Math.min(0,...extremes),hi=Math.max(0,...extremes),span=hi-lo||1;
 if(['bars','stackedBars','percentBars'].includes(type)){
  H=Math.max(360,top+categories.length*Math.max(20,series.length*10)+50);bottom=H-40;const x=v=>left+(v-lo)/span*(right-left),step=(bottom-top)/categories.length;
  for(let k=0;k<=4;k++){const v=lo+span*k/4;svg+=tag('path',{d:'M'+x(v)+' '+top+'V'+bottom,stroke:'#e0e7eb'})+text(x(v),bottom+20,labelValue(v),{'text-anchor':'middle'});}
  categories.forEach((c,i)=>{svg+=text(5,top+(i+.5)*step,c.slice(0,9));let positive=0,negative=0;series.forEach((s,j)=>{const v=s.values[i];if(v==null)return;const start=stacked?(v>=0?positive:negative):0,end=start+v;if(v>=0)positive=end;else negative=end;const y=top+i*step+step*.1+(stacked?0:j*step*.8/series.length),h=stacked?step*.8:step*.8/series.length;svg+=rectangle(Math.min(x(start),x(end)),y,Math.abs(x(end)-x(start)),h,colors[j%colors.length],tooltip(c+' · '+s.name,v))+valueLabel(x(end),y+h*.6,v);});});return frame(svg);
 }
 const y=v=>bottom-(v-lo)/span*(bottom-top),step=(right-left)/categories.length,x=i=>left+step*(i+.5);
 for(let k=0;k<=4;k++){const v=lo+span*k/4;svg+=tag('path',{d:'M'+left+' '+y(v)+'H'+right,stroke:'#e0e7eb'})+text(2,y(v)+3,labelValue(v));}
 svg+=tag('path',{d:'M'+left+' '+y(0)+'H'+right,stroke:'#aebfc9'});
 if(type==='waterfall'){
  waterfall.forEach((p,i)=>{const color=p.total?colors[1]:p.value>=0?colors[0]:colors[4];svg+=rectangle(left+i*step+step*.15,Math.min(y(p.start),y(p.end)),step*.7,Math.abs(y(p.end)-y(p.start)),color,tooltip(p.label,p.value))+valueLabel(x(i),Math.min(y(p.start),y(p.end))-5,p.value);if(i<waterfall.length-2)svg+=tag('path',{d:'M'+(left+(i+.85)*step)+' '+y(p.end)+'H'+(left+(i+1.15)*step),stroke:'#8597a2','stroke-dasharray':'3 3'});});cats(x,bottom+20);return frame(svg);
 }
 const positive=Array(categories.length).fill(0),negative=Array(categories.length).fill(0);
 series.forEach((s,j)=>{
  const color=colors[j%colors.length],line=['line','area','stackedArea'].includes(type)||(type==='combo'&&j===series.length-1&&j>0);
  if(line){
   let segments=[],segment=[];
   s.values.forEach((v,i)=>{if(v==null&&type!=='stackedArea'){if(segment.length)segments.push(segment);segment=[];return;}v=v||0;const start=type==='stackedArea'?(v>=0?positive[i]:negative[i]):0,end=start+v;if(type==='stackedArea'){if(v>=0)positive[i]=end;else negative[i]=end;}segment.push({i,v,start,end});});if(segment.length)segments.push(segment);
   for(const points of segments){if(type!=='line'&&type!=='combo')svg+=tag('polygon',{points:[...points.map(p=>x(p.i)+','+y(p.end)),...points.toReversed().map(p=>x(p.i)+','+y(p.start))].join(' '),fill:color+'44'});svg+=tag('polyline',{points:points.map(p=>x(p.i)+','+y(p.end)).join(' '),fill:'none',stroke:color,'stroke-width':2});for(const p of points)svg+=tag('circle',{cx:x(p.i),cy:y(p.end),r:3,fill:color},tooltip(categories[p.i]+' · '+s.name,p.v))+valueLabel(x(p.i),y(p.end)-7,p.v);}
  }else s.values.forEach((v,i)=>{if(v==null)return;const start=stacked?(v>=0?positive[i]:negative[i]):0,end=start+v;if(stacked){if(v>=0)positive[i]=end;else negative[i]=end;}const slots=type==='combo'&&series.length>1?series.length-1:series.length,w=stacked?step*.76:step*.76/slots,px=left+i*step+step*.12+(stacked?0:j*w);svg+=rectangle(px,Math.min(y(start),y(end)),w,Math.abs(y(end)-y(start)),color,tooltip(categories[i]+' · '+s.name,v))+valueLabel(px+w/2,Math.min(y(start),y(end))-5,v);});
 });
 if(type==='pareto'){svg+=tag('polyline',{points:special.map((p,i)=>x(i)+','+(bottom-p.cumulative*(bottom-top))).join(' '),fill:'none',stroke:colors[1],'stroke-width':2});for(const p of [0,.5,1])svg+=text(right+7,bottom-p*(bottom-top),fmt(p*100)+' %');}
 cats(x,bottom+20);return frame(svg);
}
