# Pestaña Programador — entrega local del 30/09/2026

Se añadió Programador siguiendo la captura aportada y la documentación oficial de Microsoft para controles de formulario y XML. Se mantuvo la indicación del usuario de omitir macros y grabaciones: no hay Visual Basic, grabación, referencias de macros ni ejecución de código. Las comprobaciones se realizaron en la plataforma web; no se inspeccionó Excel de escritorio durante esta entrega.

Esta entrega permanece local. Guardar conserva el libro, los controles, los mapas y el último XML importado en este navegador. No se publicó en Vercel ni se migraron documentos.

## Controles disponibles

| Control | Comportamiento |
| --- | --- |
| Casilla | Escribe un valor lógico en su celda vinculada y refleja los cambios posteriores de la celda. |
| Botón de opción | Los botones que comparten una celda constituyen un grupo. Cada uno escribe un número distinto y la selección es excluyente. El valor inicial 0 indica ninguna opción. |
| Cuadro combinado / lista | Lee un rango horizontal o vertical de celdas y conserva el índice de la opción elegida, comenzando por 1. La lista y sus fórmulas se actualizan cuando cambian los datos del origen. El índice 0 no selecciona ningún elemento. |
| Control de número | Captura enteros con mínimo, máximo e incremento. Límites de 0 a 30000; los valores fuera del intervalo se rechazan. |
| Barra de desplazamiento | Captura enteros, en orientación horizontal o vertical. Admite incremento normal y cambio por PageUp/PageDown, acotado al mínimo/máximo. |
| Etiqueta | Muestra texto fijo o el valor actual de una celda, incluida una fórmula, sin reemplazarla. |
| Cuadro de grupo | Marco con título para organizar visualmente el formulario. El grupo funcional de los botones de opción se define por su celda vinculada, no por la posición dentro del marco. |
| Botón | Acciones propias de la plataforma: ir a una celda, guardar o recalcular el libro. No asigna ni ejecuta una macro. |
| Entrada de texto web | Control propio para introducir texto literal, incluido texto que comienza con `=`. No representa un TextBox ActiveX. |

Insertar abre una galería con los diez tipos. Propiedades permite cambiar título, vínculo, origen de lista y parámetros correspondientes al tipo, además de posición, dimensiones, fuente, tamaño, texto, relleno, habilitación e impresión. Las opciones de vínculo no aparecen para el botón ni el cuadro de grupo.

Modo Diseño impide capturar valores y permite mover/redimensionar con los controles del objeto. También admite flechas y Shift+flechas en los manejadores; el arrastre tiene en cuenta el zoom. En modo de uso, las entradas escriben a través del mismo motor de edición y cálculo que la cuadrícula. El menú contextual abre las propiedades del control seleccionado. Aplicar propiedades usa el objeto del formulario abierto, aunque posteriormente se pulse otro control.

Las escrituras respetan validación de datos, celdas bloqueadas y rangos autorizados. La protección de hoja bloquea la creación y el cambio de propiedades, pero un control puede escribir en una celda que tenga permiso de edición. Un vínculo que contenga una fórmula queda bloqueado. Las listas no pueden incluir su propia celda de salida. Se evitan escritores duplicados en una celda salvo los botones de un mismo grupo.

Insertar/eliminar filas o columnas y desplazar celdas trasladan los vínculos, rangos de entrada y destinos de navegación. Se impide eliminar un vínculo sin cambiarlo primero. Los controles flotan en posición fija; no se desplazan ni redimensionan automáticamente con las celdas. Deshacer/Rehacer y Guardar conservan su modelo.

Los controles habilitados para impresión se incluyen en el área utilizada y en la vista previa/PDF, con sus textos, opciones y valores actuales. Los manejadores de diseño no se imprimen. Las ventanas adicionales de Vista siguen mostrando celdas: los controles flotantes se usan en la principal y se representan en Diseño de página mediante el motor de impresión.

## XML

| Acción | Comportamiento |
| --- | --- |
| Origen | Añade un XML de datos o un XSD admitido, muestra raíz, espacio de nombres, registro y campos. Permite crear varios mapas con nombres únicos y navegar a la celda vinculada a un campo. Crear el mapa no importa valores. |
| Propiedades del mapa | Nombre, primera celda, encabezados y número de filas a exportar. Un mapa inferido puede establecer texto, decimal, entero, lógico o fecha ISO por campo. Los tipos de un XSD quedan fijados por el esquema. |
| Importar | Archivo local con vista previa de los primeros registros. Valida raíz, registro, espacios de nombres, campos y tipos antes de escribir. La carga de encabezados y datos es atómica y conserva los formatos/comentarios de las celdas. El texto se mantiene literal, incluidos ceros iniciales y expresiones con `=`. |
| Actualizar datos | Prepara de nuevo la importación del último XML guardado en el mapa y muestra una vista previa. No consulta una conexión remota ni vuelve a leer automáticamente un archivo externo. |
| Exportar | Descarga XML UTF-8 con los valores actuales de las celdas, incluidos resultados calculados. Conserva espacios de nombres y atributos del modelo/template, escapa el texto y comprueba los tipos y errores de fórmula. Los campos opcionales vacíos del esquema se omiten. |
| Eliminar mapa | Quita la asociación XML y conserva los datos de las celdas. |

Importar rechaza destinos con fórmulas. Para reemplazar otros valores existentes se debe marcar la opción correspondiente en la vista previa. Al cargar menos registros se limpian solamente los valores anteriores que pertenecen al mapa y siguen sin modificar; las ediciones manuales fuera del nuevo destino se conservan. Los mapas no pueden importar sobre otro mapa vigente. La protección, los límites A1:Z100 y las validaciones se comprueban antes de escribir.

Después de un cambio estructural de filas, columnas o desplazamiento de celdas, el mapa exige recrearse antes de importar o exportar. Se impide reutilizar referencias antiguas de forma silenciosa. Cambiar el destino desde Propiedades no mueve ni elimina los datos existentes.

## Alcance del XML y de los complementos

- XML admite un registro plano directamente en la raíz o un único tipo de registro plano repetido debajo de ella. Los campos pueden ser elementos simples o atributos. Incluye nombres Unicode y espacios de nombres; rechaza contenido mezclado, campos anidados y campos repetidos dentro de un registro. El archivo local tiene un límite de 1 MB. No admite DTD ni entidades externas.
- XSD admite una raíz global, tipos complejos en línea o declarados y una secuencia plana, con atributos en el registro, cardinalidad básica y tipos `string`, `integer`, `int`, `long`, `short`, `decimal`, `float`, `double`, `boolean` y fecha ISO `AAAA-MM-DD`. Los enteros se limitan a la precisión segura de JavaScript; los tipos int/short respetan sus límites. Se comprueban campos obligatorios, campos inesperados y el orden de la secuencia. Las fechas con zona horaria, las restricciones/facetas, referencias, choice, include/import, herencia, elementos nulos y esquemas anidados no se admiten. Esto no constituye un validador general de XSD ni una implementación completa de mapas XML de Excel.
- La validación de captura exige valores no vacíos para los campos obligatorios. El modelo no conserva todas las diferencias léxicas del XML: un número tipado puede normalizarse al importar/exportar. Se preservan como texto los códigos declarados de texto.
- Complementos muestra un catálogo informativo de los motores incluidos: FormulaJS 4.6.1, gráficos SVG Arles y nspell 2.1.5. No es una tienda, un instalador ni un sistema de ejecución de extensiones externas.
- Complementos Excel/COM y paquetes Smart Document se muestran deshabilitados con su explicación. ActiveX, Power Pivot, UserForms y ejecución de cuadros de diálogo VBA no están disponibles. Las acciones de botón son funciones explícitas del editor web.
- Archivo sigue excluido. El motor conserva el límite A1:Z100 y su almacenamiento local; no importa/exporta controles, mapas ni proyectos de VBA como XLSX/XLSM nativos. ECMA-376 y MS-XLSX describen interoperabilidad que este modelo propio todavía no implementa por completo.

## Fuentes primarias

- [Formularios, controles de formulario y ActiveX](https://support.microsoft.com/es-es/excel/overview-of-forms-form-controls-and-activex-controls-on-a-worksheet).
- [Controles de formulario](https://support.microsoft.com/es-es/excel/form-controls).
- [Agregar una lista o un cuadro combinado](https://support.microsoft.com/es-es/excel/add-a-list-box-or-combo-box-to-a-worksheet-in-excel).
- [Usar controles de formulario](https://support.microsoft.com/es-es/excel/how-to-use-the-forms-controls-on-a-worksheet-in-excel).
- [Información general de XML en Excel](https://support.microsoft.com/en-us/excel/overview-of-xml-in-excel).
- [Asignar elementos XML a celdas](https://support.microsoft.com/en-us/excel/map-xml-elements-to-cells-in-an-xml-map).

## Implementación y verificación

Modelo: `sheet-developer-model.js`. Galería, cinta, diseño, propiedades e importación/exportación: `sheet-developer.js`. Se integran con estructura, cálculo, protección, estadísticas y motor de impresión, y se incluyen en el servidor y la compilación.

Doce pruebas nuevas del modelo cubren vínculos y recálculo, listas y grupos de opciones, límites, texto literal, acciones declaradas, protección, referencias estructurales y escritura XML atómica sin pérdida de fórmulas/datos. El recorrido del navegador utiliza un libro de QA aislado: diez tipos de control, listas dinámicas, grupos, límites, propiedades, estilos, diseño, movimiento, protección, XML/XSD reales, atributos y espacios de nombres, exportación descargada, campos opcionales, registros vacíos, texto Unicode, DTD rechazado, actualización, Deshacer, impresión y reapertura. No modifica libros reales del usuario.

Verificación acumulada: 129 pruebas del motor de hojas y 34 generales/documentales, más 17 recorridos de navegador, aprobados. La compilación y la revisión de espacios también pasan. Se revisaron visualmente los controles, el origen XML y el diseño a 1920 y 1100 píxeles. Entrega local, sin publicar.
