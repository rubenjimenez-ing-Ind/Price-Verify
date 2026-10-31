# P04 · Datos y carrito completados

- `dataService` expone búsqueda pública y administración de productos, y
  operaciones de carrito transaccionales.
- `npm run probar:flujo`: 15/15 pasos correctos; verifica suma de cantidades,
  eliminación con cero, recálculo del total y precio unitario congelado.
- `npm run db:demo`: ocho productos creados; incluye discrepancias y productos
  sin precio de etiqueta.
- `npm run db:limpiar -- --prueba`: finalizó correctamente.
- `npm test`: 23 pasaron. `npm run build`: correcto.
- La fachada pública no importa directamente el pool; solo
  `src/lib/datos/` usa `src/lib/db/conexion.ts`.

La fase 4 continúa abierta hasta implementar y verificar P05 (API).
