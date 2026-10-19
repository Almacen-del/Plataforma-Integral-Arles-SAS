# Auditoría del motor Word — 3 de octubre de 2026

Los cambios son locales, sin nueva publicación. Los originales se abrieron en Microsoft Word en modo de solo lectura. Se verificaron sus hashes; no se modificaron para hacer pasar las pruebas. Las copias editadas están separadas en `output/`.

| Original | Páginas Word | Páginas motor | Reconstrucción abierta en Word |
|---|---:|---:|---:|
| Anexo 13 Metodología de IPEVR.docx | 22 | 22 | 22 |
| Anexo 43 Lista de verificación Módulo 3.docx | 2 | 2 | 2 |

Ambos originales conservan su SHA-256. No se detectan párrafos ausentes del cuerpo. La edición de una copia conserva el paquete mediante el recorrido de preservación. **Esto no certifica igualdad visual.**

## Correcciones incorporadas

- Conservación de párrafos vacíos, fuentes de tema, negrita, cursiva, espaciado de caracteres, espacios consecutivos, bordes de párrafo e interlineado.
- Medición del interlineado con la fuente efectiva del texto cuando difiere de la marca del párrafo.
- Imágenes en línea y proporción de colocación, incluso imágenes estiradas en el original, también al reconstruir DOCX.
- Encabezados y pies según geometría y distancias de su sección. Las regiones heredadas se recalculan para la sección receptora, incluso horizontal.
- Reserva del espacio ocupado por el pie para evitar que tape la última fila; eliminación de copias ocultas duplicadas.
- Anchos preferidos en tablas de diseño fijo, políticas de división de filas y alturas exactas; eliminación de párrafos artificiales tras tablas.
- Anclajes detrás del texto compatibles y proporción del lienzo de gráficos.
- Detección de recortes que distingue palabras visibles de espacios de justificación.
- Versión 11 del importador: actualiza borradores sin cambios y conserva los editados.

## Verificaciones completadas

- Suite general: 64 pruebas, sin fallos.
- Suite Word: 15 programas, sin fallos.
- Suite de referencias: 6 programas, sin fallos.
- Nuevas pruebas de regiones: imágenes, distancias, orientación, herencia entre secciones y políticas de filas, sin fallos.
- Corpus funcional de 50: importación, edición, guardado, reapertura y exportación sin fallos; 50 PDF y 91 páginas de copias editadas.
- Auditoría semántica independiente: 750 comprobaciones, sin fallos.
- Inspección independiente: cero paquetes dañados, párrafos ausentes o imágenes originales perdidas detectados. Persiste una advertencia de alias Unicode árabe/persa en el caso 47, sin aprobación tipográfica.
- Comparación de originales: los 48 aceptados por Microsoft Word coinciden en páginas con el motor. Los 50 originales conservan su hash.
- Compilación y comprobación de espacios del diff correctas.

El auditor de texto distingue el cuerpo de los encabezados/pies que la extracción PDF intercala entre fragmentos de un párrafo dividido. Solo excluye literales de regiones del archivo fuente, resolviendo PAGE/NUMPAGES, y registra cada exclusión. No elimina texto arbitrario para hacer pasar la comparación.

La última corrección de métrica de fuente se verificó después del corpus funcional con la suite Word y una repetición de los 50 originales. Ambos recorridos se mantienen diferenciados.

## Pendientes reales: no aprobados

1. **Fidelidad visual completa:** las láminas muestran diferencias reales de distribución, tablas y posición de elementos, además del suavizado de fuentes. Ningún anexo se declara idéntico por coincidir en páginas.
2. **Gráficos Office:** se conservan datos editables y proporción, pero colores, ejes y leyendas no reproducen todos los estilos originales.
3. **Notas enriquecidas:** conservar su XML y recursos al exportar no acredita presentación editable equivalente en el navegador.
4. **Filas complejas divididas:** las filas con listas o tablas anidadas necesitan más trabajo; permitir su división indiscriminada provocó recortes y no se adoptó.
5. **Originales 48 y 49:** Microsoft Word los rechaza. Permanecen inalterados; la apertura en el navegador y la validez ZIP/XML no los convierten en referencias válidas. Falta diagnosticar la incompatibilidad de esos paquetes.

No se afirma compatibilidad universal ni se considera terminada la fidelidad del motor.

## Evidencia y repetición

- Anexos: `output/word-ipevr/` y `output/word-anexo43/`.
- Originales: `output/word-corpus-50/comparacion-originales/resultados.json`.
- Referencias Word: `output/word-corpus-50/referencia-microsoft-word/resultados.json`.
- Láminas por página: `output/word-corpus-50/comparacion-visual-word/`.
- Corpus funcional: `output/word-corpus-50/pruebas/fidelidad-word-20261003/`.
- Repetición: `npm run test:word`, `npm run test:word:references`, `npm run test:word:source`.
- `node tests/word-original-corpus.browser.cjs`: originales inalterados.
- `tests/render-word-reference.ps1`: referencias mediante Microsoft Word.
- `tests/compare-original-word-pdf.py`: comparativas sin aprobación automática.
