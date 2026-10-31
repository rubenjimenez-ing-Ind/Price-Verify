# PriceVerify · Estado actual del repositorio

Auditoría P00. No se copiaron valores de variables de entorno ni se abrió el archivo
no versionado `usuarios-registrados.md`.

## 1. Versiones

| Paquete | Versión |
|---|---|
| next | 14.2.35 |
| react | 18.3.1 |
| typescript | 5.9.3 |
| tailwindcss | 3.4.19 |
| pg | No instalado |
| zod | 4.6.5 |
| @supabase/supabase-js | No instalado |
| @supabase/ssr | No instalado |
| @vercel/blob | No instalado |
| vitest | 2.1.9 |

## 2. Scripts de `package.json`

| Script | Comando |
|---|---|
| dev | `node scripts/tokenVercel.mjs && next dev` |
| build | `next build` |
| start | `next start` |
| lint | `next lint` |
| type-check | `tsc --noEmit` |

## 3. Estructura

El proyecto usa `src/`. No existen directorios `app/`, `lib/` ni
`components/` en la raíz; sus equivalentes están bajo `src/`.

```text
src/
  app/
    api/
      admin/users/
      auth/{login,logout,password,profile,recuperar,restablecer}/
      correo/prueba/
      data/[collection]/
      health/
    login/
    products/
    profile/
    prueba-correo/
    recuperar-contrasena/
    restablecer-contrasena/
    users/
  components/
    layout/
    products/
  lib/
  modules/
    auth/
    products/
supabase/
  assign-admin-role.sql
scripts/
  tokenVercel.mjs
data/
  products.json
  example.json
```

## 4. Alias

`@/*` apunta a `./src/*`.

## 5. Autenticación

- Login: `src/app/login/page.tsx`; autentica mediante `POST /api/auth/login`.
- La ruta `src/app/api/auth/login/route.ts` usa Supabase Auth REST y guarda una
  sesión cifrada en la cookie HttpOnly `priceverify_session`.
- `src/lib/auth-session.ts` valida y descifra la cookie; devuelve `userId`,
  `accessToken` y `expiresAt`.
- `src/modules/auth/admin.ts` consulta Supabase Auth y exige
  `app_metadata.role === 'admin'`. El endpoint de usuarios también usa este
  control.
- El login actualmente dirige a `/` (`src/app/login/page.tsx`); el middleware
  global está en `src/middleware.ts` y protege todas las rutas salvo una lista
  explícita. Su matcher excluye archivos estáticos y rutas con extensión.
- Cierre de sesión: `POST /api/auth/logout` elimina la cookie.
- El middleware actual no deja `/comprar` ni `/api/publico/*` fuera de la
  autenticación; habrá que conservar la protección existente y permitir esas
  nuevas rutas.

## 6. Acceso a datos

- Catálogo actual: JSON local mediante `src/lib/json-db.ts` y
  `src/modules/products/service.ts`.
- No se encontró uso de `pg` ni un pool de Postgres.
- Supabase Auth se consume por HTTP en las rutas existentes; no hay cliente
  `@supabase/*` instalado.

## 7. Migraciones

- No existe `supabase/migrations/`, ni mecanismo de migración, ni tabla de
  control de migraciones.
- Existe `supabase/assign-admin-role.sql`, ajeno a las tablas PriceVerify.
- Inspección remota de solo lectura completada mediante `POSTGRES_URL_NON_POOLING`:
  no existen `productos`, `sesiones`, `items_carrito` ni `_migrations` en
  `public`. No hay columnas previas que preservar.

## 8. Variables de entorno (solo nombres)

`.env.local` contiene nombres para Supabase Auth, claves publicables, claves
administrativas, Postgres y `AUTH_SESSION_SECRET`. La cadena directa disponible
es `POSTGRES_URL_NON_POOLING` (también existen nombres `POSTGRES_URL` y
`POSTGRES_PRISMA_URL`). Existe `SUPABASE_SERVICE_ROLE_KEY`.

`BLOB_READ_WRITE_TOKEN` no está presente en `.env.local` ni en `.env.example`.
`.env.local` coincide con `.gitignore`; `git ls-files '*.env*'` solo devuelve
`.env.example`. No se registraron valores.

## 9. Estilos

- Tailwind CSS 3; configuración en `tailwind.config.js`.
- Estilos globales en `src/app/globals.css`, con fondo oscuro y fuente Arial.
- No se encontraron tokens PriceVerify ni una librería de íconos.

## 10. Pruebas

Vitest 2.1.9 está instalado, pero no hay script `test`, configuración ni pruebas
de reglas. Existe `src/app/api/health/route.test.ts`.

## 11. Conflictos con el plan

- No existen `/comprar`, `/admin`, `/api/publico` ni
  `/api/admin/productos`.
- Ya existe `/api/admin/users`; debe conservar su protección.
- No existen `src/lib/dataService.ts` ni `src/components/ui/`.
- `src/app/page.tsx` es una página de inicio autenticada con enlaces a `/products`
  y `/profile`.
- Los datos actuales de productos viven en `data/products.json`.
- Se confirmó en Postgres que no existen las tablas `productos`, `sesiones` ni
  `items_carrito`; tampoco existe `_migrations`.

## 12. Decisiones derivadas

- Login: `/login`; cambiar el destino de éxito a `/admin`.
- Protección: ampliar `src/middleware.ts`; mantener protegido el resto y abrir
  solamente `/comprar` y `/api/publico/*`.
- Migraciones: crear `supabase/migrations/` y scripts Node con `pg`, tras
  comprobar el esquema remoto.
- Conexión: `POSTGRES_URL_NON_POOLING`, disponible en el entorno local y
  apropiada para transacciones directas.
- Roles: existe `app_metadata.role === 'admin'`; solo usuarios con ese rol
  administran el catálogo.
- Migraciones PriceVerify: `202610310001_priceverify_m1.sql` y
  `202610310002_priceverify_m2.sql`, si la numeración remota no exige otro
  prefijo.
- Imports de `src/lib`: `@/lib/...`.
- Ruta canónica de documentación existente: `Doc/` (mayúscula en disco).

## 13. Compilación de base

`npm run build` (Next.js 14.2.35): correcto. Compilación, lint y revisión de
tipos concluyeron; se generaron las rutas existentes sin errores.
