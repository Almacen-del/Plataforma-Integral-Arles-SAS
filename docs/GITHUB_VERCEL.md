# Repositorio y publicación en Vercel

Repositorio público: https://github.com/Almacen-del/Plataforma-Integral-Arles-SAS

Este repositorio reúne el código de la Plataforma Integral Arles SAS. Que el código sea público no da acceso a las cuentas, documentos privados o datos almacenados en Supabase. No se publican claves de servidor, archivos `.env`, sesiones, copias privadas del editor, informes generados ni archivos temporales. Las licencias y avisos de los componentes de terceros se conservan en sus carpetas.

## Instalación local

Se requiere Node.js 24 y npm. Desde la raíz:

```sh
npm ci
npm start
```

Abrir `http://127.0.0.1:4173`. Los servicios opcionales del editor y de compresión PDF se describen en `infra/onlyoffice-local/README.md` e `infra/pdf-tools/README.md`.

## Proyecto existente de Vercel

- Nombre: `plataforma-integral-arles-demo`.
- Sitio: https://plataforma-integral-arles-demo.vercel.app
- Directorio raíz: la raíz del repositorio.
- Comando de compilación: `node build.mjs`.
- Directorio de salida: `dist`.
- Configuración: `vercel.json`.

Conectar el repositorio al proyecto existente conserva sus dominios y variables de entorno. No es necesario crear otro proyecto ni copiar las claves al código. La conexión Git permite que Vercel compile los nuevos commits de la rama de producción configurada.

Los secretos de IA y del servidor de edición deben mantenerse en los ajustes de Vercel o en la configuración privada de sus servicios. `.env.example` es una plantilla sin credenciales. El cliente de Supabase usa una clave publicable; la autorización se verifica en el servidor y mediante las políticas de la base de datos.

ONLYOFFICE y la compresión de imágenes PDF necesitan sus servicios externos a Vercel. Subir el repositorio no sustituye su instalación ni convierte un túnel temporal en un servidor permanente.

## Comprobaciones

```sh
npm test
node build.mjs
```

La prueba de compresión PDF real necesita el servicio local de compresión disponible en `http://127.0.0.1:8089`. Las demás pruebas usan sus datos de prueba aislados. No utilizar registros de producción para validar cambios.
