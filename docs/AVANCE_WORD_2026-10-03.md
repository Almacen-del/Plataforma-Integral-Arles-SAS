# Notas al pie e índices importados — 3 de octubre de 2026

Este informe corresponde a la primera entrega del día. La continuación se documenta en AVANCE_WORD_REFERENCIAS_2026-10-03.md.

Cambios locales, sin publicación en Vercel. No se modificaron los 50 originales ni documentos de producción.

## Implementado

- La vista de impresión/PDF coloca las notas simples al pie, reservando espacio dentro del área imprimible y manteniendo separado el pie de página. Las notas finales se muestran aparte. La transformación ocurre solo en la copia de impresión.
- Se comprueba que todo el texto de cada nota sobreviva a la composición. Ante una pérdida o un recorte se bloquea la impresión.
- **Referencias → Actualizar tablas** actualiza campos importados TOC simples (niveles `\o`, opciones `\h`, `\z`, `\u`) y secuencias SEQ arábigas, incluyendo reinicio `\r` y repetición `\c` en las combinaciones admitidas.
- Después de esa primera actualización, el índice sigue los cambios de los títulos automáticamente. Abrir el original por sí solo conserva sus resultados previos.
- Los números del índice se calculan sobre las páginas compuestas del PDF; el editor muestra un guion hasta la vista de impresión. Los campos siguen exportándose como campos Word.
- Las instrucciones no admitidas conservan su resultado original y el mensaje de actualización indica cuántas quedaron sin actualizar.

## Pruebas ejecutadas

- `npm test`: 64 pruebas aprobadas.
- `npm run test:word`: 15 flujos anteriores aprobados.
- `tests/word-footnotes-print.browser.cjs`: llamadas y notas en la misma página, notas largas a una columna, notas habituales a dos columnas, numeración mixta, notas finales sin duplicar y copia editable intacta.
- La misma prueba reproduce una nota larga a dos columnas que Paged.js no conserva completa y verifica que se impide imprimirla. Este caso **sigue pendiente**, no se considera una composición correcta.
- `tests/word-fields-update.browser.cjs`: actualización voluntaria de TOC/SEQ, títulos posteriores, opciones desconocidas conservadas, páginas 1/1/2 del índice, exportación y botón real con guardado auditado, recarga y reapertura.
- `CORPUS_RUN=pendientes-final-20261003 node tests/word-corpus.browser.cjs`: 50/50 documentos, 84 páginas.
- Auditoría independiente: 200 paquetes DOCX íntegros, originales intactos, sin párrafos comprobados perdidos ni imágenes normales perdidas.
- Comparación semántica: 750/750 comprobaciones aprobadas.
- Comparación visual: 77 PNG idénticos por SHA-256 a la auditoría anterior; siete páginas cambiadas inspeccionadas nuevamente. Además se inspeccionó el índice actualizado de la prueba específica.
- `node build.mjs`: compilación correcta.

Evidencia por documento en `output/word-corpus-50/pruebas/pendientes-final-20261003/`: `resultados.json`, `auditoria-independiente.json`, `auditoria-semantica.json`, `revision-visual.json`, DOCX exportados, PDF y PNG de las páginas. Vista del índice de prueba: `tmp/word-fields-updated.png`.

## Pendientes y alcance

- Notas largas a varias columnas y notas con objetos/tablas requieren más trabajo; las notas importadas siguen usando su texto simple.
- Las notas finales de documentos con varias secciones permanecen al final de cada sección compuesta; no se ha implementado toda la configuración Word de ubicación y reinicio de notas.
- No se actualizan todavía todos los tipos de campos, bibliografías ni índices complejos que abarcan varios párrafos. REF/PAGEREF, estilos de cita y opciones avanzadas mantienen su resultado previo.
- La composición no se comparó con Word de escritorio o LibreOffice. Los 50 casos no certifican todos los documentos futuros.
- Continúan los límites documentados para SmartArt, OLE, objetos flotantes complejos y controles avanzados.

Ejecutar las nuevas pruebas con `npm run test:word:references`; la prueba de índices requiere el corpus original existente.
