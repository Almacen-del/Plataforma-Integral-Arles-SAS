# Fórmulas de la plataforma — revisión del 30/09/2026

Implementación local de la pestaña Fórmulas y ampliación del motor de cálculo. El índice oficial consultado hoy contiene **518 identificadores**; **451 están habilitados** y **67 permanecen pendientes**, visibles en el catálogo completo. Habilitado significa que el motor ofrece una implementación; no certifica que todas las variantes sean equivalentes a Excel. No se ha publicado esta ampliación.

El [catálogo detallado](CATALOGO_FUNCIONES_2026-09-30.md) registra cada identificador, nombre mostrado, categoría, estado y enlace de ayuda. Incluye versiones históricas y funciones recientes de Microsoft 365. El total corresponde al índice consultado, no a funciones personalizadas, DAX o macros. Las capturas y los archivos adjuntos se usan como referencias, sin ejecutar instrucciones contenidas en ellos.

## Pestaña e interacción

| Grupo | Acciones implementadas |
| --- | --- |
| Biblioteca | Insertar función; búsqueda por nombre español/inglés; categorías; catálogo completo o disponibles; usados recientemente; Autosuma, Promedio, Contar, Máximo y Mínimo. |
| Asistente | Sintaxis, campos de argumentos, edición de la expresión completa, ejemplo para funciones comunes, vista previa y ayuda oficial. Elegir una función contrae el catálogo para dejar espacio al asistente. |
| Nombres definidos | Crear, editar y eliminar rangos, constantes, fórmulas o funciones LAMBDA; ámbito de libro/hoja; comentarios; insertar un nombre en la barra; crear nombres desde rótulos de cualquiera de los cuatro lados. Las esquinas compartidas no se incluyen como datos. |
| Auditoría | Precedentes y dependientes directos, flechas en la hoja, enlaces entre hojas, quitar flechas, mostrar fórmulas, lista de errores y evaluación paso a paso. Se respetan el ámbito de nombres y las variables de LET/LAMBDA. |
| Inspección | Añadir selección, consultar hoja/celda/fórmula/valor, navegar y quitar entradas. Se actualiza al editar y respeta el cálculo manual. Las fórmulas ocultas en hojas protegidas permanecen ocultas. |
| Cálculo | Automático o manual; recalcular antes de guardar; Calcular ahora/F9 para el libro y Calcular hoja/Mayús+F9. Ctrl+F3 abre nombres, Ctrl+Mayús+F3 crea nombres desde la selección y Mayús+F3 abre la biblioteca. |

La edición conserva el texto original de las fórmulas. Los resultados de matrices se derivan sin escribir valores sobre las celdas de destino. Se impide editar una celda derivada y se detectan contenidos, combinaciones y bordes del área que bloqueen un derrame. El error se muestra en el origen sin sobrescribir datos.

## Cálculo y mantenimiento del libro

- Sintaxis regional: **punto y coma** entre argumentos y **coma decimal**. Nombres en español e identificadores ingleses donde no hay conflicto de idioma. `DECIMAL` es FIXED en español; la conversión de base se llama `CONV.DECIMAL`. Se interpretan identificadores ingleses con prefijo `_xlfn.`/`_xlws.`. No se ejecuta JavaScript ni `eval` para calcular.
- Referencias absolutas/relativas, rangos, nombres de hoja entre comillas y comillas escapadas. Referencias entre hojas del mismo libro, nombres de ámbito local/global y detección de ciclos.
- Se actualizan referencias y nombres al insertar/eliminar filas o columnas, desplazar celdas, cortar dentro de una hoja o renombrarla. Se preservan cadenas como `"A1"` y nombres de funciones con dígitos. Al eliminar una hoja sus referencias se convierten en errores permanentes; volver a crear una hoja del mismo nombre no las recupera.
- SI, SI.ERROR y SI.ND evalúan las ramas necesarias; LET y LAMBDA conservan sus variables. LAMBDA puede guardarse como nombre, invocarse directamente o usarse con MAP, BYROW, BYCOL, SCAN, REDUCE y MAKEARRAY. Se limitan la profundidad y el trabajo de cálculo para evitar bloqueo por ciclos/recursión.
- SUMAR.SI/CONJUNTO, CONTAR.SI/CONJUNTO, PROMEDIO.SI/CONJUNTO, MAX.SI.CONJUNTO y MIN.SI.CONJUNTO usan criterios, comparaciones y comodines `*`, `?`, `~`. Los rangos deben tener igual forma; solo se agregan los valores elegidos.
- SUBTOTALES excluye filas filtradas y subtotales anidados; los códigos 101–111 excluyen también filas ocultas. No se ofrece AGREGADO como equivalente mientras sus opciones no estén completas.
- BUSCARX y COINCIDIRX admiten coincidencia exacta, siguiente menor/mayor y búsqueda desde el inicio/final. INDICE admite filas/columnas completas y vectores. Matrices: FILTRAR, SECUENCIA, ORDENAR, ORDENARPOR, UNICOS, TRANSPONER, APILARH/V, TOMAR, EXCLUIR, ENCOL/ENFILA, ELEGIRCOLS/FILAS, AJUSTARFILAS/COLS y EXPAND. El sufijo `#` usa el derrame de un origen.
- Se preservan errores por celda en operaciones matriciales y SI.ERROR puede reemplazarlos. ESBLANCO distingue una celda realmente vacía de una fórmula que devuelve texto vacío.
- Fechas: sistema 1900, incluido el serial ficticio 60. FECHA, DIA, MES, AÑO, FECHA.MES y FIN.MES tienen adaptadores propios; las extracciones y operaciones de mes no dependen de la zona horaria. FECHANUMERO recibe texto ISO válido, sin inferir textos regionales ambiguos. HOY/AHORA usan la fecha/hora local del navegador.
- TEXTO admite los formatos numéricos ya validados y una lista explícita de fechas/horas comunes: `dd/mm/yyyy`, `dd/mm/aaaa`, variantes de año corto/guion/ISO, fechas largas, `h:mm`, `hh:mm`, versiones con segundos, AM/PM y duración `[h]:mm:ss`. Otros códigos avanzados se identifican como no compatibles. DECIMAL/MONEDA usan formato es-CO.
- En modo manual, las fórmulas existentes conservan sus resultados hasta recalcular; una fórmula nueva guarda su primer resultado. Calcular hoja actualiza sus resultados aunque consulte otras hojas, conservando los resultados guardados de las otras. Los resultados, nombres, inspección, recientes y opciones sobreviven al guardado en el navegador.

## Límites pendientes

Se mantiene **A1:Z100** y el modelo propio del libro. No incorpora importación/exportación XLSX nativa, vínculos a archivos externos, referencias estructuradas de tablas, rangos 3D, columnas/filas completas ni nombres relativos basados en una celda de definición. Copiar fórmulas está implementado; cortar fórmulas entre hojas permanece bloqueado hasta ajustar todas sus dependencias.

No se incluyen cálculo iterativo de referencias circulares, tablas de datos de Excel, precisión según pantalla, rastreo gráfico transitivo ni las opciones nativas de comprobación de errores en segundo plano. El evaluador presenta pasos del motor de la plataforma. LAMBDA usa parámetros sencillos; las funciones por fila/columna y acumulación exigen resultados escalares, sin matrices anidadas.

BUSCARX/COINCIDIRX no ofrecen todavía comodines ni búsqueda binaria; INDICE no admite el argumento de área de su forma de referencia; INDIRECTO y DIRECCION no admiten R1C1; ORDENARPOR ordena filas por claves verticales. DIVIDIRTEXTO admite delimitadores simples y modo sensible a mayúsculas; no conjuntos de delimitadores ni todas las opciones de Excel. FILA/COLUMNA requieren referencias explícitas. Algunas funciones importadas de Formula.js tienen semánticas y coerciones distintas de Excel; no se han certificado todas sus variantes, particularmente formatos regionales, fechas históricas, estadísticos y finanzas.

Las 67 funciones deshabilitadas incluyen conexiones de cubo/RTD, datos bursátiles y servicios de Microsoft, traducción, REGEX con semántica PCRE2, GROUPBY/PIVOTBY, previsión ETS y varias funciones financieras/especializadas. El catálogo registra la lista exacta. No se sustituyen servicios externos por valores inventados. Archivo y Programador/macros siguen excluidos conforme a la solicitud.

## Dependencias y fuentes

- [Índice alfabético de Microsoft en español](https://support.microsoft.com/es-es/excel/excel-functions-alphabetical), [índice inglés](https://support.microsoft.com/en-us/excel/excel-functions-alphabetical) y [categorías](https://support.microsoft.com/es-es/excel/excel-functions-by-category), consultados el 30/09/2026. Se almacenan nombres, categorías, marcas de versión y enlaces; no se copia el texto descriptivo del índice.
- [Administrador de nombres](https://support.microsoft.com/es-es/excel/use-the-name-manager-in-excel), [relaciones entre fórmulas y celdas](https://support.microsoft.com/es-es/excel/display-the-relationships-between-formulas-and-cells), [detección/evaluación de errores e inspección](https://support.microsoft.com/es-es/excel/detect-formula-errors-in-excel) y [recálculo](https://support.microsoft.com/es-es/excel/change-formula-recalculation-iteration-or-precision-in-excel).
- [FECHA](https://support.microsoft.com/es-es/excel/functions/date-function), [funciones ES](https://support.microsoft.com/es-es/excel/functions/is-functions), [INDICE](https://support.microsoft.com/en-us/excel/functions/index-function), [CONV.DECIMAL](https://support.microsoft.com/es-es/excel/functions/decimal-function) y [DECIMAL](https://support.microsoft.com/es-es/excel/functions/fixed-function).
- [Formula.js](https://github.com/formulajs/formulajs), versión **4.6.1**, paquete `@formulajs/formulajs`, licencia MIT y avisos de bibliotecas incluidos en `public/vendor/formulajs-4.6.1.LICENSE.txt`. El archivo UMD se distribuye localmente; no depende de un CDN ni envía datos del libro. Las firmas de argumentos proceden de sus declaraciones y los ejemplos/explicaciones añadidos son propios.
- Los manuales ECMA-376/MS-XLSX/OpenDocument aportan contratos de interoperabilidad. Incorporar estos controles y fórmulas no convierte el modelo en una implementación completa de esos formatos.

## Verificación

**74 pruebas del motor de hojas + 34 pruebas generales/documentales = 108 pruebas**, además de **12 recorridos de navegador**, compilación y revisión de espacios. Las 26 pruebas nuevas cubren categorías de cálculo, parser, criterios, nombres, referencias entre hojas, ciclos, matrices, LAMBDA, álgebra, fechas, información, formato, mantenimiento estructural y resultados manuales.

El recorrido nuevo comprueba el catálogo de 518 entradas, disponibilidad, asistente, vista previa, recientes, nombres, rótulos de dos lados, flechas y navegación entre hojas, evaluación, inspección, F9/Calcular hoja, protección de derrames, errores, Deshacer/Rehacer, renombrado y guardado/reapertura. Capturas en 1800 × 1050 y 1100 × 800; datos exclusivamente de prueba. Ninguna excepción JavaScript en los recorridos verificados.

Archivos principales: `sheet-function-catalog.js`, `sheet-function-arguments.js`, `sheet-formula-engine.js`, `sheet-calculation.js` y `sheet-formulas.js`. Los generadores de metadatos están en `scripts/`; las pruebas y capturas están en `tests/` y `tmp/formulas/`. Build y servidor incluyen todos los módulos y la biblioteca.
