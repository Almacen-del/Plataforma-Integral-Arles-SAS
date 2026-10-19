import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),PptxGenJS=require('C:/Users/Almacen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs');
// Presentacion sintetica para verificar el motor sin tocar Supabase real.
export async function powerpointFixture(JSZip){
 const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.title='Prueba aislada PowerPoint';pptx.author='Prueba aislada';pptx.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'es-CO'};
 const first=pptx.addSlide();first.background={color:'F5F9F6'};first.addText('PRESENTACION DE PRUEBA',{x:.7,y:.6,w:11,h:.6,fontSize:28,bold:true,color:'154734'});first.addText('Texto inicial editable',{x:.7,y:1.6,w:11,h:.7,fontSize:24,color:'154734'});
 first.addTable([['Actividad','Responsable'],['Verificacion de PPTX','Usuario de prueba']],{x:.7,y:3,w:8.5,h:1.1,fontFace:'Arial',fontSize:16,color:'154734',border:{pt:1,color:'154734'}});
 first.addImage({data:'image/png;base64,'+(await readFile('public/logo-arles-sas.png')).toString('base64'),x:10,y:3,w:1.5,h:1.5});first.addNotes('NOTAS PPTX DE PRUEBA');
 const second=pptx.addSlide();second.addText('SEGUNDA DIAPOSITIVA DE PRUEBA',{x:.7,y:.6,w:11,h:.6,fontSize:26,bold:true,color:'154734'});second.addChart(pptx.ChartType.bar,[{name:'Serie de prueba',labels:['Enero','Febrero'],values:[10,15]}],{x:1,y:1.6,w:10,h:4.5,showTitle:false,showLegend:false,chartColors:['238955'],catAxisLabelFontFace:'Arial',valAxisLabelFontFace:'Arial'});second.addNotes('NOTAS DE SEGUNDA DIAPOSITIVA');
 const zip=await JSZip.loadAsync(await pptx.write({outputType:'arraybuffer',compression:true}));const xml=await zip.file('ppt/slides/slide1.xml').async('string');zip.file('ppt/slides/slide1.xml',xml.replace('</p:sld>','<p:transition spd="slow" advClick="1"><p:fade/></p:transition></p:sld>'));
 return Buffer.from(await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
}
