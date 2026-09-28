# Plano documental y accesos — Arles SAS

Versión de propuesta: 0.1 · 12 de septiembre de 2026.

Base: solicitud del usuario, organigrama GE-CO-004 versión 010 aportado como imagen y estructura parcial de Drive observada en esta conversación. Este plano es un diseño para revisar; no crea carpetas en Drive, no concede permisos ni acredita conformidad.

## 1. Regla que organiza todo

**Un documento tiene una identidad, un proceso custodio y una versión vigente por ámbito de aplicación. Puede estar relacionado con muchos procesos y cargos sin copiarse.**

No crear repositorios por persona o cargo. El árbol maestro clasifica los documentos; “Mis documentos”, “Mi proceso”, “Mis tareas” y “Compartidos conmigo” son vistas del mismo repositorio. Un enlace no crea una copia ni concede acceso por sí solo.

La exclusividad de versión vigente se aplica a la misma identidad y ámbito: una instrucción específica de otra sede o producto puede ser un documento distinto, con identidad y alcance expresos. No mezclar instrucciones diferentes bajo un título genérico. Las traducciones y anexos deben tener relaciones controladas, sin competir como supuestas versiones independientes del mismo documento.

ISO 9001 permite adaptar la documentación a los procesos de la organización; no prescribe este árbol ni una carpeta por numeral. Mantener alcance, política, objetivos, controles y evidencias aplicables, con control de información documentada, es distinto de imponer una nomenclatura. [Guía oficial de información documentada](https://www.iso.org/files/live/sites/isoorg/files/archive/pdf/en/documented_information.pdf).

## 2. Árbol maestro propuesto

Los prefijos de navegación siguientes son nuevos y provisionales. **No sustituyen los códigos documentales existentes** ni significan que los procesos no visibles ya estén validados. Se conservarán nombres y rutas de origen en la migración.

Leyenda: `[O]` estructura observada parcialmente en Drive; `[P]` categoría propuesta; `[R]` acceso restringido; `↗` vista o enlace, sin copias.

```text
ARLES SAS — REPOSITORIO DOCUMENTAL ÚNICO
│
├── A. DIRECCIÓN Y SISTEMA DE GESTIÓN
│   ├── A1. Gestión estratégica [O]
│   │   ├── Contexto y partes interesadas
│   │   ├── Alcance del sistema y mapa de procesos
│   │   ├── Política y objetivos de calidad
│   │   ├── Organigrama y autoridades
│   │   ├── Planeación estratégica y cambios del sistema
│   │   └── Revisión por la dirección: resultados y compromisos
│   ├── A2. Control documental [P]
│   │   ├── Reglas de identificación, revisión y aprobación
│   │   ├── Clasificación, acceso, retención y disposición
│   │   ├── ↗ Catálogo maestro de documentos y registros
│   │   ├── ↗ Documentos externos por proceso custodio
│   │   └── Evidencias de distribución y retiro de versiones
│   ├── A3. Riesgos y oportunidades [P]
│   │   ├── Criterios de evaluación y seguimiento
│   │   ├── Registro único de riesgos y oportunidades
│   │   └── Acciones, responsables y seguimiento
│   └── A4. Evaluación y mejora [P]
│       ├── Auditorías: programa, ejecución y resultados
│       ├── No conformidades: expediente único por caso
│       ├── Oportunidades y planes de mejora
│       ├── Acciones correctivas y verificación de eficacia
│       └── ↗ Indicadores e informes de todos los procesos
│
├── B. PROCESOS OPERATIVOS
│   ├── B1. Gestión comercial [P]
│   │   ├── Requisitos y revisión de pedidos o contratos
│   │   ├── Especificaciones comerciales y cambios
│   │   ├── Atención de quejas y satisfacción
│   │   └── ↗ Entregas y casos de no conformidad relacionados
│   ├── B2. Producción de material vegetal — Vivero [O]
│   │   ├── Planeación y métodos de producción
│   │   ├── Materiales, lotes y trazabilidad
│   │   ├── Labores, controles y registros de producción
│   │   ├── Verificación, liberación y despacho
│   │   └── ↗ Insumos, hojas de seguridad y fichas técnicas
│   ├── B3. Plantación y labores de campo [P]
│   │   ├── Planeación y órdenes de labor
│   │   ├── Lotes y ubicaciones
│   │   ├── Conteo y censo: jornadas, registros y validación
│   │   ├── Sanidad y labores ejecutadas
│   │   ├── Apiario: documentación operativa por confirmar
│   │   └── ↗ Maquinaria, consumos y documentos técnicos
│   └── B4. Poscosecha [O]
│       ├── Recepción y trazabilidad
│       ├── Métodos y controles operativos
│       ├── Verificación y liberación
│       └── Conservación, entrega y registros
│
├── C. PROCESOS DE APOYO
│   ├── C1. Compras y proveedores [P]
│   │   ├── Requisitos y solicitudes de compra
│   │   ├── Selección, evaluación y seguimiento
│   │   ├── Órdenes, contratos y comunicaciones [R según caso]
│   │   └── ↗ Recepciones y documentos de producto
│   ├── C2. Gestión de almacenamiento [O]
│   │   ├── Recepción, almacenamiento y entrega
│   │   ├── Existencias, movimientos y conciliaciones
│   │   ├── Lotes, seriales y vencimientos aplicables
│   │   ├── Documentación técnica de productos
│   │   │   └── Producto identificado
│   │   │       ├── Hoja de seguridad: identidad documental propia
│   │   │       └── Ficha técnica: identidad documental propia
│   │   └── ↗ Proveedores, solicitudes y casos de calidad
│   ├── C3. Mantenimiento y taller [P]
│   │   ├── Equipos y hojas de vida
│   │   ├── Planes de mantenimiento y órdenes de trabajo
│   │   ├── Intervenciones, fallas y verificación de entrega
│   │   ├── Recursos de medición: controles aplicables
│   │   └── ↗ Repuestos, consumos y manuales de fabricante
│   ├── C4. Gestión humana [P]
│   │   ├── Perfiles y competencias requeridas
│   │   ├── Formación y evaluación de competencia
│   │   │   └── Registro de capacitaciones líderes [O, origen separado]
│   │   ├── Expedientes de personal [R]
│   │   └── ↗ Organigrama y documentos de trabajo por cargo
│   ├── C5. Seguridad y salud en el trabajo — SGSST [P]
│   │   ├── Controles, instrucciones y evidencias aplicables
│   │   ├── Expedientes de acceso restringido [R]
│   │   └── ↗ Hojas de seguridad, equipos y capacitación
│   ├── C6. Administración y finanzas [P, R]
│   │   ├── Planeación y controles administrativos
│   │   ├── Registros contables y financieros
│   │   └── ↗ Compras y movimientos autorizados para conciliación
│   ├── C7. Asuntos jurídicos y gobierno [P, R]
│   │   ├── Documentación societaria y asesoría
│   │   └── ↗ Contratos y expedientes autorizados
│   └── C8. Tecnología y continuidad [P, R]
│       ├── Configuración y cambios de la plataforma
│       ├── Administración de identidades y accesos
│       ├── Integraciones y conciliación de datos
│       ├── Recuperación y evidencias de pruebas
│       └── ↗ Bitácora protegida y eventos administrativos
│
└── VISTAS TRANSVERSALES ↗ (no almacenan copias)
    ├── Mis documentos vigentes / por cargo y proceso
    ├── Mis tareas / revisión / aprobación / diligenciamiento
    ├── Formatos disponibles
    ├── Registros por fecha, proceso, lote, equipo o responsable
    ├── Hojas de seguridad y fichas técnicas
    ├── Indicadores, informes y resúmenes
    ├── Evidencias por requisito ISO
    └── Historial autorizado / versiones / trazabilidad
```

Las ramas internas son propuestas de contenido, no hallazgos sobre archivos de Drive. SGSST, finanzas y asuntos jurídicos se incluyen por la plataforma integral y el organigrama; ISO 9001 no convierte este plano en una evaluación de sus obligaciones específicas. Compras, Poscosecha, calidad y tecnología requieren designar custodios: no se asignan cargos nuevos como si ya existieran.

El diseño y desarrollo, si resulta aplicable al alcance de Arles, tendrá su expediente en el proceso que lo ejecute, con entradas, controles, salidas y cambios. Su aplicabilidad se resolverá al definir el alcance, sin excluirlo por anticipado ni crear una carpeta vacía como evidencia.

## 3. Organización uniforme dentro de cada proceso

Las siete categorías vistas en Drive son un punto de partida. La plataforma conservará su correspondencia, pero evitará mezclar tipo documental, tema y estado en el mismo nivel.

| Vista interna del proceso | Contenido | Relación con Drive |
| --- | --- | --- |
| 01. Definición y responsabilidades | Caracterización, alcance del proceso, autoridades y relaciones | Caracterización |
| 02. Documentos de trabajo | Políticas del proceso, manuales, procedimientos, instrucciones y especificaciones | Manuales / documentación corporativa, según contenido |
| 03. Planes y programación | Actividades previstas, responsables y criterios | Planes |
| 04. Matrices y controles | Matrices propias o vistas del registro transversal correspondiente | Matrices |
| 05. Formatos | Plantillas autorizadas; todavía sin diligenciar | Formatos |
| 06. Registros y resultados | Evidencias de operaciones e informes emitidos | Registros / documentación corporativa, según contenido |
| 07. Referencias vinculadas | Documentos de otros procesos y externos que este proceso utiliza | Enlaces al custodio, nunca copias |

Las carpetas temáticas del árbol y estas categorías son dos vistas del mismo catálogo. Por ejemplo, “Vivero / Despacho / Formatos” y “Vivero / 05. Formatos” muestran las mismas identidades documentales. No se crean físicamente ambas estructuras con archivos replicados. No activar categorías vacías sin necesidad del proceso.

Los estados —borrador, en revisión, vigente, sustituido, retirado— son atributos. El historial cuelga del documento; no se maneja una carpeta “Obsoletos” con copias desconectadas.

## 4. Documento, versión, formato y registro

| Objeto | Regla de identidad y uso |
| --- | --- |
| Documento controlado | Identificador estable, proceso custodio y enlace permanente. Conserva su código existente si está validado. |
| Versión | Contenido y metadatos aprobados de una identidad documental. Tiene autoría, revisión, aprobación y fecha de entrada en vigor. |
| Formato | Documento de tipo plantilla. “Diligenciar” crea un registro nuevo, no otra plantilla. |
| Registro | Evidencia de una operación concreta, con identificador propio y referencia a la versión de formato usada. |
| Documento externo | Archivo del emisor, fuente y revisión identificadas; Arles controla su aceptación para uso, no altera el original del fabricante. |
| Informe emitido | Resultado con fecha de corte, fuentes y reglas de cálculo; se conserva cuando constituye evidencia. |
| Resumen o tablero | Vista de fuentes autorizadas. Si se emite formalmente, se registra la versión y el corte que sustentan sus conclusiones. |

Publicación propuesta: borrador → revisión → aprobación → programación de vigencia, si procede → vigente. Hasta la entrada en vigor de la nueva versión, la anterior sigue siendo la vigente. La activación cambia de forma indivisible la referencia vigente y el estado anterior. No se modifica directamente el contenido aprobado: se abre una revisión.

El enlace “consultar vigente” muestra la versión aplicable hoy. El enlace de evidencia “versión utilizada” muestra siempre la versión empleada en esa operación. Si el documento se retira sin sustituto, mostrar su estado; no servir silenciosamente la última versión retirada como vigente.

Dos usuarios pueden colaborar en un borrador bajo control de edición o detección de conflictos. La publicación debe impedir que dos revisiones se activen simultáneamente para la misma identidad y ámbito. Una anulación o corrección de registro conserva el original y su motivo.

Los respaldos y las versiones históricas son conservación controlada; no son documentos vigentes adicionales. Una descarga o impresión debe identificar código, versión, fecha y forma de verificar vigencia; su existencia fuera de la plataforma no permite garantizar que se actualice automáticamente.

## 5. Matriz inicial por cargo

Todos los accesos siguientes son propuestas, no autorizaciones efectivas. “Gestionar” significa preparar documentos y operar registros dentro del proceso; no incluye aprobar, borrar históricos o cambiar permisos. La facultad de aprobación se asigna por tipo documental y alcance en una matriz separada. Solo las políticas y documentos internos expresamente distribuidos a toda la organización serán visibles a todos los usuarios internos activos.

| Cargo u órgano de la imagen | Área principal de trabajo propuesta | Documentos enlazados y límites |
| --- | --- | --- |
| Junta Directiva | Gobierno y decisiones estratégicas | Informes y expedientes expresamente elevados; sin acceso automático a todo el repositorio. |
| Gerencia General | Estrategia y revisión por la dirección | Resultados, compromisos y documentos según autoridad; acceso a expedientes sensibles definido aparte. |
| Asesoría Jurídica | Asuntos jurídicos asignados | Contratos y casos remitidos; consulta limitada por expediente. |
| Revisoría Fiscal | Evidencias dentro de su encargo | Consulta de finanzas y soportes pertinentes; sin editar registros operativos. |
| Gerencia Adm. y Finan. | Administración y finanzas | Compras, almacén, mantenimiento y gestión humana según función; no acceso indiscriminado a información reservada. |
| Coordinador Gtion Humana | Gestión humana | Perfiles, formación y organigrama; expedientes por autorización. |
| Coordinador Contable y F. | Contabilidad y finanzas | Recepciones, movimientos y compras para conciliación; no modificar existencias desde soportes contables. |
| Coordinador SGSST | SGSST | Hojas de seguridad, manuales de equipos y formación relacionada; acceso sensible restringido. |
| Jefe de Mant. | Mantenimiento y taller | Manuales, repuestos, solicitudes y consumos; aprobación por asignar. |
| Aux. de Mant. | Órdenes e intervenciones asignadas | Instrucciones y equipos pertinentes; registrar trabajo sin modificar manuales aprobados. |
| Asistente de Almacén | Almacenamiento | Compras, solicitudes, hojas de seguridad y fichas técnicas; acceso comercial o financiero solo si corresponde. |
| Auxiliar Cont. y admin. | Tareas administrativas y contables asignadas | Soportes necesarios para cada tarea; sin autoridad general de aprobación. |
| Aux. de Serv. Gen. | Instrucciones y registros de tareas asignadas | Seguridad y formación pertinente; sin acceso general a expedientes administrativos. |
| Junta Agronómica | Criterios y planeación agronómica | Resultados de vivero y campo; revisión técnica por asignación, sin presumir una jerarquía de permisos. |
| Director de Vivero | Producción de material vegetal | Especificaciones, insumos, despachos y formación de su equipo. |
| Asistente de Viveros | Planeación y seguimiento operativo delegado | Formatos, lotes y documentos técnicos del vivero. |
| Auxiliares de Viveros | Labores y registros asignados | Instrucciones vigentes y seguridad aplicable; sin editar plantillas. |
| Director de Plant. | Plantación y campo, interpretación por confirmar | Planeación, censo y resultados; nombre completo y atribuciones pendientes. |
| Jefe de campo | Ejecución y seguimiento de campo | Órdenes, censo, equipos e insumos relacionados. |
| Tractoristas | Órdenes y registros asignados | Instrucciones del equipo y seguridad; solicitudes de mantenimiento vinculadas. |
| Gestores de Sanidad | Controles y registros de sanidad asignados | Hojas de seguridad, fichas y criterios técnicos autorizados. |
| Aux. de Campo | Labores y capturas asignadas | Formatos e instrucciones de trabajo; validación final por responsable designado. |
| Aux. de Apiario | Operaciones de apiario asignadas | Documentación técnica y seguridad pertinente; alcance por confirmar. |
| Gerencia Comercial | Gestión comercial | Especificaciones y disponibilidad autorizada; entregas y quejas relacionadas. |
| Asistente de ventas | Pedidos y atención asignados | Fichas destinadas a clientes y estado autorizado de pedidos; sin información técnica o personal reservada. |

Figuras funcionales pendientes: custodio de calidad y control documental, responsable de compras, responsable de Poscosecha y administrador de plataforma. Podrán asignarse a cargos existentes mediante decisión expresa. No se inventan puestos ni se identifica calidad con SGSST.

## 6. Cómo se enlazan varios cargos sin duplicar

### Caso A: hoja de seguridad de un producto

```text
C2. Almacenamiento / Documentación técnica / Producto identificado
└── Hoja de seguridad — UNA identidad y su historial
    ├── ↗ Asistente de Almacén: preparar actualización y consultar
    ├── ↗ Coordinador SGSST: revisar contenido técnico y consultar
    ├── ↗ Director de Vivero: consultar si el producto corresponde
    ├── ↗ Gestores de Sanidad: consultar si tienen uso autorizado
    └── ↗ Jefe de campo: consultar según labores y productos asignados
```

Ejemplo de reparto propuesto, sujeto a designación: Almacén custodia el archivo recibido; SGSST y responsables técnicos revisan lo pertinente; una autoridad designada acepta la revisión externa para uso. Ninguno reescribe el documento original del fabricante. Los cinco accesos apuntan al mismo identificador.

### Caso B: solicitud de repuesto

Taller crea una solicitud con identificador propio. Almacén atiende desde una vista del mismo caso. Compras, si interviene, vincula su orden; contabilidad vincula el soporte pertinente. La solicitud, la orden, el movimiento y el soporte son hechos diferentes relacionados entre sí, no cuatro copias de un mismo documento. Cada uno tiene su propietario y permisos de escritura.

### Caso C: no conformidad de un despacho

La no conformidad tiene un único expediente en A4 y enlaces al despacho y al proceso de origen. Comercial registra la queja en su caso de atención, y enlaza la no conformidad si corresponde. Vivero o Almacén aportan evidencias desde el mismo expediente de calidad. Los planes muestran las acciones del caso por referencia; no replican sus fechas o estados en otra hoja editable.

### Caso D: capacitación compartida

La evidencia de una misma sesión se conserva una vez bajo Gestión Humana. Vivero, Campo y SGSST acceden a su evidencia autorizada. La evaluación de competencia individual puede ser otro registro relacionado y restringido. Una sesión distinta constituye otra evidencia, aunque use el mismo formato.

## 7. Reglas de acceso sin contradicciones

1. El acceso efectivo combina usuario activo, rol funcional, proceso/sede asignados, clasificación del documento y acción solicitada. Un enlace o pertenecer a una carpeta no vence una restricción del documento.
2. Distinguir consultar vigente, consultar histórico, descargar, diligenciar, preparar borrador, revisar, aprobar, publicar, corregir registros y administrar accesos. Evitar permisos genéricos de “editar todo”.
3. Vincular un documento a otro proceso es una relación de uso. Conceder permiso es una operación diferente, explícita y trazable.
4. La restricción de un expediente prevalece sobre permisos amplios del proceso. La búsqueda, vistas, notificaciones, informes y resúmenes deben respetar el mismo control, incluyendo títulos y fragmentos.
5. Los cargos superiores no heredan todo el acceso de sus subordinados. Las asignaciones acumuladas y suplencias se revisan frente a restricciones y separación de funciones.
6. Cambiar de cargo retira asignaciones anteriores y aplica las nuevas, salvo excepciones expresas con vigencia. El cambio no borra autorías anteriores.
7. Cada documento tendrá custodio y autoridad de aprobación identificables. El custodio no es automáticamente el aprobador; si se permite autoaprobación para algún caso, la regla deberá quedar expresa.
8. Administrar técnicamente la plataforma no autoriza a aprobar contenido. Las intervenciones privilegiadas y los cambios de permisos dejan evidencia protegida.
9. Retirar acceso debe impedir aperturas posteriores desde enlaces guardados; las descargas ya entregadas tienen el límite indicado en la sección 4.
10. No se crean credenciales compartidas por cargo. Se asignan roles a cuentas individuales o identidades de servicio identificadas.

## 8. Catálogo maestro: datos mínimos

| Grupo | Campos propuestos |
| --- | --- |
| Identidad | ID estable, código validado, título, tipo, idioma y ámbito. |
| Clasificación | Proceso custodio único, categoría, temas, procesos usuarios y relaciones con producto/equipo/lote cuando proceda. |
| Responsabilidad | Custodio, autoría, revisores y autoridad de aprobación por alcance. |
| Control | Estado, versión vigente, revisiones históricas, motivo del cambio y fecha efectiva. |
| Acceso | Clasificación, permisos por acción, grupos autorizados y excepciones con vigencia. |
| Origen | ID y ubicación originales de Drive, emisor externo, revisión del fabricante y fecha de recepción cuando se conozcan. |
| Evidencia | Registro de aprobación, referencias a versiones utilizadas y eventos de auditoría. |
| Conservación | Regla de retención validada, disposición autorizada y bloqueos de eliminación aplicables. |

No usar el nombre del archivo como identidad única. Detectar posibles duplicados por identificador de origen, código, revisión, emisor y contenido. Un hash igual ayuda a detectar archivos idénticos, pero no decide si dos registros de operaciones distintas deben fusionarse. Documentos con igual título y distinto producto o alcance no se fusionan automáticamente.

## 9. Cruce inicial con ISO 9001:2015

Este índice es orientativo; no sustituye la matriz requisito por requisito contra la edición aplicable. Las ubicaciones son decisiones de Arles. [Guía ISO](https://www.iso.org/files/live/sites/isoorg/files/archive/pdf/en/documented_information.pdf).

| Referencia | Ubicación de control o evidencia |
| --- | --- |
| 4.3–4.4, 5.2, 6.2 | A1: alcance, procesos, política y objetivos. |
| 7.5 | A2 y control transversal de cada documento. |
| 7.1.5, 7.2 | C3 y C4: medición y competencia, según corresponda. |
| 8.2–8.4 | B1, proceso de diseño si aplica y C1. |
| 8.5–8.7 | Procesos operativos: trazabilidad, cambios, liberación y salidas no conformes. |
| 9.1–9.3 | Resultados de procesos, A4 y A1. |
| 10.2 | A4: no conformidades, acciones y resultados. |

La matriz definitiva añadirá aplicabilidad, control, responsable, evidencia, estado y brecha, referenciando el documento original. “Evidencias ISO” será una vista, no otra carpeta con copias de los mismos archivos. La edición 2026 y su transición deben verificarse al cerrar la base normativa, como se registra en el plan maestro.

## 10. Comprobaciones del diseño antes de implementar

| Situación | Resultado exigido |
| --- | --- |
| Tres cargos abren una hoja de seguridad vigente | Mismo ID y misma versión aplicable; sin tres archivos independientes. |
| Se publica una nueva revisión | Las vistas de vigentes cambian conjuntamente; las evidencias antiguas mantienen su versión. |
| Se comparte un enlace sin permiso | No permite abrir ni expone metadatos restringidos. |
| Un operador diligencia un formato | Se crea un registro; la plantilla aprobada no cambia. |
| Un registro cerrado requiere corrección | Quedan versión anterior, motivo y responsable. |
| Un usuario cambia de cargo | Pierde accesos anteriores no conservados expresamente; historial intacto. |
| Dos personas intentan publicar revisiones distintas | No pueden quedar dos versiones vigentes para la misma identidad y ámbito. |
| Un proceso muestra riesgos o acciones transversales | Consulta el registro central; no mantiene una segunda hoja editable. |
| Se migra el mismo archivo dos veces | La correspondencia de origen impide crear otra identidad por el reintento. |
| Se añade un proceso nuevo | Se añaden relaciones y permisos sin copiar documentos existentes. |

Estos son criterios de aceptación futuros; no se presentan como pruebas de software ya ejecutadas.

## 11. Incorporación de las carpetas pendientes

Antes de migrar cada documento: identificar su proceso custodio; decidir si es documento, formato o registro; contrastar código, alcance y revisión; buscar correspondencias existentes; conservar origen y relaciones; determinar accesos; validar contenido y vigencia con el responsable. Cuando haya discrepancias, dejarlo en revisión con acceso restringido y no declararlo vigente por la fecha del archivo.

Al recibir más permisos, incorporar las nuevas carpetas al inventario. Sus nombres y numeración no obligan a rehacer este plano: la clasificación y las vistas pueden ajustarse sin cambiar la identidad documental. No mover ni borrar originales de Drive durante el diagnóstico.

Pendientes que no impiden usar este plano como base: responsables de procesos no identificados, matriz real de aprobación, nombres abreviados del organigrama, acceso completo a Drive, alcance del sistema, retención y rutas de los cuatro proyectos.
