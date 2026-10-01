# Pestaña Datos — entrega local del 30/09/2026

Se amplió la pestaña Datos de la plataforma siguiendo las capturas aportadas y la documentación oficial de Microsoft consultada en esta fecha. La verificación de interfaz se hizo en el navegador de la plataforma; no se inspeccionó una sesión nativa de Excel durante esta entrega.

Los cambios están en el proyecto local y no se han publicado en Vercel. Se conservan los documentos y libros del navegador; publicar código no migra esos datos. Archivo y Programador/macros permanecen excluidos.

## Herramientas implementadas

| Grupo | Comportamiento disponible |
| --- | --- |
| Obtener y transformar | Importar texto/CSV/TSV, JSON de registros o filas y XML de registros planos. UTF-8 o Windows-1252 para archivos de texto. Delimitador, encabezados, tipo general/texto/número/fecha ISO/lógico, vista previa y carga en otra hoja. Obtener datos HTTPS públicos que permitan CORS. Crear una consulta desde una tabla o rango del libro. Fuentes recientes y catálogo de conexiones disponibles. |
| Consultas y conexiones | Crear, editar, nombrar, describir, guardar, cargar y quitar consultas. Pasos de recorte, limpieza, conversión de tipo, filtrado, ordenación, selección de columnas, eliminación de duplicados, reemplazo, división y agrupación/agregación. Editar un paso conserva su posición. Anexar por encabezados o combinar por clave con unión izquierda/interna; la combinación ocurre después de los pasos existentes. Detectar ciclos entre consultas. Actualizar una consulta o todas, con Deshacer/Rehacer. Reemplazar la fuente de archivo seleccionándola de nuevo. |
| Ordenar y filtrar | A–Z/Z–A; hasta ocho niveles por valores, color directo de relleno/fuente o lista personalizada; mayúsculas y orientación por filas/columnas. Fórmulas y formatos viajan con sus filas/columnas. Filtros por columna con valores marcados, texto, comparaciones, intervalos, comodines, vacías, colores directos, superiores/inferiores, porcentaje y promedio. Flechas para un rango sin exigir estilo de tabla. Borrar y volver a aplicar. Filtro avanzado por rango de criterios: Y en una fila, O entre filas, registros únicos y copia sin sobrescribir. |
| Herramientas de datos | Texto en columnas delimitado o de ancho fijo, posiciones de corte, comillas, separadores consecutivos, destino y tipo con vista previa. Duplicados según las columnas elegidas, conservando la primera fila y sus asociaciones/formatos. Relleno rápido previo para palabra y mayúsculas/minúsculas. Validación ampliada y consolidación por posición o rótulos, con valores o fórmulas vinculadas entre hojas. |
| Validación | Cualquier valor, entero, decimal, lista literal o por rango/nombre, fecha, hora, longitud y fórmula personalizada. Entre/no entre, igual/distinto y desigualdades, con límites literales o fórmulas relativas. Omitir blancos, desplegable en la celda, mensaje de entrada y alerta de detención personalizada. Puede desactivarse el bloqueo y señalar posteriormente entradas no válidas. Sustituir/quitar una regla afecta solo al rango indicado. Fechas AAAA-MM-DD y horas HH:MM[:SS] se convierten a sus valores seriales bajo la regla correspondiente. |
| Análisis de hipótesis | Buscar objetivo con una variable numérica, límites, vista previa y aplicación explícita; una propuesta caducada debe recalcularse. Escenarios de hasta 32 celdas, mostrar/eliminar y resumen de resultados. Tablas de una o dos variables en otra hoja, como instantáneas de resultados. Las vistas previas no cambian las celdas originales ni sus resultados manuales. |
| Previsión | Cronología numérica y valores; proyección mediante regresión lineal, periodos/paso y vista previa; nueva hoja con datos históricos, proyección y gráfico editable. El método aparece identificado como lineal. |
| Esquema | Grupos de filas/columnas separados o anidados, hasta ocho niveles, botones +/−, mostrar/ocultar detalle, desagrupar y borrar esquema. No modifica la ocultación manual. Impresión y SUBTOTALES(101–111) respetan los grupos contraídos. Subtotales por cambios de categoría en otra hoja, con fórmulas, grupos y total general que excluye subtotales anidados. |
| Análisis | Estadística descriptiva por columnas, matriz de correlación/covarianza poblacional, regresión lineal simple, histograma, media móvil y muestra sistemática. Vista previa y resultados en otra hoja. Exportación CSV existente con valores. |

## Conservación y actualización

- Las importaciones mantienen códigos como `0012`; las entradas externas que empiezan por `=` se guardan como texto. Los encabezados vacíos/repetidos se completan y se distinguen. Se rechazan archivos de más de 2 MB, objetos JSON anidados, XML anidado/entidades y resultados que excedan A1:Z100.
- Las cargas comprueban contenido, protección, combinaciones, matrices dinámicas y validación. Una consulta no sobrescribe su origen ni un resultado que el usuario haya editado. Al reducir el resultado se limpian únicamente sus celdas sobrantes. Cambiar una fuente no sustituye el archivo original.
- La actualización de rangos vuelve a leer el libro; la de archivos utiliza la copia importada hasta volver a seleccionar el archivo; la de direcciones web vuelve a consultar la URL al pulsar Actualizar. No se envían celdas del libro al servidor de origen. No hay actualización remota automática al abrir ni intervalos en segundo plano.
- El conjunto de una actualización se registra como una acción reversible. Si falla una carga, la transacción del editor restaura el libro. El guardado persiste consultas, pasos, reglas, escenarios y esquema en el navegador.
- Insertar/eliminar filas o columnas remapea rangos de consultas, destinos, escenarios, esquema y fórmulas de validación. Un cambio del número de columnas del origen exige revisar/restablecer los pasos de la consulta. Una celda eliminada invalida su escenario. Los filtros avanzados se descartan tras cambios estructurales para no conservar criterios desalineados. Renombrar hojas mantiene sus fórmulas calificadas.

## Diferencias y pendientes frente a Excel

Esta entrega no implementa el motor completo de Power Query, Power Pivot, el lenguaje M, DAX ni todos los conectores de Excel. Las capacidades disponibles tienen una implementación propia en la plataforma.

| Área | Pendiente o límite explícito |
| --- | --- |
| Orígenes externos | XLSX externo nativo, carpetas, SQL/Access, ODBC/OLE DB, Azure, SharePoint, OData, servicios autenticados y lectura OCR desde imagen. No hay credenciales de conexión ni autorización empresarial configurada. |
| Tipos de datos | Cotizaciones y Geografía requieren proveedor/licencia; sus botones están deshabilitados. Tampoco se incluyen tipos empresariales conectados a Microsoft 365. |
| Consultas | No todas las transformaciones, expresiones M, privacidad de Power Query, actualización en segundo plano, programación de intervalos, carga al modelo DAX ni todas las clases de uniones. La selección del tipo en importación es global; se pueden cambiar tipos por columna en el editor de consultas. |
| Ordenación/filtros | Colores directos de celda; no el color visual derivado de formato condicional ni conjuntos de iconos. No menús completos de agrupación de fechas por año/mes/día ni criterios avanzados calculados por fórmula. Los operadores numéricos pueden aplicarse a seriales de fecha. |
| Texto/duplicados | Separador de un carácter o cortes de ancho fijo; no combinación arbitraria de delimitadores. Quitar duplicados compacta el rango seleccionado, sin eliminar filas completas ajenas. Requiere valores en ese rango. Ordenar matrices dinámicas exige convertirlas a valores. |
| Validación | Detención o bloqueo desactivado; no confirmaciones de estilo Advertencia/Información de Excel. No se interpreta todo texto regional de fechas ni rangos de columnas completas. Las reglas nuevas no cambian automáticamente los datos existentes; se pueden señalar los inválidos. |
| Hipótesis | Buscar objetivo numérico con una variable y límite de iteraciones; puede no encontrar soluciones de modelos discontinuos o no lineales. Tablas y resúmenes de escenario son instantáneas y deben regenerarse. Solver y tablas nativas vinculadas de recálculo están pendientes. |
| Previsión | Regresión lineal disponible. El método estacional ETS, sus intervalos y diagnósticos propios de Excel están pendientes; no se presenta una línea como si fuera ETS. |
| Esquema/subtotales | Grupos manuales y subtotales en otra hoja; no Autoesquema, reemplazo de subtotales in situ ni toda la configuración nativa de símbolos/resúmenes. |
| Herramientas para análisis | No ANOVA, pruebas t/F/z, Fourier, regresión múltiple, generación aleatoria ni todas las variantes del complemento ToolPak. La covarianza implementada utiliza divisor N; la varianza descriptiva utiliza N−1. |

Se conserva el área A1:Z100 y el modelo propio del libro. No equivale a compatibilidad completa con Excel ni con XLSX/ECMA-376/OpenDocument.

## Fuentes de referencia

- [Power Query en Excel](https://support.microsoft.com/es-es/excel/about-power-query-in-excel) y [asistente de importación de texto](https://support.microsoft.com/es-es/excel/text-import-wizard).
- [Criterios de filtro avanzado](https://support.microsoft.com/en-us/excel/filter-by-using-advanced-criteria) y [validación de datos](https://support.microsoft.com/en-gb/excel/get-started/apply-data-validation-to-cells?nochrome=true).
- [Consolidar datos](https://support.microsoft.com/en-us/excel/consolidate-data-in-multiple-worksheets) y [análisis de hipótesis](https://support.microsoft.com/en-us/excel/introduction-to-what-if-analysis).
- [Tablas de datos](https://support.microsoft.com/en-us/excel/calculate-multiple-results-by-using-a-data-table), [escenarios](https://support.microsoft.com/en-US/Excel/switch-between-various-sets-of-values-by-using-scenarios) y [previsión de Excel/ETS](https://support.microsoft.com/en-us/excel/create-a-forecast-in-excel-for-windows).
- [Esquema de filas y columnas](https://support.microsoft.com/en-us/excel/outline-group-data-in-a-worksheet), [subtotales](https://support.microsoft.com/en-us/excel/insert-subtotals-in-a-list-of-data-in-a-worksheet) y [Herramientas para análisis](https://support.microsoft.com/en-us/excel/use-the-analysis-toolpak-to-perform-complex-data-analysis).

## Verificación y archivos

Resultado: **96 pruebas del motor de hojas + 34 generales/documentales = 130 pruebas**, **14 recorridos de navegador**, compilación y revisión de espacios aprobados. Los recorridos anteriores de Inicio, Insertar, Disposición de página y Fórmulas también pasan. No se detectaron excepciones JavaScript en los recorridos finales.

22 pruebas nuevas de modelo cubren importación/fidelidad, límites, ordenación, matrices, filtros compartidos con SUBTOTALES, criterios Y/O, duplicados, validación, consultas, ciclos, cargas protegidas, actualización, hipótesis, escenarios, consolidación, grupos, subtotales, análisis y cambios estructurales.

Los dos recorridos nuevos de navegador comprueban Datos, operaciones y guardado/reapertura; fuentes CSV/JSON/XML, edición de pasos y combinación después de transformaciones; actualización HTTPS con un origen simulado de prueba, deshacer, protección, controles contextuales y entrada de fechas. Datos y orígenes exclusivamente de prueba. Se revisaron vistas anchas y de 1100 × 800.

Código: `sheet-data.js`, `sheet-data-model.js`, `sheet-data-rules.js`; integración en `sheet-workspace.js`, `sheet-model.js`, `sheet-calculation.js` y `sheet-layout-model.js`. Las pruebas están en `tests/sheet-data*.test.mjs`/`tests/sheet-data*.browser.cjs`; las capturas, en `tmp/data-*.png`. Build y servidor incluyen los nuevos módulos.
