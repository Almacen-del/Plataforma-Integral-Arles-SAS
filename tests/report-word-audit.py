"""Publish the completed before/after audit, never infer success from missing files."""
import json, hashlib, html
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
ROOT=BASE/'output/word-corpus-50'
RUN='auditoria-verificada-20261002'
folder=ROOT/'pruebas'/RUN
load=lambda path:json.loads(path.read_text(encoding='utf8'))
manifest=load(ROOT/'manifest.json')
before=load(ROOT/'pruebas/auditoria-profunda-20261002/auditoria-semantica.json')
after=load(folder/'auditoria-semantica.json')
browser=load(folder/'resultados.json')
packages=load(folder/'auditoria-independiente.json')
visual=load(folder/'revision-visual.json')
assert len(manifest)==len(before)==len(after)==len(browser)==len(packages)==50
assert all(not r['failures'] for r in after+browser)
assert all(r['originalIntact'] and not r['pdf']['missingParagraphs'] and not r['images']['missingPixelHashes'] and not any(p['errors'] for p in r['packages']) for r in packages)
assert len(visual)==sum(r['pdf']['pages'] for r in packages)
assert all(v['reviewed'] and hashlib.sha256((folder/'paginas'/v['file']).read_bytes()).hexdigest()==v['sha256'] for v in visual)
checks=sum(len(r['checks']) for r in after)
faults=sum(len(r['failures']) for r in before)
affected=sum(bool(r['failures']) for r in before)
pages=len(visual)
fixes=[
 'Distancias de encabezado y pie: la exportación directa tomaba valores predeterminados en lugar de las distancias importadas. Ahora sobreviven a la normalización y exportación.',
 'Caso 30: se importan y exportan los márgenes reflejados y los 288 twips de encuadernación. Una prueba de navegador comprueba el margen interior alterno en ambas páginas del PDF.',
 'Caso 38: se conserva la revisión pendiente de formato del párrafo, con autor, fecha y propiedades anteriores, al guardar y reconstruir el Word.',
 'Caso 46: el XML adjunto y sus relaciones se conservan en la exportación reconstruida y después de guardar/reabrir el documento.'
]
limits=[
 '50 casos progresivos no cubren todas las funciones ni garantizan fidelidad universal. No se dispuso de Word ni LibreOffice para comparar visualmente con otro motor.',
 'Las notas Word conservan su tipo, pero el PDF aún agrupa las notas al final del contenido. La composición como notas al pie de cada página sigue pendiente.',
 'Los índices y campos importados conservan instrucciones y valores; su actualización completa dentro del editor sigue pendiente.',
 'La revisión de formato se conserva pendiente, pero este cambio no agrega una interfaz para aceptar/rechazar revisiones de formato. El XML adjunto se conserva como dato, no como contenido editable.',
 'Objetos flotantes complejos, SmartArt, OLE, macros, controles avanzados y todos los estilos posibles de gráficos no están certificados por este corpus.',
 'Los borradores antiguos editados no se reemplazan automáticamente. Recuperar propiedades antes omitidas puede requerir comparar una nueva importación del original.',
 'La auditoría XML comprueba integridad, relaciones y propiedades seleccionadas; no es una validación completa contra todos los esquemas OOXML. El PDF árabe mantiene la advertencia documentada sobre extracción Unicode.'
]
rows=[]
for m,b,a,p in zip(manifest,before,after,packages):
 assert m['id']==b['id']==a['id']==p['id']
 i=m['id'];errors='; '.join(b['failures']) or 'Sin fallos en las comprobaciones añadidas'
 rows.append(f'<tr><td>{i:02}</td><td>{html.escape(m["title"])}</td><td>{html.escape(errors)}</td><td>15/15 · Flujo completo aprobado</td><td><a href="originales/{html.escape(m["filename"])}">DOCX original</a> · <a href="pruebas/{RUN}/{i:02}.pdf">PDF ({p["pdf"]["pages"]} pág.)</a></td></tr>')
bullet=lambda items:'<ul>'+''.join('<li>'+html.escape(t)+'</li>' for t in items)+'</ul>'
doc=f'''<!doctype html><html lang="es"><meta charset="utf-8"><title>Auditoría Word · 50 documentos</title>
<style>body{{font:16px/1.5 system-ui;margin:40px;color:#15382c;background:#f7faf8}}main{{max-width:1500px;margin:auto}}h1{{font-size:32px}}table{{border-collapse:collapse;background:white;width:100%}}th,td{{padding:12px;border:1px solid #d2dfd7;text-align:left}}th{{background:#dfece4}}input{{padding:12px;width:60%;margin:20px 0}}a{{color:#096b4b}}.metric{{padding:20px;background:#e4f1e9;font-size:20px}}</style><main>
<h1>Auditoría de los 50 documentos Word</h1><p>2 de octubre de 2026 · Cambios locales; no publicados.</p>
<p class="metric">50/50 recorridos completos · {checks}/{checks} comprobaciones semánticas · {pages} páginas · 200 paquetes DOCX íntegros</p>
<p>La primera ejecución pasó los 50 recorridos de edición, pero el comparador independiente detectó {faults} discrepancias en {affected} documentos. Se corrigieron cuatro causas y se repitieron los 50 casos. Los originales permanecen intactos.</p>
<h2>Correcciones verificadas</h2>{bullet(fixes)}
<p>Regresión: 64 pruebas generales y 15 flujos de Word aprobados; una prueba adicional valida márgenes reflejados en impresión. Compilación local correcta.</p>
<h2>Resultado por documento</h2><input aria-label="Buscar documento" placeholder="Buscar número, tema o fallo…" oninput="document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(this.value.toLowerCase()))">
<table><thead><tr><th>N.º</th><th>Documento</th><th>Antes de corregir</th><th>Después</th><th>Archivos</th></tr></thead><tbody>{''.join(rows)}</tbody></table>
<h2>Alcance y pendientes reales</h2>{bullet(limits)}
<p>Evidencia: <a href="pruebas/{RUN}/resultados.json">edición de los 50</a> · <a href="pruebas/{RUN}/auditoria-semantica.json">comparación OOXML</a> · <a href="pruebas/{RUN}/auditoria-independiente.json">integridad y PDF</a> · <a href="pruebas/{RUN}/revision-visual.json">comparación visual por página</a>.</p></main></html>'''
(ROOT/'AUDITORIA.html').write_text(doc,encoding='utf8')
summary=f'''# Auditoría del motor Word — 2 de octubre de 2026

Se ejecutaron dos recorridos nuevos de los 50 documentos originales: antes y después de las correcciones. La comparación semántica independiente encontró {faults} discrepancias en {affected} documentos, correspondientes a cuatro causas. El resultado final es 50/50 recorridos y {checks}/{checks} comprobaciones semánticas, con 200 paquetes íntegros y {pages} páginas PDF sin pérdida de párrafos comprobados.

## Correcciones

'''+''.join('- '+v+'\n' for v in fixes)+'''
## Verificación

- `npm test`: 64 pruebas aprobadas.
- `npm run test:word`: 15 flujos aprobados.
- `node tests/word-mirrored-margins.browser.cjs`: márgenes interiores alternos verificados en el PDF.
- `CORPUS_RUN=auditoria-verificada-20261002 node tests/word-corpus.browser.cjs`: 50 documentos.
- `python tests/audit-word-semantics.py --run auditoria-verificada-20261002`: geometría de todas las secciones, márgenes reflejados, revisiones de formato, XML adjunto y filas/combinaciones de tablas, en tres modalidades de exportación.
- `python tests/inspect-word-corpus.py --run auditoria-verificada-20261002 --render`: CRC, XML, relaciones, texto PDF y píxeles de imágenes.
- `node build.mjs`: compilación correcta.
- Registro visual por página: se reutiliza la revisión anterior solo cuando el PNG completo coincide en SHA-256; las páginas diferentes se inspeccionan de nuevo a resolución original.

Informe por documento: `output/word-corpus-50/AUDITORIA.html`. Evidencia anterior en `pruebas/auditoria-profunda-20261002`; evidencia final en `pruebas/auditoria-verificada-20261002`.

## Límites y pendientes

'''+''.join('- '+v+'\n' for v in limits)+'''
Cambios locales, sin despliegue en Vercel. No se alteraron los DOCX originales ni documentos de producción.
'''
(BASE/'docs/AUDITORIA_WORD_2026-10-02.md').write_text(summary,encoding='utf8')
print(json.dumps({'documents':50,'checks':checks,'beforeDiscrepancies':faults,'beforeAffectedDocuments':affected,'pages':pages}))
