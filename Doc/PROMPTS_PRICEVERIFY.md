# PriceVerify · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_PRICEVERIFY.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: proyecto desplegado en Vercel, Supabase conectado (con Supabase Auth) y login funcionando

---

## Antes de empezar: seguridad

Un archivo del proyecto (`usuarios-registrados.md`) tenía un correo y una contraseña reales en texto plano. Antes de ejecutar P00:

1. Cambiar la contraseña de la cuenta expuesta (`ruben.jimenez01@usa.edu.co`) desde Supabase Auth.
2. No volver a escribir credenciales en ningún archivo del repositorio.
3. Confirmar que `.env.local` está en `.gitignore` y que la `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el servidor.

No continuar con P00 hasta hacerlo.

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_PRICEVERIFY.md` y `PROMPTS_PRICEVERIFY.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt: revisar los cambios y aceptarlos (**Keep**); hacer la verificación indicada; hacer commit con el mensaje sugerido y `git push`. Vercel desplegará; si falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final.

| Fase | Prompts |
|---|---|
| 0 · Preparación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz | P06, P07, P08 |
| 7 · Opcionales | P09 |

---

## P00 · Auditoría del repositorio y archivos de control

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio Next.js.

Contexto: el proyecto "PriceVerify" (verificador de precios y carrito en tiempo real para un supermercado) ya está desplegado en Vercel, conectado a Supabase (usa Supabase Auth) y tiene login funcionando. El plan técnico está en doc/PLAN_PRICEVERIFY.md. Este prompt NO implementa funcionalidades: audita el repositorio y crea los archivos de control.

Lee completo doc/PLAN_PRICEVERIFY.md, en especial las secciones 0, 1, 2, 4 y 16.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con estas secciones, llenas con lo que encuentres. No supongas: si algo no existe, escribe "No existe".
1. Versiones (package.json): next, react, typescript, tailwindcss, pg, zod, @supabase/supabase-js, @supabase/ssr o similar, @vercel/blob, vitest.
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/ y scripts/ hasta 3 niveles. Indica si usa carpeta src/.
4. Alias de importación en tsconfig.json.
5. Autenticación: archivos; cómo usa Supabase Auth (cliente de servidor, cookies, @supabase/ssr); función que lee la sesión y qué devuelve; si hay roles (por ejemplo en app_metadata o una tabla) o solo autenticación; ruta de la página de login; ruta a la que redirige después del login (archivo y línea); archivo de middleware o proxy y su matcher; cómo se cierra sesión.
6. Acceso a datos: clientes de Supabase existentes, uso del paquete pg, archivo de pool si existe.
7. Migraciones: carpeta, archivos existentes y su numeración, tabla de control, script o página que las aplica.
8. Variables de entorno: solo los NOMBRES presentes en .env.local y .env.example (NUNCA copies valores). Indica si existen: una cadena de conexión directa a Postgres (DATABASE_URL o similar) y con qué nombre; BLOB_READ_WRITE_TOKEN; SUPABASE_SERVICE_ROLE_KEY; las claves públicas de Supabase.
9. Estilos: versión de Tailwind, ubicación de globals.css, fuentes, tokens de color existentes, librería de íconos.
10. Pruebas: framework existente.
11. Conflictos con el plan: existencia previa de app/comprar, app/admin, app/api/publico, app/api/admin, lib/dataService.ts y components/ui; contenido de app/page.tsx; tablas existentes llamadas productos, sesiones o items_carrito y, si existen, sus columnas.
12. Decisiones derivadas:
    - Ruta de la página de login.
    - Archivo de protección de rutas (proxy.ts en Next.js 16, middleware.ts antes) y si ya existe.
    - Mecanismo de migraciones a usar.
    - Nombre de la variable de conexión a Postgres que usará conexion.ts (si no existe, hay que obtenerla; el carrito necesita transacciones con pg).
    - Si el login distingue roles; si no, cualquier usuario autenticado es administrador (un solo rol) para este alcance.
    - Nombres exactos que tendrán M1 y M2 continuando la numeración existente.
    - Prefijo de imports para lib.
13. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea .github/copilot-instructions.md reemplazando [AJUSTAR] con lo hallado:

```markdown
# PriceVerify · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_PRICEVERIFY.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable [AJUSTAR: variable de conexión].
- Supabase Auth para el administrador; carrito del cliente anónimo por device_id. Fotos en Vercel Blob.
- Validación con Zod. Pruebas con Vitest.
- Login existente: [AJUSTAR]. No se reescribe.

## Dos tipos de uso
- Cliente: público, sin cuenta. Carrito identificado por device_id (UUID en localStorage). Rutas /comprar y /api/publico/*.
- Administrador: login existente. Gestiona el catálogo. Rutas /admin y /api/admin/*.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas puras en lib/reglas/: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto fechas.ts). Se prueban con Vitest.
- El total del carrito se recalcula desde los ítems (SELECT SUM), nunca se acumula a mano.
- El precio_unitario del ítem se congela al agregar (copia de precio_actual); el subtotal y el total usan el congelado.
- Discrepancia: precio_etiqueta no nulo y precio_actual != precio_etiqueta (tolerancia 0). Si etiqueta es null, no hay alerta.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/admin/ llama await exigirUsuario() como primera instrucción. Las de app/api/publico/ reciben device_id y operan solo sobre esa sesión.
- Entradas validadas con los esquemas de lib/validacion/esquemas.ts.
- Errores de negocio con ErrorDeNegocio(codigo); respuestas con lib/http/respuestas.ts.
- Montos en pesos enteros. Nunca decimales.
- El código y el nombre se normalizan antes de buscar o comparar; la búsqueda por nombre es parcial, sin mayúsculas ni acentos.
- En rutas dinámicas params es una Promise: const { id } = await params.
- SQL siempre con parámetros ($1, $2). Nunca concatenar valores.
- Un producto no se elimina; se desactiva. Las sesiones cerradas no se reabren.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: [AJUSTAR].
- Archivo de protección de rutas: [AJUSTAR]. Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa y hace el commit.
```

TAREA 3. Crea doc/ESTADO_EJECUCION.md:

```markdown
# Estado de ejecución · PriceVerify

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | pendiente | | | |
| P01 Base de datos | pendiente | | | |
| P02 Reglas de negocio | pendiente | | | |
| P03 Servidor | pendiente | | | |
| P04 Datos | pendiente | | | |
| P05 API | pendiente | | | |
| P06 Interfaz base y catálogo admin | pendiente | | | |
| P07 Consulta de productos | pendiente | | | |
| P08 Carrito y aceptación | pendiente | | | |
| P09 Opcionales | pendiente | | | |

## Bitácora

Cada prompt agrega una sección con: archivos creados, archivos modificados, comandos ejecutados y su resultado, problemas y cómo se resolvieron, pendientes.
```

TAREA 4. Si no existe node_modules, ejecuta npm install. Luego npm run build y registra el resultado en la sección 13 de ESTADO_ACTUAL.md. Si falla, NO corrijas: describe el error.

TAREA 5. Confírmame que entiendes que la credencial expuesta debe haberse cambiado (sección 2 del plan). Explícame qué claves faltan (sección 8): si no hay una cadena de conexión directa a Postgres, cómo obtenerla en Supabase (Connect, Transaction pooler, puerto 6543); si falta BLOB_READ_WRITE_TOKEN, cómo crear un Blob store en Vercel (Storage). No continuar con P01 sin la conexión a Postgres.

RESTRICCIONES: no modifiques código, configuración ni dependencias. Solo crea los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: resultado de la compilación, qué claves existen, si el login tiene roles, decisiones derivadas.
- Marca P00 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y los riesgos para los siguientes prompts.
````

**Verificación del estudiante:** abrir `doc/ESTADO_ACTUAL.md` y confirmar que la sección 5 describe cómo funciona Supabase Auth y si hay roles, y que la 8 identifica la conexión a Postgres y el token de Blob.

**Commit sugerido:** `docs: auditoría del repositorio y archivos de control para Copilot`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea:** dos migraciones, `scripts/verificar-bd.mjs` y, si hace falta, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 5, 7 y 14), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: crear y aplicar las dos migraciones y dejar un script que demuestre que la base protege las reglas (precio congelado, ítem único por sesión, una sesión activa por dispositivo).

TAREA 1. Si ESTADO_ACTUAL.md reporta tablas previas con esos nombres que NO correspondan a este plan, detente y avísame. Si no, crea en supabase/migrations/ dos archivos con los nombres de la sección 12 de ESTADO_ACTUAL.md:
- M1 (tablas) con el SQL exacto de la sección 7.2 del plan.
- M2 (vista y seguridad) con el SQL exacto de la sección 7.3.
No cambies nombres de tablas, columnas, el subtotal generado ni las restricciones: el código depende de ellos (sección 7.4).

TAREA 2. Aplica las migraciones con el mecanismo existente o creando scripts/migrar.mjs (lee la variable de conexión; ssl { rejectUnauthorized: false }; tabla _migrations; aplica en orden alfabético en transacción; imprime "aplicada"/"omitida"; código 1 si falla) y el script "db:migrar". Si hay migraciones anteriores ya aplicadas por otro medio, regístralas sin ejecutarlas y explícalo.

TAREA 3. Crea scripts/verificar-bd.mjs y "db:verificar". Debe imprimir:
1. Existencia de productos, sesiones, items_carrito y de la vista v_carrito.
2. Número de filas de cada tabla.
3. Restricciones (pg_constraint) e índices únicos (pg_indexes): productos_codigo_unico, ux_sesiones_activa_por_device, items_unico_por_sesion.
4. Si RLS está activo en las tres tablas.
5. Pruebas de integridad en UNA transacción que SIEMPRE termina en ROLLBACK, con SAVEPOINT antes de cada caso que debe fallar:
   a) Insertar producto 'PV-A' (nombre "Arroz", precio_actual 4500, precio_etiqueta 4500): funciona.
   b) Insertar 'PV-A' otra vez: 23505 (productos_codigo_unico).
   c) Insertar producto con precio_actual 0: 23514.
   d) Insertar producto con precio_etiqueta 0: 23514 (debe ser null o > 0).
   e) Insertar una sesión activa para device 'dev-test'; insertar otra sesión activa para el mismo device: 23505 (ux_sesiones_activa_por_device).
   f) Insertar un item (sesión del caso e, producto 'PV-A', cantidad 2, precio_unitario 4500); comprobar que subtotal es 9000 (columna generada).
   g) Insertar otro item con la misma sesión y el mismo producto: 23505 (items_unico_por_sesion).
   h) Insertar un item con cantidad 0: 23514 (la cantidad 0 elimina, no se guarda).
   Imprime "OK" o "FALLA" por caso.
6. Total de fallas; termina con código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques archivos del login ni de app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida de npm run db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase, Table Editor, deben aparecer `productos`, `sesiones` e `items_carrito`. La salida de `npm run db:verificar` no debe tener FALLA, y el caso f debe mostrar el subtotal 9000 calculado por la base.

**Commit sugerido:** `feat(bd): tablas, vista del carrito y restricciones de PriceVerify`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/priceverify.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 5, 8, 9.3, 9.4, 9.5, 10.2, 13 y 15.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas puras y probarlas con Vitest. El corazón es el cálculo del total, el subtotal, la discrepancia de precio y la validación de cantidad.

TAREA 1. Instala vitest (desarrollo). Agrega "test": "vitest run" y "test:ver": "vitest". Crea vitest.config.ts con environment 'node', include ['tests/**/*.test.ts'] y el alias '@' de tsconfig.json.

TAREA 2. Crea lib/config/priceverify.ts con el contenido exacto de la sección 9.4.

TAREA 3. Crea lib/reglas/ con las firmas exactas de la sección 9.5:
- errores.ts: CodigoError; MENSAJES y ESTADO_HTTP con la tabla 10.2; clase ErrorDeNegocio.
- fechas.ts: ahoraISO; minutosDesde(fechaISO) (diferencia en minutos para el cierre por inactividad).
- producto.ts: normalizarCodigo (recorta; conserva el valor tal cual, sin cambiar mayúsculas); normalizarTextoBusqueda (minúsculas, sin acentos con normalize NFD y quitar diacríticos, recortado); validarDatosProducto (código y nombre no vacíos; precioActual entero > 0; precioEtiqueta null o entero > 0; si no, DATOS_INVALIDOS).
- precio.ts: hayDiscrepancia(precioActual, precioEtiqueta) (si etiqueta es null → false, RN-04; si no, precioActual !== precioEtiqueta, RN-02, tolerancia 0); describirDiscrepancia (devuelve { hay, precioCobrado: precioActual, precioEtiqueta }).
- carrito.ts: validarCantidad(cantidad, { permitirCero }) (entero; si permitirCero, >= 0; si no, > 0; siempre <= CANTIDAD_MAXIMA_ITEM; si no, DATOS_INVALIDOS); subtotal(cantidad, precioUnitario); calcularTotal(items) (suma de cantidad*precioUnitario); nuevaCantidadAlSumar(actual, agregada) (actual + agregada).

Ninguna regla importa pg, red, next ni process.env, ni llama new Date() (excepto el parámetro por defecto de ahoraISO).

TAREA 4. Crea tests/reglas/ayudas.ts con esperarCodigo(fn, codigo).

TAREA 5. Crea las pruebas en tests/reglas/ (precio, carrito, producto) cubriendo T-01 a T-22 de la sección 15.1. Cada caso con su ID. Presta atención a T-02 (diferencia de $1 alerta), T-03 (etiqueta null no alerta) y T-11 (cantidad 0 válida solo con permitirCero).

TAREA 6. Ejecuta npm test hasta que pasen las 22. Si una falla, corrige la regla, no la prueba, salvo que contradiga el plan; explícalo.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida resumida de npm test.
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm test` (22 pruebas). Abrir `lib/reglas/precio.ts` y comprobar que una diferencia de $1 alerta y que una etiqueta nula no.

**Commit sugerido:** `feat(reglas): total, subtotal, discrepancia y cantidad con 22 pruebas`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión admin, device_id, respuestas, esquemas, formato, blob y `/api/admin/ping` · **Modifica:** protección de rutas y redirección del login

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 1.3, 4, 7.4, 9.1, 9.3, 9.7, 10.1, 10.2, 10.4, 12, 13 y 14), doc/ESTADO_ACTUAL.md (sección 5) y doc/ESTADO_EJECUCION.md.

OBJETIVO: dejar lista la infraestructura: conexión a Postgres, sesión del administrador sobre Supabase Auth, identidad de dispositivo del cliente, formato, esquemas, blob para fotos.

TAREA 1. lib/db/conexion.ts como la sección 9.7. Usa el nombre real de la variable de conexión. Si ya hay pool, reutilízalo agregando los parsers.

TAREA 2. lib/auth/sesion.ts:
- obtenerUsuario(): Promise<{ id: string; email: string } | null> usando Supabase Auth del lado del servidor como lo describe ESTADO_ACTUAL.md. Si hay roles y existe uno de administrador, solo devuelve el usuario si lo tiene; si no hay roles, cualquier usuario autenticado cuenta como administrador.
- exigirUsuario(): igual, pero lanza ErrorDeNegocio('NO_AUTORIZADO') si no hay sesión válida.
- Solo importa del login; no modifica sus archivos.

TAREA 3. lib/deviceId.ts y lib/hooks/useDeviceId.ts (cliente): getOrCreateDeviceId() lee/escribe localStorage 'pv_device_id' (UUID); useDeviceId() devuelve el deviceId (null durante SSR, string en el cliente).

TAREA 4. Protección de rutas en el archivo indicado: agrega /admin/:path* y /api/admin/:path* al matcher, conservando lo existente. Las rutas /comprar y /api/publico son PÚBLICAS: no las protejas. Sin sesión: /admin redirige al login; /api/admin responde 401. Si no es posible en ese archivo, protege en el layout de /admin (P06) y en exigirUsuario(), y anótalo.

TAREA 5. Cambia SOLO el destino de la redirección posterior al login a /admin.

TAREA 6. lib/http/respuestas.ts: responderOk; responderError (ErrorDeNegocio → ESTADO_HTTP; ZodError → 400 DATOS_INVALIDOS con flatten; pg 23505/23514 → tabla 7.4; otro → console.error y 500 ERROR_INTERNO); conManejoDeErrores; leerCuerpo. Todas con Cache-Control: no-store.

TAREA 7. lib/validacion/esquemas.ts con los esquemas de la sección 10.4, con tipos z.infer. No importa nada del servidor.

TAREA 8. lib/formato.ts: formatearPesos (Intl es-CO, COP, sin decimales).

TAREA 9. lib/blobImages.ts: subir una imagen a Vercel Blob público con getBlobToken() lazy; subirFotoProducto(id, buffer, mime) devuelve la URL pública. Valida tipo (jpeg/png/webp) y tamaño (máximo 2 MB).

TAREA 10. app/api/admin/ping/route.ts (temporal de verificación): GET con conManejoDeErrores; primera instrucción await exigirUsuario(); responde { email }. export const dynamic = 'force-dynamic'. (Se puede eliminar luego; sirve para probar la protección.)

VERIFICACIÓN: npm run build y npm test. Inicia npm run dev; sin sesión, GET /api/admin/ping da 401. Pídeme que inicie sesión y abra http://localhost:3000/api/admin/ping; espera mi confirmación de 200. Comprueba que el login redirige a /admin y que /comprar es accesible sin sesión.

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados y el diff resumido de lo que tocaste del login o la protección.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `/api/admin/ping` da 401 sin sesión y 200 con sesión; `/comprar` abre sin login.

**Commit sugerido:** `feat(servidor): conexión, sesión admin, device_id y blob`

---

## P04 · Datos: productos y carrito

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/*`, `lib/dataService.ts`, `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts`, `scripts/cargar-demo.ts`

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 5, 6, 6.1, 7.4, 8, 9.5, 9.6 y 15.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: implementar el acceso a datos y los casos de uso, con transacciones, y comprobar el flujo contra la base. El punto delicado es el precio congelado y el recálculo del total.

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 9.6 (FilaProducto, ProductoConAlerta, ItemCarrito, EstadoCarrito, ResultadoCarrito, DatosProducto, FilaProductoAdmin). Reutiliza los tipos de lib/reglas.

TAREA 2. lib/datos/productos.ts:
- buscarProductos(texto): productos activos que coincidan por código exacto (normalizado) o por nombre parcial (normalizarTextoBusqueda, comparando contra lower(unaccent(nombre)) o un equivalente; si unaccent no está disponible, normaliza en SQL con lower y translate, o filtra en memoria tras traer por lower LIKE). Orden por nombre; LIMITE_BUSQUEDA. Devuelve FilaProducto[] (código, nombre, precioActual, fotoUrl).
- obtenerProductoPorCodigo(codigo): producto activo; si no existe, PRODUCTO_NO_ENCONTRADO. Devuelve ProductoConAlerta con describirDiscrepancia.
- listarProductosAdmin({ busqueda, incluirInactivos }): todos (o solo activos) con precioActual, precioEtiqueta, indicador de discrepancia, estado.
- crearProducto(d): validarDatosProducto; inserta; CODIGO_DUPLICADO si choca.
- editarProducto(id, d): validarDatosProducto; actualiza; PRODUCTO_NO_ENCONTRADO si no existe.
- subirFotoProducto(id, buffer, mime): delega en lib/blobImages y actualiza foto_url.
- desactivarProducto(id): activo = false.
- obtenerProductoActivo(tx, codigo) (interna): para el carrito; PRODUCTO_NO_ENCONTRADO si no existe o inactivo.

TAREA 3. lib/datos/carrito.ts:
- obtenerOCrearSesionActiva(tx, deviceId) (interna): busca la sesión 'activa' del device; si no hay, crea una; actualiza ultima_actividad. Maneja la carrera de ux_sesiones_activa_por_device (si falla por duplicado, relee la activa).
- recalcularTotal(tx, sesionId) (interna): UPDATE sesiones SET total = (SELECT COALESCE(SUM(subtotal),0) FROM items_carrito WHERE sesion_id = $1), ultima_actividad = NOW() (RN-01, sección 8.2).
- leerCarrito(tx, sesionId) (interna): ítems desde v_carrito (nombre, foto, precio congelado, subtotal, precio actual vigente) + total.
- verCarrito(deviceId): la sesión activa del device (o una vacía nueva) con sus ítems y total.
- agregarAlCarrito(deviceId, codigo, cantidad): secuencia EXACTA de la sección 6.1 (validarCantidad sin permitirCero; obtenerOCrearSesionActiva; obtenerProductoActivo; describirDiscrepancia para la alerta; sumarOCrearItem con precio_unitario = producto.precio_actual congelado, RN-06 y RN-07; recalcularTotal; leerCarrito). Devuelve ResultadoCarrito con carrito, total y alerta.
- ajustarCantidad(deviceId, codigo, nuevaCantidad): validarCantidad con permitirCero; si la sesión está cerrada, SESION_CERRADA; busca el ítem (ITEM_NO_ENCONTRADO); si nuevaCantidad es 0, elimina el ítem (RN-05); si no, actualiza la cantidad (el subtotal se recalcula solo); recalcularTotal; devuelve el carrito. NO recongela el precio.
- eliminarItem(deviceId, codigo): elimina el ítem; recalcularTotal.
- cerrarSesion(deviceId): marca la sesión activa como 'cerrada' con fecha_cierre; los ítems quedan asociados a la sesión cerrada (historial) o se borran por CASCADE si prefieres vaciar; sigue el plan: vaciar el carrito y marcar cerrada (puedes borrar los ítems y marcar cerrada). Una nueva operación creará una sesión nueva.
- cerrarSesionesInactivas(): se implementa en P09 (déjala preparada).

TAREA 4. lib/dataService.ts como fachada: reexporta las funciones públicas y los tipos. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 5. scripts/limpiar-prueba.mjs con "db:limpiar": borra (en orden items_carrito, sesiones de device que empiece por 'dev-test' o 'dev-demo', productos con código que empiece por 'PV-TEST' o 'PV-DEMO'). Imprime el conteo. Opciones --prueba y --demo.

TAREA 6. Instala tsx (desarrollo). Crea scripts/probar-flujo.ts con los 15 pasos de la sección 15.2 usando solo dataService, con un deviceId fijo de prueba 'dev-test-0001'. Imprime OK/FALLA por paso; para los pasos que esperan error, verifica el código; limpia antes y en finally; cierra el pool; código 1 si hay fallas. "probar:flujo": "tsx --env-file=.env.local scripts/probar-flujo.ts" (o la variante con --import tsx). CRÍTICO: el paso 12 debe comprobar que, tras cambiar el precio del producto, el ítem ya agregado conserva su precio congelado. Ejecuta y corrige hasta 0 fallas.

TAREA 7. scripts/cargar-demo.ts con "db:demo": crea ~8 productos PV-DEMO con nombres reales (arroz, aceite, leche, pan, etc.), algunos con discrepancia (precio_etiqueta distinto), algunos con etiqueta null, uno con foto si tienes una URL de ejemplo. Limpia los DEMO antes. Imprime una tabla con código, nombre, precio actual, etiqueta y si hay discrepancia. Ejecútalo.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega la salida de probar:flujo y db:demo en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run probar:flujo` (15 OK, 0 fallas); el paso 12 confirma el precio congelado. `npm run db:demo` y revisar los productos en Supabase.

**Commit sugerido:** `feat(datos): productos y carrito con precio congelado y prueba de flujo`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `app/api/publico/` y `app/api/admin/`

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 4, 10.1 a 10.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesion.ts.

OBJETIVO: exponer las operaciones del cliente (públicas) y del administrador (protegidas).

TAREA 1. Crea las rutas de la tabla 10.3. Reglas:
- Rutas /api/admin/*: primera instrucción await exigirUsuario().
- Rutas /api/publico/*: NO requieren sesión; reciben el deviceId (en query para GET, en el cuerpo para POST/PATCH/DELETE) y operan solo sobre esa sesión.
- Todas: conManejoDeErrores; cuerpos con leerCuerpo y los esquemas de 10.4; [id]/[codigo] con await params; export const dynamic = 'force-dynamic'.
- POST de productos y de carrito responden 201.
- Detalle: GET /api/publico/productos?q= usa buscarProductos; GET /api/publico/productos/[codigo] usa obtenerProductoPorCodigo; el carrito usa las funciones correspondientes; PATCH /api/publico/carrito/item con cantidad 0 elimina (ajustarCantidad); POST /api/admin/productos/[id]/foto recibe multipart y usa subirFotoProducto.
- Elimina app/api/admin/ping si lo creaste en P03, o déjalo; no estorba.

TAREA 2. Verificación admin sin sesión: con npm run dev, GET /api/admin/productos y POST /api/admin/productos deben dar 401. Público: GET /api/publico/productos?q=arroz debe responder 200 sin sesión.

TAREA 3. Verificación con sesión: pídeme que inicie sesión y cree un producto por API; luego, sin sesión (otra ventana), busca ese producto con /api/publico/productos?q= y agrégalo al carrito con un deviceId de prueba; confirma que el total llega en la respuesta. Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con probar:flujo (P04) y las verificaciones.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** las rutas admin dan 401 sin sesión; la búsqueda pública responde sin login; agregar al carrito por API devuelve el total.

**Commit sugerido:** `feat(api): rutas públicas del carrito y rutas admin del catálogo`

---

## P06 · Interfaz base y catálogo del administrador

**Fase:** 5 · **Crea:** `components/ui/*`, layout de `/admin`, catálogo y formulario de productos · **Modifica:** `app/globals.css`, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 4, 5, 11, 12 y 14), doc/ESTADO_ACTUAL.md (secciones 5, 9, 11), doc/ESTADO_EJECUCION.md, lib/dataService.ts y lib/formato.ts.

OBJETIVO: componentes reutilizables, estructura del admin y gestión del catálogo (sin esto no hay productos que consultar).

TAREA 1. Agrega los tokens de color de la sección 12 sin borrar nada existente: con Tailwind 4 en @theme de app/globals.css; con Tailwind 3 en tailwind.config.

TAREA 2. components/ui/: Boton (primario, secundario, peligro, fantasma; prop cargando), Campo, Tarjeta, Insignia (tono neutro, primario, alerta, peligro, inactivo), Aviso (info, exito, advertencia, error), Modal (fondo oscuro, cierre con Escape y botón, foco al abrir, role dialog), EstadoVacio. Foco visible y contraste.

TAREA 3. app/page.tsx: redirección a /comprar (si tiene contenido propio, añade un enlace a /comprar sin borrarlo).

TAREA 4. components/admin/NavegacionAdmin.tsx y app/admin/layout.tsx (servidor): obtenerUsuario(); sin sesión, redirect al login. Barra con "PriceVerify · Administración", enlace al catálogo, correo y cerrar sesión.

TAREA 5. Catálogo: components/admin/TablaProductos.tsx y app/admin/page.tsx (servidor): listarProductosAdmin; columnas código, nombre, precio actual, precio etiqueta (o "—"), discrepancia (Insignia "Difieren" si precio_actual != precio_etiqueta y etiqueta no nula), estado (Activo/Inactivo); buscador; botón "Nuevo producto"; acciones editar (enlace) y desactivar (POST, con confirmación). Tarjetas apiladas bajo 640 px.

TAREA 6. components/admin/FormularioProducto.tsx (cliente), components/admin/SubidorFoto.tsx y app/admin/productos/nuevo/page.tsx y app/admin/productos/[id]/page.tsx:
- Campos: código, nombre, descripción, precio actual, precio de etiqueta (opcional, puede quedar vacío = null). Validación con esquemaProducto; precios como enteros en pesos.
- SubidorFoto: sube la imagen a /api/admin/productos/[id]/foto (en creación, primero se crea el producto y luego se sube la foto, o se sube tras guardar). Muestra la foto actual si existe.
- Crear: POST /api/admin/productos; Editar: PATCH. Al guardar, vuelve al catálogo. Código duplicado muestra el mensaje de CODIGO_DUPLICADO.
- Muestra una nota: "Si el precio de etiqueta difiere del actual, el cliente verá una alerta."

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Crea "Arroz Diana" (7701, actual 4500, etiqueta 4500), "Aceite Premier" (actual 12000, etiqueta 11000) y "Pan Bimbo" (actual 3000, sin etiqueta). Verifica que el catálogo marca la discrepancia de "Aceite Premier". Sube una foto a "Arroz Diana". Edita un precio. Intenta un código repetido (error). Documenta. Al final ejecuta npm run db:limpiar si creaste productos de prueba, o déjalos para la aceptación.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** crear tres productos; comprobar que la discrepancia se marca en el catálogo y que un código repetido se rechaza.

**Commit sugerido:** `feat(interfaz): catálogo del administrador y formulario de productos`

---

## P07 · Consulta de productos (cliente)

**Fase:** 5 · **Crea:** la búsqueda y la ficha del producto con la alerta

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 5.1, 6 (CU-01), 10.3, 11, 11.1 y 12), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: que el cliente (sin login) consulte un producto por código o nombre y vea su precio y la alerta de discrepancia.

TAREA 1. app/comprar/layout.tsx (cliente o servidor según convenga): barra con "PriceVerify", un enlace discreto "Administración" (al login) y acceso al carrito. Usa el deviceId (useDeviceId) en los componentes cliente. Esta sección es pública: no exige sesión.

TAREA 2. components/comprar/BuscadorProducto.tsx (cliente): campo de búsqueda que llama GET /api/publico/productos?q= con espera de 300 ms; muestra los resultados como una lista de tarjetas (nombre, precio actual, foto miniatura). Al elegir uno, carga su ficha. Mensaje "No encontramos productos" si la búsqueda no devuelve nada.

TAREA 3. components/comprar/FichaProducto.tsx y components/comprar/AlertaDiscrepancia.tsx: la ficha muestra foto, nombre, descripción y precio actual (grande). Si la respuesta trae alerta (hay discrepancia), AlertaDiscrepancia muestra, en ámbar y con texto, el mensaje de la sección 11.1 ("El precio del estante ({etiqueta}) no coincide con el precio vigente. Se cobrará {actual}."). Botón "Agregar al carrito" con un selector de cantidad (por defecto 1). (La acción de agregar se conecta en P08; aquí deja el botón listo o conéctalo ya a dataService vía la API del carrito.)

TAREA 4. app/comprar/page.tsx: combina el BuscadorProducto y la FichaProducto del producto seleccionado. El carrito se agrega en P08; por ahora, deja el espacio reservado.

VERIFICACIÓN: pídeme que inicie sesión como admin solo para tener productos (los de P06); la consulta es pública. Como cliente (sin login, incluso en ventana privada): buscar "arroz" (encuentra Arroz Diana); buscar "aceite" y abrir la ficha (muestra la alerta de discrepancia con el precio que se cobra); abrir "pan" (sin alerta); buscar algo inexistente (mensaje). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** como cliente sin login, buscar y abrir productos; comprobar que el de precio discrepante muestra la alerta con el precio que se cobra.

**Commit sugerido:** `feat(interfaz): consulta de productos y alerta de discrepancia`

---

## P08 · Carrito con total en tiempo real y aceptación del módulo mínimo

**Fase:** 5 y 6 · **Crea:** el carrito completo, `doc/ACEPTACION.md` · **Modifica:** `README.md`

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 5, 6.1, 8, 10.3, 11, 11.1, 14, 15 y 16), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: el carrito que suma en tiempo real, congela precios, permite ajustar y eliminar, y cerrar la sesión; y el cierre del módulo mínimo con la aceptación.

TAREA 1. components/comprar/Carrito.tsx, ItemCarrito.tsx y TotalCarrito.tsx (cliente), con el deviceId:
- Al montar, GET /api/publico/carrito?deviceId= para cargar el carrito.
- ItemCarrito: nombre, foto miniatura (si hay), precio unitario (congelado), controles + y − de cantidad y botón quitar. + y − llaman PATCH /api/publico/carrito/item con la nueva cantidad (0 elimina, RN-05); quitar llama DELETE. Cada cambio actualiza el carrito y el total desde la respuesta.
- TotalCarrito: el total grande, con tabular-nums, siempre visible; se actualiza al instante tras cada operación (el "tiempo real" del plan).
- Botón "Vaciar carrito" → POST /api/publico/carrito/cerrar; tras cerrar, el carrito queda vacío y una nueva operación crea una sesión nueva.
- EstadoVacio cuando no hay ítems.
- Nota de la sección 11.1: "El total se calcula con el precio vigente al momento de agregar cada producto."

TAREA 2. Conecta el botón "Agregar al carrito" de FichaProducto (P07): POST /api/publico/carrito con { deviceId, codigo, cantidad }; tras agregar, actualiza el Carrito y, si la respuesta trae alerta, muéstrala. Si el mismo producto ya estaba, la cantidad se suma (RN-07).

TAREA 3. app/comprar/page.tsx: integra consulta y carrito en una sola vista (en móvil, el carrito puede ser una sección inferior o un panel desplegable; el total siempre visible).

TAREA 4. Revisa el código contra las secciones 8 y 14. Reporta y corrige en la bitácora: total que se acumule a mano en vez de recalcularse; precio que se recalcule al leer en vez de usar el congelado; rutas admin sin exigirUsuario; montos con decimales; SQL concatenado; textos en inglés; alerta comunicada solo con color.

TAREA 5. Ejecuta npm test y npm run probar:flujo; corrige fallas en el código. Prepara la aceptación: deja los productos demo o crea los de la tabla; limpia carritos de prueba con db:limpiar --prueba.

TAREA 6. Crea doc/ACEPTACION.md con la tabla A-01 a A-16 de la sección 15.3 (columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación; las tres últimas vacías).

TAREA 7. Actualiza README.md: descripción; funcionalidades; los dos tipos de uso (cliente anónimo y administrador); requisitos (conexión a Postgres, Blob, Supabase Auth); cómo correr en local (npm install, .env.local con los NOMBRES de las variables, db:migrar, db:demo, dev); scripts y su propósito; estructura de carpetas; una nota sobre el precio congelado y la alerta de discrepancia; nota de seguridad (credenciales nunca en el repositorio); enlace a doc/PLAN_PRICEVERIFY.md.

TAREA 8. Verifica que .env.local esté en .gitignore y que ningún archivo versionado tenga credenciales ni valores de variables de entorno.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md (interfaz) y doc/checkpoints/FASE_6_COMPLETADA.md (revisión y pruebas).
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que A-01 a A-16 se ejecutan en el despliegue de Vercel.
````

**Verificación del estudiante:** como cliente, agregar productos y ver el total cambiar al instante; ajustar cantidades; comprobar el precio congelado (A-12: cambiar el precio como admin y ver que el ítem ya agregado lo conserva). Hacer push y ejecutar A-01 a A-16 en Vercel.

**Commit sugerido:** `feat(interfaz): carrito con total en tiempo real y aceptación del módulo mínimo`

---

## P09 · Opcionales: cierre por inactividad, foto en el carrito y escaneo

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/PLAN_PRICEVERIFY.md (secciones 5 (RN-15), 13, 17), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: las tres mejoras opcionales.

TAREA 1. F7 · Foto en el carrito: en ItemCarrito, muestra la foto_url del producto (ya disponible en v_carrito). Si no hay foto, un marcador neutro. (Puede que ya esté; si es así, confírmalo y pasa a la siguiente.)

TAREA 2. F6 · Cierre por inactividad:
- lib/datos/carrito.ts: cerrarSesionesInactivas(): marca 'cerrada' (con fecha_cierre) las sesiones 'activa' cuya ultima_actividad sea anterior a ahora menos INACTIVIDAD_MINUTOS; devuelve { cerradas }. Reexporta en dataService.
- Exponlo de una de estas formas (elige la más simple según ESTADO_ACTUAL.md y explícalo): una ruta protegida GET /api/admin/mantenimiento/cerrar-inactivas que el admin puede invocar; o un Vercel Cron (vercel.json) que llame una ruta con un secreto en el encabezado. Si usas Cron, documenta el secreto como variable de entorno (CRON_SECRET), nunca en el código.
- En verCarrito, si la sesión activa está vencida por inactividad, trátala como cerrada y empieza una nueva (comportamiento coherente aunque el cron no haya corrido).

TAREA 3. Escaneo con cámara:
- components/comprar/EscanerQR.tsx: usa una librería de lectura de códigos del lado del cliente (por ejemplo una de escaneo por cámara); al leer un código, lo pasa al BuscadorProducto como si se hubiera tecleado. Pide permiso de cámara; si no hay cámara o se niega el permiso, muestra un aviso y deja la búsqueda manual.
- app/comprar/escanear/page.tsx: la página del escáner; botón para volver a la búsqueda manual.
- Un botón "Escanear" en la vista de compra abre el escáner.

VERIFICACIÓN: pídeme lo que necesites. Comprueba: la foto aparece en el carrito; cerrarSesionesInactivas marca cerradas las sesiones viejas (puedes bajar temporalmente INACTIVIDAD_MINUTOS para probar y luego restaurarlo); el escáner lee un QR de un código de producto y lo busca (si no tienes cámara en el equipo de prueba, descríbeme cómo probarlo en el celular). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver la foto en el carrito; probar el cierre por inactividad bajando el umbral; escanear un código con el celular.

**Commit sugerido:** `feat(opcional): cierre por inactividad, foto en el carrito y escaneo`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/PLAN_PRICEVERIFY.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/PLAN_PRICEVERIFY.md y doc/PROMPTS_PRICEVERIFY.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel —incluidos el token de Blob y la conexión a Postgres—, o diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````
