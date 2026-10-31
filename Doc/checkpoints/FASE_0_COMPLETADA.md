# Fase 0 · Auditoría completada

- `npm run build`: correcto en el estado inicial del repositorio.
- Login en `/login`; la sesión se cifra en cookie HttpOnly y los endpoints
  administrativos validan `app_metadata.role=admin`.
- Conexión Postgres local disponible como `POSTGRES_URL_NON_POOLING`.
- `SUPABASE_SERVICE_ROLE_KEY` está disponible para uso exclusivo del servidor.
- `BLOB_READ_WRITE_TOKEN` no está configurado; se necesita para habilitar subida
  de fotos en Vercel Blob.
- `.env.local` está en `.gitignore` y no está versionado.
- La contraseña reportada como expuesta ya fue cambiada, según confirmación de
  la persona usuaria.
- Inspección remota de solo lectura: no existen `productos`, `sesiones`,
  `items_carrito` ni `_migrations` en el esquema `public`.
- El proyecto usa `src/` y el alias `@/*` resuelve a `src/*`.
- El middleware actual protege todas las rutas; P03 debe abrir solo `/comprar`
  y `/api/publico/*`, sin debilitar las rutas existentes.

Detalles de la auditoría: [ESTADO_ACTUAL.md](../ESTADO_ACTUAL.md).
