# Continuación del motor Word — referencias y notas

Cambios locales del 3 de octubre de 2026. No publicados en Vercel. Complementa y actualiza los pendientes de `AVANCE_WORD_2026-10-03.md`.

## Correcciones

- Las notas largas a dos y tres columnas ya no se dividen durante la medición previa como si fueran texto del párrafo. Las notas que exceden una página pueden continuar en la siguiente. Se sigue comprobando la conservación íntegra del texto antes de permitir imprimir.
- Las notas finales con ubicación `docEnd` se reúnen al final del documento compuesto; `sectEnd` conserva la ubicación por sección y se exporta en el DOCX. Se respeta la configuración de sección o, en su ausencia, la del documento. Referencia de valores: [Microsoft Open XML](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.endnotepositionvalues?view=openxml-3.0.1).
- Se conservan ambos extremos de los marcadores importados. `REF` básico puede actualizar el texto de un fragmento marcado y `PAGEREF` básico muestra su página calculada en el PDF. Se admite `\h`; otras opciones conservan sus resultados anteriores.
- Los campos complejos TOC que abarcan varios párrafos se reconocen y actualizan desde **Referencias → Actualizar tablas**. El texto anterior y posterior al campo queda fuera de la actualización.
- Las bibliografías complejas conservan el contenido almacenado del campo; esto no implementa un gestor de estilos bibliográficos ni el recálculo de CITATION/BIBLIOGRAPHY.
- El importador pasa a versión 9. Los borradores antiguos sin ediciones se pueden reinterpretar desde el original; las ediciones existentes no se sustituyen automáticamente.

## Pruebas específicas

`npm run test:word:references` incluye:

- Notas a una, dos y tres columnas, numeración y llamadas, original editable intacto y una nota de más de 10.000 caracteres repartida en varias páginas. PDF de comprobación: `tmp/word-long-notes.pdf`; páginas 7–9 inspeccionadas visualmente.
- TOC/SEQ: actualización voluntaria, edición posterior de títulos, opciones desconocidas, páginas del índice y guardado auditado con recarga y reapertura.
- Marcador de una parte de un párrafo, actualización REF, edición del fragmento, exportación y reimportación con ambos extremos; PAGEREF devuelve página 2.
- TOC complejo de dos párrafos, conservación del texto exterior, actualización y reimportación.
- Notas finales en dos secciones: posición `docEnd` y `sectEnd`, exportación, reimportación y composición sin duplicados.

## Auditoría completa

- 50/50 documentos completaron importación, edición, guardado, reapertura, reconstrucción DOCX y PDF; 84 páginas en total.
- 750/750 comprobaciones semánticas aprobadas; 200 paquetes DOCX comprobados sin daños. Originales intactos y ninguna pérdida detectada en los párrafos e imágenes normales auditados.
- 80 páginas PNG coinciden exactamente por SHA-256 con la revisión anterior. Las cuatro modificadas (49:6–7 y 50:10,12) se inspeccionaron completas: las notas finales pasan al cierre del documento, sin recortes ni superposiciones.
- Se mantiene la advertencia conocida de un alias Unicode de la fuente árabe del caso 47; no se contabiliza como pérdida de texto.
- 64 pruebas generales, los 15 flujos anteriores de Word y las cinco pruebas específicas de referencias aprobados. Compilación correcta.

Evidencia: `output/word-corpus-50/pruebas/referencias-ampliadas-20261003/`, con resultados por archivo, auditorías independiente y semántica, registro visual, DOCX, PDF y PNG. `tests/compare-word-renders.py` solo reutiliza una revisión visual cuando coincide el hash de la página completa; las demás quedan pendientes de inspección visual directa.

## Alcance pendiente

No se certifica compatibilidad con cualquier DOCX. Siguen pendientes las notas con tablas/imágenes y formato enriquecido, reinicios y formatos avanzados de numeración de notas, ubicación exacta al final de secciones continuas que comparten página, opciones avanzadas de campos y referencias encadenadas, estilos de citas, controles vinculados a datos, SmartArt y OLE editables y determinados objetos flotantes. Los resultados almacenados de campos no admitidos se conservan sin inventar su cálculo.

La reconstrucción de un campo complejo conserva su instrucción y resultado textual, pero no toda su tipografía interna. La composición en navegador puede diferir de Word y dejar más espacio libre. No hubo comparación contra Microsoft Word de escritorio o LibreOffice. Los originales siguen siendo la referencia completa.
