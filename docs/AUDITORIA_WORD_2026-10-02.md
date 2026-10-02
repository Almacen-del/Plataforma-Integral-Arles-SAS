# Auditoría del motor Word — 2 de octubre de 2026

Se ejecutaron dos recorridos nuevos de los 50 documentos originales: antes y después de las correcciones. La comparación semántica independiente encontró 49 discrepancias en 42 documentos, correspondientes a cuatro causas. El resultado final es 50/50 recorridos y 750/750 comprobaciones semánticas, con 200 paquetes íntegros y 84 páginas PDF sin pérdida de párrafos comprobados.

## Correcciones

- Distancias de encabezado y pie: la exportación directa tomaba valores predeterminados en lugar de las distancias importadas. Ahora sobreviven a la normalización y exportación.
- Caso 30: se importan y exportan los márgenes reflejados y los 288 twips de encuadernación. Una prueba de navegador comprueba el margen interior alterno en ambas páginas del PDF.
- Caso 38: se conserva la revisión pendiente de formato del párrafo, con autor, fecha y propiedades anteriores, al guardar y reconstruir el Word.
- Caso 46: el XML adjunto y sus relaciones se conservan en la exportación reconstruida y después de guardar/reabrir el documento.

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

- 50 casos progresivos no cubren todas las funciones ni garantizan fidelidad universal. No se dispuso de Word ni LibreOffice para comparar visualmente con otro motor.
- Las notas Word conservan su tipo, pero el PDF aún agrupa las notas al final del contenido. La composición como notas al pie de cada página sigue pendiente.
- Los índices y campos importados conservan instrucciones y valores; su actualización completa dentro del editor sigue pendiente.
- La revisión de formato se conserva pendiente, pero este cambio no agrega una interfaz para aceptar/rechazar revisiones de formato. El XML adjunto se conserva como dato, no como contenido editable.
- Objetos flotantes complejos, SmartArt, OLE, macros, controles avanzados y todos los estilos posibles de gráficos no están certificados por este corpus.
- Los borradores antiguos editados no se reemplazan automáticamente. Recuperar propiedades antes omitidas puede requerir comparar una nueva importación del original.
- La auditoría XML comprueba integridad, relaciones y propiedades seleccionadas; no es una validación completa contra todos los esquemas OOXML. El PDF árabe mantiene la advertencia documentada sobre extracción Unicode.

Cambios locales, sin despliegue en Vercel. No se alteraron los DOCX originales ni documentos de producción.
