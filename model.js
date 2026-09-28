export const ROOT = 'root';
export function itemById(state, kind, id) {
  const item=(kind==='folder'?state.folders:state.documents).find(x=>x.id===id);
  if(!item)throw new Error('El elemento ya no existe.');return item;
}
export function renameItem(state,kind,id,name){
  const item=itemById(state,kind,id);name=name.trim();
  if(!name||name.length>100)throw new Error('Escribe un nombre de 1 a 100 caracteres.');
  const collection=kind==='folder'?state.folders:state.documents, field=kind==='folder'?'parent':'folder';
  if(collection.some(x=>x.id!==id&&x[field]===item[field]&&x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new Error('Ya existe ese nombre en el destino.');
  item.name=name;
}
export function moveItem(state,kind,id,target){
  const item=itemById(state,kind,id);
  if(target===ROOT)throw new Error('Elige un destino dentro de ISO 9001-2015, Rainforest o Halal. No se pueden mover elementos a la raíz de Biblioteca.');
  if(target!==ROOT&&!state.folders.some(f=>f.id===target))throw new Error('Selecciona una carpeta válida.');
  if(!ancestors(state.folders,target).some(f=>LIBRARY_ROOTS.includes(f.id)))throw new Error('El destino debe estar dentro de una de las tres raíces.');
  if(kind==='folder'&&LIBRARY_ROOTS.includes(id))throw new Error('Las carpetas raíz permanecen en Biblioteca.');
  const field=kind==='folder'?'parent':'folder',collection=kind==='folder'?state.folders:state.documents;
  if(collection.some(x=>x.id!==id&&x[field]===target&&x.name.toLocaleLowerCase()===item.name.toLocaleLowerCase()))throw new Error('Ya existe ese nombre en el destino.');
  if(kind==='folder'){
    if(target===id||ancestors(state.folders,target).some(f=>f.id===id))throw new Error('Una carpeta no puede moverse dentro de sí misma o sus subcarpetas.');
    const subtree=state.folders.filter(f=>ancestors(state.folders,f.id).some(a=>a.id===id));
    const height=Math.max(...subtree.map(f=>ancestors(state.folders,f.id).length-ancestors(state.folders,id).length));
    if(depth(state.folders,target)+1+height>5)throw new Error('El movimiento superaría los cinco niveles.');
  }
  item[field]=target;item.linkedFolders=(item.linkedFolders||[]).filter(x=>x!==target);
}
export function linkItem(state,kind,id,targets){
  const item=itemById(state,kind,id),origin=kind==='folder'?item.parent:item.folder;
  const valid=[...new Set(targets)];
  if(valid.some(t=>!state.folders.some(f=>f.id===t)||t===origin||(kind==='folder'&&t===id)))throw new Error('Elige otras carpetas válidas, distintas del origen y del propio elemento.');
  item.linkedFolders=valid;
}
export const ISO_ROOT = 'iso-9001-2015';
export const RAINFOREST_ROOT = 'rainforest';
export const HALAL_ROOT = 'halal';
export const LIBRARY_ROOTS = [ISO_ROOT, RAINFOREST_ROOT, HALAL_ROOT];
export function ensureLibraryRoot(state) {
  if (!state.folders.some(f => f.id === ISO_ROOT)) {
    state.folders.unshift({ id: ISO_ROOT, name: 'ISO 9001-2015', parent: ROOT, area: 'Sistema de gestión', demo: false });
  }
  if (!state.schemaVersion || state.schemaVersion < 2) {
    state.folders.forEach(f => { if (!LIBRARY_ROOTS.includes(f.id) && f.parent === ROOT) f.parent = ISO_ROOT; });
  }
  for (const [id, name] of [[RAINFOREST_ROOT, 'Rainforest'], [HALAL_ROOT, 'Halal — حلال']]) {
    if (!state.folders.some(f => f.id === id)) state.folders.push({ id, name, parent: ROOT, area: name, demo: false });
  }
  if (state.schemaVersion !== 3 && state.folders.some(f => f.demo)) seedAdditionalLibraries(state);
  state.schemaVersion = 3;
}
export const depth = (folders, id) => ancestors(folders, id).filter(f => !LIBRARY_ROOTS.includes(f.id)).length;
export function ancestors(folders, id) {
  const result = []; const seen = new Set();
  while (id && id !== ROOT) {
    if (seen.has(id)) throw new Error('Estructura circular');
    seen.add(id); const f = folders.find(x => x.id === id); if (!f) break;
    result.unshift(f); id = f.parent;
  } return result;
}
export function createFolder(state, parent, name) {
  name = name.trim();
  if (!name || name.length > 70) throw new Error('Escribe un nombre entre 1 y 70 caracteres.');
  if (parent !== ROOT && !state.folders.some(f => f.id === parent)) throw new Error('La carpeta ya no existe.');
  if (depth(state.folders, parent) >= 5) throw new Error('Esta propuesta admite hasta cinco niveles dentro de la raíz.');
  if (state.folders.some(f => f.parent === parent && f.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Ya existe una carpeta con ese nombre aquí.');
  const folder = { id: crypto.randomUUID(), parent, name, area: state.folders.find(f => f.id === parent)?.area || 'General', demo: false };
  state.folders.push(folder); return folder;
}
export function seed(state) {
  ensureLibraryRoot(state);
  if (state.folders.some(f => f.demo) || state.documents.some(d => d.demo)) return seedAdditionalLibraries(state);
  const folder = (id, name, parent = ISO_ROOT, area = '') => state.folders.push({ id, name, parent: parent === ROOT ? ISO_ROOT : parent, area: area || state.folders.find(f => f.id === parent)?.area || name, demo: true });
  folder('estrategia', '01. Dirección y estrategia', ROOT, 'Dirección');
  folder('politicas', 'Políticas y objetivos', 'estrategia');
  folder('almacen', '02. Almacenamiento', ROOT, 'Almacén');
  folder('insumos', 'Insumos y productos', 'almacen');
  folder('agro', 'Agroquímicos', 'insumos');
  folder('producto', 'Producto de ejemplo A', 'agro');
  folder('tecnica', 'Documentación técnica', 'producto');
  folder('movimientos', 'Formatos de movimientos', 'almacen');
  folder('vivero', '03. Producción de material vegetal', ROOT, 'Vivero');
  folder('lotes', 'Lotes de producción', 'vivero');
  folder('lote', 'Lote de ejemplo V-01', 'lotes');
  folder('seguimiento', 'Seguimiento', 'lote');
  folder('registros', 'Registros de labores', 'seguimiento');
  folder('campo', '04. Plantación y campo', ROOT, 'Campo');
  folder('censo', 'Conteo y censo', 'campo');
  folder('sector', 'Sector de ejemplo B', 'censo');
  folder('jornadas', 'Jornadas de conteo', 'sector');
  folder('validacion', 'Registros por validar', 'jornadas');
  folder('taller', '05. Mantenimiento y taller', ROOT, 'Taller');
  folder('equipos', 'Equipos', 'taller');
  folder('tractor', 'Tractor de ejemplo 01', 'equipos');
  folder('ordenes', 'Órdenes de trabajo', 'tractor');
  folder('evidencias', 'Evidencias de intervención', 'ordenes');
  folder('humana', '06. Gestión Humana', ROOT, 'Gestión Humana');
  folder('turnos', 'Turnos de plantación', 'humana');
  folder('calidad', '07. Calidad y mejora', ROOT, 'Calidad');
  folder('hallazgos', 'No conformidades', 'calidad');
  folder('caso', 'Caso de ejemplo NC-001', 'hallazgos');
  folder('sgsst', '08. Seguridad y salud', ROOT, 'SGSST');
  const doc = (id, name, folderId, type, status, version, shared = [], linkedFolders = [], description = '') => state.documents.push({ id, name, folder: folderId, type, status, version, shared, linkedFolders, description, code: 'DEMO-' + id.toUpperCase(), modified: '2026-09-21', demo: true });
  doc('pol01', 'Política de calidad', 'politicas', 'PDF', 'Vigente', '01', ['Todos los cargos'], [], 'Ejemplo de documento transversal. La política real deberá ser definida y aprobada por Arles.');
  doc('hds01', 'Hoja de seguridad · Producto A', 'tecnica', 'PDF', 'Vigente', '03', ['Almacén', 'SGSST', 'Vivero', 'Campo'], ['sgsst', 'vivero', 'campo'], 'Ejemplo de identidad documental única compartida entre cuatro áreas. No contiene información química ni instrucciones de uso reales.');
  doc('ft01', 'Ficha técnica · Producto A', 'tecnica', 'PDF', 'Vigente', '02', ['Almacén', 'Vivero', 'Campo'], ['vivero'], 'Referencia ilustrativa. En la plataforma final aquí se conservará el archivo original del fabricante.');
  doc('mov01', 'Formato de entrega de insumos', 'movimientos', 'XLSX', 'En revisión', '02', ['Almacén'], [], 'Plantilla de demostración para entrega de insumos. No registra ni modifica inventario.');
  doc('rec01', 'Recepción de materiales', 'movimientos', 'DOCX', 'Borrador', '01', ['Almacén']);
  doc('viv01', 'Registro de labores · Lote V-01', 'registros', 'XLSX', 'Vigente', '01', ['Vivero'], [], 'Registro ficticio de labores. Se mantiene vinculado a su lote y a la versión de formato utilizada.');
  doc('cen01', 'Conteo · Sector B', 'validacion', 'XLSX', 'En revisión', '01', ['Campo'], [], 'Jornada ficticia pendiente de validación. Sin plantas ni resultados reales.');
  doc('tal01', 'Intervención · Orden OT-001', 'evidencias', 'PDF', 'Borrador', '01', ['Taller'], [], 'Ejemplo de evidencia de una intervención de mantenimiento.');
  doc('tur01', 'Turnos de personal de plantación', 'turnos', 'XLSX', 'Borrador', '01', ['Gestión Humana', 'Campo'], [], 'Espacio reservado para el formato real, todavía no suministrado. Campos y reglas pendientes de definición.');
  doc('nc01', 'Seguimiento · Caso NC-001', 'caso', 'DOCX', 'En revisión', '01', ['Calidad', 'Almacén'], ['almacen'], 'Ejemplo de expediente único con acciones y evidencias vinculadas.');
  seedAdditionalLibraries(state);
  return true;
}
export function seedAdditionalLibraries(state) {
  let changed = false;
  const groups = [
    [RAINFOREST_ROOT, 'rf', [
      ['gestion', '01. Gestión y responsables', null],
      ['personas', '02. Personas y formación', null],
      ['ambiente', '03. Gestión ambiental', null],
      ['planes', 'Planes de trabajo', 'ambiente'],
      ['agua', 'Agua y suelo', 'planes'],
      ['seguimiento', 'Seguimiento de ejemplo', 'agua'],
      ['evidencias', 'Evidencias', 'seguimiento'],
      ['trazabilidad', '04. Trazabilidad de productos', null],
      ['evaluaciones', '05. Evaluaciones y mejora', null]
    ], [
      ['plan', 'Plan de seguimiento ambiental · Ejemplo', 'agua', 'DOCX', 'Borrador'],
      ['evidencia', 'Registro de seguimiento · Ejemplo', 'evidencias', 'XLSX', 'En revisión'],
      ['formacion', 'Registro de formación · Ejemplo', 'personas', 'XLSX', 'Borrador']
    ]],
    [HALAL_ROOT, 'hl', [
      ['gestion', '01. Gestión y responsables', null],
      ['proveedores', '02. Proveedores e insumos', null],
      ['proveedor', 'Proveedor de ejemplo A', 'proveedores'],
      ['ingredientes', 'Ingredientes y materiales', 'proveedor'],
      ['producto', 'Producto de ejemplo A', 'ingredientes'],
      ['soportes', 'Documentos de soporte', 'producto'],
      ['procesos', '03. Procesos y limpieza', null],
      ['trazabilidad', '04. Trazabilidad y almacenamiento', null],
      ['revision', '05. Revisión y mejora', null]
    ], [
      ['insumos', 'Ficha de revisión de insumos · Ejemplo', 'soportes', 'XLSX', 'En revisión'],
      ['limpieza', 'Registro de limpieza · Ejemplo', 'procesos', 'DOCX', 'Borrador'],
      ['traza', 'Seguimiento de lote · Ejemplo', 'trazabilidad', 'XLSX', 'Borrador']
    ]]
  ];
  for (const [root, prefix, folders, docs] of groups) {
    const area = state.folders.find(f => f.id === root)?.name || root;
    for (const [key, name, parent] of folders) {
      const id = `${prefix}-${key}`;
      if (!state.folders.some(f => f.id === id)) { state.folders.push({ id, name, parent: parent ? `${prefix}-${parent}` : root, area, demo: true }); changed = true; }
    }
    for (const [key, name, folder, type, status] of docs) {
      const id = `${prefix}-doc-${key}`;
      if (!state.documents.some(d => d.id === id)) {
        state.documents.push({ id, name, folder: `${prefix}-${folder}`, type, status, version: '01', shared: [area], linkedFolders: [], code: `DEMO-${prefix.toUpperCase()}-${key.toUpperCase()}`, modified: '2026-09-21', demo: true,
          description: 'Contenido ficticio para explorar la organización documental. Estructura propuesta, pendiente de contrastar con el alcance y los requisitos aplicables. No acredita certificación ni cumplimiento.' }); changed = true;
      }
    }
  }
  return changed;
}
export function clearDemo(state) {
  const removed = new Set(state.folders.filter(f => f.demo).map(f => f.id));
  const originalFolders = state.folders;
  // Preserve manually created folders, promoting them to the root when their demo parent is removed.
  state.folders = state.folders.filter(f => !f.demo).map(f => removed.has(f.parent) ? { ...f, parent: ancestors(originalFolders, f.id).find(a => LIBRARY_ROOTS.includes(a.id))?.id || ROOT } : f);
  state.documents = state.documents.filter(d => !d.demo);
  for (const item of [...state.folders,...state.documents]) item.linkedFolders=(item.linkedFolders||[]).filter(id=>!removed.has(id));
  state.favorites = state.favorites.filter(id => state.documents.some(d => d.id === id));
}
