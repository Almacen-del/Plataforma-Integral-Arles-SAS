# Pestaña Vista — entrega local del 30/09/2026

Se amplió Vista utilizando la captura de la cinta de Excel aportada por el usuario y la documentación oficial de Microsoft. Se inspeccionó y probó la plataforma en el navegador. No se controló Excel de escritorio durante esta entrega. Archivo y Programador/macros continúan excluidos.

Los cambios están en el proyecto local. Esta entrega no se ha publicado en Vercel. Guardar conserva el libro, las vistas y las ventanas en este navegador.

## Funciones disponibles

| Grupo | Comportamiento |
| --- | --- |
| Vistas de libro | Normal mantiene la cuadrícula editable. Vista previa de salto de página muestra las páginas calculadas, sus números, límites automáticos discontinuos y saltos manuales continuos en azul; sombrea las celdas fuera del área impresa. Diseño de página muestra el papel, los márgenes, la escala, los títulos repetidos y el encabezado/pie calculados por el motor de impresión. |
| Saltos | Se pueden añadir o mover por fila/columna desde el panel y arrastrar sus controles azules. Respeta las dimensiones reales, las combinaciones y la protección. Si la escala está en Ajustar a páginas, pide cambiar a porcentaje antes de mover saltos, porque ese modo ignora los saltos manuales. |
| Diseño de página | Seleccionar una celda en el papel actualiza la barra de fórmulas. Doble clic lleva el foco a su edición. Los cambios recalculan fórmulas y reconstruyen las páginas. Pulsar encabezado o pie abre su edición, con las variables existentes de hoja, libro, página, páginas y fecha. |
| Mostrar | Cuadrícula, encabezados y barra de fórmulas se muestran u ocultan. Diseño de página dispone además de reglas en centímetros. Las opciones de pantalla no cambian las casillas Imprimir cuadrícula/encabezados de Disposición de página. La regla se habilita solo en Diseño de página. |
| Zoom | Porcentaje entre 10 y 400, preajustes, 100 %, acercar/alejar y Ampliar selección. El ajuste considera ancho y alto de las filas/columnas visibles y el espacio disponible. El zoom de pantalla se conserva por hoja y es independiente de la escala de impresión. |
| Inmovilizar | Fila superior, primera columna, filas y columnas anteriores a la celda seleccionada, o movilizar. Se usan las alturas y anchos efectivos, incluidos ocultaciones y filtros. Se rechazan límites que atraviesen combinaciones. Se mantiene el ajuste anterior de fila fija. No se inmoviliza en Diseño de página. |
| Dividir | División horizontal, vertical o en cuatro paneles según la selección; volver a pulsar elimina la división. Los paneles permiten desplazarse y seleccionar/editar por separado; sus celdas comparten el mismo modelo y cálculo. Dividir e inmovilizar son excluyentes. |
| Ventanas | Hasta cuatro ventanas adicionales del mismo libro dentro de la plataforma. Cada una puede mostrar una hoja visible diferente, navegar por dirección o teclado, editar valor/fórmula y pegar texto tabulado. La protección y validación de datos se aplican a todas las escrituras. Cerrar u ocultar una ventana conserva la hoja y sus datos. |
| Organizar y comparar | Organización vertical, horizontal, mosaico, cascada y en paralelo. Activar/cambiar, ocultar/mostrar y restablecer posición. El desplazamiento sincrónico mantiene la misma fila/columna al comparar hojas con dimensiones o zoom diferentes; se puede desactivar para desplazarlas independientemente. |
| Vistas personalizadas | Añadir con nombre único, mostrar y eliminar. Conserva presentación, zoom, selección y desplazamiento; opcionalmente impresión, filtros y filas/columnas ocultas. Restaurar una vista no reemplaza valores, fórmulas ni comentarios. Si se insertaron/eliminaron filas o columnas o se desplazaron celdas desde que se guardó, exige guardar una vista nueva para evitar aplicar referencias antiguas. |

Las ventanas adicionales tienen su propia dirección y barra de edición. La cinta, la barra principal de fórmulas y los ajustes de vista/zoom se aplican a la ventana principal. Activar una ventana adicional identifica el destino de Ocultar y la coloca al frente en Cascada; no cambia el destino de las herramientas de Inicio. Las ventanas adicionales muestran celdas y sus formatos; los objetos flotantes y su edición permanecen en la ventana principal. Los paneles divididos admiten selección de una celda, navegación, edición y pegado; la selección de rangos por arrastre y las herramientas completas de formato permanecen en la principal.

## Límites explícitos

- Son ventanas internas de este libro. No son ventanas del sistema operativo, no comparan archivos externos y no controlan monitores.
- Diseño de página representa las áreas de impresión configuradas o el contenido utilizado. En una hoja vacía muestra una página inicial con A1:F12 sin crear contenido. No reproduce la cuadrícula ilimitada de Excel.
- La regla usa centímetros y no permite arrastrar márgenes. Se editan en Disposición de página.
- Las vistas personalizadas pertenecen a una hoja. No reproducen la restricción de Excel de deshabilitarlas cuando hay tablas en el libro ni los formatos de vistas OOXML. La estructura modificada invalida la restauración; no se intenta adaptar filtros guardados a columnas diferentes.
- Se mantiene A1:Z100, guardado local y el modelo propio del editor. No se afirma interoperabilidad XLSX completa ni equivalencia de todas las funciones de Excel.
- Las limitaciones existentes de impresión, objetos y coautoría siguen documentadas en sus entregas. Macros y grabación siguen omitidas por petición del usuario.

## Fuentes primarias

- [Inmovilizar paneles para bloquear filas y columnas](https://support.microsoft.com/es-es/excel/get-started/freeze-panes-to-lock-rows-and-columns).
- [Dividir paneles en áreas independientes](https://support.microsoft.com/es-es/excel/split-panes-to-lock-rows-or-columns-in-separate-worksheet-areas).
- [Crear, aplicar o eliminar una vista personalizada](https://support.microsoft.com/es-es/excel/create-apply-or-delete-a-custom-view).
- [Ver saltos de página](https://support.microsoft.com/es-es/excel/view-page-breaks).
- [Insertar, mover o eliminar saltos](https://support.microsoft.com/es-es/excel/insert-move-or-delete-page-breaks-in-a-worksheet).
- [Comparar dos o más hojas al mismo tiempo](https://support.microsoft.com/es-ES/Excel/compare-two-or-more-worksheets-at-the-same-time).
- [Ocultar o mostrar hojas y ventanas](https://support.microsoft.com/es-es/excel/hide-or-unhide-worksheets).
- [Escalar una hoja y compatibilidad de las vistas](https://support.microsoft.com/es-es/excel/scale-a-worksheet).
- [Encabezados y pies de página](https://support.microsoft.com/es-es/excel/headers-and-footers-in-a-worksheet).
- [Configurar página](https://support.microsoft.com/es-es/excel/page-setup).

## Implementación y verificación

Modelo: `sheet-view-model.js`. Cinta, paneles y vistas: `sheet-view.js`. La cuadrícula principal conserva las integraciones de Inicio, Insertar, Disposición de página, Fórmulas, Datos y Revisar. Los módulos nuevos se incluyen en el servidor local y la compilación. La serialización de impresión elimina los estilos de inmovilización y las marcas de la vista para no imprimir elementos de navegación.

Once pruebas del modelo verifican límites, migración, combinaciones, división, dimensiones y zoom, sincronización, papel y paginación, escritura atómica de saltos, restauración sin pérdida de datos, opciones de guardado, estructura modificada y ventanas separadas de las hojas. El recorrido nuevo del navegador prueba posiciones físicas de filas y columnas inmovilizadas, cuatro paneles editables, movimiento y arrastre real de saltos, reglas, selección/edición sobre papel, encabezados, controles visuales separados de impresión, vistas guardadas, fórmulas entre hojas, navegación/edición con teclado, sincronización, organización, ocultar/mostrar ventanas, protección y reapertura.

Las pruebas utilizan exclusivamente un libro de QA en un perfil de navegador aislado. Se inspeccionaron las capturas de páginas, saltos, ventanas y ancho de 1100 píxeles. Resultado acumulado: 117 pruebas del motor de hojas y 34 generales/documentales aprobadas (151 en total); los 16 recorridos de navegador pasaron, incluidos todos los anteriores. También pasaron la compilación y `git diff --check`. No se detectaron errores de página en el recorrido nuevo ni en la comprobación final con agent-browser. La hoja vacía también se verificó visualmente en Diseño de página.

## Corrección de inmovilización — 01/10/2026

El panel anterior usaba únicamente la primera celda de la selección y mantenía un mensaje de error aun después de activar una opción válida. Seleccionar la columna A completa producía A1, que no constituye una celda de división. Ahora el panel recibe la selección completa, sigue sus cambios mientras permanece abierto y permite escribir la referencia directamente.

- **Antes de la celda inicial** conserva las filas anteriores y columnas a su izquierda: C4 fija filas 1–3 y columnas A–B.
- **Hasta el final del rango** fija las filas y columnas desde el comienzo de la hoja hasta su extremo: A1:C3 fija filas 1–3 y columnas A–C. Se elige automáticamente al seleccionar varias celdas.
- Una selección de columnas completas fija únicamente columnas; una selección de filas completas fija únicamente filas. Se aceptan referencias como A:C y 1:4. Seleccionar B:D fija A–D: los paneles siempre comienzan en la primera columna o fila. La vista previa muestra el resultado antes de aplicar.
- Las opciones de fila superior y primera columna son explícitas e idempotentes. El estado actual y el mensaje de confirmación se actualizan al aplicar o movilizar paneles.
- La vista previa y la aplicación comparten validación: se rechaza una división de celdas combinadas, una referencia inválida o la inmovilización de toda la hoja. Movilizar paneles también funciona si se cambió a Diseño de página.

La selección por rango hasta su extremo y las referencias abreviadas son ayudas propias de la plataforma; la opción por celda conserva el comportamiento de división de Excel. Se mantienen A1:Z100 y la incompatibilidad de activar inmovilización desde Diseño de página.

Verificación adicional: tres pruebas del modelo y `tests/sheet-freeze.browser.cjs`, con arrastre y Mayús reales, selección con el panel abierto, referencias escritas, mensajes de error/éxito, medidas de posición al desplazarse por ambos ejes, zoom, ancho de 1100 píxeles, filas/columnas/encabezados ocultos, combinaciones, deshacer/rehacer, reapertura y conservación de valores y fórmulas. Captura: `tmp/sheet-freeze-range.png`.
