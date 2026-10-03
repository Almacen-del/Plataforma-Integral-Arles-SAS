import assistantHandler from './api/assistant.js';
import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const allowed = new Set(['/assistant.js', '/assistant.css', '/document-workspace.js','/document-workspace.css','/permissions.js','/coordination.js','/coordination.css','/planning.js','/planning.css','/experience.js','/experience.css','/index.html', '/styles.css', '/app.js', '/model.js', '/editor.js', '/audit.js', '/platform.js', '/platform-model.js', '/demo-model.js', '/substances.js', '/document-control.js', '/document-control-model.js', '/turnos.js', '/turnos-model.js', '/turnos.css', '/public/logo-arles-sas.png']);
for(const f of ['sheet-grid-limits.js','sheet-grid-window.js','sheet-xlsx.js','sheet-xlsx-ui.js','public/vendor/xlsx/exceljs-4.4.0.js','public/vendor/xlsx/ssf-0.11.2.js','public/vendor/xlsx/jszip-3.10.1.js'])allowed.add('/'+f);
allowed.add('/sheet-insert.js');allowed.add('/sheet-insert-model.js');allowed.add('/native-chart-model.js');allowed.add('/native-charts.js');allowed.add('/public/vendor/chart-4.5.1.js');allowed.add('/native-text-boxes.js');allowed.add('/native-context-ribbon.js');allowed.add('/native-object-deletion.js');allowed.add('/native-art.js');allowed.add('/native-signature.js');allowed.add('/native-object-wrap.js');allowed.add('/native-symbols.js');allowed.add('/native-layout-ribbon.js');allowed.add('/native-norms.js');allowed.add('/native-references.js');allowed.add('/native-icons.js');allowed.add('/native-diagram-model.js');allowed.add('/native-diagrams.js');allowed.add('/native-shapes.js');allowed.add('/native-equations.js');allowed.add('/native-math-model.js');allowed.add('/native-math-docx.js');allowed.add('/native-document.js');allowed.add('/native-docx.js');allowed.add('/public/vendor/docx-9.6.1.js');
allowed.add('/native-objects.js');allowed.add('/native-interaction.js');allowed.add('/native-home.js');allowed.add('/native-view.js');allowed.add('/native-tracking.js');allowed.add('/native-merge.js');allowed.add('/native-merge-model.js');allowed.add('/native-merge-labels.js');allowed.add('/native-insert.js');allowed.add('/native-tools.js');allowed.add('/native-ribbon.js');
allowed.add('/native-assets.js');allowed.add('/native-identity.js');
allowed.add('/sheet-insert-charts.js');
allowed.add('/sheet-layout-model.js');allowed.add('/sheet-layout.js');
for(const f of ['sheet-function-arguments.js','sheet-function-catalog.js','sheet-formula-engine.js','sheet-calculation.js','sheet-formulas.js','public/vendor/formulajs-4.6.1.js'])allowed.add('/'+f);
allowed.add('/native-review.js');
allowed.add('/native-history.js');allowed.add('/native-history-model.js');
allowed.add('/native-pages.js');allowed.add('/native-page-layout.js');
for(const file of await readdir(path.join(root,'public/fsst053')))allowed.add('/public/fsst053/'+file);
allowed.add('/demo-personalizacion.html');
for(const f of ['sheet-model.js','sheet-workspace.js','sheet-workspace.css'])allowed.add('/'+f);
for(const f of ['sheet-review.js','sheet-review-model.js','sheet-review-language.js','sheet-protection.js'])allowed.add('/'+f);
for(const file of await readdir(path.join(root,'public/vendor/review')))allowed.add('/public/vendor/review/'+file);
for(const f of ['sheet-view.js','sheet-view-model.js'])allowed.add('/'+f);
for(const f of ['sheet-developer.js','sheet-developer-model.js'])allowed.add('/'+f);
for(const f of ['pdf-ocr.js','pdf-model.js','pdf-workspace.js','pdf-workspace.css'])allowed.add('/'+f);
for(const entry of await readdir(path.join(root,'public/vendor/pdf'),{recursive:true,withFileTypes:true}))if(entry.isFile())allowed.add('/'+path.relative(root,path.join(entry.parentPath,entry.name)).replaceAll('\\','/'));
for(const entry of await readdir(path.join(root,'public/vendor/ocr'),{recursive:true,withFileTypes:true}))if(entry.isFile())allowed.add('/'+path.relative(root,path.join(entry.parentPath,entry.name)).replaceAll('\\','/'));
allowed.add('/public/vendor/paged-0.4.3.js');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.wasm':'application/wasm', '.png': 'image/png', '.jpeg':'image/jpeg', '.jpg':'image/jpeg', '.json':'application/json; charset=utf-8', '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
http.createServer(async (req, res) => {
  const route = new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname;
  if(route==='/api/assistant')return assistantHandler(req,res);
  if (!allowed.has(route)) { res.writeHead(404); return res.end('No encontrado'); }
  try { const body = await readFile(path.join(root, route)); res.writeHead(200, { 'Content-Type': mime[path.extname(route)]||'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(body); }
  catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(4173, '127.0.0.1', () => console.log('Arles: http://127.0.0.1:4173'));

for(const f of ['sheet-data.js','sheet-data-model.js','sheet-data-rules.js'])allowed.add('/'+f);

for(const f of ['platform-cloud.js','platform-boot.js','public/vendor/supabase-2.117.2.js','public/vendor/supabase-LICENSE.txt'])allowed.add('/'+f);
for(const f of ['library-upload.js','library-upload-model.js','document-source-history.js','assistant-documents.js','assistant-markdown.js','native-docx-import.js','native-docx-format.js','native-docx-preserve.js','native-print.js','native-word-sections.js','native-word-comments.js','native-word-revisions.js','native-math-import.js','native-word-charts.js','native-word-notes.js','native-word-note-parts.js','native-word-controls.js','native-word-text-boxes.js','native-word-bibliography.js'])allowed.add('/'+f);

for(const f of ['mammoth-1.13.0.js','mammoth-LICENSE.txt'])allowed.add('/public/vendor/'+f);
