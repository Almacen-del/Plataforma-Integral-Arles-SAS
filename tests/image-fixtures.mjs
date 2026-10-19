// Generated fixtures plus upstream samples kept only in ignored tmp/.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {initializeImageMagick,ImageMagick,MagickFormat,Magick} from '../public/vendor/images/magick-0.0.44.js';
await mkdir('tmp/image-engine',{recursive:true});
await initializeImageMagick(new Uint8Array(await readFile('public/vendor/images/magick.wasm')));
console.log(Magick.delegates);
for(const format of ['PNG','JPEG','TIFF','PSD','BMP','WEBP','HEIC','AVIF','TGA','QOI','JP2','EXR']){
 try{await ImageMagick.read('xc:red',image=>{image.resize(64,48);return image.write(format,async bytes=>await writeFile('tmp/image-engine/sample.'+format.toLowerCase(),bytes));});console.log(format,'created');}catch(e){console.log(format,e.message)}
}

for(const [extension,url] of [
 ['full.cr3','https://raw.pixls.us/getfile.php/2663/nice/Canon%20-%20EOS%20M50%20-%20CRAW%20%283:2%29.CR3'],
 ['cr3','https://raw.githubusercontent.com/Exiv2/exiv2/main/test/data/Canon-R6-pruned.CR3'],
 ['heic','https://raw.githubusercontent.com/strukturag/libheif/master/examples/example.heic'],
 ['dng','https://raw.githubusercontent.com/f-spot/raw-samples/master/DNG/RAW_LEICA_M8.DNG']
]){try{await readFile('tmp/image-engine/'+(extension==='full.cr3'?extension:'sample.'+extension));}catch{const response=await fetch(url);if(!response.ok)throw Error('Fixture download failed: '+url);await writeFile('tmp/image-engine/'+(extension==='full.cr3'?extension:'sample.'+extension),new Uint8Array(await response.arrayBuffer()));}}
