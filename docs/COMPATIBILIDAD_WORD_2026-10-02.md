# Compatibilidad Word: tercera revisión del 2 de octubre de 2026

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

## Ampliación de secciones, ecuaciones y capacidad

- Importación y exportación de secciones con tamaño, orientación y márgenes propios; composición PDF con páginas verticales y horizontales en un mismo archivo.
- Encabezados y pies generales, de primera página y pares; se resuelven las referencias heredadas entre secciones. Se pueden editar en «Secciones y encabezados» y se guardan junto al contenido y su historial.
- Numeración continua o reiniciada, decimal, romana y alfabética. PAGE y NUMPAGES se actualizan en el PDF completo.
- Columnas con anchos explícitos importados: medidas conservadas en DOCX y composición de impresión con flujo por columnas. La vista de edición aún usa columnas iguales; la vista previa es la referencia de impresión.
- Ecuaciones OMML comunes se convierten a estructuras editables: fracciones, raíces, potencias, subíndices, integrales/sumatorias, delimitadores, matrices y acentos admitidos. Se exportan nuevamente como ecuaciones nativas. Las estructuras no soportadas muestran un marcador visible y una advertencia; no se inventa su interpretación.
- Límite de importación DOCX ampliado de 25 a 50 MiB, coherente con la biblioteca. Eliminado el rechazo fijo de guardado por 300.000 caracteres. El almacenamiento real del navegador o del servidor sigue teniendo capacidad finita; un fallo de guardado se informa y mantiene el estado pendiente.
- Las imágenes PNG/JPEG importadas conservan sus bytes originales, sin reducirlas a 1.600 píxeles. Los formatos no soportados y los controles de integridad/expansión ZIP mantienen sus avisos y protecciones.

### Verificación adicional

Cuatro suites nuevas en `npm run test:word`: secciones (importación, exportación, PDF, edición de pie, numeración, guardado auditado, recarga y reapertura), columnas desiguales, ecuaciones (ida y vuelta semántica) y capacidad (DOCX de 26 MiB, PNG idéntico y guardado de más de 300.000 caracteres). Fixture de seis páginas con tres secciones y dimensiones PDF comprobadas. Fixture de columnas: cuatro páginas y 30 párrafos en orden, sin ausencias. Manual real GA-M-002: siete páginas, 369 párrafos y todos los encabezados/pies presentes; revisión visual de las páginas.

Los borradores guardados anteriormente no se reemplazan automáticamente con una nueva importación: se preservan las ediciones. El soporte nuevo de importación se aplica a archivos abiertos por primera vez. Un borrador antiguo que ya perdió elementos en su primera conversión no los recupera por abrirlo de nuevo.

## Pendientes reales

- Composición de saltos continuos dentro de la misma página y páginas de relleno para saltos par/impar: el DOCX conserva el tipo, pero el PDF comienza cada sección en una nueva página sin insertar esos rellenos.
- Edición vinculada entre encabezados heredados: al reconstruir se exportan las variantes resueltas por sección; cambiar una no actualiza las otras automáticamente.
- Columnas desiguales en el lienzo editable y numeración avanzada de listas totalmente editable.
- Objetos flotantes complejos, gráficos Office, SmartArt, estructuras matemáticas no soportadas, comentarios/control de cambios y contenidos vinculados.
- Combinaciones verticales de tabla que exceden una página y algunos casos de notas/tabulaciones/estilos condicionales.
- Fidelidad de fuentes cuando la fuente original no está disponible en el equipo.

No se garantiza equivalencia universal con Microsoft Word. El archivo original se conserva y la exportación sin cambios o con modificaciones compatibles sigue usando la preservación del paquete original. El modo reconstruido mantiene únicamente los elementos soportados.

## Referencias técnicas consultadas

- Microsoft Open XML, KeepNext: https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.keepnext
- Microsoft Open XML, StartOverrideNumberingValue: https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.startoverridenumberingvalue
- Paged.js 0.4.3, puntos de extensión previos al cálculo de desbordamiento: https://github.com/pagedjs/pagedjs/blob/v0.4.3/src/chunker/layout.js
