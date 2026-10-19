# ONLYOFFICE en Oracle para Arles

Preparacion del 3 de octubre de 2026. Este paquete configura el motor completo de
ONLYOFFICE Docs Community en una maquina ARM64. Todavia no esta desplegado en
Oracle ni conectado al guardado de la plataforma.

Verificacion local: estructura de Docker Compose valida, sintaxis Bash valida,
script con finales de linea Linux y rechazo del arranque sin secreto JWT.
Manifest ARM64 y ruta de arranque comprobados en la imagen oficial publicada.
No se ha iniciado esa imagen ni se han probado sesiones reales de colaboracion.

## Almacenamiento y acceso de la IA

El repositorio maestro de documentos, originales y versiones debe permanecer
en el bucket privado de Supabase de Arles. La IA obtiene los documentos desde
ese repositorio con los permisos de la plataforma. Esta decision se mantiene
al cambiar el proveedor del servidor que ejecuta ONLYOFFICE.

El servidor del editor procesa copias de trabajo y conserva caches y sesiones
segun su configuracion. El guardado devuelve el documento a Supabase y confirma
su persistencia antes de mostrar "Guardado en Arles". La IA debe consultar la
ultima version confirmada y su texto extraido, con su identificador de version,
para evitar responder sobre un original anterior a las modificaciones.

El proveedor del modelo de IA es una decision separada del origen documental.
Actualmente `api/assistant.js` prepara peticiones a Groq con los fragmentos
autorizados; guardar en Supabase por si solo no vuelve local la inferencia.
La lectura de borradores XLSX actualizados y el enlace de guardado del editor
siguen pendientes de implementacion.

## Otro VPS compatible en lugar de Oracle

Este motor puede ejecutarse en un VPS Linux propio de otro proveedor. Para
Intel/AMD con 8 GB RAM y disco suficiente, conservar los mismos parametros de
dominio y JWT y utilizar el complemento `compose.amd64.yaml`:

```sh
docker compose -f compose.yaml -f compose.amd64.yaml config --quiet
docker compose -f compose.yaml -f compose.amd64.yaml pull
docker compose -f compose.yaml -f compose.amd64.yaml up -d
docker compose -f compose.yaml -f compose.amd64.yaml ps
```

Ese complemento selecciona el digest AMD64 oficial y limita el contenedor a
6 GB de RAM para reservar memoria al sistema operativo. Los comandos de este
apartado deben usarse tambien para operaciones posteriores en ese VPS; el
archivo base por si solo sigue seleccionando ARM64 para Oracle Ampere.

Preparar este complemento no contrata alojamiento, crea una cuenta ni despliega
el servicio. La disponibilidad, el metodo de pago y el costo total del VPS
deben verificarse en el proveedor antes de contratarlo.

## Cuenta y servidor gratuito

Abrir https://cloud.oracle.com/ para comprobar si existe una cuenta. El registro
oficial esta en https://signup.cloud.oracle.com/. La identidad, la tarjeta y las
claves de acceso se introducen directamente en Oracle.

Crear una instancia en la region de origen, comprobando en la consola que los
recursos son **Always Free**. Configuracion prevista: Ubuntu ARM64, forma
`VM.Standard.A1.Flex`, 2 OCPU, 12 GB RAM y disco de arranque de 80 GB. Verificar
antes los recursos que ya utilice la cuenta: el limite gratuito es compartido.
Se requieren al menos 4 GB de swap y 40 GB de disco libre para el motor.

La documentacion consultada indica 2 OCPU y 12 GB RAM equivalentes gratuitos,
ademas de 200 GB de almacenamiento de bloques total, incluidos discos de
arranque. La capacidad regional puede agotarse y Oracle puede recuperar
instancias consideradas inactivas. Este alojamiento gratuito no tiene SLA.
No usar instancias de pago cubiertas temporalmente por el credito de prueba.

## Instalacion del motor

1. Instalar Docker Engine y el complemento Docker Compose en Ubuntu con las
   instrucciones oficiales: https://docs.docker.com/engine/install/ubuntu/.
2. Copiar esta carpeta al servidor. No contiene credenciales reales.
3. Preparar un nombre DNS real que apunte a la IP publica del servidor. Puede
   utilizarse un subdominio existente; no hay que comprar un dominio nuevo.
4. Permitir HTTP y HTTPS (puertos TCP 80 y 443) en la red de Oracle y comprobar
   el firewall del servidor. Limitar SSH (22) a la IP del administrador.
   Mantener PostgreSQL, RabbitMQ y Redis sin puertos publicos.
5. Crear `.env` a partir de `.env.example`, poner dominio y correo reales y
   generar el secreto JWT con `openssl rand -hex 32`. Guardarlo solo en `.env`
   del servidor y en el backend de la integracion. No compartirlo en el chat ni
   enviarlo al navegador. Aplicar `chmod 600 .env`.
6. Desde esta carpeta, validar e iniciar:

   ```sh
   docker compose config --quiet
   docker compose pull
   docker compose up -d
   docker compose ps
   ```

7. Comprobar `https://DOMINIO_REAL/healthcheck` y la carga de
   `https://DOMINIO_REAL/web-apps/apps/api/documents/api.js` desde el navegador.
   Confirmar el certificado HTTPS valido antes de abrir archivos reales.

El contenedor utiliza una imagen oficial 9.4.0 fijada por digest ARM64, JWT
habilitado, limites de CPU/memoria y volumenes persistentes. Su arranque activa
el ensamblado automatico con intervalo de un minuto. Ese intervalo inicia
guardados periodicos; la conversion y transferencia anaden tiempo, de modo
que no garantiza una copia en Supabase exactamente cada 60 segundos.

No ejecutar `docker compose down --volumes` con documentos en uso: elimina los
volumenes persistentes. Antes de actualizar, completar los guardados y hacer
copia de los datos y de la configuracion protegida. No exponer el ejemplo de
pruebas incluido en ONLYOFFICE como biblioteca de archivos de Arles.

## Conexion que falta construir en Arles

Vercel sigue alojando la interfaz, Oracle ejecuta ONLYOFFICE y Supabase conserva
las cuentas y los archivos. Instalar el motor por si solo no habilita el
autoguardado de nuestra biblioteca.

La plataforma actual usa el proyecto `dziwhbjyvxdbplthpazt`, con membresia en
`integral_members`, estado compartido en `integral_state` y objetos privados
comprimidos en `integral-files`. Su protocolo actual no expone archivos XLSX
directos ni recibe callbacks de ONLYOFFICE. No se han cambiado tablas, permisos
ni documentos reales para preparar este paquete.

La integracion debe implementar:

- Apertura desde la biblioteca en una pestaña nueva, con identidad validada de
  Supabase y acceso limitado a miembros autorizados. Comenzar con XLSX.
- Configuracion del editor firmada por el backend: modo de colaboracion `fast`,
  autoguardado habilitado, idioma español y una misma `document.key` para todas
  las personas que editan la misma sesion.
- Entrega del binario al motor mediante un enlace autorizado. El bucket permanece
  privado; no entregar al editor secretos de JWT o claves privilegiadas.
- Recepcion y validacion de callbacks JWT. Guardar los archivos recibidos en
  estado `6` (periodico/forzado) y `2` (final) en almacenamiento privado antes de
  confirmar el exito al motor. Reintentos idempotentes, revision comprobada y
  recuperacion ante errores. Conservar el archivo original y las versiones.
- Mantener la misma clave durante los guardados de estado `6`, incluso para
  nuevos usuarios que se unen. Renovarla despues de completar el guardado final
  de estado `2`, sin dividir una sesion activa en copias independientes.
- Un permiso de servidor especifico para esos callbacks. El mecanismo existente
  de guardado exige una identidad autenticada; no basta con cambiar a una clave
  privilegiada ni con confiar en la identidad enviada por el navegador.
- Mostrar "Guardado en Arles" solamente cuando el backend confirme que el archivo
  ya esta almacenado. Diferenciar cambios sincronizados con el motor de copias
  persistidas en Supabase. Señalar una desconexion sin afirmar que se guardo.

## Prueba de aceptacion antes de activar

Abrir una copia de un XLSX real con tres cuentas autorizadas distintas. Editar
celdas diferentes, comprobar actualizacion en vivo y persistencia mientras todos
siguen dentro. Incorporar una cuarta cuenta despues de un guardado periodico,
cerrar todas las sesiones y reabrir desde otro navegador. Comprobar formulas,
formatos, filtros y descarga del XLSX actualizado. Probar tambien reconexion,
rechazo de usuarios no autorizados y un fallo de guardado sin sobrescritura.

La documentacion actual recomienda Community para hasta 20 usuarios. Esto no
es una promesa de rendimiento de una VM gratuita: medir con nuestros archivos
y numero de editores. Community no incluye todas las prestaciones comerciales,
como los editores web moviles o la eliminacion de marca.

## Apariencia, licencia y fuentes

El paquete conserva el motor y la apariencia original por ahora. El tema de
Arles se incorporara despues de verificar apertura, colaboracion y guardado.
Community utiliza AGPLv3: conservar avisos y atribuciones, proporcionar el codigo
fuente correspondiente y publicar modificaciones del motor segun la licencia.
La documentacion de licencia exige conservar la marca de ONLYOFFICE. No se
promete una version sin marca ni compatibilidad absoluta con todas las funciones
de Microsoft Excel.

- Oracle Always Free: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Registro y condiciones: https://www.oracle.com/cloud/free/faq/
- Instalacion ARM64: https://helpcenter.onlyoffice.com/docs/installation/docs-community-install-docker-arm64.aspx
- Fuente y comparacion de ediciones: https://github.com/ONLYOFFICE/DocumentServer
- Version utilizada: https://github.com/ONLYOFFICE/DocumentServer/releases/tag/v9.4.0
- Arranque de la imagen oficial: https://github.com/ONLYOFFICE/Docker-DocumentServer
- Colaboracion: https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/co-editing/
- Guardado: https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/saving-file/
- Configuracion de servidor: https://api.onlyoffice.com/docs/docs-api/get-started/configuration/server-config/
- Licencia: https://helpcenter.onlyoffice.com/docs/faq/docs-community.aspx
