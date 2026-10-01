import {mkdir,writeFile} from 'node:fs/promises';
import * as lib from '../public/vendor/pdf/pdf-lib-1.17.1.mjs';
const {PDFDocument,StandardFonts,PageSizes,degrees,rgb,PDFName,PDFString}=lib;
await mkdir('tmp/pdfs',{recursive:true});
async function save(doc,name){await writeFile('tmp/pdfs/'+name,await doc.save());}
const source=await PDFDocument.create(),font=await source.embedFont(StandardFonts.Helvetica);
for(const [i,size] of [PageSizes.A4,[612,792],[420,900]].entries()){
 const page=source.addPage(size);page.drawRectangle({x:40,y:size[1]-140,width:Math.min(size[0]-80,450),height:90,color:rgb(.9,.96,.91)});
 page.drawText('QA SOURCE '+(i+1),{x:60,y:size[1]-80,font,size:23,color:rgb(.07,.3,.2)});
 page.drawText('Arles: texto original y geometria de pagina.',{x:60,y:size[1]-110,font,size:12});
 page.drawRectangle({x:60,y:80,width:90,height:75,borderColor:rgb(.15,.4,.25),borderWidth:2});
 if(i===1){page.setCropBox(20,30,572,722);page.setRotation(degrees(90));}
}
await save(source,'source.pdf');
const extra=await PDFDocument.create(),p=extra.addPage(PageSizes.A4),extraFont=await extra.embedFont(StandardFonts.Helvetica);
p.drawText('QA EXTRA - pagina para combinar',{x:55,y:750,size:20,font:extraFont});await save(extra,'extra.pdf');
const form=await PDFDocument.create(),fp=form.addPage(PageSizes.A4),formFont=await form.embedFont(StandardFonts.Helvetica);
fp.drawText('QA FORM - original interactivo',{x:55,y:750,size:20,font:formFont});const field=form.getForm().createTextField('qa.nombre');field.setText('Arles QA');field.addToPage(fp,{x:55,y:650,width:250,height:30});await save(form,'form.pdf');
const signed=await PDFDocument.create(),sp=signed.addPage(PageSizes.A4),sigFont=await signed.embedFont(StandardFonts.Helvetica);
sp.drawText('QA ONLY - synthetic signature dictionary',{x:40,y:750,size:16,font:sigFont});
const sig=signed.context.register(signed.context.obj({Type:'Sig',Filter:'Adobe.PPKLite',SubFilter:'adbe.pkcs7.detached',ByteRange:[0,0,0,0],Contents:PDFString.of('QA only - no cryptographic signature')}));
const widget=signed.context.register(signed.context.obj({Type:'Annot',Subtype:'Widget',FT:'Sig',T:PDFString.of('qa.signature'),V:sig,Rect:[0,0,0,0],P:sp.ref}));
sp.node.set(PDFName.of('Annots'),signed.context.obj([widget]));signed.catalog.set(PDFName.of('AcroForm'),signed.context.obj({Fields:[widget]}));await save(signed,'signed.pdf');
console.log('Created four isolated PDF fixtures (the signature fixture is synthetic).');
