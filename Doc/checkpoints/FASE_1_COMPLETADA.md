# Fase 1 · Base de datos completada

Migraciones aplicadas a Supabase:

- `202610310001_priceverify_m1.sql`
- `202610310002_priceverify_m2.sql`

`npm run db:verificar`: 0 fallas. Tablas `productos`, `sesiones`,
`items_carrito`, vista `v_carrito`, restricciones e índices únicos, y RLS
activo en las tres tablas. Las pruebas transaccionales confirmaron el rechazo
de duplicados (`23505`), valores inválidos (`23514`) y el subtotal generado
de 9000 para 2 × 4500. La transacción de prueba terminó en `ROLLBACK`.

`npm run build`: correcto.
