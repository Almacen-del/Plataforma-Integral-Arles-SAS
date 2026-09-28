import test from 'node:test';
import assert from 'node:assert/strict';
import { ancestors, depth, ensureLibraryRoot, ISO_ROOT, seed, createFolder, clearDemo, renameItem, moveItem, linkItem } from '../model.js';
const fresh=()=>({folders:[],documents:[],favorites:[]});
test('Edición mantiene identidades, referencias y jerarquía válida',()=>{
 const s=fresh();seed(s);const count=s.documents.length;
 assert.throws(()=>moveItem(s,'folder','almacen','root'),/raíz de Biblioteca/);
 assert.throws(()=>moveItem(s,'document','hds01','root'),/raíz de Biblioteca/);
 const outside=createFolder(s,'root','Fuera de las raíces');
 assert.throws(()=>moveItem(s,'document','hds01',outside.id),/tres raíces/);
 linkItem(s,'document','hds01',['halal','halal']);renameItem(s,'document','hds01','HDS renombrada');moveItem(s,'document','hds01','rainforest');
 assert.equal(s.documents.length,count);assert.deepEqual(s.documents.find(d=>d.id==='hds01').linkedFolders,['halal']);
 assert.throws(()=>moveItem(s,'folder','almacen','tecnica'),/sí misma/);
 assert.throws(()=>moveItem(s,'folder','insumos','hl-soportes'),/cinco/);
 assert.throws(()=>moveItem(s,'folder',ISO_ROOT,'halal'),/raíz/);
 assert.throws(()=>renameItem(s,'folder','politicas',' '));
 linkItem(s,'folder','politicas',['halal']);moveItem(s,'folder','politicas','rainforest');assert.deepEqual(s.folders.find(f=>f.id==='politicas').linkedFolders,['halal']);
});
test('Actualiza pruebas anteriores y conserva tres raíces independientes',()=>{
 const s=fresh();seed(s);
 s.folders=s.folders.filter(f=>!f.id.startsWith('rf-')&&!f.id.startsWith('hl-')&&!['rainforest','halal'].includes(f.id));
 s.documents=s.documents.filter(d=>!d.id.startsWith('rf-')&&!d.id.startsWith('hl-'));s.schemaVersion=2;
 const original=s.documents.find(d=>d.id==='hds01');ensureLibraryRoot(s);
 assert.equal(s.folders.filter(f=>f.parent==='root').length,3);
 assert.equal(s.folders.find(f=>f.id==='halal').name,'Halal — حلال');
 assert.equal(s.documents.length,16);assert.equal(s.documents.find(d=>d.id==='hds01'),original);
 const snapshot=JSON.stringify(s);ensureLibraryRoot(s);assert.equal(JSON.stringify(s),snapshot);
 assert.equal(depth(s.folders,'rf-evidencias'),5);assert.equal(depth(s.folders,'hl-soportes'),5);
 const own=createFolder(s,'hl-producto','Propia');clearDemo(s);
 assert.equal(s.folders.find(f=>f.id===own.id).parent,'halal');
});
test('Migra las carpetas existentes a ISO sin cambiar documentos ni duplicar la raíz',()=>{
 const s=fresh();s.folders=[{id:'propia',name:'Propia',parent:'root',demo:false}];
 s.documents=[{id:'original',folder:'propia',linkedFolders:[]}];
 const documents=JSON.stringify(s.documents);
 ensureLibraryRoot(s);ensureLibraryRoot(s);
 assert.equal(s.folders.length,4);assert.equal(s.folders.find(f=>f.id==='propia').parent,ISO_ROOT);
 assert.equal(JSON.stringify(s.documents),documents);
});
test('Pruebas idempotentes con cinco niveles y referencias válidas',()=>{
 const s=fresh();assert.equal(seed(s),true);const snapshot=JSON.stringify(s);assert.equal(seed(s),false);assert.equal(JSON.stringify(s),snapshot);
 assert.equal(Math.max(...s.folders.map(f=>depth(s.folders,f.id))),5);
 assert.equal(new Set(s.documents.map(d=>d.id)).size,s.documents.length);
 for(const d of s.documents)for(const id of [d.folder,...d.linkedFolders])assert.ok(s.folders.some(f=>f.id===id));
 const h=s.documents.find(d=>d.id==='hds01');assert.equal(h.linkedFolders.length,3);assert.equal(s.documents.filter(d=>d.id==='hds01').length,1);
});
test('No permite sexto nivel, nombres vacíos o duplicados en la misma carpeta',()=>{
 const s=fresh();seed(s);assert.throws(()=>createFolder(s,'tecnica','Sexto'),/cinco/);assert.throws(()=>createFolder(s,'root',' '));
 createFolder(s,'root','Pruebas propias');assert.throws(()=>createFolder(s,'root','pruebas propias'),/existe/);
});
test('Limpiar preserva carpetas manuales, incluso dentro de pruebas',()=>{
 const s=fresh();seed(s);const f=createFolder(s,'producto','Propia');const g=createFolder(s,'root','Raíz propia');s.favorites=['hds01'];clearDemo(s);
 assert.equal(s.folders.length,5);assert.equal(s.folders.find(x=>x.id===f.id).parent,ISO_ROOT);assert.equal(s.documents.length,0);assert.equal(s.favorites.length,0);
 assert.equal(seed(s),true);assert.ok(s.folders.some(x=>x.id===g.id));
});


