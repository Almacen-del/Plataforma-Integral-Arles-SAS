# Entrega del motor de hojas · 01/10/2026

Publicación solicitada por el usuario antes de comenzar el motor de PDF.

Incluye Inicio, Insertar, Disposición de página, Fórmulas, Datos, Revisar, Vista y controles declarativos/XML de Programador. Archivo y macros/grabación siguen omitidos por petición del usuario. La selección permite varias filas/columnas completas y el panel de inmovilización acepta la selección completa o referencias escritas, con vista previa y confirmaciones actualizadas.

Verificación previa a publicación: 132 pruebas del motor de hojas, 19 recorridos en navegador, 34 pruebas generales/documentales, compilación y revisión de espacios. Los recorridos usan datos de QA aislados. La corrección de inmovilización también se comprobó en el navegador del usuario conservando su borrador.

Las funciones y límites están documentados en `EXCEL_DISENO_Y_MANUALES.md` y las entregas de cada ficha. El libro se conserva en el navegador; publicar el código no carga sus documentos o datos al servidor. Área de diseño A1:Z100 y modelo propio; no se afirma compatibilidad XLSX completa ni equivalencia con todo Microsoft Excel.

Publicación verificada: commit `c4f048d`, proyecto `plataforma-integral-arles-demo`, equipo `almacen-2787s-projects`, despliegue `dpl_6h4msojyNrpDXSZdvMdLsQANhtLA`, estado READY. Dirección: https://plataforma-integral-arles-demo.vercel.app/?editor=hojas

Comprobación pública: HTTP 200, módulo actualizado de Vista, selección A:C y confirmación «Inmovilización aplicada: Columnas A–C». Sin errores de página en agent-browser. Captura: `tmp/excel-publicado-2026-10-01.png`.
