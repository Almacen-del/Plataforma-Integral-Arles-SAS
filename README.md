# Espacio documental Arles SAS

## Estado actual y repositorio

El proyecto incorpora biblioteca documental, conexión a Supabase, personal y turnos, asistente de IA y lectores de PDF e imágenes. Word, Excel y PowerPoint se editan mediante la integración de ONLYOFFICE. La interfaz se publica en Vercel; el servidor de edición requiere su propio servicio disponible. El detalle de los motores actuales está en [docs/MOTORES_ACTUALES.md](docs/MOTORES_ACTUALES.md).

La preparación del repositorio y su conexión al proyecto existente de Vercel se describen en [docs/GITHUB_VERCEL.md](docs/GITHUB_VERCEL.md). El repositorio contiene código y recursos de la aplicación; no incluye la base de datos, archivos privados de usuarios, credenciales, copias de trabajo del editor ni informes generados.

Los apartados siguientes conservan la documentación histórica del prototipo inicial y no describen por sí solos el estado actual del sistema.

## Documentación histórica del prototipo

Prototipo local de interfaz, sin base de datos, autenticación ni servicios externos. Usa el logo original suministrado. No modifica Drive ni los cuatro proyectos operativos.

## Abrir

Con Node.js instalado, ejecutar `npm start` y abrir http://127.0.0.1:4173. El servidor escucha solo en el equipo local y sirve únicamente los archivos de la interfaz.

## Explorar

**Mover** permite navegar por Biblioteca, pero no usarla como destino. Solo se aceptan destinos dentro de ISO 9001-2015, Rainforest o Halal; las tres raíces permanecen fijas. La restricción se verifica tanto en el selector como en la operación de movimiento.

Cada carpeta y documento dispone de un menú **⋮ Editar** con Renombrar, Mover, Enlaces y Propiedades. Un clic selecciona; doble clic abre la carpeta o la vista previa. Con teclado, Espacio selecciona y Enter abre. Las flechas del árbol despliegan subcarpetas y la ruta superior permite volver a una ubicación.

Enlaces crea accesos en las carpetas elegidas sin copiar el original; desmarcar una ubicación elimina solo su enlace. Renombrar y mover conservan la identidad y sus referencias. Propiedades permite consultar los metadatos y editar la descripción. Las raíces no se pueden mover; se rechazan movimientos circulares, nombres repetidos en el mismo destino y estructuras de más de cinco niveles dentro de una raíz.

El menú **Aplicativos** contiene Almacén (`gestion-almacen-arles-sas.vercel.app`), Vivero (`maestro-web-liard.vercel.app`, aplicativo real en desarrollo) y Censo campo (`censos-arles.vercel.app`), abiertos en pestaña nueva. Mantenimiento taller todavía es un programa de escritorio: aparece sin enlace y con la indicación «Pendiente de migración a web». Estos accesos no integran datos ni implementan autorización por cargo; los sistemas de destino mantienen su propio acceso.

Biblioteca también incluye las raíces **Rainforest** y **Halal — حلال**, independientes de ISO. Cada una añade nueve carpetas y tres documentos ilustrativos, con rutas de cinco niveles. Al actualizar una biblioteca que ya tenía pruebas, se incorporan sin duplicar los ejemplos anteriores. La estructura no acredita certificación ni define requisitos oficiales. Limpiar pruebas conserva las tres raíces y las carpetas manuales dentro de su raíz correspondiente.

Biblioteca contiene la carpeta raíz **ISO 9001-2015**, disponible incluso sin cargar pruebas. Las carpetas guardadas con el diseño anterior se trasladan dentro de ella una sola vez, conservando sus identificadores y documentos. Los cinco niveles se cuentan dentro de esta raíz.

- **Crear pruebas** incorpora una biblioteca ficticia con 29 carpetas, diez documentos y rutas de hasta cinco niveles. No duplica el contenido si se pulsa otra vez.
- Navegar usando el árbol, las tarjetas o la ruta superior. Buscar en toda la biblioteca y filtrar documentos por estado.
- Seleccionar un documento para consultar detalles, versiones y actividad ilustrativas. La vista previa es texto de demostración, no un PDF, Word o Excel real.
- La hoja de seguridad aparece por referencia en varias áreas y mantiene una sola identidad y ubicación de origen.
- **Nueva carpeta** crea carpetas locales hasta el quinto nivel. Los favoritos conservan referencias, no copias.
- **Limpiar pruebas** elimina solo los ejemplos y conserva las carpetas manuales. Las carpetas manuales cuyo padre era una prueba pasan a la raíz.

La información se guarda en `localStorage` del navegador con la clave `arles-documental-prototipo-v1`. Si se bloquea o agota el almacenamiento, la interfaz avisa y funciona durante la sesión. Borrar los datos del navegador elimina estas pruebas; no es almacenamiento documental definitivo.

Esta es una **vista de diseño** de todos los procesos, no una cuenta de empleado. La autorización real por cargo y área deberá implementarse y verificarse en el servidor al conectar el sistema. Las áreas vinculadas del panel son propuestas visuales, no permisos efectivos.

## Verificación

`npm test`: jerarquía, límite de cinco niveles, referencias, generación idempotente y conservación de carpetas manuales al limpiar ejemplos.


## Turnos del personal
Ficha local con consolidado mensual, personal activo/inactivo, edición individual y por rangos, filtros, leyenda editable, historial de 100 acciones, deshacer durante la sesión y exportación CSV de la vista. No importa nombres ni registros del Excel. A: turno; D: descanso (amarillo); V: vacaciones; I: incapacidad; N: no asistió; P: permiso por urgencia; DP: descanso pendiente por compensar (naranja, etiqueta propia del prototipo). DP es una marca manual, no calcula saldos ni compensaciones automáticamente. Datos en localStorage, sin base de datos ni permisos reales. El historial no es auditoría autenticada. Crear pruebas añade solo personal ficticio.


## Gestión documental (prototipo local)
- Misma identidad documental en catálogo y Biblioteca, con vistas interna/externa, vigentes, revisión y obsoletos agrupados.
- Adjuntos locales hasta 10 MB en IndexedDB del navegador; metadatos e historial en localStorage. No se enviaron archivos a un servidor ni se publicó este cambio.
- Nueva versión queda en revisión; aprobar sustituye vigente conservando archivos anteriores. Rechazar conserva vigente; retirar conserva historial.
- Área responsable, código único, enlaces de carpetas y propuesta de permisos por cargo/usuario. No hay autenticación ni autorización real.
- Los registros diligenciados guardan el código y versión del formato de origen. No se reemplazan al actualizar el formato.
- Crear pruebas produce dos documentos ficticios, interno y externo, con versiones 01 obsoleta, 02 vigente y 03 pendiente (sin adjuntos reales).

## Pendientes, catálogos y mejoras
- Inicio muestra avisos enlazados a documentos, días de turnos y hallazgos; filtra datos manuales o ejemplos.
- Catálogos comparte el personal de Turnos y permite configurar áreas, cargos, prefijos y tipos. El registro de auditoría selecciona a los responsables del catálogo, sin autenticación real.
- Los documentos permiten revisión y vencimiento, comparación de metadatos/resúmenes, vista previa PDF/PNG/JPG y aprobación con fecha futura. La vigencia se activa al abrir la plataforma o durante la sesión, sin proceso externo.
- Las compensaciones enlazan origen y destino del mismo trabajador. Un destino no puede usarse dos veces; días enlazados se protegen hasta desvincular. Las compensaciones futuras no se cierran como cumplidas.
- Inconformidades y mejoras registra hallazgo, causa, evidencia adjunta o documental, responsable, acciones y verificación. El cierre exige acciones completadas y resultado eficaz.
- Cada ficha nueva incluye Crear pruebas. Pruebas centraliza un escenario completo y el restablecimiento, preservando registros manuales y sus dependencias; la auditoría no se borra.
- No se implementó exportación/importación de respaldos por instrucción del usuario. Continúa siendo una demostración con almacenamiento local del navegador.
