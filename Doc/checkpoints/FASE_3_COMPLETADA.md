# Fase 3 · Infraestructura del servidor completada

- Conexión `pg` configurada con `POSTGRES_URL_NON_POOLING`, parsers PostgreSQL
  y transacciones; se elimina `sslmode` solo de la copia en memoria de la URL
  para respetar `ssl.rejectUnauthorized=false`.
- Adaptador `obtenerUsuario` / `exigirUsuario` valida el usuario y el rol
  `app_metadata.role=admin` mediante la sesión Supabase existente.
- Se agregaron `device_id`, respuestas JSON sin caché, esquemas Zod,
  formato COP, carga Vercel Blob lazy y `/api/admin/ping`.
- Middleware deja públicas `/comprar` y `/api/publico/*`; las rutas protegidas
  conservan su verificación. El login redirige a `/admin`.
- Verificación runtime sin sesión: `GET /api/admin/ping` responde 401 con
  `Cache-Control: no-store`; `/comprar` no redirige a login (aún no tenía su
  página implementada). No se pudo comprobar el flujo autenticado sin operar
  una sesión del navegador.
- `npm run build`: correcto; `npm test`: 23 pruebas correctas.
- Pendiente de configuración: falta `BLOB_READ_WRITE_TOKEN`; no se podrá probar
  una subida real hasta configurar el token.
