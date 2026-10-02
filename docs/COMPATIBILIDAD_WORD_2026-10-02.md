# Compatibilidad Word: segunda revisión del 2 de octubre de 2026

## Fallos corregidos y comprobados

- Se importan el número de columnas iguales, su separación y la línea divisoria. Se respetan márgenes explícitos de cero.
- Se conservan valores de párrafo heredados y las opciones conservar con el siguiente, conservar líneas juntas, salto de página anterior y control de viudas/huérfanas. El editor aplica las guías básicas y la composición de impresión respeta los saltos.
- Los saltos explícitos dentro de párrafos se separan en bloques de impresión, manteniendo texto y formato; se exportan como saltos DOCX.
- Se conservan filas de cabecera de tabla, repetidas en las páginas impresas de continuación y marcadas como cabeceras al reconstruir Word.
- Anchos fijos y porcentuales de tablas y alineación se mantienen al importar y exportar.
- Se conservan inicios no unitarios de listas decimales. Las listas con numeración literal importada no reciben una segunda numeración al reconstruir el DOCX (también se reconoce list-style:none de borradores antiguos). La numeración literal no se recalcula automáticamente al reordenar elementos.
- PAGE y NUMPAGES se reconocen dentro de frases, tanto en campos complejos como en fldSimple; la impresión actualiza página y total. Los resultados almacenados de campos simples ya no desaparecen durante la conversión.
- La importación identifica columnas desiguales, objetos complejos, revisiones y contenido vinculado; las limitaciones se presentan como lista en la información de compatibilidad.

## Evidencia

64 pruebas unitarias; seis suites de Word; pruebas de vista, columnas, navegación y miniaturas. Fixture DOCX con columnas, párrafos, tabla multipágina, listas desde 4 y campos mixtos: importación, limpieza, exportación y PDF comprobados. PDF de tres páginas con cabecera de tabla repetida y Página X de 3. Manual GA-M-002: siete páginas y 369 párrafos contrastados, ninguno ausente. Revisión visual de PDFs generados.

Los archivos de prueba se generan en tmp; no se modifica el Word del usuario ni se suben documentos de prueba a la base de datos. Los borradores existentes conservan sus ediciones: no se sustituyen silenciosamente por una nueva importación.

## Pendientes reales

- Múltiples secciones con tamaños, orientaciones, márgenes y encabezados diferentes.
- Encabezados y pies particulares para primera página y pares/impares; inicio de numeración y formatos romanos de páginas.
- Columnas desiguales y numeración avanzada totalmente editable.
- Objetos flotantes complejos, gráficos Office, SmartArt, ecuaciones, comentarios/control de cambios y contenidos vinculados.
- Combinaciones verticales de tabla que exceden una página y algunos casos de notas/tabulaciones/estilos condicionales.
- Fidelidad de fuentes cuando la fuente original no está disponible en el equipo.

No se garantiza equivalencia universal con Microsoft Word. El archivo original se conserva y la exportación sin cambios o con modificaciones compatibles sigue usando la preservación del paquete original. El modo reconstruido mantiene únicamente los elementos soportados.

## Referencias técnicas consultadas

- Microsoft Open XML, KeepNext: https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.keepnext
- Microsoft Open XML, StartOverrideNumberingValue: https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.startoverridenumberingvalue
- Paged.js 0.4.3, puntos de extensión previos al cálculo de desbordamiento: https://github.com/pagedjs/pagedjs/blob/v0.4.3/src/chunker/layout.js
