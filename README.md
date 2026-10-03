# PriceVerify

PriceVerify permite consultar el precio y la disponibilidad registrados de
productos y calcular el total estimado de una lista de compra. El MVP también
identificará artículos sin stock suficiente. Hasta integrar una fuente externa,
los precios son los últimos datos registrados y no una cotización en tiempo real.

El alcance y las decisiones técnicas del MVP están documentados en
[alcance-y-decisiones.md](./alcance-y-decisiones.md).

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run type-check
```

## Estructura actual

- `src/app` — páginas y rutas de la aplicación
- `src/components` — componentes reutilizables
- `src/lib` — utilidades y lógica compartida
- `src/modules` — lógica de dominio, actualmente productos
- `data` — datos JSON de demostración

## Estado y limitaciones

- El catálogo usa los productos y precios registrados en archivos JSON.
- El login valida el correo y la contraseña con Supabase Auth y la clave
  publicable del proyecto. Supabase administra las credenciales en
  `auth.users`; la aplicación no almacena contraseñas. El token de sesión se
  mantiene en una cookie HttpOnly cifrada.
- El menú autenticado incluye **Mi perfil** para consultar el correo y guardar
  el nombre en los metadatos del usuario de Supabase Auth.
- Los administradores con `app_metadata.role=admin` ven **Usuarios** en el
  menú. La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa desde el servidor.
  Para habilitar el primer administrador, sigue los pasos en
  [supabase/assign-admin-role.sql](./supabase/assign-admin-role.sql), y luego
  vuelve a iniciar sesión para actualizar la sesión.
- Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
  `AUTH_SESSION_SECRET` en `.env.local`. No uses la clave `service_role` en el
  cliente ni la publiques.
- Para iniciar sesión debe existir una cuenta en **Authentication → Users**
  del proyecto Supabase.
- No hay sincronización con tiendas ni actualización de precios en tiempo real.
- Los archivos JSON son adecuados para el prototipo, no para escritura
  concurrente en producción.
