# PriceVerify · Aceptación

Ejecutar en el despliegue de Vercel con una sesión de administrador y una
ventana privada para el cliente. Los resultados y evidencias quedan pendientes
de validación manual en ese despliegue.

| ID | Acción | Resultado esperado | Resultado obtenido | Evidencia | Observación |
|---|---|---|---|---|---|
| A-01 | Como admin, crear Arroz Diana (7701, actual $4.500, etiqueta $4.500) | Aparece en el catálogo | | | |
| A-02 | Crear Aceite Premier (actual $12.000, etiqueta $11.000) | Creado; el catálogo marca discrepancia | | | |
| A-03 | Crear Pan Bimbo (actual $3.000, sin etiqueta) | Creado; sin discrepancia | | | |
| A-04 | Subir una foto a Arroz Diana | La foto aparece en catálogo y ficha | | | |
| A-05 | Sin login, buscar “arroz” | Encuentra Arroz Diana | | | |
| A-06 | Consultar Aceite Premier | Alerta: estante $11.000; vigente $12.000 | | | |
| A-07 | Consultar Pan Bimbo | Sin alerta | | | |
| A-08 | Agregar Arroz Diana ×2 | Total $9.000 | | | |
| A-09 | Agregar Aceite Premier ×1 | Total $21.000 y alerta | | | |
| A-10 | Agregar Arroz Diana ×1 adicional | Cantidad 3; total $25.500 | | | |
| A-11 | Bajar Aceite Premier a 0 | Se elimina; total $13.500 | | | |
| A-12 | Cambiar precio de Arroz Diana a $5.000 y releer el carrito | El ítem conserva $4.500 | | | |
| A-13 | Agregar un producto con cantidad 0 | Rechazo con mensaje | | | |
| A-14 | Vaciar el carrito | Carrito vacío; puede empezar otra sesión | | | |
| A-15 | Recargar la página del cliente | El carrito persiste con el mismo device_id | | | |
| A-16 | Abrir `/admin` sin sesión | Redirige al login | | | |
| A-17 | Agregar al carrito un producto sin foto y uno con foto | Muestra la foto cuando existe; usa un marcador neutro cuando falta | Local: «Sin foto» visible en ficha y carrito; foto real pendiente | Navegador local | La subida real requiere `BLOB_READ_WRITE_TOKEN` |
| A-18 | Simular más de 30 minutos de inactividad y volver a consultar el carrito | La sesión vencida se cierra y se crea otra | Local: probado con 31 minutos en Postgres; ambas rutas de cierre correctas | Prueba Postgres local | Repetir en Vercel |
| A-19 | Abrir el escáner y leer el código de un producto con la cámara | El código busca el producto; si no hay permiso/cámara, permite búsqueda manual | Local: fallback sin cámara comprobado; lectura física pendiente | Navegador local | Probar en celular mediante HTTPS; instrucciones en README |
