# Plataforma Integral: primera conexión a Supabase

## Alcance autorizado

Se añade persistencia de la plataforma al proyecto existente `dziwhbjyvxdbplthpazt`, de la organización Gestion Labores de Campo. La plataforma no tenía una base anterior: no se migraron datos locales ni se trasladaron censos. No se cambió el nombre del proyecto, las tablas `campo_*`, las credenciales/configuración del celular ni la configuración de Auth. Almacén (`gfgsnnweyfryfcqdnlvw`) no se modificó.

## Conexiones implementadas

| Componente | Destino y comportamiento |
|---|---|
| Cuenta | Supabase Auth existente, correo/contraseña; sesión del navegador con clave propia. Salir usa `scope: local`, sin cerrar sesiones del celular. |
| Autorización | `integral_members`, inicialmente el administrador activo de censos. Los trabajadores no reciben acceso automático. |
| Biblioteca, documentos, personal, turnos, catálogos y estado de módulos | `integral_state`; conserva la estructura JSON que utiliza cada módulo. |
| Word, adjuntos y recursos | Contenido e historial en estado; binarios en bucket privado `integral-files`. |
| Hojas | Estado de hojas creadas en plataforma; borrador XLSX y archivo original en almacenamiento privado. |
| PDF | Borrador, cambios y originales en almacenamiento privado. |
| Censos | Consulta directa de cantidades de registros FLORACION, FRUTOS y PRODUCCION según las políticas existentes; disponible en Cuenta y botón del asistente. No suma árboles ni frutos. |
| Auditoría de interfaz | Identidad autenticada en acciones manuales; cada fila de estado registra además `updated_by` en servidor. El historial JSON no es un registro inmutable de auditoría. |

El usuario abre **Conectar mi cuenta** e inicia sesión con el administrador ya autorizado. El espacio de nube comienza vacío; los borradores locales no se cargan automáticamente. Sin sesión continúa disponible la vista local. Para volver a leer cambios de otro dispositivo se recarga la página.

## Guardado y permisos

RLS en ambas tablas, sin acceso anónimo. Membresía visible únicamente al propio usuario, no editable desde el cliente. El espacio inicial es compartido por miembros autorizados; aún no hay permisos reales por área o documento. La pantalla de Usuarios y permisos sigue siendo una demostración y no otorga acceso a Supabase.

La función `integral_save_batch` usa transacciones y revisión esperada para impedir sobrescritura de versiones antiguas. Se conserva un diario local por usuario para cambios JSON pendientes; se puede descargar desde Cuenta. Un conflicto requiere conservar pendientes y resolverlo, no se fuerza sobrescritura automática. El archivo binario se sube primero con nombre nuevo y luego se referencia mediante revisión comprobada. Una descarga fallida impide guardar encima de ese archivo. Límite de cada objeto comprimido: 50 MB. No hay limpieza automática de versiones binarias antiguas.

Solo se incluye clave publicable en el cliente, nunca claves privilegiadas. Sesión e información pendiente permanecen en el almacenamiento del navegador; deben usarse cuentas/dispositivos adecuados para el acceso a datos.

## Límites que siguen pendientes

- La IA generativa y los conectores de almacén, vivero y taller no están conectados. Censos cuenta con consulta directa de registros, no interpretación de lenguaje natural ni escritura.
- Los flujos identificados como pruebas (aprobaciones, notificaciones e integraciones simuladas) conservan esa condición aunque su estado pueda persistirse.
- Es una primera capa de persistencia JSON, no una conversión completa a tablas relacionales de negocio, colaboración en tiempo real ni un sistema de permisos por módulo.
- La edición sin sesión sigue siendo local. No se ofrece arranque de nube sin internet ni sincronización offline de archivos binarios.
- El inicio de sesión final con la cuenta real queda a cargo del usuario; no se pidió ni utilizó su contraseña para pruebas.

## Verificación

- 8 pruebas específicas de nube: aislamiento local/nube, cola y reintento, conflictos, recuperación de pendientes, binarios/fechas y protección tras lectura fallida.
- 34 pruebas previas de modelos generales, 139 de hojas y 17 de PDF/OCR: aprobadas.
- Navegador: flujo general de hoja, importación/presentación XLSX, Word y PDF: aprobados.
- Navegador con backend simulado y sin datos reales: arranque autenticado, guardado/reapertura de hoja, consulta de censos identificada y binarios comprimidos: aprobado. No equivale a inicio de sesión real del usuario.
- Base real, transacción revertida: escritura autorizada, revisión 1 → 2, identidad de servidor, conflicto y reversión del lote completo; trabajador no autorizado rechazado. No quedaron registros de prueba.
- API real: lectura anónima de ambas tablas rechazada (401).
- Censos antes/después: 2.376 registros; resumen de contenido MD5 `b792832f54280af3553094a5c185853e` idéntico. No se modificaron sus datos.
- Asesor de seguridad: sin hallazgos nuevos; permanecen dos avisos previos: [pg_net en esquema public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) y [protección contra contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No se cambiaron ajustes de Auth compartidos.

Migración aplicada: `supabase/migrations/20261002123327_integral_platform_connection.sql`. Dependencia fijada: `@supabase/supabase-js@2.117.2`, con copia distribuida y licencia en `public/vendor`.

## Publicación verificada

Vercel producción `dpl_5Q58rSpHY5btvf6YRaefsdVLreQE`, estado READY, código `7264f3f`. URL: https://plataforma-integral-arles-demo.vercel.app/ . Prueba sobre URL pública: HTTP 200, carga del SDK real, formulario de acceso y apertura de hojas sin errores JavaScript. No se usaron credenciales reales ni se escribieron datos en esa prueba. Captura local privada: `tmp/platform-cloud-public-login.png`.
