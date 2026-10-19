# Asistente Arles en ONLYOFFICE

Complemento propio para Docs Community 9.4.0: Word, Excel y PowerPoint. Se abre como panel derecho; también se puede abrir en **Extensiones → Asistente Arles**. PDF conserva sus herramientas existentes.

Usa el proveedor Groq ya configurado en Vercel (`AI_ENABLED=true`, `GROQ_API_KEY`) y el modelo `openai/gpt-oss-20b`. No instala otros proveedores ni activa un plan de pago. Los límites de la cuenta de Groq siguen aplicando; ante un 429 se muestra el error sin cambiar de proveedor ni reintentar automáticamente. No se guardan preguntas o respuestas en la nube.

La ruta `/api/editor-assistant` verifica el JWT contra Supabase Auth y la membresía activa, y lee la versión documental con el JWT del usuario. Nunca usa una clave privilegiada. Antes de aplicar se comprueba nuevamente que la versión admita edición. No agrega tablas ni cambia RLS.

Las solicitudes se hacen desde la página principal con su sesión de Arles. El panel no mantiene otra sesión ni necesita leer el almacenamiento de autenticación de un iframe anidado; el servidor fija el documento abierto y vuelve a comprobar el acceso en cada solicitud.

El contenido enviado es parcial: hasta 12.000 caracteres de Word, hasta 200 celdas seleccionadas con sus valores y fórmulas, o los textos de la diapositiva actual. El panel informa que se envían esos fragmentos a Groq. Las claves de Groq permanecen en el servidor.

La IA devuelve propuestas de datos, sin macros ni código ejecutable. Se validan en servidor y cliente. Word permite añadir párrafos al final o reemplazar una selección que siga siendo la misma. Excel verifica hoja, selección y valores originales antes de editar; rechaza direcciones fuera del rango y fórmulas con conexiones externas. PowerPoint añade hasta cinco diapositivas con texto editable al final. Las propuestas solo se aplican por acción del usuario, mediante el SDK oficial y las funciones de edición de ONLYOFFICE, conservando su autoguardado, deshacer y colaboración.

El SDK `office-ai/plugins-9.4.0.js` es una copia sin modificar de `/sdkjs-plugins/v1/plugins.js` del contenedor ONLYOFFICE 9.4.0 instalado; conserva sus avisos de licencia AGPL y autoría. SHA-256: `8b3cff57a562b56610116252f021042410b568cbfdfabb22c3abb35c38c78cdf`.
