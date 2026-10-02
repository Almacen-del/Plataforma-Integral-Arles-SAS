# Asistente Arles: integración gratuita preparada

Estado: código preparado para GroqCloud; el usuario indicó que todavía no tiene cuenta. No se creó una cuenta ni se activó facturación. No hay clave del proveedor configurada ni inferencia real comprobada.

## Activar

1. Crear una cuenta en https://console.groq.com/ y mantener el plan **Free**, sin habilitar facturación de pago.
2. Crear una clave API. No enviarla por el chat ni incorporarla al código.
3. En Vercel → proyecto `plataforma-integral-arles-demo` → Settings → Environment Variables, crear `GROQ_API_KEY` como secreto para Production y `AI_ENABLED=true`.
4. Volver a desplegar para que las variables lleguen a la función. Iniciar sesión con la cuenta autorizada de Plataforma Integral y abrir Asistente Arles.
5. Hacer una consulta pequeña, comprobar la respuesta y revisar el uso en Groq. Esta verificación real está pendiente de la cuenta del usuario.

Sin ambas variables, la interfaz informa que falta activar la cuenta. No hay proveedor de pago alternativo, reintentos automáticos ni activación automática de facturación. La aplicación no puede comprobar por API que el administrador mantenga el plan Free: esa condición debe conservarse en Groq. El alojamiento y la base siguen sujetos a sus propios planes.

## Arquitectura y alcance

`api/assistant.js` es una función Node de Vercel que llama directamente a la API de Groq, sin intermediario de pago ni SDK adicional. Modelo inicial verificado en catálogo oficial: `openai/gpt-oss-20b`. La clave queda exclusivamente en variables del servidor. La sesión de Supabase se verifica con Auth y con la membresía activa en `integral_members`; las consultas usan el JWT del usuario y sus reglas RLS, sin clave privilegiada.

La IA recibe la pregunta, como máximo dos intercambios previos de IA y un resumen de la fuente seleccionada:

- Biblioteca: cantidad de documentos no ficticios/no retirados y hasta diez coincidencias por nombre/código, con su estado.
- Personal: cantidad de personas y personas activas; no incluye nombres, nómina ni turnos individuales.
- Hallazgos: cantidad total y abiertos.
- Censos: conteos de registros por tipo, nunca equivalentes a número de árboles/frutos.
- Almacén, vivero y taller: informa que no tienen conector, sin consultar otras fuentes en su nombre.

No lee contenido de archivos Word, Excel o PDF, no ejecuta SQL generado, no navega, no cambia registros y no envía mensajes a terceros. Los textos del contexto son datos, no instrucciones. La respuesta se muestra como texto escapado y las referencias provienen del servidor. El usuario ve que su pregunta y contexto se envían a Groq. Las conversaciones conservan el mecanismo existente de historial, compartido en el espacio de nube cuando hay sesión.

El límite oficial consultado para GPT OSS 20B en Free es 30 solicitudes/minuto, 1.000/día, 8.000 tokens/minuto y 200.000/día, compartido por organización. Puede cambiar o variar por cuenta; prevalece la consola del proveedor. La respuesta tiene un máximo solicitado de 1.500 tokens. Un 429 muestra el límite y detiene la petición. No hay una cuota adicional persistente por usuario en esta primera versión.

## Verificación

Ocho pruebas de API con proveedores simulados: autenticación, membresía, configuración ausente, RLS mediante token de usuario, separación de fuentes, filtrado de demos, cuota y ocultación de errores/secretos. Prueba de navegador con backend simulado: respuesta de IA, referencia, historial y texto HTML escapado. No se enviaron registros reales al proveedor durante las pruebas.

Fuentes oficiales verificadas: [modelos](https://console.groq.com/docs/models), [límites](https://console.groq.com/docs/rate-limits), [compatibilidad API](https://console.groq.com/docs/openai), [tratamiento de datos](https://console.groq.com/docs/your-data), [funciones Node de Vercel](https://vercel.com/docs/functions/runtimes/node-js).
