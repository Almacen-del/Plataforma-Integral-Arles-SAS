# OCR local

Tesseract.js **7.0.0**, tesseract.js-core **7.0.0**, Apache 2.0. Distribución ESM, worker y seis variantes WASM autocontenidas copiados sin modificación de sus paquetes npm. Las variantes incluyen SIMD y Relaxed SIMD; el worker elige la adecuada para el navegador. Se carga solo la variante necesaria.

Modelos `spa` y `eng`: paquetes **@tesseract.js-data/spa@1.0.0** y **@tesseract.js-data/eng@1.0.0**, variante **4.0.0_best_int**. Se conserva la metadata de distribución MIT declarada por los paquetes y la licencia Apache 2.0 del origen `tessdata_best`. Binarios sin modificaciones.

El código y los idiomas se sirven desde nuestra plataforma y se cargan al solicitar OCR sobre una página que lo necesita. Las imágenes de los documentos se reconocen dentro del navegador; no se envían a una API. Los idiomas se almacenan en la caché IndexedDB del motor.

Reproducción: `node scripts/vendor-ocr.mjs` desde la raíz. Fuentes: https://github.com/naptha/tesseract.js, https://github.com/naptha/tesseract.js-core, https://github.com/naptha/tessdata y https://github.com/tesseract-ocr/tessdata_best.
