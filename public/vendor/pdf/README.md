# Dependencias del motor de PDF

- PDF.js / pdfjs-dist **6.3.289**, licencia Apache 2.0. Renderer, worker, CMaps, fuentes estándar y WASM copiados sin modificaciones del paquete npm `pdfjs-dist@6.3.289`. https://github.com/mozilla/pdf.js / https://mozilla.github.io/pdf.js/
- pdf-lib **1.17.1**, licencia MIT. Distribución ESM minificada copiada sin modificaciones de `pdf-lib@1.17.1`. https://pdf-lib.js.org/ / https://github.com/Hopding/pdf-lib

Las licencias están junto a los archivos. Los recursos se sirven desde la plataforma y se cargan al abrir PDF. El motor procesa los archivos en el navegador; no utiliza un conversor remoto. El script `scripts/vendor-pdf.mjs` documenta cómo reproducir la instalación de estas versiones.
