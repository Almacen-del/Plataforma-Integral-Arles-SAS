"""Package the external fixtures and the actual, completed verification evidence."""
from pathlib import Path
import argparse, csv, hashlib, html, json, zipfile

ROOT=Path(__file__).resolve().parents[1]/'output'/'word-corpus-50'
LIMITS=[
 'Esta colección cubre 50 combinaciones progresivas. No constituye una prueba de todas las funciones de Word ni de cualquier documento futuro.',
 'No hubo Word de escritorio ni LibreOffice disponibles para comparar la paginación con otro motor. Se revisaron las páginas producidas por la plataforma y se auditó el paquete con herramientas independientes.',
 'Sin cambios, la descarga conserva los bytes originales. Una corrección simple de texto conserva las demás partes del paquete. Los cambios estructurales reconstruyen las funciones admitidas y pueden variar el diseño.',
 'Las notas simples se pueden editar y conservan su tipo al exportar Word. En el PDF de la plataforma se agrupan al final del contenido; no se comprobó su composición al pie de cada página como Word.',
 'Se conservan instrucciones y resultados de los campos admitidos y las fuentes bibliográficas de Word. No se ha implementado la actualización completa de los índices y estilos bibliográficos importados dentro del editor.',
 'El formulario probado usa un control de texto. No cubre todos los controles de fechas, casillas, listas ni controles vinculados a datos. Se impide reconstruir vínculos de datos que no se puedan conservar.',
 'Se editan cuadros rectangulares VML independientes en línea. Los grupos, cuadros flotantes complejos y formas especiales requieren comprobar el original. SmartArt, OLE, EMF/WMF, macros y otras extensiones no están cubiertos por esta colección.',
 'Los gráficos de Office comprobados incluyen barras, líneas, circular, dispersión y radar. Importar combinaciones, cachés ausentes o varias series XY tiene límites explícitos. El diseño exacto de ejes y colores de Office puede variar.',
 'La prueba adicional cubrió los 16 tipos de gráfico de Arles: 13 exportan una representación de gráfico Office y 3 una imagen con metadatos para seguir editando al reimportarla en Arles.',
 'El caso árabe mantiene texto, idioma y dirección en DOCX y se ve correctamente en la página revisada. La extracción del PDF presenta una equivalencia de glifo entre dos códigos Unicode de la letra yeh; copiar o buscar ese texto puede depender del lector.',
 'Las tabulaciones comprobadas usan los intervalos predeterminados. No se verificaron todas las tabulaciones personalizadas, líderes ni alineaciones decimales.',
 'La revisión de formato de párrafo del caso 38 y el XML adicional del caso 46 se conservan completos al preservar el original; no se ha demostrado su edición estructural completa en una reconstrucción.',
 'Los borradores antiguos sin cambios se pueden actualizar desde el original. Si tienen ediciones anteriores, se conservan y se avisa cuando recuperar objetos necesita comparar una nueva importación.',
 'La biblioteca admite DOCX de hasta 50 MB. La regresión adicional comprobó un archivo de 26 MB y un borrador con más de 300.000 caracteres. Una fila combinada mayor que una página sigue bloqueando la impresión para evitar recortes.'
]
FIXES=[
 'Gráficos Office: lectura de datos, edición, guardado, exportación con libro de datos y reimportación; tamaño de origen y selección correcta de cada gráfico.',
 'Imágenes PNG/JPEG preservadas; GIF y BMP importados como PNG y transparencias conservadas. Cada uno de los 50 DOCX incluye una ilustración editable. Las pruebas cambian ancho, alineación y descripción; la auditoría compara los píxeles de las imágenes normales tras exportar. Se ajustan a las columnas al reconstruir Word.',
 'Notas al pie y finales: referencias y texto editable, guardado y exportación como notas Word.',
 'Controles de contenido de texto: conservación de sus propiedades y edición sin crear elementos OOXML inválidos.',
 'Marcadores y enlaces internos: se conservan los destinos incluso dentro de títulos.',
 'Campos automáticos y fuentes bibliográficas: se conservan sus instrucciones y registros de origen al reconstruir el Word.',
 'Cuadros de texto VML rectangulares: se mantienen como cuadros editables al importar y volver a exportar.',
 'Tabulaciones, idiomas, texto de derecha a izquierda y alineaciones de párrafos con saltos internos.',
 'Actualización del lector sin sobrescribir borradores anteriores editados.',
 'Separadores de columnas desiguales centrados en su espacio, sin tocar el texto.'
]

def main():
 p=argparse.ArgumentParser();p.add_argument('--run',default='entrega-final');args=p.parse_args();folder=ROOT/'pruebas'/args.run
 manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'));results=json.loads((folder/'resultados.json').read_text(encoding='utf-8'));audit=json.loads((folder/'auditoria-independiente.json').read_text(encoding='utf-8'));visual=json.loads((folder/'revision-visual.json').read_text(encoding='utf-8'))
 assert len(manifest)==len(results)==len(audit)==50 and not any(r['failures'] for r in results)
 assert all(r['originalIntact'] and not any(p['errors'] for p in r['packages']) and not r['pdf']['missingParagraphs'] for r in audit)
 assert len(visual)==sum(r['pdf']['pages'] for r in audit) and all(v['reviewed'] and hashlib.sha256((folder/'paginas'/v['file']).read_bytes()).hexdigest()==v['sha256'] for v in visual)
 assert all(m['media'] for m in manifest) and all(not r['images']['missingPixelHashes'] and r['images'].get('fitsColumn',True) for r in audit)
 byid={r['id']:r for r in results};pages=sum(r['pdf']['pages'] for r in audit);packages=sum(len(r['packages']) for r in audit)
 image_edits=sum(len(r.get('imageEdits',[])) for r in results);charts=sum(r['import']['charts'] for r in results)
 rows=[]
 for m in manifest:
  r=byid[m['id']];rows.append([m['id'],m['title'],m['stage'],'Cumple los controles',r['print']['pages'],len(r['imageEdits']),r['import']['charts'],r.get('noteEdited',False),'; '.join(m['features'])])
 with (ROOT/'resultados.csv').open('w',encoding='utf-8-sig',newline='') as f:
  writer=csv.writer(f);writer.writerow(['Caso','Documento','Etapa','Resultado','Páginas PDF','Imágenes editadas','Gráficos editables','Nota editada','Funciones']);writer.writerows(rows)
 esc=html.escape
 cards=''.join(f'<tr data-stage="{m["stage"]}"><td>{m["id"]:02d}</td><td><strong>{esc(m["title"])}</strong><small>{esc(", ".join(m["features"]))}</small></td><td>{m["stage"]}</td><td><span class="pass">Cumple</span></td><td>{byid[m["id"]]["print"]["pages"]}</td><td><a href="originales/{m["filename"]}">DOCX</a> · <a href="pruebas/{args.run}/{m["id"]:02d}.pdf">PDF editado</a></td></tr>' for m in manifest)
 report=f'''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>50 documentos · Verificación del motor Word Arles</title>
<style>body{{margin:0;background:#f2f5f1;color:#183d32;font:16px/1.5 Arial,sans-serif}}main{{max-width:1200px;margin:auto;padding:32px}}header,section{{background:white;border:1px solid #d5dfd7;border-radius:12px;padding:24px;margin:0 0 22px}}header{{background:#104f3d;color:white}}h1{{font-size:30px;line-height:1.2}}h2{{font-size:22px}}.stats{{display:flex;gap:28px;flex-wrap:wrap}}.stats strong{{display:block;font-size:28px}}small{{display:block;color:#60766c;font-size:13px}}table{{width:100%;border-collapse:collapse}}td,th{{text-align:left;padding:12px;border-bottom:1px solid #dce5dd;vertical-align:top}}th{{background:#edf3ec}}a{{color:#086841}}.pass{{background:#e5f3e8;color:#156137;padding:4px 8px;border-radius:5px}}input,select{{padding:10px;border:1px solid #becfc3;border-radius:6px;margin:0 8px 16px 0;font:inherit}}.scroll{{overflow:auto}}li{{margin:9px 0}}.note{{border-left:4px solid #bc9b47;background:#fbf9ef;padding:12px}}@media(max-width:700px){{main{{padding:12px}}td,th{{padding:8px}}}}
</style><main><header><p>ARLES · LABORATORIO DOCUMENTAL · 2 OCTUBRE 2026</p><h1>50 documentos para comprobar el motor Word</h1><p>Importación, edición, guardado, reapertura, descarga, reimportación e impresión. Colección de ejemplos ficticios de distintas materias; los originales se mantienen separados de las pruebas.</p><div class="stats"><div><strong>50/50</strong>Casos que cumplen los controles</div><div><strong>{pages}</strong>Páginas revisadas</div><div><strong>{image_edits}</strong>Ediciones de imágenes</div><div><strong>{charts}</strong>Gráficos editables</div></div></header>
<section><h2>Qué se comprobó</h2><p>Los 50 originales mantuvieron su SHA-256. La descarga sin cambios fue idéntica al original y la corrección simple del texto sólo cambió word/document.xml. Se revisaron {packages} paquetes DOCX: CRC, XML legible, relaciones internas existentes y ausencia del elemento inválido undefined.</p><p>Se verificó el texto previsto en los 50 PDF, con las sustituciones intencionadas registradas. La advertencia Unicode del caso 47 se mantiene separada. Las imágenes se editaron desde sus controles y se comprobaron después del guardado, la reapertura y la reimportación del DOCX descargado. Cada uno de los 50 documentos contiene una ilustración. La comparación independiente no encontró pérdidas de píxeles en sus imágenes normales. También se modificaron datos de gráficos, notas, formularios de texto y cuadros de texto.</p><p>Regresiones: 64 pruebas de modelo y 15 recorridos de navegador del motor Word aprobados, incluida la verificación de los 16 tipos de gráfico y la protección de borradores. La compilación local terminó correctamente.</p><p class="note">«Cumple» significa que pasó estos controles. No significa equivalencia completa con Word ni compatibilidad garantizada con todas sus funciones. Los cambios de código están preparados en el proyecto local; esta entrega no incluye una publicación nueva en Vercel.</p></section>
<section><h2>Correcciones aplicadas</h2><ul>{''.join('<li>'+esc(s)+'</li>' for s in FIXES)}</ul></section>
<section><h2>La colección por etapas</h2><p>1: texto y estilos · 2: tablas e imágenes · 3: diseño de página · 4: referencias y revisión · 5: datos e informes integrados.</p><input id="search" placeholder="Buscar tema o función" aria-label="Buscar documento"><select id="stage" aria-label="Filtrar etapa"><option value="">Todas las etapas</option>{''.join(f'<option value="{n}">Etapa {n}</option>' for n in range(1,6))}</select><span id="count">50 documentos</span><div class="scroll"><table><thead><tr><th>Caso</th><th>Documento y funciones</th><th>Etapa</th><th>Controles</th><th>Páginas</th><th>Abrir</th></tr></thead><tbody>{cards}</tbody></table></div></section>
<section><h2>Alcance y diferencias pendientes</h2><ul>{''.join('<li>'+esc(s)+'</li>' for s in LIMITS)}</ul><p>La relación entre campos de cita y fuentes se contrastó con la <a href="https://learn.microsoft.com/en-us/office/vba/word/concepts/working-with-word/working-with-bibliographies">documentación de Microsoft sobre bibliografías</a>.</p></section>
<section><h2>Evidencia y reproducción</h2><p><a href="resultados.csv">Matriz CSV</a> · <a href="manifest.json">Manifiesto de originales</a> · <a href="pruebas/{args.run}/resultados.json">Resultados de navegador</a> · <a href="pruebas/{args.run}/auditoria-independiente.json">Auditoría independiente</a> · <a href="pruebas/{args.run}/revision-visual.json">Registro de revisión visual</a></p><p>Generación: tests/create-word-corpus.py. Pruebas: npm run test:word:corpus, con CORPUS_RUN. Auditoría: tests/inspect-word-corpus.py --run nombre --render. Empaquetado: tests/report-word-corpus.py --run nombre. El lector visual independiente de Word/LibreOffice quedó sin verificar por falta del ejecutable.</p></section></main>
<script>const rows=[...document.querySelectorAll('tbody tr')],search=document.getElementById('search'),stage=document.getElementById('stage');function filter(){{let n=0;for(const row of rows){{row.hidden=!(row.textContent.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())&&(!stage.value||row.dataset.stage===stage.value));if(!row.hidden)n++;}}document.getElementById('count').textContent=n+' documentos';}}search.addEventListener('input',filter);stage.addEventListener('change',filter);</script></html>'''
 (ROOT/'INFORME.html').write_text(report,encoding='utf-8')
 md='# Verificación del motor Word: 50 DOCX\n\n2 de octubre de 2026. Resultado local; no publicación nueva.\n\n'+f'50/50 casos cumplen los controles, {pages} páginas revisadas y {packages} paquetes auditados. Los 50 originales conservaron su SHA-256.\n\n'+ '\n'.join('- '+s for s in FIXES)+'\n\n## Alcance real\n\n'+ '\n'.join('- '+s for s in LIMITS)+f'\n\n## Reproducción\n\n`npm test`, `npm run test:word`, `CORPUS_RUN={args.run} npm run test:word:corpus`, `python tests/inspect-word-corpus.py --run {args.run} --render`. Artefactos en `output/word-corpus-50`, informe navegable y CSV con los 50 casos. Se generaron con python-docx y OOXML, no con el exportador Arles.\n'
 (ROOT.parent.parent/'docs'/'ENTREGA_CORPUS_WORD_2026-10-02.md').write_text(md,encoding='utf-8')
 package=ROOT/'50-DOCX-y-pruebas-Arles.zip'
 with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED) as z:
  for f in sorted((ROOT/'originales').glob('*.docx')):z.write(f,f.relative_to(ROOT).as_posix())
  for name in ['INFORME.html','LEEME.txt','manifest.json','resultados.csv']:z.write(ROOT/name,name)
  for f in [*sorted(folder.glob('*.pdf')),*[folder/n for n in ['resultados.json','auditoria-independiente.json','revision-visual.json']]]:z.write(f,f.relative_to(ROOT).as_posix())
 with zipfile.ZipFile(package) as z:assert z.testzip() is None and sum(n.endswith('.docx') for n in z.namelist())==50
 print(json.dumps({'archive':str(package),'bytes':package.stat().st_size,'documents':50,'pages':pages,'packages':packages,'imageEdits':image_edits,'charts':charts},ensure_ascii=False))
if __name__=='__main__':main()
