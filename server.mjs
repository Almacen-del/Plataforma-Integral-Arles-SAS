import {applicationFiles} from './app-assets.mjs';
import assistantHandler from './api/assistant.js';
import editorAssistantHandler from './api/editor-assistant.js';
import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {createOnlyofficeBridge} from './onlyoffice/bridge.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const allowed=new Set(applicationFiles.map(file=>'/'+file));
for(const folder of ['office-ai','public/vendor','public/fsst053'])for(const entry of await readdir(path.join(root,folder),{recursive:true,withFileTypes:true}))if(entry.isFile())allowed.add('/'+path.relative(root,path.join(entry.parentPath,entry.name)).replaceAll('\\','/'));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.json':'application/json; charset=utf-8','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
const onlyoffice=process.env.ARLES_ONLYOFFICE_LOCAL==='true'?await createOnlyofficeBridge({root}):null;
const server=http.createServer(async (req, res) => {
  if(onlyoffice&&await onlyoffice.handle(req,res))return;
  const route = new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname;
  if(route==='/api/assistant')return assistantHandler(req,res);
  if(route==='/api/editor-assistant')return editorAssistantHandler(req,res);
  if (!allowed.has(route)) { res.writeHead(404); return res.end('No encontrado'); }
  try { const body = await readFile(path.join(root, route)); res.writeHead(200, { 'Content-Type': mime[path.extname(route)]||'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(body); }
  catch { res.writeHead(404); res.end('No encontrado'); }
});
if(onlyoffice)server.on('upgrade',onlyoffice.upgrade);
const port=Number(process.env.ARLES_PORT||4173);
server.listen(port, '127.0.0.1', () => console.log('Arles: http://127.0.0.1:'+port));

