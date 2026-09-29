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
