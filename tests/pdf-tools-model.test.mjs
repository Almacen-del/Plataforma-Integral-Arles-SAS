import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as PDF from '../public/vendor/pdf/pdf-lib-1.17.1.mjs';
import {loadToolPDF,pdfSplitGroups,transformPDF,addSearchableOCR} from '../pdf-tools-model.js';
import './pdf-fixtures.mjs';

test('merge and split preserve actual page geometry, CropBox, rotation and source bytes',async()=>{
 const original=new Uint8Array(await readFile('tmp/pdfs/source.pdf')),extra=new Uint8Array(await readFile('tmp/pdfs/extra.pdf')),snapshot=original.slice(),[merged]=await transformPDF({operation:'merge',files:[original,extra]}),loaded=await loadToolPDF(merged.bytes),source=await loadToolPDF(original);assert.equal(loaded.count,4);assert.deepEqual(original,snapshot);
 for(let i=0;i<3;i++){assert.deepEqual(loaded.document.getPage(i).getMediaBox(),source.document.getPage(i).getMediaBox());assert.deepEqual(loaded.document.getPage(i).getCropBox(),source.document.getPage(i).getCropBox());assert.deepEqual(loaded.document.getPage(i).getRotation(),source.document.getPage(i).getRotation());}
 const split=await transformPDF({operation:'split',files:[original],splitMode:'ranges',ranges:'2;1,3'});assert.deepEqual(split.map(item=>item.pageCount),[1,2]);const first=await loadToolPDF(split[0].bytes);assert.deepEqual(first.document.getPage(0).getCropBox(),source.document.getPage(1).getCropBox());assert.equal(first.document.getPage(0).getRotation().angle,90);
});
test('lossless compression actually reduces an unoptimized PDF without changing page count',async()=>{
 const source=await PDF.PDFDocument.create();for(let i=0;i<30;i++)source.addPage([595,842]);const original=await source.save({useObjectStreams:false}),[result]=await transformPDF({operation:'compress',files:[original]});assert.ok(result.after<result.before*.8);assert.equal((await loadToolPDF(result.bytes)).count,30);const [again]=await transformPDF({operation:'compress',files:[result.bytes]});assert.ok(again.after<=again.before);
});
test('split rejects invalid or overlapping ranges and excessive result counts',()=>{
 for(const options of [{mode:'ranges',ranges:'0'},{mode:'ranges',ranges:'4'},{mode:'ranges',ranges:'2-1'},{mode:'ranges',ranges:'1-2;2-3'},{mode:'each',pagesPerPart:0}])assert.throws(()=>pdfSplitGroups(3,options));assert.throws(()=>pdfSplitGroups(300,{mode:'each',pagesPerPart:1}),/100/);assert.deepEqual(pdfSplitGroups(5,{mode:'each',pagesPerPart:2}),[[0,1],[2,3],[4]]);
});
test('signed PDFs, forms and invalid files are rejected without bypassing their restrictions',async()=>{
 for(const [name,message] of [['signed.pdf',/firma digital/],['form.pdf',/formulario/]])await assert.rejects(loadToolPDF(await readFile('tmp/pdfs/'+name)),message);await assert.rejects(loadToolPDF(new TextEncoder().encode('not PDF')),/PDF válido/);
});
test('OCR adds invisible PDF text operators while preserving page geometry and original bytes',async()=>{
 const original=new Uint8Array(await readFile('tmp/pdfs/source.pdf')),snapshot=original.slice(),record={words:[{text:'Factura número 12345',quad:[[55,760],[255,760],[255,738],[55,738]]}]},result=await addSearchableOCR(original,new Map([[0,record]])),loaded=await loadToolPDF(result.bytes);assert.equal(result.words,1);assert.equal(loaded.count,3);assert.deepEqual(original,snapshot);assert.deepEqual(loaded.document.getPage(1).getCropBox(),(await loadToolPDF(original)).document.getPage(1).getCropBox());
});
