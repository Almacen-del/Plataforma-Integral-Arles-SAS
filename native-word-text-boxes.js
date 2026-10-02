import {applyBox} from './native-text-boxes.js';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main',V='urn:schemas-microsoft-com:vml';
const length=value=>{const m=String(value||'').match(/^([\d.]+)(pt|px|in|cm|mm)$/);return m?Number(m[1])*({pt:96/72,px:1,in:96,cm:96/2.54,mm:96/25.4})[m[2]]:null;};
const color=(value,fallback)=>/^#[a-f0-9]{6}$/i.test(value||'')?value:fallback;
// Standalone rectangular VML boxes can use the existing editable box controls.
// Floating, grouped and nonrectangular shapes keep the original as their source.
export function prepareWordTextBoxes(xml,warnings){
 const entries=new Map();
 for(const content of [...xml.getElementsByTagNameNS(W,'txbxContent')]){
  const box=content.parentElement,shape=box?.parentElement;if(shape?.namespaceURI!==V)continue;
  const css=Object.fromEntries(String(shape.getAttribute('style')||'').split(';').map(s=>s.split(':').map(v=>v.trim())).filter(p=>p.length===2));
  let paragraph=shape;while(paragraph&&paragraph.localName!=='p')paragraph=paragraph.parentElement;
  const width=length(css.width),height=length(css.height),standalone=paragraph&&[...paragraph.getElementsByTagNameNS(W,'t')].every(n=>content.contains(n));
  if(!standalone||!width||!height||width>650||height>900||css.position==='absolute'||css.rotation||!['shape','rect'].includes(shape.localName))continue;
  const id=crypto.randomUUID().replaceAll('-',''),padding=length((box.getAttribute('inset')||'8pt').split(',')[0])??10.67;
  entries.set(id,{width,height,padding,wrap:'inline',radius:0,fill:color(shape.getAttribute('fillcolor'),'#ffffff'),stroke:color(shape.getAttribute('strokecolor'),'#000000'),color:'#000000',border:shape.getAttribute('stroked')==='f'?0:length(shape.getAttribute('strokeweight')||'0.75pt')||1});
  const token=kind=>{const p=xml.createElementNS(W,'w:p'),r=xml.createElementNS(W,'w:r'),t=xml.createElementNS(W,'w:t');t.textContent='ARLESBOX'+id+kind;r.append(t);p.append(r);return p;};
  paragraph.replaceWith(token('START'),...content.childNodes,token('END'));
 }
 if(xml.getElementsByTagNameNS(W,'txbxContent').length)warnings.push('Algunos cuadros de texto flotantes o con formas especiales conservan sus palabras en la vista y su estructura completa en el original.');
 return root=>{for(const [id,settings] of entries){const candidates=[...root.querySelectorAll('p')],start=candidates.find(n=>n.textContent==='ARLESBOX'+id+'START'),end=candidates.find(n=>n.textContent==='ARLESBOX'+id+'END');if(!start||!end)throw Error('No se pudo recuperar la ubicación de un cuadro de texto.');const range=document.createRange();range.setStartAfter(start);range.setEndBefore(end);const wrapper=document.createElement('div');wrapper.append(range.extractContents());applyBox(wrapper,settings);range.insertNode(wrapper);start.remove();end.remove();}};
}
