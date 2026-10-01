import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist/public',{recursive:true});
for(const f of ['sheet-grid-limits.js','sheet-grid-window.js','sheet-xlsx.js','sheet-xlsx-ui.js'])await copyFile(f,'dist/'+f);
for(const f of ['pdf-ocr.js','pdf-model.js','pdf-workspace.js','pdf-workspace.css'])await copyFile(f,'dist/'+f);
for(const f of ['sheet-developer.js','sheet-developer-model.js'])await copyFile(f,'dist/'+f);
for(const f of ['sheet-view.js','sheet-view-model.js'])await copyFile(f,'dist/'+f);
for(const f of ['sheet-review.js','sheet-review-model.js','sheet-review-language.js','sheet-protection.js'])await copyFile(f,'dist/'+f);
await copyFile('native-document.js','dist/native-document.js');
await copyFile('native-tools.js','dist/native-tools.js');
for(const file of ['native-assets.js','native-identity.js','native-review.js','native-history.js','native-history-model.js','native-pages.js','native-page-layout.js'])await copyFile(file,'dist/'+file);
for(const file of ['document-workspace.js','document-workspace.css','permissions.js','coordination.js','coordination.css','planning.js','planning.css','experience.js','experience.css','index.html','assistant.js','assistant.css','styles.css','app.js','model.js','editor.js','audit.js','platform.js','platform-model.js','demo-model.js','substances.js','document-control.js','document-control-model.js','turnos.js','turnos-model.js','turnos.css','public/logo-arles-sas.png'])await copyFile(file,'dist/'+file);



await cp('public/fsst053','dist/public/fsst053',{recursive:true});

await copyFile('native-docx.js','dist/native-docx.js');
await cp('public/vendor','dist/public/vendor',{recursive:true});

await copyFile('native-ribbon.js','dist/native-ribbon.js');

await copyFile('native-objects.js','dist/native-objects.js');

await copyFile('native-interaction.js','dist/native-interaction.js');

await copyFile('native-home.js','dist/native-home.js');

await copyFile('native-insert.js','dist/native-insert.js');

for(const f of ['native-equations.js','native-math-model.js','native-math-docx.js'])await copyFile(f,'dist/'+f);

await copyFile('native-shapes.js','dist/native-shapes.js');

for(const f of ['native-diagram-model.js','native-diagrams.js'])await copyFile(f,'dist/'+f);

await copyFile('native-icons.js','dist/native-icons.js');

for(const f of ['native-chart-model.js','native-charts.js'])await copyFile(f,'dist/'+f);

await copyFile('native-text-boxes.js','dist/native-text-boxes.js');

await copyFile('native-context-ribbon.js','dist/native-context-ribbon.js');

await copyFile('native-object-deletion.js','dist/native-object-deletion.js');

await copyFile('native-art.js','dist/native-art.js');

await copyFile('native-signature.js','dist/native-signature.js');

await copyFile('native-object-wrap.js','dist/native-object-wrap.js');

await copyFile('native-symbols.js','dist/native-symbols.js');

await copyFile('native-layout-ribbon.js','dist/native-layout-ribbon.js');

await copyFile('native-norms.js','dist/native-norms.js');

await copyFile('native-references.js','dist/native-references.js');

for(const f of ['native-view.js','native-tracking.js','native-merge.js','native-merge-model.js','native-merge-labels.js'])await copyFile(f,'dist/'+f);

for(const f of ['sheet-model.js','sheet-workspace.js','sheet-workspace.css','sheet-insert.js','sheet-insert-model.js','sheet-insert-charts.js','sheet-layout-model.js','sheet-layout.js','sheet-function-arguments.js','sheet-function-catalog.js','sheet-formula-engine.js','sheet-calculation.js','sheet-formulas.js'])await copyFile(f,'dist/'+f);

for(const f of ['sheet-data.js','sheet-data-model.js','sheet-data-rules.js'])await copyFile(f,'dist/'+f);
