# OCR del motor PDF

Actualización de la primera entrega PDF, 1 de octubre de 2026.

## Función disponible

La ficha **OCR** y el acceso **Leer escaneo** permiten reconocer la página actual, las seleccionadas o todo el documento. Idiomas: español, inglés y ambos. Por defecto se conservan las páginas que ya tienen texto seleccionable; la casilla permite forzar reconocimiento. Un PDF puede combinar páginas escaneadas, texto nativo y diferentes tamaños y recortes.

El resultado aparece en un panel de lectura y como texto transparente seleccionable sobre la imagen. Las posiciones de las palabras se guardan en coordenadas PDF, por lo que siguen la página al girar o cambiar el zoom. La búsqueda usa conjuntamente el texto nativo y el reconocido.

Se puede copiar el texto de la página y descargar todos los resultados como TXT, en el orden de las páginas. **Guardar** conserva originales, texto y posiciones en el borrador IndexedDB. Quitar OCR, deshacer y rehacer son reversibles. La cancelación conserva las páginas ya terminadas; cada lote utiliza un worker y lo libera al finalizar o cancelar. Los pasos tienen un límite de tiempo para evitar quedarse bloqueados.

## Motor integrado y procesamiento local

La interfaz, el visor, la persistencia y la integración son parte de nuestra plataforma. El reconocimiento usa **Tesseract.js 7.0.0** y **tesseract.js-core 7.0.0**, con modelos español e inglés de `@tesseract.js-data` **1.0.0**, variante `4.0.0_best_int`. Son dependencias de código abierto, no un servicio OCR contratado ni un modelo entrenado por Arles.

El código, worker, núcleo y modelos se sirven desde `public/vendor/ocr/` y se cargan cuando hace falta OCR. Las imágenes se procesan en el navegador. No hay llamadas a una API OCR, claves externas, envío de documentos ni cobro por página a un proveedor. Los recursos y sus licencias están versionados. `scripts/vendor-ocr.mjs` reproduce las versiones fijadas.

Referencia primaria del funcionamiento: [Tesseract.js](https://github.com/naptha/tesseract.js), [API de workers](https://github.com/naptha/tesseract.js/blob/master/docs/api.md) y [configuración de rutas locales](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md). Se renderizan las páginas con PDF.js porque el motor OCR recibe imágenes.

## Límites y fidelidad

La confianza mostrada es una estimación del motor, no una garantía de exactitud. Cifras, nombres, escritura manual y escaneos borrosos requieren revisión. El texto debe estar orientado para lectura; se puede girar la página antes de reconocer. La resolución se limita a 7 millones de píxeles y 3200 píxeles por lado para acotar memoria, con un máximo de 100000 caracteres y 15000 palabras por resultado.

Los originales y sus páginas no se modifican por reconocer texto. Los PDF con formularios o estructuras de firma siguen en consulta; el OCR añade únicamente datos de lectura al borrador. **Descargar PDF** conserva el contenido PDF y las modificaciones de organización/anotación que se hayan realizado; esta versión no incrusta la capa OCR en el PDF exportado. Para llevar el resultado a otro programa se descarga TXT. No representa un OCR de tablas a Excel ni reconstruye formatos Word.

## Pruebas y publicación

- Siete pruebas específicas: límites de imagen, texto y geometría; posiciones PDF; worker secuencial y páginas nativas omitidas; cancelación durante reconocimiento; timeout y limpieza después de inicialización tardía; duplicación/giro/JSON y original PDF idéntico pese a contener OCR en el borrador.
- Prueba real en navegador con un PDF sintético de tres páginas: dos imágenes sin texto PDF y una página de texto nativo. Incluye giro de 90 grados y CropBox.
- Se verificaron `ARLES SAS`, factura `12345`, `25 unidades` y `$ 1.250.000`; reconocimiento en español y modelo combinado español/inglés, sin simulación del motor.
- Selección de palabras sobre la imagen, coordenadas tras giro, búsqueda de las dos páginas escaneadas, portapapeles, TXT ordenado, omisión de página nativa, guardado/recarga, quitar OCR/deshacer, cancelación y nueva ejecución.
- La prueba registró las solicitudes: solo GET hacia el origen del sitio, sin POST, sin subidas y sin dominios externos, incluyendo descarga local de los modelos `spa` y `eng` y el núcleo WASM. No hubo errores JavaScript.
- Pasó nuevamente el flujo general PDF, incluida la integración con Excel. Captura de lectura: `tmp/pdf-ocr-lectura.png`.

Repetición: generar el fixture con el Python de pruebas (`tests/pdf-ocr-fixture.py`), iniciar `npm start` y ejecutar `npm run test:ocr`. `npm run test:pdf` incluye las pruebas de modelo OCR y el flujo PDF previo. El fixture es exclusivamente de QA; no contiene datos operativos.

Publicación y comprobación en producción: se registran al terminar el despliegue.
