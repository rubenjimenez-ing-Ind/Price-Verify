# Estado de ejecución · PriceVerify

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | correcto | no configurados | 2026-10-31 |
| P01 Base de datos | completado | correcto | no configurados | 2026-10-31 |
| P02 Reglas | completado | correcto | 23 pasaron | 2026-10-31 |
| P03 Servidor | completado; Blob requiere configurar token | correcto | 23 pasaron | 2026-10-31 |
| P04 Datos | completado | correcto | 23 pasaron | 2026-10-31 |
| P05 API | completado; falta prueba interactiva con sesión admin | correcto | 23 pasaron | 2026-10-31 |
| P06 Catálogo admin | completado localmente; falta prueba admin interactiva | correcto | 23 pasaron | 2026-10-31 |
| P07 Consulta pública | completado | correcto | 23 pasaron | 2026-10-31 |
| P08 Carrito y aceptación | completado localmente; aceptación Vercel pendiente | correcto | 23 pasaron | 2026-10-31 |
| P09 Opcionales | completado localmente; faltan cámara real, subida de foto y aceptación Vercel | correcto | 23 pasaron | 2026-10-31 |

## Bitácora

### Ajuste de acceso tras P09 · 2026-10-31

- Por solicitud de la usuaria, el login ahora es obligatorio para la app, la
  compra y sus endpoints API.
- Los administradores (`app_metadata.role=admin`) entran a `/admin`; los
  clientes autenticados entran a `/comprar`. El carrito conserva su
  `device_id`.
- Verificación runtime sin sesión: `/comprar` redirige a `/login` (307) y
  `/api/publico/carrito` responde 401. `/login` responde 200.
- `npm run build` correcto y `npm test` con 23 pruebas aprobadas.
- A-05 se actualizó para cliente autenticado y se añadió A-20. Una sesión
  válida existente se conserva hasta cerrar sesión o expirar; por eso un
  navegador ya autenticado no vuelve a pedir credenciales.

### P00 · Auditoría

- **Archivos creados:** `Doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`,
  `Doc/ESTADO_EJECUCION.md` y `Doc/checkpoints/FASE_0_COMPLETADA.md`.
- **Archivos modificados:** ninguno.
- **Comandos:** `npm run build` — correcto (Next 14.2.35; compilación, lint,
  tipos y generación estática); inspección de nombres de variables sin imprimir
  valores.
- **Resultado:** existe `POSTGRES_URL_NON_POOLING`; no aparece
  `BLOB_READ_WRITE_TOKEN`; `.env.local` está ignorado y no está versionado.
  Login de administrador con `app_metadata.role=admin`. Se confirmó que la
  persona usuaria ya cambió la contraseña expuesta.
- **Consulta remota de solo lectura:** no existen `productos`, `sesiones`,
  `items_carrito` ni `_migrations` en `public`; no se encontraron conflictos de
  esquema para P01. Al probar TLS, la URL de Postgres incluía un parámetro
  `sslmode` que anulaba `rejectUnauthorized: false`; se retiró solo ese
  parámetro en memoria para la consulta.
- **Riesgo pendiente:** no abrir ni versionar `usuarios-registrados.md`, que
  está no versionado.

### P01 · Base de datos

- **Archivos creados:** dos migraciones de PriceVerify, `scripts/db-connection.mjs`,
  `scripts/migrar.mjs`, `scripts/verificar-bd.mjs` y
  `Doc/checkpoints/FASE_1_COMPLETADA.md`.
- **Archivos modificados:** `package.json` y `package-lock.json` (cliente `pg`,
  tipos y scripts `db:migrar` / `db:verificar`).
- **Migraciones aplicadas:** M1 y M2. La inspección previa confirmó que las
  tablas de destino y `_migrations` no existían.
- **Verificación:** `npm run db:verificar` — 0 fallas; todas las restricciones,
  RLS y pruebas transaccionales correctas. `npm run build` — correcto.
- **Incidencias resueltas:** los scripts CLI cargan `.env.local` con
  `@next/env`; el helper de conexión retira `sslmode` de la URL en memoria para
  que se respete la configuración TLS explícita.

### P02 · Reglas de negocio

- **Archivos creados:** `src/lib/config/priceverify.ts`,
  `src/lib/reglas/*` y `tests/reglas/*`.
- **Archivos modificados:** `package.json`, `vitest.config.ts`; se conservó el
  test existente de health y el alias `@data`.
- **Comandos:** `npm test` — 23 pruebas correctas (22 del plan y una existente);
  `npm run build` — correcto.
- **Nota:** Vitest advierte que la API CJS de Vite está obsoleta; no afecta las
  pruebas y no se cambió tooling de forma innecesaria.

### P03 · Infraestructura del servidor

- **Archivos creados:** conexión Postgres, sesión admin, device ID, respuestas,
  esquemas, formato, Blob, `/api/admin/ping` y hook del device.
- **Archivos modificados:** `src/middleware.ts` abre las rutas públicas del
  módulo y conserva las demás protecciones; `src/app/login/page.tsx` cambia
  únicamente el destino de éxito a `/admin`.
- **Comandos:** `npm run build` — correcto; `npm test` — 23 pruebas correctas.
- **Prueba runtime:** `/api/admin/ping` sin sesión → 401 y `no-store`;
  `/comprar` sin sesión → 404 (todavía no se había creado la página), sin
  redirección al login.
- **Pendientes:** `BLOB_READ_WRITE_TOKEN` no está configurado; no se probaron
  subida real ni sesión autenticada interactiva.

### P04 · Datos y carrito

- **Archivos creados:** `src/lib/datos/*`, `src/lib/dataService.ts`,
  `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts` y
  `scripts/cargar-demo.ts`.
- **Archivos modificados:** `package.json` y `package-lock.json` (tsx y scripts
  de base de datos).
- **Verificación:** `npm run probar:flujo` — 15 pasos correctos, 0 fallas,
  incluida la prueba de precio congelado; `npm run db:demo` — ocho productos
  demo; `npm run db:limpiar -- --prueba` — sin datos de prueba residuales;
  `npm test` — 23 pasaron; `npm run build` — correcto.
- **Diseño:** el código de aplicación que importa `conexion.ts` está limitado a
  `src/lib/datos/`; los scripts usan el helper de base de datos y la fachada
  `dataService`.

### P05 · API

- **Archivos creados:** rutas públicas de productos y carrito; rutas admin de
  productos, edición, foto y desactivación.
- **Protección:** todas las rutas admin llaman `exigirUsuario()` antes de
  operar; las rutas públicas usan `device_id`, esquemas Zod y la respuesta
  `no-store`.
- **Verificación runtime:** GET/POST admin sin sesión → 401; búsqueda pública
  → 200 y ficha discrepante → alerta correcta. `npm run build` correcto y
  `npm test` con 23 pasaron.
- **Pendiente manual:** verificar creación/edición/foto con una sesión admin real
  en navegador; la subida además requiere `BLOB_READ_WRITE_TOKEN`.

### P06 · Interfaz base y catálogo admin

- **Archivos creados:** componentes UI, navegación y catálogo admin, formulario,
  carga de foto y páginas de alta/edición.
- **Archivos modificados:** tokens en Tailwind/CSS y raíz redirigida a
  `/comprar`.
- **Verificación:** `npm run build` correcto. Sesión admin y subida real
  pendientes por requisitos interactivos y token Blob ausente.

### P07 · Consulta pública

- **Archivos creados:** buscador, ficha y alerta de discrepancia.
- **Verificación:** navegador local encontró Arroz Diana y mostró la ficha y
  alerta de Aceite Premier. API pública respondió 200 sin sesión.

### P08 · Carrito y aceptación

- **Archivos creados:** carrito, ítems, total, experiencia de compra y
  `Doc/ACEPTACION.md`; README actualizado.
- **Verificación de navegador:** agregar Arroz Diana, ajustar a 2 unidades,
  agregar Aceite Premier, alerta visible, total $21.000 y vaciar correctamente.
- **Pendientes:** A-01 a A-16 en Vercel; el despliegue requiere commit/push y
  configuración de `BLOB_READ_WRITE_TOKEN`, acciones que no se ejecutaron.

### P09 · Opcionales

- **Implementación:** se confirmó la foto o marcador neutro en el ítem del
  carrito; se agregó el cierre por inactividad, el endpoint admin protegido
  `/api/admin/mantenimiento/cerrar-inactivas` y el escáner QR/código de barras
  con retorno al buscador y alternativa manual.
- **Pruebas de inactividad:** en Postgres se marcó una sesión de prueba con
  31 minutos de antigüedad. `verCarrito` la cerró y creó otra; la función de
  mantenimiento cerró la sesión vencida. Los datos de prueba se limpiaron.
- **Pruebas de interfaz/runtime:** el marcador «Sin foto» se vio en ficha y
  carrito; la ruta del escáner respondió 200 y el endpoint de mantenimiento
  sin sesión respondió 401 con `no-store`. Se simuló un navegador sin cámara
  y se confirmó el aviso con enlace a búsqueda manual.
- **Comandos:** `npm run db:verificar` — 0 fallas; `npm run probar:flujo` —
  15 pasos correctos; `npm test` — 23 pasaron; `npm run build` — correcto.
- **Pendientes:** no hay `BLOB_READ_WRITE_TOKEN` para probar una foto real;
  falta escanear un código con cámara física en HTTPS y completar A-01 a A-19
  en Vercel. No se hizo commit, push ni despliegue.
