# Pestaña Revisar — entrega local del 30/09/2026

Se amplió la ficha Revisar a partir de las capturas aportadas y de documentación oficial de Microsoft. Se verificó la plataforma en el navegador. No se inspeccionó Excel de escritorio durante esta entrega.

Los cambios permanecen en el proyecto local; no se publicaron en Vercel. El libro, los comentarios, las notas y el diccionario personal se guardan al pulsar Guardar, en este navegador. Archivo y Programador/macros siguen excluidos.

## Herramientas disponibles

| Grupo | Comportamiento |
| --- | --- |
| Revisión | Ortografía de una selección, la hoja o el libro en español de Colombia. Diccionario Hunspell local, sugerencias, cambiar una aparición o todas dentro del ámbito, omitir una/todas y añadir al diccionario personal. No modifica fórmulas ni números. Los reemplazos preservan el texto como texto literal y admiten Deshacer. |
| Sinónimos | Consulta real del diccionario español OpenThesaurus, agrupada por acepciones. Elegir un resultado reemplaza una aparición en el texto de la celda de origen, después de verificar que sigue siendo el mismo texto. |
| Estadísticas | Recuentos separados para la hoja y el libro: última celda usada, celdas con contenido, fórmulas, tablas, tablas dinámicas, gráficos, imágenes, controles, objetos, comentarios y notas. Incluye las consultas externas registradas. |
| Accesibilidad | Revisa todas las hojas: descripción de imágenes y objetos, contraste de colores efectivo incluido tema/formato condicional, nombres genéricos de hojas, vínculos poco descriptivos, encabezados vacíos o repetidos y combinaciones. Permite navegar a la incidencia y guardar texto alternativo. Los indicadores de comentarios y notas tienen descripciones accesibles. |
| Idioma | Panel con idiomas de origen/destino, original, resultado revisable y celda de destino. Traducción automática con la API local Translator cuando el navegador la ofrece; informa progreso de descarga y disponibilidad. Si no existe, explica la limitación y permite insertar una traducción preparada manualmente. Impide reemplazar fórmulas o números y sobrescribir otras celdas ocupadas. |
| Comentarios | Hilos por celda, respuestas, edición de mensajes, resolver/reabrir, eliminar hilo, anterior/siguiente, ámbito hoja/libro y filtro pendiente/resuelto. Autores declarados y fechas locales, contenido escapado, indicador propio, Guardar y Deshacer/Rehacer. |
| Notas | Anotaciones simples independientes de los hilos. Crear, editar, eliminar, anterior/siguiente, listar hoja/libro y mostrar/ocultar notas sobre la cuadrícula. Se mantienen las notas de libros existentes. |
| Proteger hoja | Activación rápida compatible con el editor anterior. Panel para contraseña opcional y permiso de editar comentarios/notas. Respeta las celdas desbloqueadas y las fórmulas ocultas, además de los rangos autorizados. La desprotección con contraseña exige verificarla. |
| Proteger libro | Protección de estructura con contraseña opcional. Bloquea añadir, copiar, mover, renombrar, eliminar, ocultar o mostrar hojas, incluyendo resultados de Datos que crean otra hoja. |
| Permitir editar rangos | Crear/eliminar rangos sin superposición antes de proteger. Rangos libres o con contraseña. La autorización de una contraseña dura solamente esta sesión y se limita a esa hoja; se restablece al abrir de nuevo el editor. Las modificaciones de filas/columnas trasladan sus referencias. |

Los diccionarios se cargan solo al utilizar sus herramientas. Los datos revisados no se envían a un servicio de traducción o corrección externo. Las contraseñas se guardan como verificadores PBKDF2/SHA-256 con sal aleatoria; no se guarda el texto de la contraseña. Esta protección controla la edición local, no cifra un archivo ni sustituye permisos de servidor.

## Límites explícitos

- Ortografía no incluye gramática ni todos los idiomas de Office. El tesauro tiene la cobertura de OpenThesaurus, no la del servicio propietario de Microsoft.
- La traducción automática depende de la API y los paquetes del navegador. No se ha configurado Microsoft Translator ni otro proveedor externo. La prueba del navegador valida el caso sin API y la inserción manual; no confirma la calidad de un modelo de traducción descargado.
- Los comentarios son locales. No hay coautoría, notificaciones, menciones a personas, identidad autenticada, historial compartido ni «Dejar de compartir libro» heredado.
- Entrada de lápiz queda deshabilitada e identificada como pendiente hasta disponer del motor de dibujo. No se ocultan formas o imágenes para simular trazos.
- Las comprobaciones de accesibilidad cubren las reglas descritas; no certifican accesibilidad completa ni sustituyen revisar el contenido con un lector de pantalla.
- Se mantiene el área A1:Z100. Las nuevas propiedades son del modelo del editor; no se afirma importación/exportación XLSX completa de comentarios, protección o diccionarios.

## Diccionarios y reproducibilidad

`public/vendor/review/SOURCES.json` fija la revisión de LibreOffice/dictionaries. Los archivos originales del diccionario de Colombia y del tesauro español permanecen separados y sin modificar, junto a atribución y licencias MPL-1.1 y LGPL-2.1. nspell 2.1.5 usa MIT y conserva su licencia y la de is-buffer. `scripts/vendor-sheet-review.mjs` reproduce la descarga y el paquete de navegador usando la revisión registrada.

## Fuentes primarias

- [Comprobar ortografía en una hoja](https://support.microsoft.com/es-es/excel/check-spelling-in-a-worksheet).
- [Sinónimos en Office](https://support.microsoft.com/es-es/word/look-up-words-in-the-thesaurus).
- [Estadísticas del libro](https://support.microsoft.com/es-es/excel/check-workbook-statistics).
- [Comentarios y notas](https://support.microsoft.com/es-es/excel/insert-comments-and-notes-in-excel).
- [Diferencia entre comentarios encadenados y notas](https://support.microsoft.com/es-es/excel/the-difference-between-threaded-comments-and-notes).
- [Proteger una hoja](https://support.microsoft.com/es-es/excel/protect-a-worksheet).
- [Proteger un libro](https://support.microsoft.com/es-es/excel/protect-a-workbook).
- [Translator API del navegador](https://developer.chrome.com/docs/ai/translator-api).
- [Diccionarios originales y sus licencias](https://github.com/LibreOffice/dictionaries/tree/32b006a2c22a4ac7e8ed3f03346f7b3d85a970a4/es).
- [nspell: API y licencia](https://github.com/wooorm/nspell).

## Verificación

Las pruebas nuevas cubren conversaciones y notas independientes, texto frente a fórmulas/códigos, diccionarios reales, contraseñas y autorizaciones por hoja/sesión, escritura atómica, estructura protegida, cambios estructurales sin perder anotaciones, estadísticas y comprobaciones de accesibilidad. El flujo de navegador verifica corrección real, sinónimos, mensajes y respuestas, edición/resolución, notas, descripción de imagen, traducción manual, protección, persistencia y recuperación con Deshacer.

Resultado: 106 pruebas del motor de hojas y 34 generales/documentales aprobadas (140 en total); 15 recorridos de navegador aprobados, incluidos todos los anteriores. También pasaron `node build.mjs` y `git diff --check`. La inspección visual en 1920 y 1100 píxeles confirmó que el panel y la cuadrícula conservan su distribución; la cinta permite desplazarse horizontalmente cuando no cabe. No hubo errores de página en los recorridos de navegador ni en la comprobación final con agent-browser. La reapertura verificó que las autorizaciones temporales de rangos se restablecen.
