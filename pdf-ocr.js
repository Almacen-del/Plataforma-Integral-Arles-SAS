export const OCR_LANGUAGES=['spa','eng','spa+eng'];
export const OCR_LIMITS={characters:100000,words:15000,pixels:7000000,side:3200,stepMs:120000};
export function ocrImageSize(width,height){
 if(![width,height].every(n=>Number.isFinite(n)&&n>0))throw Error('El tamaño de la página no es válido para OCR.');
 const scale=Math.min(2.5,OCR_LIMITS.side/Math.max(width,height),Math.sqrt(OCR_LIMITS.pixels/(width*height)));
 return {scale,width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))};
}
export function validateOCR(record){
 if(!record||typeof record.text!=='string'||record.text.length>OCR_LIMITS.characters||!OCR_LANGUAGES.includes(record.language)||!Number.isFinite(record.confidence)||record.confidence<0||record.confidence>100||!Array.isArray(record.words)||record.words.length>OCR_LIMITS.words)throw Error('El resultado OCR no tiene un formato válido.');
 for(const w of record.words)if(typeof w.text!=='string'||!w.text||w.text.length>2000||!Array.isArray(w.quad)||w.quad.length!==4||w.quad.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('La posición del texto OCR no es válida.');
 return record;
}
export function makeOCRRecord(data,language,viewport){
 const text=String(data.text||'').replace(/\r\n?/g,'\n').replace(/\u0000/g,'').trim();
 if(text.length>OCR_LIMITS.characters)throw Error('El texto de esta página supera el límite de OCR.');
 const words=[];for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[])for(const word of line.words||[]){
  const t=String(word.text||'').trim(),box=word.bbox;if(!t||!box||![box.x0,box.y0,box.x1,box.y1].every(Number.isFinite)||box.x1<=box.x0||box.y1<=box.y0)continue;
  words.push({text:t,quad:[[box.x0,box.y0],[box.x1,box.y0],[box.x1,box.y1],[box.x0,box.y1]].map(p=>viewport.convertToPdfPoint(...p))});
 }
 return validateOCR({text,words,language,confidence:Math.max(0,Math.min(100,Number(data.confidence)||0)),recognizedAt:new Date().toISOString()});
}
async function createLocalWorker(language,logger,errorHandler){
 const {default:Tesseract}=await import('./public/vendor/ocr/tesseract-7.0.0.mjs');
 return Tesseract.createWorker(language,1,{workerPath:'/public/vendor/ocr/worker-7.0.0.js',corePath:'/public/vendor/ocr/core',langPath:'/public/vendor/ocr/lang',cachePath:'arles-ocr-7-best-int',workerBlobURL:false,logger,errorHandler});
}
export async function recognizePDFPages(pages,{language='spa',render,onResult,onProgress=()=>{},signal,makeWorker=createLocalWorker,stepMs=OCR_LIMITS.stepMs}){
 if(!OCR_LANGUAGES.includes(language))throw Error('Selecciona un idioma disponible para OCR.');
 let worker,finished=false,index=0,recognized=0,skipped=0,fail;
 const interrupted=new Promise((_,reject)=>fail=reject);interrupted.catch(()=>{});
 const abort=()=>fail(new DOMException('Lectura OCR cancelada.','AbortError'));
 signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 async function step(operation){let timer;try{return await Promise.race([operation,interrupted,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('El OCR tardó demasiado. Prueba con menos páginas o una imagen más clara.')),stepMs))]);}finally{clearTimeout(timer);}}
 try{
  for(index=0;index<pages.length;index++){
   onProgress({index,total:pages.length,progress:0,status:'rendering'});
   const rendered=await step(Promise.resolve().then(()=>render(pages[index])));if(!rendered){skipped++;onProgress({index,total:pages.length,progress:1,status:'skipped'});continue;}
   try{
    if(!worker){const pending=makeWorker(language,m=>onProgress({index,total:pages.length,progress:m.progress||0,status:m.status}),e=>fail(Error(String(e))));Promise.resolve(pending).then(w=>{if(finished)w.terminate().catch(()=>{});},()=>{});worker=await step(pending);}
    const {data}=await step(worker.recognize(rendered.image,{rotateAuto:false},{text:true,blocks:true}));
    if(signal?.aborted)throw new DOMException('Lectura OCR cancelada.','AbortError');
    await onResult(pages[index],makeOCRRecord(data,language,rendered.viewport));recognized++;onProgress({index,total:pages.length,progress:1,status:'done'});
   }finally{rendered.release?.();}
  }
  return {recognized,skipped};
 }finally{finished=true;signal?.removeEventListener('abort',abort);if(worker)await worker.terminate().catch(()=>{});}
}
