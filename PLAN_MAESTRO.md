# Plataforma Integral Arles SAS

Estado: propuesta inicial para revisar con responsables de procesos. Fecha: 12 de septiembre de 2026. Este documento define el alcance; no constituye una plataforma implementada ni una evaluación de conformidad ISO. El usuario confirma que el sistema de gestión se estructurará desde cero, aprovechando la documentación existente.

## 1. Propósito y alcance

Centralizar operación, información documentada, responsabilidades, análisis y evidencias del sistema de gestión. La plataforma será la fuente principal una vez superadas las verificaciones de migración y aceptación. Google Drive se mantendrá durante la transición.

Interpretación inicial de los cuatro proyectos: almacén; vivero; conteo y censo; mantenimiento de taller. Confirmar esta distribución y las rutas de sus repositorios antes de diseñar integraciones.

## 2. Módulos propuestos

| Módulo | Funciones y evidencias |
| --- | --- |
| Inicio y pendientes | Tareas por usuario, aprobaciones, vencimientos, indicadores y accesos según permisos. |
| Administración | Usuarios, áreas, sedes, cargos, roles, suplencias con vigencia y reglas de acceso. |
| Gestión documental | Carpetas por proceso, búsqueda, códigos, propietarios, revisión, aprobación, versiones, distribución, consulta e históricos. |
| Formatos y registros | Plantillas versionadas, captura estructurada, validaciones y exportación fiel a los formatos suministrados. |
| Calidad | Contexto, partes interesadas, alcance, procesos, política, objetivos, riesgos, oportunidades y cambios. |
| No conformidades y mejora | Hallazgo, corrección, análisis de causa, acción correctiva, responsable, plazo, evidencia, evaluación de eficacia y cierre o reapertura. Diferenciar quejas, no conformidades y oportunidades. |
| Auditorías y revisión por la dirección | Programa, criterios, hallazgos, evidencias, compromisos, decisiones y seguimiento. |
| Competencias | Requisitos por cargo, capacitación y evidencias de evaluación de competencia. |
| Proveedores y clientes | Criterios y evaluaciones de proveedores; quejas y seguimiento de satisfacción según procesos aplicables. |
| Almacén | Integración de existencias, movimientos y controles ya presentes en el proyecto; conservar identificadores e históricos. |
| Vivero | Integración de lotes, labores, producción y despachos existentes, según datos reales. |
| Conteo y censo | Jornadas, ubicación, registros, validación y diferencias según el modelo del proyecto. |
| Taller | Equipos, órdenes, mantenimiento, repuestos, fallas y evidencias según el proyecto existente. |
| Hojas de seguridad y fichas técnicas | Documentos del fabricante vinculados al producto exacto, proveedor, idioma, revisión, fuente y estado de verificación. |
| Informes y análisis | Indicadores con fórmula, unidad, fuente, período, responsable, fecha de corte y acceso a registros de respaldo. |
| Trazabilidad | Consulta de eventos por usuario, entidad, fecha, proceso y operación; exportación autorizada. |

Las funciones operativas descritas son alcance propuesto, no afirmaciones sobre lo que ya existe en los cuatro sistemas.

## 3. Roles y reglas

Roles iniciales a validar: administrador técnico, dirección, responsable de calidad, líder de proceso, operador, auditor de consulta y usuario externo limitado.

Los permisos se definirán por acción y alcance: consultar, crear, editar borradores, revisar, aprobar, publicar, exportar, anular y administrar; restringidos por proceso, sede y clasificación documental. Ocultar un botón no sustituye verificar permisos en el servidor. El administrador técnico no recibe automáticamente autoridad para aprobar documentos de negocio.

Matriz detallada pendiente del organigrama. Denegación por defecto; acceso externo con caducidad; cambios de permisos auditados. Separación de autor y aprobador cuando lo determine el proceso, con excepciones expresas y registradas.

## 4. Documentos, carpetas y formatos

El diseño detallado del árbol, la relación entre cargos y documentos, y los criterios para evitar duplicados se desarrolla en [PLANO_DOCUMENTAL_Y_ACCESOS.md](PLANO_DOCUMENTAL_Y_ACCESOS.md). Es la propuesta 0.1; no concede accesos ni modifica Drive.

Organizar por procesos y tipos documentales; permitir vistas por área, sede o proyecto sin duplicar el archivo. Cada documento tendrá identificador estable, código si corresponde, título, proceso, responsable, clasificación, versión, estado, fechas y origen.

Flujo propuesto: borrador → revisión → aprobación → vigente → sustituido o retirado. Registrar devoluciones y motivos. La nueva versión conserva la anterior y su evidencia de aprobación. Un registro diligenciado mantiene la versión exacta de la plantilla utilizada; cambiar la plantilla no modifica registros históricos.

Las correcciones a registros finalizados deben dejar autor, motivo y valores anteriores. Definir retención y disposición por tipo documental con los responsables; no inventar plazos. Conservar originales, fórmulas, unidades, firmas existentes y apariencia de los formatos suministrados durante la conversión. Las aprobaciones internas no se presentarán como firmas digitales certificadas.

Para hojas de seguridad y fichas técnicas: no inferir vigencia por nombre de archivo ni inventar fechas de vencimiento. Conservar revisiones, procedencia y correspondencia con el producto; determinar requisitos técnicos y legales aplicables por separado.

## 5. Trazabilidad verificable

Catálogo obligatorio de eventos: accesos y rechazos, consultas de información protegida, descargas, exportaciones, creación, cambios, aprobación, anulación, permisos, importaciones, integraciones y operaciones administrativas.

Cada evento debe conservar identificador, fecha del servidor, actor humano o servicio, acción, entidad, resultado, motivo cuando aplique, cambios relevantes y correlación con la operación. Evitar contraseñas, tokens y copias innecesarias de información sensible en los registros.

Generar eventos desde el servidor y protegerlos contra edición por usuarios de operación. Vincular la escritura de negocio y su evento mediante transacción o mecanismo durable equivalente. Detectar fallos de registro. Las operaciones administrativas de infraestructura requieren registros de su proveedor o sistema; la bitácora de la aplicación por sí sola no cubre todos los accesos.

Definir límites comprobables: se registra la entrega o descarga realizada por la plataforma, pero no puede observarse lo que una persona haga con una copia fuera de ella. Retención, exportación y acceso a la bitácora quedan sujetos a políticas por acordar.

## 6. Integración técnica

Propuesta pendiente de inspeccionar los proyectos: portal web común, identidad central, API con autorización, base de datos transaccional, almacenamiento privado de archivos, procesamiento de importaciones e informes y bitácora protegida.

Integrar los sistemas mediante contratos y adaptadores; evaluar compatibilidad antes de elegir proveedor o reescribir módulos. Cada entidad tendrá un sistema propietario durante cada etapa. Conservar una tabla de correspondencias entre identificadores originales y centrales. Evitar dos fuentes simultáneas que puedan modificar el mismo dato sin reglas de resolución.

Las sincronizaciones deberán ser idempotentes, permitir reintentos y presentar errores para conciliación. No duplicar movimientos ni corregir saldos creando operaciones ficticias. Determinar necesidades sin conexión, dispositivos y conectividad antes de fijar arquitectura.

## 7. Migración desde Google Drive

1. Inventariar carpetas, archivos, propietarios, permisos, enlaces, documentos nativos, volúmenes y dependencias.
2. Clasificar información vigente, histórica y pendiente de revisión. Presentar duplicados candidatos sin eliminarlos automáticamente.
3. Definir correspondencia entre origen y destino, permisos y responsables. Determinar qué comentarios, versiones y funcionalidades de documentos nativos pueden preservarse y documentar limitaciones.
4. Preparar un piloto aislado; conservar identificadores de origen, originales y manifiesto de importación.
5. Verificar cantidades, apertura, contenido, permisos, enlaces y formatos. Comparar hashes para copias binarias; validar separadamente las conversiones.
6. Ejecutar aceptación con usuarios reales, conciliación de cambios desde el piloto y ensayo de recuperación.
7. Autorizar el cambio de fuente principal y el tratamiento posterior de Drive. No retirar accesos ni eliminar originales antes de esa aceptación.

La copia de seguridad y recuperación de esta plataforma requiere definir política, responsables y objetivos de recuperación; no hay programación ni eliminación automática autorizada por este documento.

## 8. Relación inicial con ISO 9001

Mapa orientativo basado en la estructura de 2015, sujeto a contraste con el texto autorizado de la norma y el alcance real de Arles:

| Apartado | Soporte propuesto |
| --- | --- |
| 4 — Contexto | Alcance, procesos, partes interesadas y cuestiones pertinentes. |
| 5 — Liderazgo | Política, responsabilidades, autoridades y evidencias de dirección. |
| 6 — Planificación | Riesgos, oportunidades, objetivos y planificación de cambios. |
| 7 — Apoyo | Competencias, recursos, comunicación e información documentada. |
| 8 — Operación | Controles operativos, proveedores, requisitos y tratamiento de salidas no conformes según aplicabilidad. |
| 9 — Evaluación | Indicadores, satisfacción, auditorías y revisión por la dirección. |
| 10 — Mejora | No conformidades, acciones correctivas y eficacia. |

Mantener una matriz versionada: edición de norma, requisito, aplicabilidad justificada, proceso, responsable, control, evidencia y brecha. Los flujos de software son decisiones de diseño; no todos son exigencias literales de ISO.

Consulta oficial realizada el 12 de septiembre de 2026: la página ISO presenta la edición 2026 en publicación y anuncia su sustitución de 2015 para el 16 de septiembre de 2026. La base inicial debe considerar ISO 9001:2015 y su enmienda climática de 2024, y revisar la nueva edición antes de cerrar requisitos. No se presupone ningún plazo de transición de certificación.

La plataforma facilita controles y evidencias; la conformidad requiere que los procesos se implementen y funcionen en la organización.

Fuentes oficiales:
- https://www.iso.org/standard/9001
- https://committee.iso.org/standard/88431.html

## 9. Secuencia de entrega y aceptación

1. Diagnóstico: inventario de fuentes, revisión de proyectos y formatos, mapa de procesos, matriz de permisos y brechas. Salida: alcance y arquitectura sustentados en evidencia.
2. Núcleo: acceso, permisos, documentos, versiones, aprobaciones y bitácora. Salida: piloto con un proceso y formatos reales, incluyendo pruebas de denegación de acceso.
3. Calidad: no conformidades, mejora, riesgos, auditorías e indicadores. Salida: caso completo desde hallazgo hasta verificación de eficacia.
4. Integraciones: incorporar un proyecto por vez. Salida: conciliación de registros, reintentos sin duplicación y responsabilidad de datos definida.
5. Migración gradual: lotes de documentos verificados y aceptación de usuarios. Salida: operación y recuperación probadas antes del cambio de fuente principal.
6. Informes y resúmenes: cálculos reproducibles y referencias al origen. Si se usa IA, identificar el resumen como generado, respetar permisos y someter conclusiones relevantes a revisión; nunca completar datos faltantes con invenciones.

No hay fechas, costos ni alojamiento comprometidos sin conocer usuarios, almacenamiento, operación y estado de los repositorios.

## 10. Información pendiente

- Rutas de los cuatro proyectos. Carpeta principal de Drive recibida y accesible: https://drive.google.com/drive/folders/1wuKxWNW4kQDK2CMh_W-iVBEtY4uJamHJ
- Formatos representativos originales y ejemplos diligenciados autorizados.
- Alcance del nuevo sistema de gestión y evaluación de la documentación existente. El usuario indicó estructurarlo desde cero.
- Procesos, responsables, sedes, cantidad de usuarios y terceros con acceso.
- Necesidades móviles y sin conexión; prioridades de la primera entrega.
- Restricciones de alojamiento, presupuesto, retención y recuperación.

Situación actual: carpeta local con repositorio Git sin aplicación. Se revisaron los elementos directos de la carpeta Drive suministrada y las subcarpetas inmediatas de cuatro procesos. No se ha realizado inventario recursivo, lectura de formatos, revisión de repositorios, migración ni publicación.

## 11. Diagnóstico inicial de las fuentes suministradas

La lista devuelta por Drive contiene cinco carpetas y un acceso directo: Gestión Estratégica, Producción de Material Vegetal, Gestión de Almacenamiento, Poscosecha, Registro de Capacitaciones Líderes y el acceso directo ISO 9001-2015. Este último no se ha resuelto ni leído. La lista describe lo visible para la cuenta conectada, no acredita totalidad de información de la empresa ni permisos completos.

El usuario confirma que existen muchas más carpetas y que su acceso actual está limitado a las visibles. Espera recibir acceso ampliado la próxima semana; todavía no hay una fecha confirmada ni se ha verificado esa habilitación. El inventario y el mapa documental actuales son parciales por permisos. No interpretar carpetas no visibles como procesos o documentos inexistentes.

Mientras se amplía el acceso, avanzar con la revisión de documentos disponibles, el catálogo de cargos, la propuesta de permisos y el diseño del núcleo común. Mantener extensibles los procesos y categorías. Al habilitarse las demás carpetas, ampliar el inventario, revisar relaciones y duplicados, ajustar el alcance y completar la matriz documental antes de cerrar el plan de migración. No fijar volumen total, costo de migración ni cobertura completa a partir de la muestra actual.

Almacenamiento y Material Vegetal tienen siete categorías: caracterización, manuales, planes, matrices, formatos, documentación corporativa y registros. Poscosecha añade documentos externos. Gestión Estratégica devuelve caracterización, matrices, documentación corporativa y políticas. Estos nombres permiten una primera clasificación, pero no prueban contenido, vigencia o conformidad.

Decisión de diseño: preservar esta clasificación de origen como metadatos y adaptar su presentación dentro de la plataforma. Incluir Poscosecha como proceso documental descubierto, sin convertirlo automáticamente en un quinto proyecto de software.

## 12. Organigrama de referencia y acceso

Fuente: imagen aportada por el usuario, ORGANIGRAMA GE-CO-004, versión 010, actualización 31 JUL 26. Es una referencia documental; falta comprobar vigencia contra el original controlado.

Cargos y órganos visibles:
- Junta Directiva, Asesoría Jurídica, Revisoría Fiscal y Gerencia General.
- Gerencia Administrativa y Financiera; coordinaciones de Gestión Humana, Contable y F., y SGSST; Jefe de Mantenimiento, Asistente de Almacén, Auxiliar de Mantenimiento, Auxiliar Contable y Administrativo y Auxiliar de Servicios Generales.
- Junta Agronómica; Director de Vivero, Asistente de Viveros y Auxiliares de Viveros; Director de Plant., Jefe de Campo, Tractoristas, Gestores de Sanidad, Auxiliares de Campo y Auxiliares de Apiario.
- Gerencia Comercial y Asistente de Ventas.

Las abreviaturas y relaciones gráficas ambiguas se deben contrastar con el original antes de registrar dependencias formales. No se identifica explícitamente un responsable de calidad en la imagen; su designación queda pendiente y no se asigna automáticamente a SGSST.

Separar cargo organizacional de rol de sistema. Propuesta de alcance: almacén para su asistente; taller para mantenimiento; vivero para su dirección y equipo; censo para campo según asignación; comercial para su información autorizada. Dirección tendría tableros según alcance aprobado, y órganos de revisión acceso de consulta a evidencias pertinentes. Son propuestas, no permisos otorgados.

Cada asignación debe definir proceso, sede, acciones, facultad de aprobación, suplencia y vigencia. Gestión Humana, información financiera y otros documentos restringidos requieren permisos explícitos; ocupar un cargo superior no implica acceso técnico irrestricto.
