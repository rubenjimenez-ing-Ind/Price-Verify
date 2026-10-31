# Fase 4 · Datos y API completados

- `npm run probar:flujo`: 15/15 pasos correctos, 0 fallas.
- `npm run db:demo`: ocho productos de demostración disponibles en Supabase.
- `npm run db:verificar`: 0 fallas; esquema, restricciones, RLS y transacción de
  integridad correctos.
- Verificación HTTP de producción local:
  - `GET /api/admin/productos` sin sesión → 401, `no-store`.
  - `POST /api/admin/productos` sin sesión → 401, `no-store`.
  - `GET /api/publico/productos?q=arroz` → 200; devuelve `PV-DEMO-001`.
  - Ficha de `PV-DEMO-002` → 200; alerta activa y precio cobrado 12000.
- `npm test`: 23 pasaron. `npm run build`: correcto.
- Pendiente la comprobación manual de operaciones admin con una sesión
  autenticada del navegador; no se usó ni solicitó la contraseña de Supabase.
