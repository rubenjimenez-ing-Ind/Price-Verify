# Fase 7 · Mejoras opcionales

- El carrito muestra la foto del producto o un marcador neutro cuando no hay
  imagen.
- Las sesiones con más de 30 minutos de inactividad se cierran al consultar el
  carrito; también existe una ruta de mantenimiento protegida para cerrar
  sesiones vencidas.
- Se agregó el escáner QR/código de barras en el cliente, con permiso explícito
  de cámara y alternativa de búsqueda manual.
- Verificado localmente: `npm run db:verificar` sin fallas,
  `npm run probar:flujo` con 15 pasos correctos, `npm test` con 23 pruebas y
  `npm run build` correcto. También se probó el cierre por inactividad en
  Postgres y el fallback del escáner en un navegador sin cámara.
- **Pendientes:** probar el escaneo con cámara física en HTTPS, subir y mostrar
  una foto real tras configurar `BLOB_READ_WRITE_TOKEN`, y ejecutar A-01 a A-19
  en Vercel. En un celular, abre la versión HTTPS, concede acceso a cámara y
  escanea el código de un producto existente, por ejemplo `PV-DEMO-001`.
- No se hizo commit, push ni despliegue.
