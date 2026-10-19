# Servidor temporal de documentos de Arles

Instalacion en este equipo Windows, con Docker Desktop y ONLYOFFICE Docs
Community 9.4.0 para Intel/AMD. El motor oficial se conserva completo. Arles
aporta la pagina de acceso, la barra exterior y la integracion con Supabase;
se conservan los avisos, la licencia y la identidad de ONLYOFFICE.

## Uso

1. Abrir Docker Desktop y ejecutar `Iniciar editor temporal.cmd` desde la raiz.
2. Compartir `https://plataforma-integral-arles-demo.vercel.app`. La pagina y
   su asistente siguen en Vercel. Cada persona utiliza su cuenta autorizada de
   Plataforma Integral. Solo el motor de ONLYOFFICE funciona en este PC.
3. En Biblioteca, abrir un archivo XLSX, DOCX o PPTX que ya este en Supabase.
   El editor se abre en otra pestana. Los PDF se abren primero en un lector
   dentro de la plataforma, con navegacion de paginas, zoom, seleccion de
   texto y descarga. **Editar PDF** abre ONLYOFFICE en otra pestana. El lector
   muestra el ultimo borrador compartido guardado, si existe, y permite
   **Actualizar** despues de editar. La lectura no necesita el motor local.
   La pagina de edicion incluye **Herramientas PDF** para unir, dividir,
   comprimir y reconocer texto con OCR. Permite descargar PDF/TXT/ZIP o guardar
   nuevas copias en Supabase con motivo y trazabilidad. Ver `../pdf-tools/README.md`.
   Las versiones retiradas, obsoletas, rechazadas y los registros diligenciados
   conservan la lectura, con la edicion deshabilitada. Todos los usuarios de esa version se
   unen a la misma sesion mientras permanece abierta.
   Para crear un Word, iniciar sesion y elegir **Nuevo Word**, escribir el
   nombre, seleccionar la carpeta y pulsar **Crear y abrir Word**. Confirmar
   el motivo del cambio en el registro de auditoria. Se guarda un DOCX en
   blanco como documento en borrador y se abre con ONLYOFFICE. Tambien se
   pueden subir archivos DOCX existentes con **Subir archivos**.
   Para crear un libro, elegir **Nuevo Excel**, escribir el nombre,
   seleccionar la carpeta y confirmar **Crear y abrir Excel** con el motivo
   de auditoria. Se crea un XLSX con una hoja vacia llamada **Hoja 1** y se
   abre con el editor de hojas de calculo de ONLYOFFICE.
   Para crear una presentacion, elegir **Nuevo PowerPoint**, escribir el
   nombre, seleccionar la carpeta y confirmar **Crear y abrir PowerPoint**
   con el motivo de auditoria. Se crea un PPTX de formato panoramico 16:9,
   con una diapositiva en blanco. **Subir archivos** tambien admite PPTX
   existentes, que se abren con el editor de presentaciones de ONLYOFFICE.
4. Usar **Guardar ahora** para pedir un guardado inmediato. Tambien se
   configura ensamblado automatico cada minuto y guardado al cerrar la ultima
   sesion. **Guardado en Supabase** solo aparece tras confirmar Storage y la
   actualizacion del manifiesto con control de revision.
5. Antes de apagar, terminar las sesiones y comprobar el guardado. Ejecutar
   `Detener editor temporal.cmd`; no elimina archivos ni volumenes.

El PC, Docker, el servidor y el tunel deben permanecer funcionando para editar.
La pagina de Vercel y los documentos guardados en Supabase permanecen disponibles
cuando se apaga el PC. Los motores anteriores de Word, Excel y PDF estan
inhabilitados: sus botones y funciones de apertura quedan bloqueados, incluidos
los ejemplos, enlaces directos y la apertura desde biblioteca. Su codigo y sus
borradores se conservan. No hay retorno automatico a esos motores si ONLYOFFICE
esta apagado; se informa que no esta disponible.

No se
modifica el servidor existente del puerto 4173. La copia temporal de Arles
escucha en 127.0.0.1:4174 y el motor en 127.0.0.1:8088. No se abren puertos
del router ni se modifican reglas de firewall de Windows.

## Documentos y permisos

Se utiliza el proyecto existente `dziwhbjyvxdbplthpazt`, bucket privado
`integral-files`, autenticacion y membresia `integral_members`. No se crean
usuarios, tablas ni proyectos. El servidor verifica el JWT de cada usuario
con Supabase y utiliza sus permisos; no requiere una clave de servicio.

Los originales permanecen inmutables. El resultado del editor se conserva
como borrador compartido bajo `file:document:editor-onlyoffice:<fileId>`, con
origen, version, fecha y secuencia. Esto conserva las versiones aprobadas;
la aprobacion documental sigue el flujo existente. Documentos retirados,
versiones obsoletas/rechazadas y registros diligenciados se abren para lectura.

El lector de la IA consulta el ultimo borrador compartido guardado en Supabase
e identifica sus fragmentos como borrador. Conserva los limites existentes
de extraccion. La generacion de respuestas sigue requiriendo la configuracion
del proveedor de IA; este montaje no crea ni obtiene credenciales de Groq.
Para PPTX, el lector extrae texto y tablas de las diapositivas en el orden de
la presentacion, junto con las notas del presentador. Lee hasta 100 diapositivas
y archivos de hasta 25 MB; no sigue referencias externas. Los textos dentro
de imagenes y los datos internos de graficos no tienen extraccion en esta etapa.

La creacion del PPTX inicial utiliza PptxGenJS 4.0.1, incluido localmente con
su licencia MIT. El editor y todas las operaciones de presentacion siguen
utilizando el motor completo de ONLYOFFICE, sin modificar su codigo.

El motor usa copias de trabajo. El puente cifra las copias y sesiones con
AES-256-GCM en `private/`. Ante un guardado fallido conserva el pendiente,
permite descargarlo y reintenta al volver a abrir con una sesion autorizada.
El servidor conserva solo los tokens de acceso cifrados, nunca contrasenas
ni tokens de refresco. Si todos los tokens vencieron, es necesario reconectar.
No borrar `.env`, `private/` ni los volumenes mientras haya pendientes.

## Limites de esta etapa

El equipo tiene 8 GB de RAM. Docker dispone de aproximadamente 4 GB; el
contenedor se limita a 3 GB mas swap para permitir pruebas pequenas. Es una
configuracion temporal inferior a los 4 GB recomendados para el motor, no
una prueba de capacidad para muchos usuarios o libros grandes. Medir RAM,
latencia y errores antes de aumentar la carga.

Cloudflare Quick Tunnel aporta HTTPS y transporte; los archivos guardados
siguen en Supabase. El tunel no ofrece garantia de disponibilidad y tiene
una URL temporal. No se agrega autenticacion interactiva delante de los
callbacks: el acceso a Arles exige Supabase y los callbacks exigen firma JWT.

No hay inicio automatico del servidor/tunel al encender Windows. El lanzador
reutiliza procesos propios si siguen activos y verifica la descarga oficial
de cloudflared con SHA256. Si cambia el enlace del tunel, `sync-vercel.ps1`
actualiza solamente `ONLYOFFICE_SERVER_URL` y vuelve a publicar el codigo que
ya esta en produccion; no publica otros cambios locales. Requiere la sesion de
Vercel CLI existente de este equipo. Tambien puede ejecutarse desde
`Reconectar editor con Vercel.cmd`. El lanzador abre la pagina estable de Vercel.
La conexion exige un origen HTTPS exacto; el puente permite solicitudes de los
dominios autorizados y verifica la sesion y membresia de Supabase en cada acceso.
Para migrar, trasladar el motor y el puente al VPS,
cambiar el origen HTTPS y conservar el contrato de archivos de Supabase.

## Verificacion

`node --test tests/onlyoffice-bridge.test.mjs` comprueba permisos, firmas,
origen del callback, tres identidades con la misma clave, cierre de sesion,
conflictos y recuperacion de pendientes. `node tests/onlyoffice-live.mjs`
prueba el motor real con un XLSX sintetico y un almacenamiento aislado en
memoria; no escribe datos sinteticos en el proyecto real de Supabase.
Por defecto abre los tres editores por localhost y prueba descarga y callbacks
por un tunel HTTPS aislado. Para incluir el transporte de los navegadores por
internet, ejecutar con `ONLYOFFICE_TEST_INTERNET=true`. Esta prueba no sustituye
la validacion del guardado con una cuenta real autorizada de Arles.

Resultado del 3 de octubre de 2026: 26 pruebas automatizadas aprobadas y prueba
del motor real aprobada con tres identidades por internet, cambio
visible sin recargar, guardado firmado, formula conservada y original intacto.
El acceso publico se reviso en navegador sin errores; el endpoint de apertura
sin sesion responde 401 y los archivos privados del servidor no se publican.
La prueba del motor utilizo Storage y manifiestos simulados en memoria. El
guardado en el proyecto real de Supabase requiere validacion con la cuenta
autorizada del usuario.

Verificacion del 4 de octubre de 2026: 29 pruebas automatizadas aprobadas;
bloqueo de las siete funciones de apertura
anteriores y de cuatro botones, comprobado en navegador local y en la nueva
publicacion de Vercel. Prueba del motor real desde el editor alojado en Vercel,
con tres identidades aisladas: coedicion visible sin recargar, guardado firmado,
formula conservada y original intacto. Los archivos de prueba permanecen en
memoria; no se escriben en Supabase real. El endpoint de salud de Vercel se
comprobo contra el motor instalado en el PC. Las claves de IA existentes se
conservan en Vercel; no se copian al servidor temporal.
Tambien se verifico la apertura de un PDF sintetico en el motor real desde la
pagina publica de Vercel, esperando la carga completa y revisando la imagen
del documento. Los editores anteriores permanecen bloqueados en produccion.

Integracion Word del 4 de octubre de 2026: creacion de DOCX desde la biblioteca
verificada en navegador local y en la publicacion candidata de Vercel, con
archivo, manifiesto y auditoria persistidos en almacenamiento aislado. Se
corrigio la importacion de `cloudActive` en el gestor documental, necesaria
para guardar los archivos en nube. Prueba del motor real aprobada desde Vercel
con tres identidades simultaneas: edicion visible sin recargar, guardado DOCX
por callback firmado y conservacion de tabla, imagen, encabezado, pie y texto
de la segunda pagina. La IA pudo extraer el texto editado y el de la tabla
del DOCX guardado. El original comprimido permanecio intacto. Se verifico
visualmente el documento de prueba en el editor; esto no certifica paridad
visual con Microsoft Word para todos los documentos. Las 27 pruebas de
conexion, puente, biblioteca, nube y contexto de IA pasaron. Los datos de estas
pruebas permanecen en memoria; queda pendiente probar el guardado con una
cuenta real autorizada en el proyecto de Supabase.

Ejecutar `node tests/word-office.browser.mjs` despues de `node build.mjs`
para revisar la creacion desde biblioteca. Para verificar DOCX en el motor
real, ejecutar `node tests/onlyoffice-live.mjs` con `ONLYOFFICE_TEST_WORD=true`
y `ONLYOFFICE_TEST_FRONTEND=https://plataforma-integral-arles-demo.vercel.app`.
Esta ultima prueba usa un tunel separado y elimina unicamente sus copias
temporales al finalizar; no modifica el servidor publico ni Supabase real.

Integracion PowerPoint del 4 de octubre de 2026: creacion de PPTX desde la
biblioteca y regresion de creacion Word aprobadas en navegador local. Prueba
del motor real desde la publicacion candidata de Vercel con tres identidades
aisladas: edicion visible en los otros dos editores sin recargar y guardado
PPTX mediante callback firmado. El resultado conserva dos diapositivas,
tabla, imagen, grafico, transicion y notas; el original comprimido sigue
intacto. Se reviso visualmente la diapositiva editada. La IA extrae el texto
actualizado, la segunda diapositiva y las notas del borrador guardado.
El lector tambien se verifico con orden de diapositivas distinto del orden
de sus archivos, notas asociadas y referencias externas/XML corrupto.
Las 27 pruebas de puente, conexion, biblioteca, nube y contexto de IA pasaron.
Las pruebas usan autenticacion y almacenamiento aislados: sigue pendiente
validar el guardado con una cuenta real autorizada en Supabase. Estos
resultados no certifican compatibilidad visual con todas las presentaciones
de Microsoft PowerPoint.

`node tests/powerpoint-office.browser.mjs` verifica la creacion y el lector
de PPTX. Para probar el motor real, ejecutar `node tests/onlyoffice-live.mjs`
con `ONLYOFFICE_TEST_POWERPOINT=true` y `ONLYOFFICE_TEST_FRONTEND` apuntando
a la publicacion de Vercel que se va a validar. Opcionalmente,
`ONLYOFFICE_TEST_TUNNEL_URL` permite reutilizar un tunel aislado hacia el
servidor de pruebas 4184; el ejecutor no lo detiene cuando se proporciona
manualmente. Nunca utilizar para esto el tunel publico del servidor 4174.

Fuentes: [ONLYOFFICE Docker](https://helpcenter.onlyoffice.com/docs/installation/docs-community-install-docker.aspx),
[guardado](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/saving-file/),
[coedicion](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/co-editing/),
[Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
