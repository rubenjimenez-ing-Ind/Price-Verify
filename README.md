# PriceVerify

PriceVerify incluye un verificador de precios y carrito de compra autenticado.
El cliente inicia sesión, busca productos, compara el precio de etiqueta con el
precio vigente y calcula un total estimado. El precio unitario se congela al
agregar cada producto; no se procesan pagos ni se integra con caja.

El catálogo PriceVerify se almacena en Supabase Postgres. La página anterior
`/products` continúa usando el catálogo JSON existente.

Alcance y decisiones:

- [Plan técnico de PriceVerify](./Doc/PLAN_PRICEVERIFY.md)
- [Alcance y decisiones del MVP](./alcance-y-decisiones.md)

## Funcionalidades

- Consulta por código o nombre, incluyendo búsqueda sin acentos, tras iniciar
  sesión.
- Alerta textual cuando el precio de etiqueta difiere del vigente.
- Carrito por dispositivo para usuarios autenticados, con cantidades,
  eliminación y total en COP.
- Catálogo administrativo para crear, editar y desactivar productos.
- Cierre de carrito por inactividad, fotos y escaneo con cámara.

El escáner lee QR y códigos de barras. Para probarlo en un celular, abre la
versión desplegada por HTTPS, entra a **Escanear código**, concede permiso a la
cámara y apunta a un código que coincida exactamente con el código de un
producto del catálogo (por ejemplo, `PV-DEMO-001`). Al leerlo, PriceVerify
regresa a la compra y busca ese producto. Si no hay cámara o se deniega el
permiso, queda disponible la búsqueda manual. La lectura con cámara física
debe validarse en el dispositivo; no se pudo comprobar en el equipo local.

## Acceso

- Cliente: inicia sesión en `/login`; después puede consultar productos y
  comprar en `/comprar`. El carrito se identifica con un UUID guardado en
  `localStorage` y requiere la misma sesión autenticada.
- Administrador: inicia sesión en `/login` y gestiona productos en `/admin`.
  La cuenta necesita `app_metadata.role=admin`.

## Requisitos y configuración

Node.js 20.6 o posterior y npm. Configura en `.env.local` los nombres de
variables siguientes (sin versionar valores):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AUTH_SESSION_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor)
- `POSTGRES_URL_NON_POOLING` (conexión directa usada por `pg`)
- `BLOB_READ_WRITE_TOKEN` (necesario para subir fotos)

Supabase Auth debe tener una cuenta administrativa. Las migraciones crean las
tablas del módulo en el proyecto configurado. No copies credenciales a archivos
del repositorio ni compartas `.env.local`.

## Desarrollo local

```bash
npm install
npm run db:migrar
npm run db:verificar
npm run db:demo
npm run dev
```

Para limpiar los datos generados por las pruebas o la demostración:

```bash
npm run db:limpiar -- --prueba
npm run db:limpiar -- --demo
```

## Scripts

| Comando | Propósito |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run lint` | ESLint mediante Next.js |
| `npm run type-check` | Verificación de TypeScript |
| `npm test` | Vitest en modo de ejecución |
| `npm run test:ver` | Vitest en modo interactivo |
| `npm run db:migrar` | Aplicar migraciones de Postgres |
| `npm run db:verificar` | Verificar esquema y restricciones |
| `npm run db:demo` | Cargar ocho productos demostrativos |
| `npm run db:limpiar -- --prueba` | Eliminar datos `PV-TEST` y `dev-test` |
| `npm run probar:flujo` | Probar el carrito de extremo a extremo en Postgres |

## Estructura principal

- `src/app` — páginas App Router y API
- `src/components` — interfaces reutilizables, compra y administración
- `src/lib/reglas` — reglas puras de negocio
- `src/lib/datos` — acceso transaccional a Postgres
- `src/lib/dataService.ts` — fachada del servicio de datos
- `supabase/migrations` — migraciones del esquema
- `tests/reglas` — pruebas Vitest
- `Doc` — plan técnico, estado y aceptación

## Precios y discrepancias

Los montos se representan como pesos enteros. Una discrepancia se muestra si el
precio de etiqueta no es nulo y difiere del precio vigente. El precio cobrado se
indica en la alerta. Al agregar un producto, el carrito conserva ese precio
unitario aunque el catálogo cambie después; subtotales y total se recalculan con
el precio congelado.

## Seguridad

- `.env.local` está excluido de Git; revisa que ningún secreto termine en un
  archivo versionado.
- La clave `SUPABASE_SERVICE_ROLE_KEY` se usa solo en servidor.
- Las tablas del módulo tienen RLS activo y permisos revocados a los roles
  públicos de Supabase; las rutas públicas consultan la base desde el servidor.
- Nunca guardes contraseñas en archivos de usuarios.

## Funcionalidades existentes

- La página anterior `/products` mantiene los productos y precios en archivos
  JSON; `/comprar` usa el nuevo catálogo transaccional de Postgres.
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
- Al consultar o crear cuentas desde el menú de administración, el servidor
  regenera [usuarios-registrados.md](./usuarios-registrados.md) con correos y
  estado de confirmación, nunca contraseñas. En despliegues con almacenamiento
  de solo lectura se informa que el archivo no pudo sincronizarse.
- Para iniciar sesión debe existir una cuenta en **Authentication → Users**
  del proyecto Supabase.
- No hay sincronización con tiendas ni actualización de precios en tiempo real.
- Los archivos JSON son adecuados para el prototipo, no para escritura
  concurrente en producción.
- Las pruebas A-01 a A-19 deben completarse en el despliegue de Vercel; consulta
  [Doc/ACEPTACION.md](./Doc/ACEPTACION.md).
