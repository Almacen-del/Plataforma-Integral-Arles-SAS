# Hojas de cálculo Arles · primera etapa

Consulta y desarrollo: 28 de septiembre de 2026. El catálogo oficial de Excel es extenso y evoluciona: esta investigación cubre las áreas siguientes, no pretende haber leído todos los manuales de Office.

## Fuentes oficiales consultadas
- [Ayuda y formación](https://support.microsoft.com/es-es/excel/): organización por tareas.
- [Fórmulas](https://support.microsoft.com/es-es/excel/get-started/overview-of-formulas-in-excel): barra de fórmulas, referencias A1, operadores y funciones.
- [Ordenar rangos](https://support.microsoft.com/es-es/excel/sort-data-in-a-range-or-table-in-excel): mantener juntas las columnas de cada fila y excluir encabezados.
- [Validación](https://support.microsoft.com/es-es/excel/get-started/apply-data-validation-to-cells): restricciones y mensajes al introducir datos.
- [Formato condicional](https://support.microsoft.com/es-es/excel/use-conditional-formatting-to-highlight-information-in-excel): reglas para destacar valores.
- [Inmovilizar paneles](https://support.microsoft.com/es-es/excel/get-started/freeze-panes-to-lock-rows-and-columns): conservar visible parte de la hoja al desplazarse.
- [Imprimir hojas y libros](https://support.microsoft.com/es-es/excel/get-started/print-a-worksheet-or-workbook): separar vista del libro y configuración de impresión.
- [Tablas dinámicas](https://support.microsoft.com/es-es/excel/overview-of-pivottables-and-pivotcharts): resumir y analizar, pendiente de implementación.
- [Excel para la web](https://learn.microsoft.com/es-es/office365/servicedescriptions/office-online-service-description/excel-online): alcance distinto del escritorio; no suponer equivalencia de todas las funciones.

## Diseño implementado
Acceso Biblioteca → Hojas de cálculo, o http://127.0.0.1:4173/?editor=hojas. Ventana independiente del editor Word y de Turnos.

| Cinta | Primera implementación |
|---|---|
| Archivo | Guardado local del libro activo; CSV con valores de la hoja |
| Inicio | Copiar valores y pegar texto tabulado, borrar, tipografía, color, relleno, alineación, ajuste de texto, formato numérico, estilos y selección |
| Insertar | Estilo visual de rango, vista previa de barras, hojas, notas |
| Disposición | Papel, orientación, rango de impresión y vista de diseño |
| Fórmulas | Asistente básico, Autosuma, mostrar fórmulas y errores |
| Datos | Ordenación de valores por primera columna seleccionada, filtro textual, validación numérica |
| Revisar | Notas por celda y protección contra edición accidental |
| Vista | Cuadrícula, fila 1 inmovilizada, zoom y navegación entre hojas |
| Ayuda | Atajos, alcance y enlace al manual oficial |

La selección admite arrastre, Mayús, filas/columnas y cuadro de direcciones. Edición con teclado, F2, doble clic o barra de fórmulas. Libro con varias hojas, renombrado y duplicación. Historial de 40 cambios. Ejemplo ficticio en una hoja nueva, sin reemplazar datos.

## Cálculo inicial y límites explícitos
100 filas × 26 columnas. SUMA, SUM, PROMEDIO, MIN, MAX, CONTAR, CONTARA, operadores aritméticos, porcentajes y referencias de la misma hoja. Recálculo al editar. Separador decimal coma y de argumentos punto y coma. Errores de fórmula, división por cero y referencia circular visibles. Sin eval ni ejecución de fórmulas como código.

No hay todavía importación/exportación XLSX, referencias entre hojas, funciones avanzadas, tablas estructuradas, tablas dinámicas, gráficos persistidos sobre la cuadrícula, impresión paginada. La ordenación se bloquea en hojas que contienen fórmulas hasta incorporar actualización de referencias. El formato de tabla es visual. Los gráficos y la impresión son vistas previas identificadas como tales.

Guardado independiente en localStorage, clave arles-sheet-design-v1, un libro por navegador en esta etapa. No se escriben documentos controlados ni datos de inventario. No es una integración con Microsoft Office ni un servicio multiusuario. La protección no es seguridad de acceso. CSV exporta valores, no formato; textos que parecen fórmulas se neutralizan en esa exportación.

## Validación
Pruebas de modelo: dependencias, fórmulas, rangos, errores, identificadores con ceros, pegado atómico, validación y protección. Prueba en navegador: acceso desde Biblioteca, cintas, edición directa, recálculo, formato por rango, deshacer, protección, guardar/reabrir, ejemplo y vista previa de gráfico. Identificadores de celda propios (data-sx-cell) para evitar interceptores de Turnos. Compilación estática y regresión Vista de Word.

## Secuencia de desarrollo siguiente
1. Revisar el diseño con el usuario y ampliar edición de filas/columnas y selección.
2. Incorporar un motor de cálculo con mayor cobertura y pruebas de compatibilidad antes de ampliar fórmulas.
3. Importar/exportar XLSX con comprobación de fidelidad y aviso ante funciones no soportadas.
4. Implementar tablas estructuradas, gráficos persistentes, impresión real y luego análisis avanzado.
5. Vincular libros a la biblioteca documental con identidad, revisión y permisos reales cuando exista backend.

La entrega Word está publicada. Esta etapa de hojas de cálculo se conserva localmente para revisar su diseño antes de otra publicación.


## Ampliación de Inicio · 29 de septiembre
La ficha Archivo se retira por solicitud del usuario. Inicio adopta una cinta compacta de siete grupos y una galería de estilos. Se implementan cortar/copiar/pegar celdas con formato y fórmulas relativas, copiar formato, subrayado, tamaño, bordes, alineación vertical, sangrías y decimales; estilos Normal/Bueno/Incorrecto/Neutral; combinar/separar sin descartar contenido; insertar/eliminar filas y columnas completas con actualización de referencias; tamaños y autoajuste; rellenar en cuatro direcciones y series numéricas; borrar por contenido/formato/notas, y reemplazo de texto en la selección.

Formato condicional: números, intervalos, texto, duplicados/únicos, superiores/inferiores por cantidad o porcentaje, promedios, vacíos, errores, fechas relativas, escalas, barras (incluidos negativos), semáforos y fórmulas de comparación simple. Vista previa, edición, activación, eliminación, prioridad y detener si se cumple. Fechas como AAAA-MM-DD o serial Excel. Las reglas se guardan con el libro y se recalculan al editar. Se migran las antiguas reglas simples.

Referencias adicionales consultadas:
- https://support.microsoft.com/es-es/excel/get-started/insert-or-delete-rows-and-columns-in-excel
- https://support.microsoft.com/es-es/excel/get-started/merge-and-unmerge-cells-in-excel
- https://support.microsoft.com/es-es/excel/get-started/fill-data-automatically-in-worksheet-cells

Pruebas: tests/sheet-home.test.mjs y tests/sheet-home.browser.cjs cubren reglas, persistencia, recálculo, fórmulas al rellenar/copiar/mover, filas/columnas, combinación sin pérdida, estilos y cintas. Continúan pendientes desplazamientos de celdas individuales, tablas estructuradas, ampliar funciones de cálculo y compatibilidad XLSX. El corte bloquea las referencias que abarcan parcialmente el rango movido y las fórmulas entre hojas, en lugar de dejar referencias incorrectas. No se promete compatibilidad completa con Excel.

## Ampliación contrastada con los archivos aportados — 29/09/2026

Fuentes revisadas:
- ZIP ECMA-376 partes 1–4: inventario y alcance; 5039, 95, 43 y 1553 páginas respectivamente. Lectura dirigida de los índices y de Part 1, sección 18.8 (Styles), incluida 18.8.1 (alignment). No se afirma lectura integral ni conformidad completa.
- Microsoft MS-XLSX, Introduction: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/f780b2d6-8252-4074-9fe3-5d7bc4830968 . El enlace PDF aportado falló en el lector web; se consultó la publicación HTML oficial.
- OASIS OpenFormula 1.2: https://docs.oasis-open.org/office/v1.2/OpenDocument-v1.2-part2.html . Describe lenguaje y evaluación de fórmulas, no la interfaz Excel.
- Microsoft: Insert or delete rows and columns; Lock cells to protect them; Protect a worksheet.

Implementado en Inicio:
- Menús Insertar, Eliminar, Formato y Ordenar/filtrar con navegación por teclado.
- Desplazamiento de celdas en cuatro direcciones con actualización de referencias y transacción atómica. Rechaza desbordamientos, combinaciones afectadas y rangos que quedarían no rectangulares. Los signos absolutos se conservan.
- Formato de celdas con Número, Alineación, Fuente, Borde, Relleno y Proteger. Vista previa, Aceptar/Cancelar y Ctrl+1.
- Edición de valores en celdas desbloqueadas bajo protección de hoja; bloqueo por defecto. Protección local contra errores, sin contraseña ni control de acceso.
- Ocultar/mostrar filas y columnas; autoajustar alto y ancho; ancho predeterminado en píxeles.
- Mover, copiar y eliminar hojas (al menos una permanece), color de pestaña; acciones recuperables con Deshacer.
- Galería de estilos y estilos propios guardados en el libro.
- Selección de columna y dirección para ordenar; sigue rechazando hojas con fórmulas hasta contar con ordenación que mantenga todas las dependencias.
- Estilos de rango con color de encabezado y bandas configurables; aún no son tablas estructuradas.

Pendiente respecto a las capturas completas: tablas dinámicas, objetos anclados a celdas, gráficos editables persistentes, biblioteca completa de fórmulas, nombres definidos, conexiones de datos, análisis avanzado, macros/VBA, importación/exportación XLSX y conformidad OOXML. No se añadieron controles que simulen estos motores.

Validación: pruebas unitarias de shifts, límites, referencias, protección, hojas y formatos numéricos; pruebas de navegador de aplicación/cancelación, menú, deshacer, estilos, visibilidad y persistencia. Datos de prueba en contextos aislados, sin modificar el libro del usuario. Cambios locales, sin despliegue.

## Ampliación de las demás fichas y exclusión de Programador

Instrucción posterior del usuario: omitir las funciones de Programador, incluidas grabaciones. Se eliminaron la ficha, la grabadora, la reproducción y las rutas de respaldo agregadas bajo esa ficha. La prueba de navegador exige que Programador no exista.

Funciones añadidas y conectadas:
- Insertar: imágenes PNG/JPEG/WebP en celda, cuatro formas en celda, símbolos, vínculos HTTP(S), gráficos de columnas/línea guardados y vinculados a un rango. Resumen por categoría (suma, recuento, promedio) en otra hoja. Este resumen es estático, no una tabla dinámica completa.
- Disposición: papel, orientación, márgenes, área de impresión, cuadrícula impresa y documento imprimible. Conserva formato de las celdas, combinaciones enteras, ilustraciones y gráficos. La paginación final corresponde al navegador.
- Fórmulas: analizador sin eval, literales de texto, comparaciones, booleanos, concatenación, evaluación selectiva de SI y SI.ERROR; catálogo por categorías, precedentes/dependientes directos y recálculo. No hay referencias entre hojas, nombres definidos ni catálogo completo.
- Datos: CSV con comillas escapadas y saltos internos, hoja nueva para la importación, fórmulas externas de CSV tratadas como texto; separación en columnas sin sobrescribir destinos; quitar duplicados; reglas numéricas, enteros, listas y longitud de texto. Duplicados/ordenación de hojas con fórmulas siguen protegidos contra operaciones no soportadas.
- Revisar: estadísticas, comprobación limitada de accesibilidad, edición con corrector del navegador, navegación y eliminación de notas, bloqueo de celdas. Sin servicio externo de gramática, traducción o diccionario propio.
- Vista: cuadrícula, encabezados, barra de fórmulas, zoom y ajuste de selección, inmovilizar primera fila y navegación de hojas.

Base documental: modelo de expresiones y operadores de OASIS OpenFormula, y lectura dirigida previa de ECMA SpreadsheetML. No implica conformidad completa con ECMA, ODF o Excel; los operadores y funciones implementados tienen pruebas explícitas.

Comprobación de navegador: fórmulas, referencias, formas, símbolos, ajustes de página, visualización, revisión, CSV, resumen, guardado/reapertura y gráfico impreso; se interceptó window.print para no enviar trabajos reales a impresoras. La inspección visual detectó desbordamiento de grupos en la cinta y se corrigieron sus anchos intrínsecos.

## Bordes de celdas — menú de referencia
- Trece preajustes: cuatro lados, sin borde, todos, contorno, contorno grueso, inferior doble/grueso y combinaciones superior/inferior.
- Modelo por lado con color, estilo (continuo, discontinuo, punteado, doble) y grosor. Compatibilidad con los bordes simples guardados anteriormente.
- Contorno calculado sobre el rango; celdas combinadas tratadas como una unidad. Las aristas compartidas se representan una vez; borrar elimina también la arista opuesta de la celda vecina.
- Dibujar líneas por el lado más próximo al puntero, dibujar cuadrícula rectangular y borrar lados. Cada gesto corresponde a una operación de Deshacer. Esc termina el modo de dibujo.
- Más bordes con vista previa, persistencia local y bordes reales CSS conservados en impresión.
- Pruebas de modelo y navegador: contorno, divisiones internas, color, doble/grueso, combinaciones, protección, dibujo, borrador, deshacer de un gesto y reapertura. Suite de lógica completa: 54 pruebas aprobadas.


## Ampliación de Inicio — 29/09/2026

Aplicación de la inspección de Excel documentada en `REVISION_EXCEL_INICIO_2026-09-29.md`. Cambios locales, sin publicación en esta sesión.

- **Portapapeles:** historial de 12 copias de la sesión; pegado especial de valores, fórmulas o formatos; transponer, omitir blancos y operaciones aritméticas. Copiar conserva un origen interno incluso si el navegador no permite escribir en el portapapeles del sistema.
- **Fuente:** subrayado doble, tachado, superíndice/subíndice, además de los controles existentes. El diálogo aplica solo propiedades modificadas, preservando formatos heterogéneos del rango.
- **Alineación:** orientación, texto vertical, reducir hasta ajustar, sangría y cuatro formas de combinar/separar. Combinar rechaza pérdida de contenido.
- **Número:** controles por categoría, separador de miles, variantes de negativos en rojo/paréntesis, símbolos o ninguno, región, tipos de fecha/hora/duración, precisión/denominadores de fracciones y códigos numéricos personalizados con vista previa y validación. Los valores y fórmulas no cambian.
- **Borde/Relleno/Protección:** diagonales, tramas y ocultación de fórmulas al proteger; se mantienen las herramientas anteriores de bordes por lado, dibujo y borrado.
- **Estilos:** intensidades 20/40/60 % de los seis énfasis, estilos propios; paletas de escalas, familias de iconos y barras sólidas/degradadas con color. Se conservan prioridad, editar, eliminar, activar y detener reglas; se añade borrar reglas de hoja.
- **Tablas:** rango registrado, encabezados únicos y filtros por columna; convertir a rango conserva celdas. La estructura de tabla se remapea al insertar/eliminar filas/columnas. Los filtros se limpian al cambiar estructura para evitar aplicar criterios a columnas desplazadas.
- **Celdas:** ocultar y mostrar hojas, con al menos una visible; se conservan las operaciones anteriores de tamaños, visibilidad de filas/columnas, mover/copiar, inserción y eliminación.
- **Edición:** Autosuma y variantes sobre filas/columnas o bloque contiguo adyacente; series lineales/geométricas/cronológicas, tendencia, límite y días laborables; copia a otras hojas; relleno por ejemplo; distribución de texto en filas; quitar vínculos; ordenar por dos criterios con fórmulas relativas; filtros por columna y reaplicar; búsqueda por valores/fórmulas, ámbito, mayúsculas y celda completa; reemplazo; navegación por tipos de celda.

### Límites explícitos que se conservan

No es una implementación completa del motor de Excel. El diálogo y los flujos explican los límites en lugar de aparentar operaciones inexistentes:

- Códigos personalizados: subconjunto numérico localizado (positivo/negativo/cero/texto, literales, ceros, decimales, miles, %, rojo); se rechazan códigos de fecha, condiciones y operadores de espaciado no soportados. Hasta ocho decimales. Especial no inventa catálogos regionales.
- Las tablas usan fórmulas A1, no referencias estructuradas; no hay expansión automática del rango ni integración XLSX en esta entrega.
- Relleno por ejemplo reconoce una palabra inequívoca o conversión de mayúsculas/minúsculas; no afirma equivalencia con Flash Fill general. Justificar usa ancho en caracteres y el rango elegido.
- Ir a Especial presenta coincidencias navegables, no una selección discontinua editable. Las familias de iconos y tramas son un catálogo reducido.
- Portapapeles interno por sesión, sin acceso al historial global de Office. No se añaden complementos COM/Office ni macros/Programador.
- El motor conserva el área A1:Z100 y sus limitaciones anteriores de referencias entre hojas.

### Verificación

Pruebas nuevas `sheet-home-complete.test.mjs` y `sheet-home-complete.browser.cjs`: preservación de fórmulas, códigos/negativos/fracciones/duraciones, pegado transpuesto y aritmético, series, combinación segura, suma horizontal, ordenación con fórmulas, tablas/filtros, remapeo estructural, diálogo, deshacer y persistencia. La batería anterior sigue ejecutándose para detectar regresiones.


### Insertar: primera ampliación — 29/09/2026

- Minigráficos de líneas, columnas y pérdidas/ganancias: series por filas o columnas, color configurable, valores negativos, referencias vinculadas que se recalculan y se ajustan al insertar/eliminar filas o columnas mediante el contrato existente de gráficos.
- El destino exige una celda por serie, sin datos, objetos, combinaciones ni superposición con el origen. Se valida toda la operación antes de escribir.
- Formas en celda: catálogo de 14 formas (rectángulos, elipse, rombo, flechas, triángulo, pentágono, hexágono, estrella, paralelogramo, trapecio, cruz y llamada).
- Eliminar objeto retira imágenes, formas o gráficos de la selección conservando el contenido de las celdas. Admite Deshacer y guardado local.
- Prueba de navegador: `tests/sheet-insert.browser.cjs`, con recálculo, números negativos, destino ocupado, formas, eliminación, Deshacer y persistencia.
- Alcance: esta entrega inicia Insertar; no completa la pestaña de Excel. Siguen pendientes objetos flotantes, tablas dinámicas completas, catálogo avanzado de gráficos, SmartArt, modelos 3D, segmentación, escala de tiempo, WordArt y ecuaciones. Los minigráficos no incluyen todavía todas las opciones de ejes y agrupación de Excel. No se ha publicado esta ampliación.


### Insertar: objetos editables y análisis vinculado — 30/09/2026

Implementación local posterior a la publicación del 29/09. Esta ampliación no se ha desplegado.

- Nuevo módulo `sheet-insert.js` y modelo `sheet-insert-model.js`: objetos flotantes con movimiento por arrastre o teclado, redimensionado, posición/tamaño numéricos, orden de superposición, edición y eliminación. Los objetos se guardan dentro de la hoja y participan en Deshacer/Rehacer.
- Galerías locales reutilizadas del editor documental: 141 formas y 228 iconos con búsqueda y selección. Imágenes PNG/JPEG/WebP flotantes, hasta 1 MB, con descripción alternativa.
- Texto y WordArt básico, color/tamaño/giro y contenido vinculado a una celda. Diagramas básicos de proceso, lista, ciclo y jerarquía; todavía no tienen el editor completo de nodos/conectores de SmartArt.
- 28 plantillas matemáticas con edición de sus elementos de texto y vista previa MathML. No ejecutan cálculos de celdas y no equivalen al editor completo de estructuras de Excel.
- Gráficos flotantes editables de columnas, barras, líneas, área, circular, anillos y radial. Categoría y campo numérico seleccionables; una serie por objeto. Circular/anillos rechazan valores negativos; radial requiere al menos tres valores no negativos. Fuente vinculada, sin copiar valores estáticos.
- Resúmenes dinámicos con un campo de filas, uno opcional de columnas y uno de valores; suma, recuento, promedio, mínimo y máximo. Segmentaciones multiselección y filtro de fechas afectan a gráficos y resúmenes con el mismo rango. No filtran directamente las filas de la cuadrícula. No son tablas dinámicas completas de Excel.
- Inserción estructural ajusta los rangos y campos de los objetos. Si una operación elimina su origen o una referencia necesaria, se rechaza con explicación. Las posiciones son absolutas y no están ancladas a celdas.
- Casillas en celda con valores lógicos y uso en fórmulas. Las casillas sobre fórmulas se muestran deshabilitadas para no sobrescribirlas.
- Encabezado/pie simples de impresión con sustitución de {hoja}/{libro}. Los objetos se imprimen después de la tabla, no en su posición flotante exacta; el encabezado/pie no se repite por página.

Validación: 26 pruebas del motor de hojas, 34 pruebas generales/documentales, 9 recorridos de navegador, compilación y revisión de espacios. El recorrido nuevo verifica agregación, recálculo, segmentación, texto vinculado, ecuaciones, galerías, movimiento con teclado, seis tipos de gráficos, casillas, Deshacer/Rehacer y persistencia. No certifica todos los casos de impresión ni el arrastre con todos los niveles de zoom.

Pendientes frente al inventario completo: gráficos multiserie/apilados y familias estadísticas/jerarquía/dispersión/3D/mapas/combinados, tablas dinámicas con múltiples campos/totales/medidas, escala de tiempo con períodos y conexiones configurables, galerías SmartArt y conectores completos, propiedades avanzadas de imágenes/WordArt, vínculos internos/correo, catálogo completo de símbolos, firmas digitales, OLE, modelos 3D, servicios/complementos de Microsoft, interoperabilidad XLSX y referencias de fórmulas entre hojas. No hay botones que afirmen realizar estas funciones pendientes.

### Insertar: análisis con varios campos y diseño — segunda ampliación del 30/09/2026

Continuación local. Esta sección actualiza el inventario de pendientes anterior; no confirma publicación en producción.

- **20 tipos de gráfico:** columnas y barras agrupadas/apiladas/al 100 %, líneas, área simple/apilada, circular, anillos, radial, dispersión XY, burbujas, combinado, histograma, Pareto, cascada, embudo y cajas/bigotes. Las familias compatibles admiten varias series, tres paletas, leyenda y etiquetas de valores. El panel muestra controles según el tipo elegido y permite revisar una vista previa antes de aplicar.
- Los gráficos conservan su origen vinculado y las categorías con datos ausentes. Las líneas se interrumpen cuando falta un valor; no convierten texto en cero. Las operaciones de estructura remapean todas las series y campos X/tamaño.
- Dispersión usa pares X/Y numéricos y burbujas exige tamaño positivo. El combinado usa columnas y una última serie de línea, con una escala común. Circular, anillos, cascada, embudo, histograma y Pareto usan la primera serie.
- Histograma permite ancho o cantidad de intervalos (hasta 100); en automático utiliza una regla basada en la desviación estándar y el tamaño de la muestra. Los intervalos incluyen el límite derecho y el primero incluye también el mínimo. Pareto agrupa categorías, las ordena y añade el porcentaje acumulado. Cascada añade el total final. Cajas/bigotes usa interpolación de cuartiles inclusiva/exclusiva, mediana, promedio, cercas de 1,5 veces el rango intercuartílico y puntos atípicos.
- **Tablas dinámicas de la plataforma:** varios campos de filas/columnas y varios cálculos, incluso repetidos sobre un mismo campo. Suma, recuento, recuento numérico, promedio, mínimo, máximo, producto, desviación y varianza de muestra/población. Valores normales o porcentajes de fila, columna o total general. Cero en el denominador y estadísticos de muestra sin suficientes datos se muestran sin un resultado numérico inventado.
- Totales y subtotales de filas se calculan desde los registros originales; los promedios totales no suman ni promedian promedios de grupos. Filtros del informe multiselección, nombres de cálculos y tres diseños. Columnas legibles con desplazamiento horizontal y encabezados fijos.
- **Conexiones y fechas:** cada segmentación/escala puede afectar a todos los objetos con el mismo origen o a destinos elegidos. Elegir cero destinos equivale a desconectar. Años, trimestres, meses o días usan intervalos completos del calendario; Mayús amplía la selección. Los filtros se combinan y no alteran los datos de origen.
- Fechas aceptadas: texto ISO AAAA-MM-DD o seriales de Excel en el sistema 1900. Se descartan fechas imposibles, seriales fuera de rango y el día ficticio 29/02/1900. No se infieren fechas a partir de textos regionales ambiguos.
- **Diseño:** los cuatro diagramas básicos incorporan conectores y flechas. Jerarquía significa una raíz con hijos; no incluye múltiples niveles editables. Hasta 50 elementos. WordArt ofrece sombra, contorno, degradado y simple. Imágenes ofrecen ajuste completo, recorte para rellenar, estirado, opacidad y giro. La carga de imágenes ignora lecturas antiguas si se cambia de editor.
- **Vínculos y símbolos:** web HTTP/HTTPS, correo mailto y celda de la misma hoja (#B5). Los vínculos internos se ajustan al insertar/eliminar filas/columnas o desplazar celdas; un destino eliminado se identifica. Se reutiliza la galería de símbolos del editor documental, con 13 categorías y búsqueda por nombre/código Unicode. Insertar símbolos no modifica fórmulas existentes.

Referencias de comportamiento: [funciones de resumen y porcentajes](https://support.microsoft.com/en-us/excel/change-the-summary-function-or-custom-calculation-for-a-field-in-a-pivottable), [totales y subtotales](https://support.microsoft.com/en-us/excel/show-or-hide-subtotals-and-totals-in-a-pivottable) e [intervalos del histograma](https://support.microsoft.com/en-us/excel/create-a-histogram). El modelo de objetos de la plataforma sigue siendo propio; no representa todavía el contrato OOXML de tablas dinámicas y gráficos nativos.

Verificación: 37 pruebas del motor de hojas, 34 pruebas generales/documentales y 10 recorridos de navegador; compilación y revisión de espacios. El recorrido nuevo cubre los 20 tipos, varias series, medidas, subtotales, porcentajes, filtros del informe, conexiones, períodos, imágenes, WordArt, conectores, vínculos, símbolos, recálculo, Deshacer/Rehacer y persistencia. La inspección visual se guarda en tmp/sheet-insert-analysis.png con datos exclusivos de prueba.

**Pendientes que permanecen:** gráficos de jerarquía, superficie, cotizaciones, 3D y mapas; segundo eje y configuraciones avanzadas por serie; gráficos vinculados directamente al resultado de una tabla dinámica; subtotales de columnas, campos calculados, agrupación y ordenación avanzadas de tablas dinámicas; editor completo de nodos/conectores y catálogo SmartArt; corrección/efectos avanzados de imágenes y transformaciones de texto; vínculos entre hojas/archivos y catálogo Unicode por fuente; firmas digitales, OLE, modelos 3D y servicios/complementos de Microsoft; interoperabilidad XLSX, fórmulas entre hojas, objetos anclados a celdas y composición completa de impresión. Se mantiene la exclusión solicitada de Archivo y Programador/macros.

### Disposición de página — 30/09/2026

Ampliación local basada en la captura de la cinta y la documentación oficial. Esta sección sustituye las limitaciones anteriores de encabezados/pies y posición de objetos al imprimir; no confirma publicación web ni compatibilidad completa con Excel.

- **Temas:** tema del libro, seis colores de énfasis, fuentes de cuerpo/encabezados y tres efectos simples. Preajustes Arles, Office y Gris, más temas personalizados guardados en el libro. Los colores/fuentes manuales se conservan; las celdas y objetos elegidos pueden vincularse explícitamente al tema. Cambiar posteriormente una propiedad manual desvincula esa propiedad. Las fuentes disponibles dependen del navegador/equipo.
- **Configurar página:** A3, A4, A5, B4, B5, Carta, Oficio y Tabloide; orientación vertical/horizontal; márgenes independientes en milímetros, distancias del encabezado/pie y centrado horizontal/vertical. Los preajustes se identifican por su medida (15, 25,4 o 6,35 mm), sin atribuirles las medidas nativas de los perfiles de Excel.
- **Área de impresión:** establecer, añadir, editar o borrar varios rangos. Cada área comienza en una página independiente. Se rechazan superposiciones y áreas que recorten una combinación. Sin área explícita, se calcula el contenido usado, incluidos formatos y objetos visibles.
- **Saltos:** insertar antes de la fila/columna de la celda activa, quitar en la selección y restablecer. Marcas azules en la cuadrícula. Las combinaciones permanecen completas y los saltos que las atraviesan se rechazan. La ampliación de Vista del 30/09/2026 añade el arrastre y la visualización de los saltos automáticos.
- **Escalado:** porcentaje del 10 al 400 % o ajuste a páginas de ancho/alto con Automático. El ajuste calcula la escala por las dimensiones reales de filas/columnas, títulos y papel; no agranda por encima del 100 %. Ignora los saltos manuales y lo explica en la vista previa.
- **Opciones de hoja:** ver/imprimir cuadrícula y encabezados por separado; filas y columnas repetidas en cada página, orden vertical/horizontal, primer número de página y blanco/negro. Filas/columnas ocultas y filtros guardados se excluyen. Las áreas, títulos y saltos se ajustan al insertar/eliminar filas o columnas.
- **Fondo:** PNG/JPEG/WebP hasta 1 MB, repetido y guardado en la hoja; no se imprime. Se puede eliminar y deshacer.
- **Encabezado/pie:** texto repetido por página, con `{hoja}`, `{libro}`, `{pagina}`, `{paginas}` y `{fecha}`. Distancias y márgenes se validan para reservar espacio. No incluye imágenes, secciones izquierda/centro/derecha ni variantes para pares/impares o primera página.
- **Organizar:** panel de selección y visibilidad, frente/fondo o un nivel de superposición, seis alineaciones y distribución horizontal/vertical. Agrupar/desagrupar, movimiento de grupos por arrastre/teclado, giros de 90 grados y volteos. El tamaño se sigue editando por objeto; alinear/distribuir usa sus cajas sin compensar la rotación. No incluye agrupación anidada ni selección múltiple directamente en el lienzo.
- **Impresión:** vista previa de todas las páginas y ventana Imprimir/PDF del navegador comparten el mismo plan de papel, márgenes, títulos, escala y saltos. Imágenes, formas, texto y gráficos conservan su posición sobre las celdas y se recortan al área impresa. Las alturas configuradas permanecen fijas; el contenido que exceda una celda requiere aumentar/autoajustar su altura. La configuración del diálogo de impresión debe conservar el papel y la escala generados.

Modelo: `sheet-layout-model.js`. Interfaz e impresión: `sheet-layout.js`. Se mantiene el límite de la plataforma A1:Z100 y el guardado en el navegador. No importa/exporta temas `.thmx`, configuración OOXML de impresión ni libros XLSX nativos. Las propiedades avanzadas de impresora, borrador/calidad, comentarios/errores de celda, impresión de múltiples hojas y objetos anclados siguen pendientes.

Referencias: [configurar página](https://support.microsoft.com/es-es/excel/page-setup), [ajustar una hoja y comportamiento de los saltos](https://support.microsoft.com/es-es/excel/scale-a-worksheet), [fondo de hoja](https://support.microsoft.com/es-es/excel/add-or-remove-a-sheet-background), [orden de páginas](https://support.microsoft.com/es-es/excel/set-the-printing-order-of-worksheet-pages) y [formato y temas](https://support.microsoft.com/es-es/excel/ways-to-format-a-worksheet). ECMA-376 y MS-XLSX describen interoperabilidad de archivos; no convierten este modelo propio en un motor OOXML completo.

Validación: 48 pruebas del motor de hojas, 34 pruebas generales/documentales y 11 recorridos de navegador; compilación y revisión de espacios. El recorrido nuevo cubre configuración, títulos, saltos, ajuste, áreas, fondo, temas, organización, Deshacer y guardado sin alterar fórmulas. El PDF de prueba conserva cuatro páginas A4 horizontales, con medidas verificadas y revisión visual de la primera/última. Las capturas y el PDF de QA se guardan en `tmp/`, con datos exclusivos de prueba.

### Fórmulas — 30/09/2026

Se amplían la cinta y el cálculo: biblioteca con 518 identificadores del índice oficial actual, 451 habilitados y 67 pendientes identificados; asistente de argumentos, nombres definidos, referencias entre hojas, matrices dinámicas, LET/LAMBDA, auditoría, evaluación paso a paso, ventana de inspección y cálculo automático/manual. Las referencias y nombres se mantienen al cambiar filas/columnas o renombrar/eliminar hojas. Esta ampliación sustituye la limitación previa de fórmulas entre hojas; no confirma compatibilidad completa con Excel/XLSX ni publicación.

Alcance, límites concretos, fuentes y verificación: [entrega de Fórmulas](EXCEL_FORMULAS_2026-09-30.md). Inventario de cada función y su estado: [catálogo completo](CATALOGO_FUNCIONES_2026-09-30.md). Validación acumulada: 74 pruebas de hojas y 34 generales/documentales, 12 recorridos de navegador, compilación y revisión de espacios. Guardado local en el navegador, A1:Z100; Archivo y Programador/macros siguen excluidos.
## Datos — 30/09/2026

Se amplió Datos con ocho grupos de cinta: Obtener y transformar, Consultas y conexiones, Tipos de datos, Ordenar y filtrar, Herramientas de datos, Previsión, Esquema y Análisis. La implementación y sus límites están documentados en [EXCEL_DATOS_2026-09-30.md](EXCEL_DATOS_2026-09-30.md).

Disponibles: CSV/TSV/JSON/XML y HTTPS público con vista previa; consultas con pasos, combinación/anexado y actualización reversible; ordenación por niveles, filtros estándar/avanzados, texto en columnas, duplicados y validación contextual; consolidación, hipótesis, escenarios, previsión lineal con gráfico, grupos/subtotales y siete herramientas de análisis. Se mantienen A1:Z100 y almacenamiento del navegador.

Pendientes explícitos: conectores empresariales/XLSX externo, Power Query/M completos, Power Pivot/DAX, tipos conectados, Solver, previsión estacional ETS y parte del ToolPak. El motor no se presenta como compatibilidad completa con Excel.

Verificación de esta entrega local: 130 pruebas y 14 recorridos de navegador, build y revisión de espacios; revisión visual ancha y 1100 × 800. No se publicó esta entrega en la web.

## Revisar — 30/09/2026

Se amplía Revisar con ortografía real en español de Colombia, diccionario de sinónimos local, estadísticas de hoja/libro, comprobaciones de accesibilidad y texto alternativo, comentarios con respuestas y resolución, notas independientes y protección de hoja, estructura del libro y rangos editables. La traducción local se habilita cuando el navegador dispone de Translator API; se mantiene un resultado manual revisable cuando no está disponible.

Alcance, fuentes, diccionarios/licencias y límites: [EXCEL_REVISAR_2026-09-30.md](EXCEL_REVISAR_2026-09-30.md). Los comentarios son locales y la protección controla edición; no hay coautoría ni cifrado del archivo. Entrada de lápiz permanece deshabilitada hasta disponer del motor de dibujo. No se publicó esta entrega.

Verificación acumulada: 140 pruebas y 15 recorridos de navegador aprobados; compilación, revisión de espacios e inspección visual en 1920 y 1100 píxeles.

## Vista — 30/09/2026

Se amplía Vista con Normal, vista previa de saltos y Diseño de página, controles de pantalla, reglas, zoom entre 10 y 400, ajuste a selección, inmovilización de filas/columnas y división editable en paneles. Los límites de página proceden del mismo motor de impresión y pueden moverse desde el panel o por arrastre. Diseño de página permite seleccionar celdas, editar desde la barra de fórmulas y cambiar encabezado/pie; las opciones visuales no modifican las casillas de impresión.

Incluye vistas personalizadas que restauran ajustes sin reemplazar datos, ventanas internas que comparten el libro y sus fórmulas, comparación entre hojas, organización, ocultar/mostrar y desplazamiento sincrónico. Las herramientas de la cinta se aplican a la principal; las adicionales tienen dirección y edición propias. No son ventanas del sistema ni comparación de archivos externos. La estructura modificada exige volver a guardar una vista personalizada. Archivo y macros siguen excluidos.

Alcance, fuentes y límites: [EXCEL_VISTA_2026-09-30.md](EXCEL_VISTA_2026-09-30.md). Entrega local, sin publicar. Verificación acumulada: 151 pruebas y 16 recorridos de navegador aprobados, compilación, revisión de espacios e inspección visual de páginas, saltos, ventanas y 1100 píxeles.

## Programador — 30/09/2026

Se habilita Programador por la nueva solicitud del usuario. Esta entrega sustituye la exclusión anterior de la ficha; se mantiene la omisión solicitada de macros, VBA y grabaciones. Incluye diez tipos de control: casilla, opción, lista desplegable, lista, número, desplazamiento, etiqueta, grupo, botón con acciones declaradas y entrada de texto propia de la plataforma. Las celdas vinculadas actualizan valores y fórmulas, y las listas toman sus opciones del rango de entrada. Modo Diseño permite movimiento, tamaño y propiedades con estilos, protección, Deshacer, impresión y guardado.

XML incluye origen y mapas, importación con vista previa, actualización desde el último XML y exportación de los valores actuales. Admite campos planos, atributos, espacios de nombres y un subconjunto XSD con validación de tipos. No reemplaza fórmulas y exige consentimiento en la vista previa para reemplazar datos ajenos al mapa. Los cambios estructurales exigen recrear el mapa. Los controles flotan en posición fija.

El catálogo de complementos muestra los motores integrados; no instala paquetes externos. ActiveX, COM, paquetes Smart Document, Power Pivot, XSD general y compatibilidad completa XLSX/XLSM no están implementados. Archivo continúa excluido. El alcance y las fuentes oficiales están en [EXCEL_PROGRAMADOR_2026-09-30.md](EXCEL_PROGRAMADOR_2026-09-30.md).

Verificación acumulada: 163 pruebas y 17 recorridos de navegador aprobados, compilación, revisión de espacios e inspección visual de controles, XML y 1100 píxeles. Entrega local, sin publicar.

## Selección de columnas y filas — 01/10/2026

Los encabezados permiten seleccionar varias columnas o filas completas mediante arrastre o Mayús + clic. La selección mantiene el encabezado inicial como ancla, admite extenderse en ambos sentidos y desplaza la cuadrícula al llegar a sus bordes. Se resaltan los encabezados seleccionados y la cuadrícula recibe el foco para continuar con el teclado.

Ctrl + Espacio selecciona las columnas completas del rango actual; Mayús + Espacio, sus filas; Ctrl + Mayús + Espacio, toda la hoja. Mayús + flechas mantiene la selección de columnas o filas completas al ampliarla en su dirección. Soltar, cancelar el puntero o salir de la ventana detiene el arrastre. El formato y las operaciones existentes usan el rango completo, incluidos los límites A1:Z100; la selección también está disponible en hojas protegidas. La selección de celdas conserva su comportamiento.

El recorrido aislado `tests/sheet-selection.browser.cjs` comprueba columnas/filas, anclas inversas, resaltado, formato y Deshacer sin modificar fórmulas, atajos, zoom, desplazamiento automático en 1100 píxeles, selección protegida y cancelación. Implementación local, sin publicar.

Verificación de esta ampliación: 129 pruebas del motor de hojas y 18 recorridos de navegador aprobados; compilación, revisión de espacios e inspección visual de columnas y filas completas. No se modificaron libros reales del usuario durante las pruebas.

## Inmovilizar paneles y seleccionar su rango — 01/10/2026

Corregido el flujo que reducía columnas y filas completas a su primera celda. Vista → Inmovilizar permite seleccionar con el panel abierto o escribir una celda, rango, columnas como A:C o filas como 1:4. La vista previa indica las filas y columnas que se fijarán desde el comienzo de la hoja. La opción por celda mantiene las filas previas y columnas a la izquierda; la opción «Hasta el final del rango» incluye su extremo. Los encabezados completos fijan únicamente su eje. Los comandos de fila superior y primera columna son idempotentes, y las confirmaciones reemplazan los errores anteriores. Detalles y límites: [EXCEL_VISTA_2026-09-30.md](EXCEL_VISTA_2026-09-30.md#corrección-de-inmovilización--01102026).

Verificación: 132 pruebas del motor de hojas y 19 recorridos de navegador aprobados, compilación y revisión de espacios. El recorrido adicional comprueba desplazamiento horizontal/vertical real, zoom, ventana estrecha, selección con el panel abierto, referencias escritas, celdas combinadas/ocultas, movilizar, deshacer/rehacer, reapertura y conservación de valores/fórmulas. Entrega local, sin publicar. Se conservó el borrador abierto del usuario antes de recargar y se confirmó la columna A fija en su navegador.
