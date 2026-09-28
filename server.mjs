import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const allowed = new Set(['/assistant.js', '/assistant.css', '/document-workspace.js','/document-workspace.css','/permissions.js','/coordination.js','/coordination.css','/planning.js','/planning.css','/experience.js','/experience.css','/index.html', '/styles.css', '/app.js', '/model.js', '/editor.js', '/audit.js', '/platform.js', '/platform-model.js', '/demo-model.js', '/substances.js', '/document-control.js', '/document-control-model.js', '/turnos.js', '/turnos-model.js', '/turnos.css', '/public/logo-arles-sas.png']);
allowed.add('/native-chart-model.js');allowed.add('/native-charts.js');allowed.add('/public/vendor/chart-4.5.1.js');allowed.add('/native-text-boxes.js');allowed.add('/native-context-ribbon.js');allowed.add('/native-object-deletion.js');allowed.add('/native-art.js');allowed.add('/native-signature.js');allowed.add('/native-object-wrap.js');allowed.add('/native-symbols.js');allowed.add('/native-layout-ribbon.js');allowed.add('/native-norms.js');allowed.add('/native-references.js');allowed.add('/native-icons.js');allowed.add('/native-diagram-model.js');allowed.add('/native-diagrams.js');allowed.add('/native-shapes.js');allowed.add('/native-equations.js');allowed.add('/native-math-model.js');allowed.add('/native-math-docx.js');allowed.add('/native-document.js');allowed.add('/native-docx.js');allowed.add('/public/vendor/docx-9.6.1.js');
allowed.add('/native-objects.js');allowed.add('/native-interaction.js');allowed.add('/native-home.js');allowed.add('/native-view.js');allowed.add('/native-tracking.js');allowed.add('/native-merge.js');allowed.add('/native-merge-model.js');allowed.add('/native-merge-labels.js');allowed.add('/native-insert.js');allowed.add('/native-tools.js');allowed.add('/native-ribbon.js');
allowed.add('/native-assets.js');allowed.add('/native-identity.js');
allowed.add('/native-review.js');
allowed.add('/native-history.js');allowed.add('/native-history-model.js');
allowed.add('/native-pages.js');allowed.add('/native-page-layout.js');
for(const file of await readdir(path.join(root,'public/fsst053')))allowed.add('/public/fsst053/'+file);
allowed.add('/demo-personalizacion.html');
for(const f of ['sheet-model.js','sheet-workspace.js','sheet-workspace.css'])allowed.add('/'+f);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpeg':'image/jpeg', '.jpg':'image/jpeg', '.json':'application/json; charset=utf-8', '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
http.createServer(async (req, res) => {
  const route = new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname;
  if (!allowed.has(route)) { res.writeHead(404); return res.end('No encontrado'); }
  try { const body = await readFile(path.join(root, route)); res.writeHead(200, { 'Content-Type': mime[path.extname(route)], 'Cache-Control': 'no-cache' }); res.end(body); }
  catch { res.writeHead(404); res.end('No encontrado'); }
}).listen(4173, '127.0.0.1', () => console.log('Arles: http://127.0.0.1:4173'));



