import {decodeImage} from './image-engine.js';
let active;
export async function openLibraryImageReader(doc,version,{file:providedFile}={}){
 active?.close();
 if(!document.querySelector('link[data-image-reader]')){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./image-library-reader.css',import.meta.url);css.dataset.imageReader='';document.head.append(css);}
 const dialog=document.createElement('dialog');dialog.className='arles-image-reader';dialog.setAttribute('aria-labelledby','image-reader-title');
 dialog.innerHTML='<header><div><small>ARLES · IMÁGENES</small><h2 id="image-reader-title"></h2></div><button data-action="download">Descargar original</button><button data-action="close" aria-label="Cerrar visor">✕</button></header><nav aria-label="Controles de imagen"><button data-action="fit">Ajustar</button><button data-action="actual">100 %</button><button data-action="out" aria-label="Alejar">−</button><output>100 %</output><button data-action="in" aria-label="Acercar">+</button><button data-action="rotate">Girar ↻</button><button data-action="background">Fondo claro / oscuro</button><button data-action="fullscreen">Pantalla completa</button></nav><div class="air-stage" tabindex="0" aria-label="Imagen: arrastra para mover; usa más y menos para ampliar"><img draggable="false" hidden><p role="status">Cargando archivo…</p></div><footer><span data-info></span><span>Vista de lectura · El original se conserva</span></footer>';
 document.body.append(dialog);active=dialog;dialog.showModal();
 const controller=new AbortController(),{signal}=controller,q=s=>dialog.querySelector(s),stage=q('.air-stage'),img=q('img');
 q('h2').textContent=doc.name||version.fileName;img.alt=doc.name||version.fileName;
 let file,url,closed=false,scale=1,angle=0,x=0,y=0,fitMode=true;
 const pointers=new Map();let pinch=0;
 const controls=()=>dialog.querySelectorAll('nav button').forEach(b=>b.disabled=!url);
 const paint=()=>{img.style.transform=`translate(${x}px,${y}px) rotate(${angle}deg) scale(${scale})`;q('output').textContent=Math.round(scale*100)+' %';};
 function fit(){if(!url)return;fitMode=true;x=y=0;const turned=angle%180!==0,w=turned?img.naturalHeight:img.naturalWidth,h=turned?img.naturalWidth:img.naturalHeight;scale=Math.min(1,(stage.clientWidth-32)/w,(stage.clientHeight-32)/h);paint();}
 function zoom(value){fitMode=false;scale=Math.max(.02,Math.min(16,value));paint();}
 controls();q('[data-action="download"]').disabled=true;
 dialog.addEventListener('click',async event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action==='close')dialog.close();
  if(action==='fit')fit();if(action==='actual'){x=y=0;zoom(1);}
  if(action==='in')zoom(scale*1.25);if(action==='out')zoom(scale/1.25);
  if(action==='rotate'){angle=(angle+90)%360;fit();}
  if(action==='background')stage.classList.toggle('air-light');
  if(action==='fullscreen')try{document.fullscreenElement?await document.exitFullscreen():await dialog.requestFullscreen();}catch{q('[role="status"]').textContent='Este navegador no permite pantalla completa.';}
  if(action==='download'&&file){const link=document.createElement('a'),downloadURL=URL.createObjectURL(file);link.href=downloadURL;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(downloadURL),1000);}
 },{signal});
 stage.addEventListener('wheel',e=>{if(url){e.preventDefault();zoom(scale*Math.exp(-e.deltaY*.002));}},{passive:false,signal});
 stage.addEventListener('pointerdown',e=>{if(!url)return;stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;},{signal});
 stage.addEventListener('pointermove',e=>{const previous=pointers.get(e.pointerId);if(!previous)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)zoom(scale*distance/pinch);pinch=distance;}else{x+=e.clientX-previous.x;y+=e.clientY-previous.y;fitMode=false;paint();}},{signal});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,e=>{pointers.delete(e.pointerId);pinch=0;},{signal});
 dialog.addEventListener('keydown',e=>{if(!url)return;if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')zoom(scale*1.25);if(e.key==='-')zoom(scale/1.25);if(e.key==='0')fit();if(e.key.startsWith('Arrow')){fitMode=false;x+=e.key==='ArrowLeft'?30:e.key==='ArrowRight'?-30:0;y+=e.key==='ArrowUp'?30:e.key==='ArrowDown'?-30:0;paint();}}},{signal});
 const resize=new ResizeObserver(()=>{if(fitMode)fit();});resize.observe(stage);
 dialog.addEventListener('close',()=>{closed=true;controller.abort();resize.disconnect();if(url)URL.revokeObjectURL(url);dialog.remove();if(active===dialog)active=null;},{once:true});
 try{
  const blob=providedFile||await (await import('./document-control.js')).blobOperation('get',version.fileId);if(closed)return;
  if(!(blob instanceof Blob))throw Error('No se encontró el archivo de esta versión.');
  file=new File([blob],version.fileName||doc.name,{type:blob.type});q('[data-action="download"]').disabled=false;
  q('[role="status"]').textContent='Preparando imagen… Los formatos avanzados pueden tardar unos segundos.';
  const result=await decodeImage(file,{signal});if(closed)return;
  url=URL.createObjectURL(result.blob);img.src=url;await img.decode();if(closed)return;
  img.hidden=false;q('[role="status"]').textContent='';q('[data-info]').textContent=`${result.format} · ${result.width} × ${result.height} px · ${(file.size/1048576).toFixed(2)} MB`+(result.preview?' · Vista previa de la cámara':result.native?'':' · Vista convertida')+(/\.(tiff?|ico)$/i.test(file.name)?' · Primera imagen':'')+(/\.(psd|psb)$/i.test(file.name)?' · Composición guardada':'');controls();fit();stage.focus();
 }catch(error){if(!closed)q('[role="status"]').textContent=error.message;}
 return dialog;
}
