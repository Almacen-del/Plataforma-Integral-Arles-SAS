# Motores documentales actuales

Word, Excel y PowerPoint se crean desde la barra de carga de la biblioteca y se editan con las adaptaciones de ONLYOFFICE. Conservan su asistente de IA, colaboración y autoguardado compartido.

PDF se consulta con el lector de la biblioteca. Su opción de edición abre ONLYOFFICE; las herramientas para unir, dividir, comprimir y reconocer texto siguen disponibles.

Los tres editores anteriores de texto, hojas de cálculo y PDF, sus botones, estilos y módulos se retiraron del código y de la publicación. Los lectores sin edición (`xlsx-reader.js`, `pptx-reader.js`, `pdf-text-recognition.js`) conservan la consulta documental, el historial y la extracción de contenido para la IA. Los archivos y borradores almacenados no se borran ni se migran durante esta retirada.

`app-assets.mjs` declara los archivos actuales que se sirven y compilan. La compilación limpia primero `dist` para evitar que sobrevivan módulos retirados.

Validación: `npm test`, `npm run test:editors`, `npm run test:office` y `npm run test:pdf`.
