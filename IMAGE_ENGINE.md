# Visor de imágenes Arles

Integrado en `document-editor.js` y `document-control.js` para los archivos de la biblioteca. Lectura local del Blob existente; no modifica registros ni archivos. No publicado por esta tarea.

El navegador abre los formatos comunes. Si necesita conversión, se inicia un Worker con magick-wasm 0.0.44 (WASM de unos 15 MB, cargado bajo demanda). No se envían imágenes a una API de conversión. Licencias y procedencia en `public/vendor/images`.

Controles: ajustar, tamaño real, zoom, arrastre, pellizco, giro, fondo claro/oscuro, pantalla completa y descargar original. Escape cierra; +/− amplían, 0 ajusta y flechas desplazan.

## Verificado en Chrome

- PNG, JPEG, TIFF, PSD, BMP, WebP, AVIF, TGA, QOI, JP2 y EXR: fixtures generadas con dimensiones y píxeles esperados.
- HEIC real: ejemplo de strukturag/libheif, 1280 × 854.
- RAW DNG real: Leica M8, f-spot/raw-samples, 3920 × 2638.
- Apertura desde document-editor con almacenamiento IndexedDB; descarga comparada byte por byte; archivo corrupto; controles y cierre.

Ejecutar `node tests/image-fixtures.mjs` y `node tests/image-engine.browser.mjs`. Las muestras externas se descargan a tmp, no se distribuyen. El test usa Chrome y Playwright del runtime local configurado en su cabecera.

## Límites explícitos

PSD muestra la composición guardada, sin edición de capas. RAW usa el revelado del decoder; el color no se promete idéntico al software de cada cámara. TIFF e ICO muestran la primera imagen. GIF nativo conserva animación. No están verificadas todas las cámaras, variantes PSD/PSB, HDR, perfiles de color o extensiones registradas en image-formats.js.

Máximo actual de biblioteca: 50 MB. Worker con presupuesto de memoria y cancelación a los 60 segundos; imágenes convertidas mayores de 8192 píxeles se reducen solo para vista previa. El original se descarga intacto incluso cuando falla la lectura. Archivos que requieren más memoria pueden rechazarse con mensaje explícito. No hay promesa de compatibilidad universal.

## Canon CR3

Lectura propia de la vista previa JPEG en el UUID Canon del contenedor ISO-BMFF, con validación de límites. Etiqueta explícita de vista previa; si no existe o no se puede decodificar, intenta el lector RAW. Verificado con Canon-R6-pruned.CR3 del corpus de Exiv2 (1620 × 1080; muestra recortada para pruebas de metadatos, no un RAW completo). El original no se modifica. Prueba del parser: `node --test tests/image-cr3.test.mjs`. Referencia de estructura: https://github.com/exiftool/exiftool/blob/master/lib/Image/ExifTool/QuickTime.pm. No se copió código de ExifTool.

También verificado un CR3 CRAW completo de Canon EOS M50 (raw.pixls.us/2663, CC0), SHA256 `15384b775867ec4c42b11882837f1e368cedc0561832ffab271221e6bb80be4c`. Vista previa incrustada: 1620 × 1080; no equivale a la resolución completa del sensor.

## Rendimiento de reapertura

Caché de vistas convertidas solo en memoria (8 imágenes / 32 MB), identificada por SHA-256 del contenido y extensión. No conserva resultados fallidos; comprueba cancelación también en aciertos. Worker reutilizable por 30 segundos de inactividad, terminado si hay error o cancelación. Se evita descargar/inicializar WASM para cada conversión consecutiva.

Mediciones locales de decodeImage en Chrome: PSD repetido 553 ms antes / 2 ms después; DNG repetido 13447 ms antes / 43 ms después. Primera conversión DNG todavía aproximadamente 14 s; estas cifras excluyen la descarga desde almacenamiento remoto y no garantizan tiempos en otros equipos. Test: `node tests/image-performance.browser.mjs` (reutilización, una carga WASM entre formatos, contenido cambiado y cancelación).
