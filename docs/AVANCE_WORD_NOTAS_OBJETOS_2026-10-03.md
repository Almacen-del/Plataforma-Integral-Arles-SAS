# Conservación de objetos dentro de notas Word

Continuación local del motor Word, 3 de octubre de 2026. Sin publicación ni modificación de documentos de producción.

## Corregido

La reconstrucción DOCX convertía las notas al pie y finales en párrafos de texto simple. Ahora el importador conserva por separado su XML y sus recursos relacionados. Al descargar un Word reconstruido, restaura esos componentes y aplica los cambios de texto al intervalo de caracteres editado, conservando el formato directo del resto.

Las imágenes se copian con sus bytes originales. Las relaciones se reasignan a rutas nuevas para no sobrescribir recursos del cuerpo del documento. También se conservan tablas y enlaces externos sin acceder a estos últimos.

Se corrigió un fallo de lectura que podía impedir importar imágenes dentro de notas: el lector HTML intentaba resolverlas en un contexto de relaciones incorrecto. Las notas se extraen previamente y se excluyen únicamente de esa copia de conversión; el archivo original permanece intacto.

El modelo se guarda junto al borrador. El importador pasa a versión 10; mantiene la protección de borradores anteriores editados.

## Prueba específica

`tests/word-rich-notes.browser.cjs` crea un DOCX sintético con nota al pie y nota final, cada una con PNG, tabla, negrita, cursiva y enlace. Incluye otra imagen en el cuerpo para comprobar que no se cruzan las relaciones.

Verifica importación, edición del texto, persistencia en IndexedDB, reconstrucción, reimportación, igualdad de bytes de las imágenes, presencia de tablas, estilos y enlaces. También comprueba que un cambio de estructura de una nota con objetos provoca un error explícito de exportación en vez de producir una nota incompleta.

La biblioteca generadora deja un marcador de imagen sin resolver en notas finales; la prueba completa explícitamente esa relación en su archivo sintético antes de importarlo. No modifica los 50 documentos originales del corpus.

## Regresión y evidencia

- Corpus completo: 50/50 flujos aprobados, 84 páginas PDF.
- 750/750 comprobaciones semánticas; 200 paquetes DOCX sin daños, originales intactos y sin pérdidas de los párrafos e imágenes auditados.
- Las 84 páginas PNG coinciden exactamente por SHA-256 con la revisión visual anterior. Permanece la advertencia conocida del alias Unicode árabe del caso 47.
- Pasaron las pruebas generales y los 15 flujos anteriores de Word, las seis pruebas de referencias y notas y la compilación. La prueba nueva también comprueba que la falta de una imagen impide generar un DOCX incompleto.

Evidencia en `output/word-corpus-50/pruebas/notas-con-objetos-20261003/`: resultados por documento, auditorías independiente y semántica, comparación visual, DOCX, PDF y PNG. La prueba de notas con objetos se ejecuta con `npm run test:word:references`.

## Límites vigentes

- La vista web y el PDF todavía muestran solo el texto de las notas con objetos. La conservación completa implementada aquí corresponde al DOCX descargado.
- No existe aún edición visual de imágenes o tablas dentro de las notas. Se permite editar su texto manteniendo los saltos que delimitan sus párrafos y celdas.
- Cambiar el número de párrafos de una nota con imágenes o tablas bloquea su reconstrucción para evitar pérdidas. Las notas sin objetos pueden exportarse como texto simple si cambia esa estructura.
- Los estilos heredados y la numeración compleja de listas dentro de notas requieren validación adicional; no se certifica su reproducción completa.
- Se preserva el formato directo situado fuera del intervalo editado; el texto nuevo adopta el formato del primer fragmento afectado. No se certifica equivalencia visual con Word de escritorio.
- Continúan los pendientes del informe anterior: estilos bibliográficos, campos avanzados, SmartArt/OLE editables, controles vinculados y composición visual avanzada.
