# Verificación del motor Word: 50 DOCX

2 de octubre de 2026. Resultado local; no publicación nueva.

50/50 casos cumplen los controles, 84 páginas revisadas y 200 paquetes auditados. Los 50 originales conservaron su SHA-256.

- Gráficos Office: lectura de datos, edición, guardado, exportación con libro de datos y reimportación; tamaño de origen y selección correcta de cada gráfico.
- Imágenes PNG/JPEG preservadas; GIF y BMP importados como PNG y transparencias conservadas. Cada uno de los 50 DOCX incluye una ilustración editable. Las pruebas cambian ancho, alineación y descripción; la auditoría compara los píxeles de las imágenes normales tras exportar. Se ajustan a las columnas al reconstruir Word.
- Notas al pie y finales: referencias y texto editable, guardado y exportación como notas Word.
- Controles de contenido de texto: conservación de sus propiedades y edición sin crear elementos OOXML inválidos.
- Marcadores y enlaces internos: se conservan los destinos incluso dentro de títulos.
- Campos automáticos y fuentes bibliográficas: se conservan sus instrucciones y registros de origen al reconstruir el Word.
- Cuadros de texto VML rectangulares: se mantienen como cuadros editables al importar y volver a exportar.
- Tabulaciones, idiomas, texto de derecha a izquierda y alineaciones de párrafos con saltos internos.
- Actualización del lector sin sobrescribir borradores anteriores editados.
- Separadores de columnas desiguales centrados en su espacio, sin tocar el texto.

## Alcance real

- Esta colección cubre 50 combinaciones progresivas. No constituye una prueba de todas las funciones de Word ni de cualquier documento futuro.
- No hubo Word de escritorio ni LibreOffice disponibles para comparar la paginación con otro motor. Se revisaron las páginas producidas por la plataforma y se auditó el paquete con herramientas independientes.
- Sin cambios, la descarga conserva los bytes originales. Una corrección simple de texto conserva las demás partes del paquete. Los cambios estructurales reconstruyen las funciones admitidas y pueden variar el diseño.
- Las notas simples se pueden editar y conservan su tipo al exportar Word. En el PDF de la plataforma se agrupan al final del contenido; no se comprobó su composición al pie de cada página como Word.
- Se conservan instrucciones y resultados de los campos admitidos y las fuentes bibliográficas de Word. No se ha implementado la actualización completa de los índices y estilos bibliográficos importados dentro del editor.
- El formulario probado usa un control de texto. No cubre todos los controles de fechas, casillas, listas ni controles vinculados a datos. Se impide reconstruir vínculos de datos que no se puedan conservar.
- Se editan cuadros rectangulares VML independientes en línea. Los grupos, cuadros flotantes complejos y formas especiales requieren comprobar el original. SmartArt, OLE, EMF/WMF, macros y otras extensiones no están cubiertos por esta colección.
- Los gráficos de Office comprobados incluyen barras, líneas, circular, dispersión y radar. Importar combinaciones, cachés ausentes o varias series XY tiene límites explícitos. El diseño exacto de ejes y colores de Office puede variar.
- La prueba adicional cubrió los 16 tipos de gráfico de Arles: 13 exportan una representación de gráfico Office y 3 una imagen con metadatos para seguir editando al reimportarla en Arles.
- El caso árabe mantiene texto, idioma y dirección en DOCX y se ve correctamente en la página revisada. La extracción del PDF presenta una equivalencia de glifo entre dos códigos Unicode de la letra yeh; copiar o buscar ese texto puede depender del lector.
- Las tabulaciones comprobadas usan los intervalos predeterminados. No se verificaron todas las tabulaciones personalizadas, líderes ni alineaciones decimales.
- La revisión de formato de párrafo del caso 38 y el XML adicional del caso 46 se conservan completos al preservar el original; no se ha demostrado su edición estructural completa en una reconstrucción.
- Los borradores antiguos sin cambios se pueden actualizar desde el original. Si tienen ediciones anteriores, se conservan y se avisa cuando recuperar objetos necesita comparar una nueva importación.
- La biblioteca admite DOCX de hasta 50 MB. La regresión adicional comprobó un archivo de 26 MB y un borrador con más de 300.000 caracteres. Una fila combinada mayor que una página sigue bloqueando la impresión para evitar recortes.

## Reproducción

`npm test`, `npm run test:word`, `CORPUS_RUN=entrega-imagenes-50 npm run test:word:corpus`, `python tests/inspect-word-corpus.py --run entrega-imagenes-50 --render`. Artefactos en `output/word-corpus-50`, informe navegable y CSV con los 50 casos. Se generaron con python-docx y OOXML, no con el exportador Arles.
