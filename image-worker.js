import {initializeImageMagick,ImageMagick,MagickReadSettings,MagickFormat,ResourceLimits,ColorSpace} from './public/vendor/images/magick-0.0.44.js';
import {imageFormats} from './image-formats.js';
let ready;
function initialize(){return ready??=(async()=>{
 const response=await fetch(new URL('./public/vendor/images/magick.wasm',import.meta.url));if(!response.ok)throw Error('No se pudo cargar el lector avanzado.');
 await initializeImageMagick(new Uint8Array(await response.arrayBuffer()));
 ResourceLimits.memory=256n*1024n*1024n;ResourceLimits.disk=0n;ResourceLimits.width=40000n;ResourceLimits.height=40000n;ResourceLimits.listLength=256n;
})();}
self.onmessage=async({data})=>{
 try{
  const format=imageFormats[data.extension];if(!format||format==='SVG')throw Error('Formato no permitido en el lector avanzado.');
  await initialize();
  const settings=new MagickReadSettings({format,frameIndex:0,frameCount:1});
  ImageMagick.read(new Uint8Array(data.bytes),settings,image=>{
   image.autoOrient();const width=image.width,height=image.height;
   if(width*height>80000000)throw Error('La imagen es demasiado grande para la memoria disponible.');
   image.colorSpace=ColorSpace.sRGB;
   // Bound preview memory without changing the source file.
   if(width>8192||height>8192)image.thumbnail(8192,8192);
   image.write(MagickFormat.Png,bytes=>{const result=bytes.slice();self.postMessage({bytes:result.buffer,width,height,format},[result.buffer]);});
  });
 }catch(error){self.postMessage({error:String(error.message||error)});}
};
