# Herramientas PDF de Arles

La página de edición de ONLYOFFICE incluye **Herramientas PDF**: unión ordenada
de hasta ocho archivos, división por cantidad de páginas o rangos, compresión
de estructura sin pérdida, compresión de imágenes a 150 o 72 ppp y OCR en
español, inglés o ambos. El OCR conserva la imagen y añade texto invisible
seleccionable al PDF; también permite descargar TXT. Los resultados pueden
descargarse como PDF o ZIP y guardarse como nuevas copias en la biblioteca.

Los archivos base provienen del original o del último borrador compartido
guardado. Si hay cambios pendientes en ONLYOFFICE, usar **Guardar ahora** antes
de **Actualizar archivo base**. Estas herramientas no reemplazan el original
ni escriben sobre una sesión de colaboración activa. Las copias quedan como
borradores, con carpeta, motivo, responsable, herramienta y huellas SHA-256
de sus archivos de origen. La biblioteca y auditoría se guardan juntas con
control de revisión. Los reintentos conservan los identificadores de archivo.

PDF-lib 1.17.1 (MIT), PDF.js 6.3.289 (Apache-2.0), Tesseract.js 7.0.0
(Apache-2.0) y JSZip 3.10.1 se sirven desde los archivos locales ya incluidos;
se conservan sus avisos y licencias en `public/vendor`. La herramienta utiliza
estas bibliotecas directamente y no incorpora módulos propietarios de Stirling.
El servicio de compresión utiliza Ghostscript 10.0.0 con las correcciones de
Debian `10.0.0~dfsg-11+deb12u8`, instalado desde el repositorio oficial. Su
licencia y avisos se conservan dentro de la imagen en `/usr/share/doc`.
Ghostscript se distribuye bajo AGPL; sus fuentes están disponibles en
https://www.ghostscript.com/releases/gsdnld.html y https://sources.debian.org/src/ghostscript/.

El servicio se inicia junto con `Iniciar editor temporal.cmd`, escucha solo en
`127.0.0.1:8089`, usa un usuario sin privilegios, sistema de archivos de solo
lectura y hasta 512 MB de RAM. Los archivos temporales están en memoria y se
eliminan al terminar. El puente de Arles valida la cuenta y la membresía activa
en Supabase antes de procesar una solicitud. No se envían documentos a otros
proveedores de OCR o compresión. ONLYOFFICE continúa en su servicio original.

Límites: 25 MB por archivo, 200 MB por lote, 300 páginas y 100 partes. Los PDF
con contraseña, firmas digitales o campos de formulario requieren una copia
sin esas restricciones para estas herramientas; conservan su consulta y descarga.

Validación: `node tests/pdf-fixtures.mjs`, generar `tests/pdf-ocr-fixture.py`
con el Python incluido en Codex, `node --test tests/pdf-tools-*.test.mjs` y
`node tests/pdf-tools.browser.mjs`. Las pruebas usan Supabase aislado en memoria
y el servicio de compresión real; no modifican documentos del proyecto real.
