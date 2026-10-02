# Composición e impresión de Word — 2 de octubre de 2026

La vista completa de páginas y el botón Imprimir/PDF componen el documento antes de abrir la impresión. Paged.js 0.4.3 (MIT, incluido localmente en public/vendor) trabaja dentro de un iframe: no se envía el documento a un servicio de conversión.

## Cambios
- Encabezados y pies originales repetidos, con campos de página actualizados por página.
- Vista con selección de página, zoom y comprobación de texto antes de habilitar la impresión.
- Filas de tabla demasiado largas se dividen por bloques en la copia de impresión. Los párrafos enormes se fragmentan conservando sus caracteres y marcas en línea; el documento editable no cambia.
- Se verifica que los fragmentos de texto estén dentro del área imprimible y que la composición conserve los bloques de origen.
- Se recalcula la paginación del editor cuando terminan de cargar las imágenes y fuentes.
- La exportación DOCX que conserva el paquete original, implementada previamente, sigue pasando sus regresiones.

## Verificación
- 64 pruebas unitarias aprobadas.
- Importación de estilos, bordes, preservación del paquete DOCX, edición/guardado/reapertura de biblioteca aprobadas.
- Vista en columnas, miniaturas, navegación y controles de Vista aprobados.
- Impresión sintética: una y dos columnas, párrafo muy largo, tabla de 20 páginas; una fila combinada que excede el área útil bloquea la impresión con explicación.
- Manual GA-M-002 real: PDF de siete páginas, 369 párrafos del DOCX contrastados contra texto extraído del PDF, ninguno ausente. Revisión visual de todas las páginas y encabezado/pie en cada una.
- tests/word-pdf-fidelity.py permite repetir la comparación con rutas DOCX/PDF explícitas.

## Límites
No equivale al motor de Microsoft Word. Las secciones con tamaños o encabezados diferentes, algunos objetos flotantes y combinaciones verticales de tabla enormes requieren más soporte. El guardado DOCX con cambios estructurales usa reconstrucción y lo comunica; la preservación del paquete aplica a archivos sin cambios o ediciones de texto compatibles. Las miniaturas y guías dentro del editor siguen siendo una aproximación: la vista completa es la referencia de impresión. Una comprobación de texto no garantiza fidelidad idéntica de todos los objetos gráficos. El archivo original permanece disponible sin modificación.
