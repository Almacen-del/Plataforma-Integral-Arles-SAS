# Importación XLSX · 01/10/2026

Solicitud: comprobar MA-F-009 PROGRAMACIÓN DE LABORES CAMPO (1).xlsx sin modificarlo y, al detectar que el motor solo importaba texto, implementar primero la lectura XLSX.

## Lectura y uso

«Abrir XLSX» está disponible en la cabecera y en Datos → Obtener datos → Desde un libro Excel / XLSX. El lector presenta un resumen antes de abrir el libro completo. Conserva nombres, orden y estado visible/oculto de las hojas, valores y fórmulas, combinaciones, fuentes, colores del tema, rellenos sólidos, bordes, alineación, formatos numéricos, tamaños de filas/columnas, filas/columnas ocultas, filtros, validaciones de listas, nombres definidos, tablas de consulta e imágenes PNG/JPEG/GIF. Guarda metadatos originales de impresión y de reglas condicionales para su posterior verificación.

La cuadrícula puede leer hasta 100.000 filas y 256 columnas y muestra una ventana de filas para libros grandes. No recorta el libro a A1:Z100. Se mantienen las referencias originales de las fórmulas; la adaptación de separadores XLSX y referencias de tablas se realiza solo para el cálculo. El cálculo entre hojas y las consultas a Tabla_1 funcionan en el archivo de prueba.

El borrador grande y el archivo original se guardan en IndexedDB. «Original XLSX» descarga los mismos bytes recibidos. La importación y los datos se procesan en el navegador, sin subidas ni API externa. Los archivos de prueba permanecen en tmp, excluido de Vercel y Git.

## Dependencias y límites

Lectores locales fijados: ExcelJS 4.4.0 (MIT), SSF 0.11.2 (Apache 2.0) y JSZip 3.10.1 (licencia distribuida con el paquete). Código y licencias en public/vendor/xlsx; reproducción en scripts/vendor-sheet-xlsx.mjs. Fuentes: [ExcelJS](https://github.com/exceljs/exceljs), [SSF](https://github.com/SheetJS/ssf) y [JSZip](https://github.com/Stuk/jszip).

Entrada: XLSX de hasta 25 MB, 50 hojas, 500.000 celdas almacenadas y 150 MB descomprimidos. Se rechazan libros fuera de límite sin importar parcialmente. XLS, XLSM, archivos cifrados y ZIP64 quedan fuera del alcance. Se avisa ante componentes como gráficos, tablas dinámicas, segmentaciones o vínculos externos. El formato condicional importado requiere adaptación y verificación; no se afirma que todas sus reglas estén aplicadas. La conversión de medidas a píxeles y la disponibilidad de fuentes del navegador impiden prometer una reproducción visual idéntica a Excel en todos los libros.

Esta entrega implementa importación y descarga del original. La exportación XLSX de cambios todavía está pendiente. El original descargado no contiene las ediciones hechas en el borrador.

## Prueba del documento recibido

- Cinco hojas en el orden original, incluida Plateo mecanico oculta.
- 78.140 celdas con contenido: 72.236 valores y 5.904 fórmulas.
- Comparación independiente del XML original frente al modelo importado: cero valores/formulas diferentes y cero celdas añadidas. Una fórmula compartida se comparó después de resolver su referencia al maestro.
- Los 5.904 resultados calculados coincidieron con los resultados guardados en el XLSX. Los 178 resultados #N/A ya estaban en el original; no se alteraron para ocultarlos.
- 18 combinaciones, Tabla_1 y tres apariciones del logotipo. Las 50 reglas XML de validación se expanden en rangos contiguos del modelo, manteniendo sus referencias.
- Navegación hasta E4000 con menos de 200 filas en el DOM; descarga original idéntica, guardado y recuperación después de recargar; sin errores JavaScript ni solicitudes de subida.
- SHA-256 del original antes y después: e431a0f1d314c9b4c8a3d98692942a79b87cd637df50d6457b4a5a532610393c.

Regresión: 137 pruebas de modelo de hojas y recorridos completos de las fichas anteriores. Verificación específica en tests/sheet-xlsx.test.mjs; comparación del documento recibido y capturas en tmp/ma-f-009-fidelity.

## Publicación y verificación

Implementación guardada en el commit be24a36. Publicada en el proyecto Vercel plataforma-integral-arles-demo, equipo almacen-2787s-projects. Despliegue dpl_12ycEo2JBybJog1dBGfADLp2iU6G en estado READY. URL pública: https://plataforma-integral-arles-demo.vercel.app/?editor=hojas.

Se repitió la prueba con el documento real en la web pública: importación completa, navegación a E4000, alturas de fila originales convertidas a píxeles, logotipo visible, descarga idéntica al original y recuperación del borrador al recargar. Cero diferencias en los 72.236 valores y las 5.904 fórmulas/resultados guardados; sin errores JavaScript ni solicitudes de subida. El archivo de trabajo permaneció en el navegador de prueba. Captura privada en tmp/ma-f-009-fidelity/imported-public.png.
