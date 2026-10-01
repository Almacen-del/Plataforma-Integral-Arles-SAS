# Inspección de Inicio en Excel de escritorio

Fecha: 29 de septiembre de 2026. Inspección directa mediante Computer Use de la ventana `Libro1 - Excel` del usuario. Esta acta documenta menús y diálogos observados; no certifica que todas las operaciones se hayan probado con datos ni que estén implementadas en la web.

## Opciones observadas

| Grupo | Cinta y menús observados |
| --- | --- |
| Portapapeles | Pegar, Cortar, Copiar, Copiar formato, lanzador de Portapapeles. El menú Pegar ofreció mantener formato de origen, coincidir con destino y Pegado especial para el contenido actual del portapapeles. Falta comprobar sus variantes con celdas copiadas. |
| Fuente | Familia, tamaño, aumentar/disminuir tamaño, negrita, cursiva, subrayado simple/doble, bordes, relleno y color de texto. Paleta de relleno con colores del tema, tonos, colores estándar, sin relleno, más colores y selector de contraste alto. |
| Alineación | Superior/medio/inferior, izquierda/centro/derecha, disminuir/aumentar sangría, ajustar texto. Orientación: ángulo ascendente/descendente, texto vertical, girar arriba/abajo y diálogo. Combinar: combinar y centrar, horizontalmente, combinar celdas y separar. |
| Número | General, Número, Moneda, Contabilidad, Fecha corta/larga, Hora, Porcentaje, Fracción, Científica, Texto y Más formatos. Cinta: contabilidad, porcentaje, millares y aumentar/disminuir decimales. |
| Estilos | Formato condicional, tabla y estilos de celda. Galerías y editor de reglas inspeccionados, según detalle inferior. |
| Celdas | Insertar/eliminar celdas, filas, columnas y hoja. Formato: alto de fila, autoajustar alto, ancho de columna, autoajustar ancho, ancho predeterminado, ocultar/mostrar, renombrar, mover/copiar hoja, color de pestaña, proteger hoja, bloquear celda y formato de celdas. No se ejecutaron eliminaciones. |
| Edición | Autosuma, Rellenar, Borrar, Ordenar y filtrar, Buscar y seleccionar, según detalle inferior. |
| Complementos | Abre panel con búsqueda, Avanzado y Más complementos. Se observó cargando; no se instaló ni verificó ningún complemento. |

## Bordes

Menú observado: inferior, superior, izquierdo, derecho, sin borde, todos, externos, exterior grueso, doble inferior, inferior grueso, superior e inferior, superior e inferior grueso, superior e inferior doble. Herramientas: dibujar borde, dibujar cuadrícula, borrar borde, color de línea, estilo de línea y más bordes.

En Formato de celdas > Borde se observaron distintos estilos de línea, color automático, preestablecidos ninguno/contorno/interior, controles individuales y diagonales, con vista previa. El interior aparece deshabilitado al seleccionar una sola celda.

## Formato de celdas

Se abrieron sus seis pestañas:

- Número: categorías adicionales Especial y Personalizada, muestra contextual.
- Alineación: horizontal, vertical, sangría, ajustar texto, reducir hasta ajustar, combinar, dirección del texto y orientación en grados.
- Fuente: familia, estilo, tamaño, subrayado, color, fuente normal, tachado, superíndice, subíndice y vista previa.
- Borde: detalle anterior.
- Relleno: color de fondo, color/estilo de trama, efectos de relleno, más colores y muestra.
- Proteger: Bloqueada y Oculta; el propio diálogo explica que requieren proteger la hoja para que surtan efecto.

## Formato condicional

- Resaltar: mayor, menor, entre, igual, texto que contiene, una fecha, duplicados y más reglas.
- Superiores/inferiores: 10 superiores, 10 % superiores, 10 inferiores, 10 % inferiores, por encima/debajo del promedio y más reglas.
- Barras: seis colores con relleno degradado y sólido.
- Escalas: galería de escalas de dos y tres colores.
- Iconos: direccionales, formas, indicadores y valoración.
- Nueva regla: seis familias, incluida fórmula que determina las celdas. La regla de escala observada contiene estilo, tipos/valores/colores mínimo y máximo y vista previa.
- Borrar reglas y Administrar reglas están disponibles; sus flujos internos no se completaron en esta sesión.

Estilos de celda: bueno/malo/neutral; datos y modelo; títulos y encabezados; cuatro intensidades de seis énfasis; formatos numéricos; nuevo estilo y combinar estilos. Tabla: galerías clara, media y oscura, nuevo estilo de tabla y de tabla dinámica.

## Edición

- Autosuma: suma, promedio, contar números, máximo, mínimo y más funciones.
- Rellenar: abajo, derecha, arriba, izquierda, otras hojas, series, justificar y relleno rápido.
- Series: filas/columnas; lineal, geométrica, cronológica, autorrellenar; tendencia, incremento y límite; unidades fecha, día laborable, mes y año.
- Borrar: todo, formatos, contenido, comentarios, hipervínculos y quitar hipervínculos. Son comandos diferentes y no deben reducirse a borrar el valor.
- Ordenar/filtrar: A-Z, Z-A, personalizado, filtro, borrar filtro y volver a aplicar.
- Buscar/seleccionar: buscar, reemplazar, ir a, ir a especial, fórmulas, comentarios, formato condicional, constantes, validación, objetos y panel de selección.
- Ir a Especial: comentarios, constantes, fórmulas por tipo, blancos, región/matriz actual, objetos, diferencias entre filas/columnas, precedentes/dependientes, última celda, solo visibles, formatos condicionales y validaciones.

## Limitación de las pruebas y estado dejado

Se creó Hoja2 para pruebas. La herramienta `set_value` devolvió valores para A1 y B2:B4 en el árbol de accesibilidad, pero esos valores no aparecieron en la captura y Autosuma propuso `=SUMA()` sin rango. Por tanto, esa vía de entrada no quedó validada y no se consideran aprobadas las pruebas de cálculo ni de transformación de datos. El foco de accesibilidad también permaneció apuntando a la búsqueda de Microsoft pese a seleccionar la cuadrícula/cuadro de nombres.

Se cancelaron los diálogos sin aplicar formatos y se canceló la fórmula incompleta. Se dejó Excel en Inicio, Hoja1 y D10, con la Hoja2 de prueba añadida; no se guardó el libro ni se publicó código web durante esta inspección.

## Comprobaciones funcionales pendientes

Con una entrada de datos verificada: copiar/cortar/pegados especiales y copiar formato; aplicar/restaurar formatos; combinar con datos y verificar avisos; cálculos y ajuste de referencias; reglas condicionales con prioridad/rangos; creación de tablas reales; inserciones/eliminaciones; series; ordenación multicolumna/filtros; buscar/reemplazar e Ir a Especial. La inspección de menús no sustituye estas pruebas.
