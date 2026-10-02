# Espacio de trabajo y fidelidad XLSX — 2 de octubre de 2026

El editor ocupa toda la ventana. Los libros importados abren con una barra compacta y sin el panel de bienvenida; las fichas y el botón de expansión permiten acceder a la cinta completa. La preferencia de expansión se guarda localmente. Las pestañas de hojas y el zoom comparten una fila inferior.

Se corrigieron los anchos OOXML (sin sumar dos veces el relleno), las coordenadas EMU del logotipo, los bordes compartidos y el perímetro de combinaciones, el recorte de texto centrado y la negrita parcial del texto enriquecido. Los filtros ocupan menos espacio para evitar cortar encabezados. La conversión de anchos usa el máximo de dígito de Calibri 11 (7 px); otros tipos de letra pueden requerir métricas distintas.

Las validaciones de lista importadas muestran selectores persistentes y cargan sus opciones al enfocarse. Se reconocen listas literales concatenadas. La paleta de etiquetas es propia: los colores de las etiquetas de Google no están guardados en el XLSX recibido.

Los borradores anteriores recuperan mejoras de presentación desde su original conservado, respetando los valores y los anchos modificados. La prueba de migración comprueba una nota añadida, un valor elegido y un ancho personalizado. La exportación de ediciones a XLSX continúa fuera del alcance; Original XLSX descarga el original intacto.

## Evidencia

El archivo descargado del enlace de Drive y el recibido en Descargas son idénticos (SHA-256 e431a0f1d314c9b4c8a3d98692942a79b87cd637df50d6457b4a5a532610393c). La inspección de H7 en Drive confirmó que la aparente diferencia de contenido era el recorte centrado de un texto largo.

Las pruebas reproducibles están en tests/sheet-xlsx.test.mjs y tests/sheet-xlsx-visual.browser.cjs. La segunda verifica tamaño de ventana, área de cuadrícula, cinta compacta/expandida, selección de listas con recálculo, texto parcialmente en negrita y migración de borradores. El límite de altura de la prueba de Inicio se actualizó a los 140 px de la cinta expandida; la barra compacta mide 40 px.

Las pruebas privadas del documento real y sus capturas se mantienen en tmp/ma-f-009-fidelity, excluido de la publicación junto con output, tests y documentos internos. El archivo no se incorpora al sitio.

Validación local final: 139 pruebas de modelo y los 20 recorridos de navegador de test:sheets aprobados; build y git diff --check aprobados. La comparación independiente del XML original confirmó 72.236 valores y 5.904 fórmulas sin diferencias, 5.904 resultados calculados coincidentes, descarga idéntica y recuperación del borrador sin errores JavaScript ni subidas del archivo.

Publicación pendiente: el intento de Vercel del 2 de octubre devolvió scope-not-accessible y whoami confirmó Logged out. No se desplegaron estos cambios. La versión local y sus pruebas están completas en el commit 739686a; se requiere restablecer la sesión de Vercel antes de publicar y verificar producción.

Actualización del 2 de octubre: sesión recuperada y publicación completada. Despliegue dpl_HBa15cw8YmdosSYcZ81xLJofBbHS READY, alias https://plataforma-integral-arles-demo.vercel.app. Prueba pública con el documento real aprobada: importación de cinco hojas, 5.904 resultados de fórmulas coincidentes, navegación a fila 4000, descarga original idéntica y recuperación del borrador, sin errores JavaScript ni subidas. Captura privada: tmp/ma-f-009-fidelity/imported-public.png. La solicitud de conexión a Supabase está pendiente de elegir un proyecto de destino; no se modificó ninguna base existente.
