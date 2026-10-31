# PriceVerify · Plan técnico de implementación

> Verificador de precios y carrito en tiempo real · versión técnica 1.0, derivada del plan funcional de Rubén Jiménez
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta · Docente: Jhonatan Castro Polo
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres + Vercel Blob + Vercel · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_PRICEVERIFY.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida](#1-punto-de-partida)
2. [Advertencia de seguridad previa](#2-advertencia-de-seguridad-previa)
3. [Alcance](#3-alcance)
4. [Acceso y sesiones](#4-acceso-y-sesiones)
5. [Reglas de negocio](#5-reglas-de-negocio)
6. [Casos de uso](#6-casos-de-uso)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Cálculos y el precio congelado](#8-cálculos-y-el-precio-congelado)
9. [Arquitectura del código](#9-arquitectura-del-código)
10. [Contratos de API](#10-contratos-de-api)
11. [Pantallas](#11-pantallas)
12. [Identidad visual](#12-identidad-visual)
13. [Dinero, escaneo y zona horaria](#13-dinero-escaneo-y-zona-horaria)
14. [Seguridad e integridad](#14-seguridad-e-integridad)
15. [Pruebas](#15-pruebas)
16. [Plan de ejecución](#16-plan-de-ejecución)
17. [Funcionalidades opcionales](#17-funcionalidades-opcionales)
18. [Glosario](#18-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_PRICEVERIFY.md` | Este documento |
| `doc/PROMPTS_PRICEVERIFY.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida

### 1.1 Lo que ya existe y no se reconstruye

- Proyecto Next.js con TypeScript desplegado en Vercel.
- Proyecto Supabase conectado al despliegue, con Supabase Auth en uso (hay al menos una cuenta administrativa).
- Login funcionando.
- Variables de entorno en `.env.local` (local) y en el proyecto de Vercel (producción), incluida `SUPABASE_SERVICE_ROLE_KEY` (solo servidor).

### 1.2 Lo que se verifica en P00 antes de escribir código

| Aspecto | Por qué importa |
|---|---|
| Mecanismo del login (Supabase Auth, según el archivo de usuarios del proyecto) | El adaptador `lib/auth/sesion.ts` debe envolverlo sin reescribirlo |
| Si el login distingue roles (administrador frente a cliente) o solo autentica | Define cómo se separa la gestión de productos (admin) del uso del carrito |
| Ruta a la que redirige el login | Se cambia a `/comprar` |
| Archivo de middleware existente | En Next.js 16 se llama `proxy.ts`; en versiones anteriores, `middleware.ts` |
| Variable de conexión directa a Postgres | El carrito usa transacciones con `pg`; si no existe, se obtiene en P00 |
| Token de Vercel Blob (`BLOB_READ_WRITE_TOKEN`) | Las fotos de producto se guardan en Blob |
| Mecanismo de migraciones existente | Las tablas nuevas se aplican con ese mecanismo; si no existe, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 12) |
| Rutas `/comprar`, `/admin` o `/api` del proyecto | No deben chocar; si existen, se reporta el conflicto |
| Tablas previas llamadas `productos`, `sesiones` o `items_carrito` | Si existen, se reporta su estructura antes de crear las nuevas |

### 1.3 Regla sobre el login y los dos tipos de uso

**Decisión actualizada el 2026-10-31 por solicitud de la usuaria:** todo acceso
a la aplicación requiere iniciar sesión. Esto reemplaza la decisión inicial del
plan funcional de permitir compras anónimas.

- **Cliente:** inicia sesión y luego consulta productos y usa el carrito. El
  carrito conserva su `device_id` (UUID en localStorage) y la sesión autenticada
  habilita las páginas y API de compra.
- **Administrador:** inicia sesión con una cuenta cuyo
  `app_metadata.role=admin` para gestionar productos.
- `/`, `/comprar/*`, `/api/publico/*` y las rutas de administración exigen una
  sesión válida. Sin sesión, las páginas redirigen a `/login` y las API
  responden 401. El login envía a administradores a `/admin` y a clientes a
  `/comprar`.

---

## 2. Advertencia de seguridad previa

El archivo de usuarios del proyecto (`usuarios-registrados.md`) incluía un correo y una contraseña reales en texto plano, pese a declarar que no almacena credenciales. Antes de ejecutar estos prompts:

1. **Cambiar la contraseña** de la cuenta expuesta (`ruben.jimenez01@usa.edu.co`) desde Supabase Auth o el flujo de recuperación.
2. **No volver a escribir credenciales en ningún archivo** del repositorio o de la entrega, ni siquiera en documentos de "solo metadatos".
3. **No versionar el listado de usuarios con credenciales.** Si se necesita un listado administrativo, debe contener solo correo y fecha, nunca contraseña, y la `SUPABASE_SERVICE_ROLE_KEY` se usa únicamente en el servidor (como ya indica el propio documento).
4. **Confirmar que `.env.local` está en `.gitignore`** y que ningún archivo versionado tiene valores de variables de entorno.

Este paso es obligatorio y previo a todo lo demás.

---

## 3. Alcance

### 3.1 Módulo mínimo

| ID | Funcionalidad (plan funcional) | Casos de uso | Prompts |
|---|---|---|---|
| F1 | Consultar un producto por código o por nombre | CU-01 | P04, P05, P07 |
| F2 | Agregar un producto consultado al carrito con una cantidad | CU-02 | P04, P05, P08 |
| F3 | Calcular el total del carrito en tiempo real | CU-03 | P02, P04, P08 |
| F4 | Alertar la discrepancia de precio (etiqueta vs. actual) | CU-01, CU-02 | P02, P04, P08 |

El módulo mínimo necesita, además, que exista un catálogo de productos con su precio actual y su precio de etiqueta. La gestión de ese catálogo (administrador) se construye como soporte del mínimo en P06.

### 3.2 Funcionalidades opcionales

| ID | Funcionalidad | Casos de uso | Prompts |
|---|---|---|---|
| F5 | Eliminar un ítem o ajustar su cantidad (cantidad 0 lo elimina) | CU-04 | P08 |
| F6 | Cierre de sesión del carrito (explícito o por inactividad) | CU-05 | P09 |
| F7 | Mostrar la foto del producto en el listado del carrito | — | P09 |

F5 (eliminar/ajustar) es tan natural en un carrito que se incluye ya en la pantalla del carrito del módulo mínimo; el plan lo marca opcional, pero su costo es mínimo y mejora mucho la demostración. El cierre por inactividad (F6) y la foto en el carrito (F7) sí quedan para la fase opcional.

### 3.3 Fuera de alcance

Se mantiene la lista del plan funcional: no procesa pagos ni se integra con caja, no gestiona inventario ni stock, no aplica promociones complejas (2x1, combos, descuentos por volumen), no gestiona cuentas de cliente (el carrito es anónimo), no funciona sin conexión, y no diferencia sucursales.

### 3.4 Ajustes respecto al plan funcional

| Plan funcional | Plan técnico | Motivo |
|---|---|---|
| Precios decimales | Pesos enteros (`INTEGER`) | El peso colombiano no usa centavos; los enteros evitan errores de redondeo en subtotales y total |
| "Escanear código de barras/QR" | Lectura de QR/código con la cámara en el navegador (opcional) **y** entrada manual del código | La cámara no siempre está disponible; el código siempre se puede teclear o buscar por nombre. El escaneo es una comodidad, no un requisito del cálculo |
| Sesión del carrito sin dueño | Sesión identificada por `device_id` (UUID en localStorage) | Cumple "anónima y temporal" y permite recuperar el carrito si se recarga la página |
| `foto` como URL o ruta | Imagen en Vercel Blob público; se guarda su URL | URL accesible directamente desde `<img>` |
| Catálogo sin administración descrita | Se agrega la gestión de productos por un administrador autenticado | Sin catálogo no hay qué consultar; el plan asume que los productos existen |

### 3.5 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| El `precio_unitario` del ítem se congela al agregarlo (copia del `precio_actual` de ese momento) | El plan funcional lo dice explícitamente; si el admin cambia el precio después, el carrito conserva el que vio el cliente |
| El total se recalcula siempre desde los ítems, nunca se "va sumando" a mano | Evita que el total se desincronice de los ítems (sección 8) |
| La discrepancia se evalúa contra el estado del producto en el momento de consultarlo/agregarlo | El plan compara `precio_actual` con `precio_etiqueta` del producto |
| Un producto no se elimina; se puede desactivar | Un producto puede estar en carritos o en el historial de sesiones |
| Las sesiones cerradas no se reabren; una nueva compra crea una sesión nueva | "Cerrar sesión" vacía el carrito y lo marca cerrado |
| La búsqueda por nombre usa coincidencia parcial sin distinguir mayúsculas ni acentos | "arroz" encuentra "Arroz Diana"; mejora la búsqueda del cliente |

---

## 4. Acceso y sesiones

| Actor | Acceso | Puede hacer |
|---|---|---|
| Cliente | Público, sin cuenta | Consultar productos, agregar al carrito, ver el total y las alertas, ajustar o vaciar su carrito |
| Administrador | Login existente | Gestionar el catálogo: crear y editar productos, fijar precio actual y precio de etiqueta, subir foto, desactivar |
| Sistema | Interno | Calcula subtotales y total, evalúa la discrepancia, congela el precio al agregar, cierra sesiones |

| Ruta | Cliente | Administrador |
|---|:-:|:-:|
| `/`, `/comprar` | Sí | Sí |
| `/api/publico/*` | Sí | Sí |
| `/admin/*` | No | Sí |
| `/api/admin/*` | No | Sí |

El carrito del cliente se identifica con `device_id` (UUID en localStorage, `lib/deviceId.ts`). No hay datos personales del cliente: la sesión es anónima.

---

## 5. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | El total del carrito es la suma de (cantidad × precio_unitario) de todos los ítems activos de la sesión | Regla 1 | `lib/reglas/carrito.ts` `calcularTotal`; se recalcula en cada operación |
| RN-02 | Hay alerta de discrepancia cuando `precio_actual ≠ precio_etiqueta`, con tolerancia 0 (una diferencia de $1 ya alerta) | Regla 2 | `lib/reglas/precio.ts` `hayDiscrepancia` |
| RN-03 | Al alertar, se muestra el `precio_actual` (el que se cobra); el producto se agrega con ese precio y la operación no se bloquea | Regla 3 | Servicio `agregarAlCarrito`; la alerta es informativa |
| RN-04 | Si `precio_etiqueta` es nulo, no se evalúa la discrepancia y no hay alerta | Regla 4 | `lib/reglas/precio.ts` `hayDiscrepancia` |
| RN-05 | Un ítem con cantidad 0 se elimina automáticamente del carrito | Regla 5 | Servicio `ajustarCantidad` |
| RN-06 | El precio unitario de un ítem se congela al agregarlo: es el `precio_actual` del producto en ese momento | Sección 5 del plan (datos) | Servicio `agregarAlCarrito` |
| RN-07 | Agregar un producto que ya está en el carrito suma a su cantidad; no crea un segundo ítem | Sección 4.2 del plan ("crear o actualizar el ítem") | Servicio `agregarAlCarrito` |
| RN-08 | La cantidad de un ítem es un entero mayor o igual a 0 (0 lo elimina, RN-05); al agregar, mayor que 0 | Sección 5 | `lib/reglas/carrito.ts`; Zod; BD CHECK |
| RN-09 | El código de producto es único e identifica al producto (código de barras o QR) | Sección 5 | BD UNIQUE |
| RN-10 | El precio actual de un producto es un entero mayor que 0; el de etiqueta es un entero mayor que 0 o nulo | Agregada (enteros) | BD CHECK; Zod |
| RN-11 | La consulta encuentra por código exacto o por coincidencia parcial del nombre (sin distinguir mayúsculas ni acentos) | Sección 4.1 | `lib/datos/productos.ts` `buscarProductos` |
| RN-12 | Solo se opera sobre productos activos; un producto inactivo no aparece en la consulta del cliente | Agregada | Servicio; filtro en consultas públicas |
| RN-13 | El subtotal de un ítem es cantidad × precio_unitario; se recalcula al cambiar la cantidad | Sección 4.2, 4.5 | `lib/reglas/carrito.ts` |
| RN-14 | Una sesión cerrada no admite más operaciones; vaciar el carrito la marca cerrada | Sección 4.6 | Servicio `cerrarSesion` |
| RN-15 | El cierre por inactividad marca cerradas las sesiones activas cuya última actividad supere el umbral (opcional, F6) | Sección 4.6 | Sección 17 |
| RN-16 | Solo el administrador gestiona el catálogo; el cliente nunca cambia precios | Sección 1.3 | `exigirUsuario()` en `/api/admin/*` |

### 5.1 La alerta de discrepancia, en detalle

Al consultar un producto y al agregarlo, el sistema compara `precio_actual` con `precio_etiqueta`:

- Si `precio_etiqueta` es nulo → sin alerta (RN-04).
- Si son iguales → sin alerta.
- Si difieren (en cualquier monto) → alerta informativa que muestra el `precio_actual` como el precio que se cobrará (RN-02, RN-03). El producto se agrega igual, con el `precio_actual`.

La ficha del producto siempre muestra el `precio_actual`. Cuando hay discrepancia, muestra además, de forma secundaria, el `precio_etiqueta` tachado o con una nota "El estante decía $X; el precio vigente es $Y".

---

## 6. Casos de uso

| ID | Actor | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|---|
| CU-01 Consultar producto | Cliente | código exacto o texto de nombre | — | Ficha del producto con precio actual y alerta si hay discrepancia; o "no encontrado" | `DATOS_INVALIDOS`, `PRODUCTO_NO_ENCONTRADO` |
| CU-02 Agregar al carrito | Cliente | device_id, código, cantidad | el producto existe y está activo | Ítem creado o cantidad sumada; precio congelado; total recalculado; alerta si hay discrepancia | `PRODUCTO_NO_ENCONTRADO`, `DATOS_INVALIDOS`, `SESION_CERRADA` |
| CU-03 Ver carrito y total | Cliente | device_id | — | Ítems con subtotal, total en tiempo real, alertas vigentes | — |
| CU-04 Ajustar o eliminar ítem | Cliente | device_id, código, nueva cantidad | ítem existe | Cantidad y subtotal actualizados, o ítem eliminado si cantidad 0; total recalculado | `ITEM_NO_ENCONTRADO`, `SESION_CERRADA`, `DATOS_INVALIDOS` |
| CU-05 Cerrar sesión | Cliente | device_id | — | Carrito vaciado, sesión cerrada; lista para una nueva | — |
| CU-06 Gestionar producto | Administrador | datos del producto | es administrador | Producto creado o editado; precios y foto actualizados | `DATOS_INVALIDOS`, `CODIGO_DUPLICADO`, `PRODUCTO_NO_ENCONTRADO` |
| CU-07 Desactivar producto | Administrador | código | es administrador | Producto inactivo (sale de la consulta del cliente) | `PRODUCTO_NO_ENCONTRADO` |

### 6.1 Secuencia de CU-02 (agregar al carrito)

Todo ocurre dentro de `conTransaccion`:

1. `validarCantidad(cantidad)` (entero mayor que 0 al agregar).
2. Obtener o crear la sesión activa del `device_id`; si la que existe está cerrada, se crea una nueva (RN-14).
3. Buscar el producto por código, activo; si no existe, `PRODUCTO_NO_ENCONTRADO`.
4. Evaluar la discrepancia (`hayDiscrepancia`) para informarla en la respuesta (RN-02 a RN-04).
5. Si el ítem ya existe en la sesión, sumar la cantidad (RN-07); si no, crear el ítem con `precio_unitario = producto.precio_actual` (RN-06). El subtotal se deriva (columna generada) o se calcula.
6. Recalcular el total de la sesión desde los ítems (RN-01) y guardarlo.
7. Confirmar y devolver el carrito, el total y la información de la alerta.

```ts
export async function agregarAlCarrito(deviceId: string, codigo: string, cantidad: number): Promise<ResultadoCarrito> {
  validarCantidad(cantidad, { permitirCero: false });
  return conTransaccion(async (tx) => {
    const sesion = await obtenerOCrearSesionActiva(tx, deviceId);
    const producto = await obtenerProductoActivo(tx, codigo); // PRODUCTO_NO_ENCONTRADO
    const alerta = evaluarDiscrepancia(producto);             // RN-02..RN-04

    await sumarOCrearItem(tx, {
      sesionId: sesion.id, codigo: producto.codigo,
      cantidad, precioUnitario: producto.precioActual,        // RN-06, RN-07
    });

    const total = await recalcularTotal(tx, sesion.id);       // RN-01
    const carrito = await leerCarrito(tx, sesion.id);
    return { carrito, total, alerta };
  });
}
```

---

## 7. Modelo de datos

### 7.1 Relaciones

```text
productos 1 ──── N items_carrito
sesiones  1 ──── N items_carrito

v_carrito = ítems de una sesión con el nombre, la foto y el precio actual vigente del producto (para comparar con el congelado)
```

Las migraciones se guardan en `supabase/migrations/` y continúan la numeración existente (P00 la identifica). En este documento se nombran M1 y M2.

### 7.2 M1 · Tablas

```sql
-- M1: tablas de PriceVerify

CREATE TABLE IF NOT EXISTS productos (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          VARCHAR(64)   NOT NULL,                 -- código de barras o QR
  nombre          VARCHAR(160)  NOT NULL,
  descripcion     TEXT,
  precio_actual   INTEGER       NOT NULL,                 -- pesos enteros (RN-10)
  precio_etiqueta INTEGER,                                -- nulo si no hay etiqueta registrada (RN-04)
  foto_url        TEXT,                                   -- URL pública de Vercel Blob
  activo          BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT productos_codigo_unico      UNIQUE (codigo),                       -- RN-09
  CONSTRAINT productos_nombre_minimo     CHECK (char_length(btrim(nombre)) >= 2),
  CONSTRAINT productos_precio_actual_ok  CHECK (precio_actual > 0),             -- RN-10
  CONSTRAINT productos_precio_etiqueta_ok CHECK (precio_etiqueta IS NULL OR precio_etiqueta > 0)
);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (lower(nombre));
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);

CREATE TABLE IF NOT EXISTS sesiones (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       VARCHAR(64)   NOT NULL,
  estado          VARCHAR(8)    NOT NULL DEFAULT 'activa',
  total           INTEGER       NOT NULL DEFAULT 0,
  fecha_inicio    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ultima_actividad TIMESTAMPTZ  NOT NULL DEFAULT NOW(),   -- para el cierre por inactividad (F6)
  fecha_cierre    TIMESTAMPTZ,
  CONSTRAINT sesiones_estado_valido CHECK (estado IN ('activa', 'cerrada')),
  CONSTRAINT sesiones_total_no_negativo CHECK (total >= 0)
);
-- Una sola sesión activa por dispositivo:
CREATE UNIQUE INDEX IF NOT EXISTS ux_sesiones_activa_por_device
  ON sesiones (device_id) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_sesiones_actividad ON sesiones (estado, ultima_actividad);

CREATE TABLE IF NOT EXISTS items_carrito (
  id              BIGSERIAL     PRIMARY KEY,
  sesion_id       UUID          NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  producto_id     UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  codigo_producto VARCHAR(64)   NOT NULL,                 -- copia para mostrar aunque cambie el producto
  cantidad        INTEGER       NOT NULL,
  precio_unitario INTEGER       NOT NULL,                 -- congelado al agregar (RN-06)
  subtotal        INTEGER       GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,  -- RN-13
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT items_cantidad_positiva    CHECK (cantidad > 0),        -- 0 elimina el ítem (RN-05), no se guarda
  CONSTRAINT items_precio_positivo      CHECK (precio_unitario > 0),
  CONSTRAINT items_unico_por_sesion     UNIQUE (sesion_id, producto_id)  -- RN-07
);
CREATE INDEX IF NOT EXISTS idx_items_sesion ON items_carrito (sesion_id);

CREATE OR REPLACE FUNCTION pv_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON productos;
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION pv_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_items_updated_at ON items_carrito;
CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON items_carrito
  FOR EACH ROW EXECUTE FUNCTION pv_actualizar_updated_at();
```

### 7.3 M2 · Vista del carrito y seguridad

```sql
-- M2: vista del carrito y cierre de acceso público

CREATE OR REPLACE VIEW v_carrito
WITH (security_invoker = true) AS
SELECT
  i.id, i.sesion_id, i.producto_id, i.codigo_producto, i.cantidad,
  i.precio_unitario, i.subtotal,
  p.nombre, p.foto_url,
  p.precio_actual   AS precio_actual_vigente,
  p.precio_etiqueta AS precio_etiqueta_vigente
FROM items_carrito i
JOIN productos p ON p.id = i.producto_id;

ALTER TABLE productos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_carrito  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON productos, sesiones, items_carrito FROM anon, authenticated;
REVOKE ALL ON v_carrito FROM anon, authenticated;
```

Las tablas quedan sin políticas: la clave pública de Supabase no puede leerlas ni escribirlas. Todo el acceso ocurre en el servidor mediante la conexión directa a Postgres. Las rutas del cliente, aunque públicas, pasan por el servidor del proyecto, que es quien consulta la base; la clave pública de Supabase nunca toca estas tablas.

### 7.4 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `productos_codigo_unico` | `CODIGO_DUPLICADO` |
| `23505` | `items_unico_por_sesion` | (se maneja sumando cantidad; no debería aflorar, RN-07) |
| `23505` | `ux_sesiones_activa_por_device` | (carrera de creación de sesión; reintentar leyendo la activa) |
| `23514` | cualquier CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 8. Cálculos y el precio congelado

Todo opera con pesos enteros.

| Cálculo | Fórmula | Regla |
|---|---|---|
| Subtotal de un ítem | `cantidad × precio_unitario` (columna generada) | RN-13 |
| Total del carrito | suma de los subtotales de los ítems de la sesión | RN-01 |
| Discrepancia | `precio_etiqueta` no nulo y `precio_actual ≠ precio_etiqueta` | RN-02, RN-04 |

### 8.1 Por qué el precio se congela

El `precio_unitario` del ítem se copia del `precio_actual` del producto cuando se agrega (RN-06). Si el administrador cambia el precio del producto después, el carrito del cliente **no cambia**: conserva el precio con el que se agregó. Esto es intencional (es el precio que el cliente vio y aceptó al agregarlo) y lo hace coherente con un carrito real. La vista `v_carrito` incluye además el `precio_actual_vigente` por si se quiere mostrar que el precio del producto cambió desde que se agregó, pero el subtotal y el total usan siempre el precio congelado.

### 8.2 El total siempre se recalcula

El total de la sesión nunca se "va sumando" incrementalmente: después de cada operación (agregar, ajustar, eliminar) se recalcula desde cero sumando los subtotales de los ítems (`SELECT SUM(subtotal)`). Así el total no puede quedar desincronizado de los ítems. El "tiempo real" del plan se logra porque cada operación devuelve el total recalculado y la interfaz lo muestra de inmediato.

---

## 9. Arquitectura del código

### 9.1 Capas

```text
Pantallas (app/comprar/*, app/admin/*) ─┐
                                        ├──► Rutas API ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ─────────────┘        │                     │
                                                 └── lib/validacion     └── lib/reglas/* (funciones puras)
```

- `lib/reglas/`: reglas puras (cálculo de total y subtotal, validación de cantidad, discrepancia de precio, normalización de código y nombre). No importan `pg`, ni red, ni el reloj (salvo `fechas.ts`). Se prueban con Vitest.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única. Las rutas y páginas importan datos solo desde aquí.
- Rutas API: las públicas validan y llaman a `dataService`; las de `/api/admin/*` llaman primero a `exigirUsuario()`.

### 9.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_priceverify_tablas.sql
supabase/migrations/NNNN_priceverify_vista_seguridad.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

lib/config/priceverify.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/producto.ts
lib/reglas/carrito.ts
lib/reglas/precio.ts
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesion.ts
lib/http/respuestas.ts
lib/formato.ts
lib/deviceId.ts
lib/hooks/useDeviceId.ts
lib/blobImages.ts
lib/datos/tipos.ts
lib/datos/productos.ts
lib/datos/carrito.ts
lib/dataService.ts

tests/reglas/ayudas.ts
tests/reglas/carrito.test.ts
tests/reglas/precio.test.ts
tests/reglas/producto.test.ts
vitest.config.ts

app/page.tsx                                  (redirige a /comprar)
app/comprar/layout.tsx
app/comprar/page.tsx                          (consulta + carrito)
app/comprar/escanear/page.tsx                 (opcional, cámara)
app/admin/layout.tsx
app/admin/page.tsx                            (catálogo)
app/admin/productos/nuevo/page.tsx
app/admin/productos/[id]/page.tsx

app/api/publico/productos/route.ts            (GET buscar)
app/api/publico/productos/[codigo]/route.ts   (GET ficha)
app/api/publico/carrito/route.ts              (GET por device, POST agregar)
app/api/publico/carrito/item/route.ts         (PATCH ajustar, DELETE eliminar)
app/api/publico/carrito/cerrar/route.ts       (POST cerrar)
app/api/admin/productos/route.ts              (GET todos, POST crear)
app/api/admin/productos/[id]/route.ts         (PATCH editar)
app/api/admin/productos/[id]/foto/route.ts    (POST subir foto)
app/api/admin/productos/[id]/desactivar/route.ts

components/ui/Boton.tsx
components/ui/Campo.tsx
components/ui/Tarjeta.tsx
components/ui/Insignia.tsx
components/ui/Aviso.tsx
components/ui/Modal.tsx
components/ui/EstadoVacio.tsx
components/comprar/BuscadorProducto.tsx
components/comprar/FichaProducto.tsx
components/comprar/AlertaDiscrepancia.tsx
components/comprar/Carrito.tsx
components/comprar/ItemCarrito.tsx
components/comprar/TotalCarrito.tsx
components/comprar/EscanerQR.tsx              (opcional)
components/admin/NavegacionAdmin.tsx
components/admin/TablaProductos.tsx
components/admin/FormularioProducto.tsx
components/admin/SubidorFoto.tsx
```

### 9.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio |
| Las reglas puras viven en `lib/reglas/` y no tocan la base ni la red | Se prueban con Vitest |
| El total se recalcula desde los ítems, nunca se acumula a mano | Sección 8.2 |
| El precio unitario se congela al agregar; el subtotal y el total usan el congelado | RN-06, sección 8.1 |
| Montos como `number` entero en pesos; nunca decimales | Sección 13 |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única |
| Las rutas `/api/admin/*` llaman `exigirUsuario()` como primera instrucción | RN-16 |
| Las rutas `/api/publico/*` reciben el `device_id` en el cuerpo o la query; nunca exponen datos de otros dispositivos | Sección 14 |
| El código y el nombre se normalizan antes de buscar o comparar | RN-11 |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js 15 y 16 entregan `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 9.4 Configuración

```ts
// lib/config/priceverify.ts
export const INACTIVIDAD_MINUTOS = 30;        // cierre por inactividad (F6, opcional)
export const TOLERANCIA_DISCREPANCIA = 0;     // RN-02: cualquier diferencia alerta
export const CANTIDAD_MAXIMA_ITEM = 999;      // tope razonable por ítem
export const LIMITE_BUSQUEDA = 50;            // resultados por búsqueda
export const ZONA_HORARIA = 'America/Bogota';
```

### 9.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'PRODUCTO_NO_ENCONTRADO' | 'CODIGO_DUPLICADO'
  | 'ITEM_NO_ENCONTRADO' | 'SESION_CERRADA' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 10.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 10.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export function ahoraISO(reloj?: Date): string;
export function minutosDesde(fechaISO: string, reloj?: Date): number;   // para inactividad (F6)

// lib/reglas/producto.ts
export function normalizarCodigo(codigo: string): string;              // recorta; respeta mayúsculas del código
export function normalizarTextoBusqueda(texto: string): string;        // minúsculas, sin acentos, recortado
export function validarDatosProducto(d: {
  codigo: string; nombre: string; precioActual: number; precioEtiqueta: number | null;
}): void;  // código y nombre no vacíos; precioActual entero > 0; precioEtiqueta null o entero > 0

// lib/reglas/precio.ts
export function hayDiscrepancia(precioActual: number, precioEtiqueta: number | null): boolean;  // RN-02, RN-04
export function describirDiscrepancia(precioActual: number, precioEtiqueta: number | null):
  { hay: boolean; precioCobrado: number; precioEtiqueta: number | null };  // para la alerta (RN-03)

// lib/reglas/carrito.ts
export function validarCantidad(cantidad: number, opciones?: { permitirCero?: boolean }): void;
// entero; >= 0 si permitirCero, > 0 si no; <= CANTIDAD_MAXIMA_ITEM; si no, DATOS_INVALIDOS
export function subtotal(cantidad: number, precioUnitario: number): number;   // RN-13
export function calcularTotal(items: Array<{ cantidad: number; precioUnitario: number }>): number;  // RN-01
export function nuevaCantidadAlSumar(cantidadActual: number, cantidadAgregada: number): number;     // RN-07
```

### 9.6 Firmas de `dataService`

```ts
// Productos (consulta pública)
buscarProductos(texto: string): Promise<FilaProducto[]>            // por código exacto o nombre parcial (RN-11, RN-12)
obtenerProductoPorCodigo(codigo: string): Promise<ProductoConAlerta>  // ficha + discrepancia

// Productos (admin)
listarProductosAdmin(f?: { busqueda?: string; incluirInactivos?: boolean }): Promise<FilaProductoAdmin[]>
crearProducto(d: DatosProducto): Promise<{ id: string; codigo: string }>
editarProducto(id: string, d: DatosProducto): Promise<void>
subirFotoProducto(id: string, archivo: Buffer, mime: string): Promise<{ fotoUrl: string }>
desactivarProducto(id: string): Promise<void>

// Carrito (público, por device_id)
verCarrito(deviceId: string): Promise<EstadoCarrito>
agregarAlCarrito(deviceId: string, codigo: string, cantidad: number): Promise<ResultadoCarrito>
ajustarCantidad(deviceId: string, codigo: string, nuevaCantidad: number): Promise<ResultadoCarrito>  // 0 elimina (RN-05)
eliminarItem(deviceId: string, codigo: string): Promise<ResultadoCarrito>
cerrarSesion(deviceId: string): Promise<void>

// Mantenimiento (opcional, F6)
cerrarSesionesInactivas(): Promise<{ cerradas: number }>
```

Tipos (`lib/datos/tipos.ts`): `FilaProducto { codigo, nombre, precioActual, fotoUrl }`; `ProductoConAlerta { producto, alerta: { hay, precioCobrado, precioEtiqueta } }`; `ItemCarrito { codigo, nombre, cantidad, precioUnitario, subtotal, fotoUrl, precioActualVigente }`; `EstadoCarrito { sesionId, items, total, estado }`; `ResultadoCarrito { carrito: EstadoCarrito, alerta?: {...} }`; `DatosProducto`, `FilaProductoAdmin`.

### 9.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → texto
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(1184, (v) => v);                 // TIMESTAMPTZ → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (ids, COUNT, SUM) → number

const globalParaPool = globalThis as unknown as { poolPriceVerify?: Pool };

export const pool = globalParaPool.poolPriceVerify ?? new Pool({
  connectionString: process.env.DATABASE_URL,        // el nombre real lo confirma P00
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolPriceVerify = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }
export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> { /* BEGIN/COMMIT/ROLLBACK */ }
```

`SUM(subtotal)` sobre `INTEGER` devuelve `BIGINT`; el parser lo pasa a número. Como todo es entero, no hace falta parser para `NUMERIC`.

---

## 10. Contratos de API

### 10.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "PRODUCTO_NO_ENCONTRADO", "mensaje": "No encontramos un producto con ese código o nombre.", "detalles": null } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 10.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión como administrador. |
| `PRODUCTO_NO_ENCONTRADO` | 404 | No encontramos un producto con ese código o nombre. |
| `CODIGO_DUPLICADO` | 409 | Ya existe un producto con ese código. |
| `ITEM_NO_ENCONTRADO` | 404 | Ese producto no está en el carrito. |
| `SESION_CERRADA` | 409 | La sesión del carrito ya se cerró. Inicie una nueva. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

### 10.3 Endpoints

| Método y ruta | Acceso | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|---|
| `GET /api/publico/productos?q=` | Cliente | texto de búsqueda | `FilaProducto[]` |
| `GET /api/publico/productos/[codigo]` | Cliente | | `ProductoConAlerta` |
| `GET /api/publico/carrito?deviceId=` | Cliente | | `EstadoCarrito` |
| `POST /api/publico/carrito` | Cliente | `{ deviceId, codigo, cantidad }` | `ResultadoCarrito` (201) |
| `PATCH /api/publico/carrito/item` | Cliente | `{ deviceId, codigo, cantidad }` | `ResultadoCarrito` (0 elimina) |
| `DELETE /api/publico/carrito/item` | Cliente | `{ deviceId, codigo }` | `ResultadoCarrito` |
| `POST /api/publico/carrito/cerrar` | Cliente | `{ deviceId }` | `{ cerrada: true }` |
| `GET /api/admin/productos?busqueda=&incluirInactivos=` | Admin | | `FilaProductoAdmin[]` |
| `POST /api/admin/productos` | Admin | `{ codigo, nombre, descripcion?, precioActual, precioEtiqueta? }` | `{ id, codigo }` (201) |
| `PATCH /api/admin/productos/[id]` | Admin | mismos campos | `{ actualizado: true }` |
| `POST /api/admin/productos/[id]/foto` | Admin | multipart (imagen) | `{ fotoUrl }` |
| `POST /api/admin/productos/[id]/desactivar` | Admin | | `{ desactivado: true }` |

Las rutas públicas reciben el `deviceId` (UUID). El servidor solo opera sobre la sesión de ese `deviceId`.

### 10.4 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaBusqueda` | q texto, recortado, 1 a 80 |
| `esquemaCodigo` | código recortado, 1 a 64 |
| `esquemaDeviceId` | UUID |
| `esquemaAgregar` | deviceId uuid, codigo, cantidad entero 1 a 999 |
| `esquemaAjustar` | deviceId uuid, codigo, cantidad entero 0 a 999 (0 elimina) |
| `esquemaEliminar` | deviceId uuid, codigo |
| `esquemaProducto` | codigo (1 a 64), nombre (2 a 160), descripcion opcional, precioActual entero ≥ 1, precioEtiqueta entero ≥ 1 o null |

La discrepancia y el congelado de precio se resuelven en `lib/reglas/` y en el servicio, no en Zod.

---

## 11. Pantallas

| Ruta | Acceso | Contenido |
|---|---|---|
| `/` | — | Redirige a `/comprar`. |
| Layout `/comprar` | Cliente | Barra con "PriceVerify", acceso al carrito y, discreto, un enlace "Administración" al login. Usa `useDeviceId`. |
| `/comprar` · Comprar | Cliente | `BuscadorProducto` (campo que busca por código o nombre, con botón de escanear si F-cámara está activo). Resultados como fichas. Al elegir un producto, `FichaProducto` muestra nombre, descripción, foto, precio actual y, si hay discrepancia, `AlertaDiscrepancia` ("El estante decía $X; el precio vigente es $Y"). Botón "Agregar" con cantidad. A un lado o abajo, el `Carrito` con sus `ItemCarrito` (nombre, cantidad con + y −, subtotal, quitar) y `TotalCarrito` grande y siempre visible, que se actualiza al instante tras cada cambio. Botón "Vaciar carrito" (cierra la sesión). `EstadoVacio` cuando el carrito está vacío. |
| `/comprar/escanear` · Escanear (opcional) | Cliente | `EscanerQR` que usa la cámara para leer un código y lo pasa al buscador. Si no hay cámara o permiso, remite a la búsqueda manual. |
| Layout `/admin` | Admin | Verifica la sesión; sin sesión redirige al login. `NavegacionAdmin` y botón de cerrar sesión. |
| `/admin` · Catálogo | Admin | `TablaProductos`: código, nombre, precio actual, precio de etiqueta (o "—"), indicador de discrepancia, estado; buscador; botón "Nuevo producto"; acciones editar y desactivar. |
| `/admin/productos/nuevo` y `/admin/productos/[id]` | Admin | `FormularioProducto`: código, nombre, descripción, precio actual, precio de etiqueta (opcional), `SubidorFoto` (a Vercel Blob). Al guardar, vuelve al catálogo. |

### 11.1 Textos fijos

Alerta de discrepancia (cliente):

> El precio del estante ({precioEtiqueta}) no coincide con el precio vigente. Se cobrará {precioActual}.

Nota del carrito:

> El total se calcula con el precio vigente al momento de agregar cada producto.

---

## 12. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#1B7A5A` | Botones principales, barra superior (verde "mercado") |
| `--color-primario-suave` | `#E4F2EC` | Fondos de selección, hover |
| `--color-alerta` | `#B7791F` | Alerta de discrepancia de precio |
| `--color-peligro` | `#B83232` | Errores, quitar |
| `--color-total` | `#1B7A5A` | El total del carrito, destacado |
| `--color-inactivo` | `#5B6770` | Producto inactivo |
| `--color-fondo` | `#F5F7F6` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas, fichas |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9DEE4` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

Criterios: pensado para móvil primero (el cliente compra con el celular en la mano); el total siempre visible y grande, con fuente tabular (`tabular-nums`); precios con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`; la alerta de discrepancia con color ámbar y texto, nunca solo color; controles de cantidad con botones grandes (+/−) fáciles de tocar; sin emojis; tipografía del proyecto (si no hay, Inter con `next/font`).

---

## 13. Dinero, escaneo y zona horaria

| Regla | Implementación |
|---|---|
| Montos | Pesos enteros (`INTEGER` en la base, `number` entero en el código); sin centavos |
| Presentación | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })` → "$ 4.500" |
| device_id | UUID generado en el primer uso, en localStorage (`pv_device_id`) |
| Escaneo (opcional) | Lectura de QR/código con la cámara en el navegador (una librería de escaneo del lado del cliente); siempre hay alternativa manual |
| Inactividad (opcional, F6) | `ultima_actividad` se actualiza en cada operación; el cierre compara con `INACTIVIDAD_MINUTOS` |
| Zona horaria | Las marcas de tiempo se guardan en UTC; la inactividad se mide por diferencia de tiempo, no por "día", así que no depende de la zona |

El cálculo del carrito no depende de fechas, así que no hay riesgo de zona horaria en las reglas de negocio; la zona solo afecta cómo se muestran las marcas de tiempo si se listan.

---

## 14. Seguridad e integridad

| Medida | Detalle |
|---|---|
| Cambio de la credencial expuesta | Obligatorio y previo (sección 2) |
| Gestión de catálogo solo con sesión | `exigirUsuario()` en cada ruta de `/api/admin` (RN-16) |
| Carrito anónimo acotado al dispositivo | El servidor solo opera sobre la sesión del `device_id` recibido; no expone carritos de otros dispositivos |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated`; todo pasa por el servidor del proyecto |
| Integridad del carrito | Las operaciones usan transacción; el total se recalcula desde los ítems (sección 8.2); `UNIQUE (sesion_id, producto_id)` evita ítems duplicados |
| Precio congelado | El `precio_unitario` no se recalcula desde el producto al leer; se guarda al agregar (RN-06) |
| Validación en tres puntos | Navegador (Zod y reglas), API (Zod y reglas) y base (CHECK, UNIQUE) |
| SQL parametrizado | Ningún valor se concatena |
| Fotos | Imagen en Vercel Blob público; se guarda la URL, no el archivo en la base |
| Credenciales | Nunca en el repositorio; `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor |
| Errores internos | Se registran con `console.error`; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

Nota de alcance: como el carrito es anónimo y acotado al dispositivo, otra persona con el mismo `device_id` (improbable: es un UUID) vería el mismo carrito. No hay datos personales en juego, así que el riesgo es nulo para este alcance.

---

## 15. Pruebas

### 15.1 Pruebas unitarias de reglas (Vitest)

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `hayDiscrepancia` | actual 4500, etiqueta 4500 | `false` |
| T-02 | `hayDiscrepancia` | actual 4500, etiqueta 4499 | `true` (diferencia de $1, RN-02) |
| T-03 | `hayDiscrepancia` | actual 4500, etiqueta null | `false` (RN-04) |
| T-04 | `hayDiscrepancia` | actual 4500, etiqueta 5000 | `true` |
| T-05 | `describirDiscrepancia` | actual 4500, etiqueta 5000 | `{ hay: true, precioCobrado: 4500, precioEtiqueta: 5000 }` |
| T-06 | `subtotal` | 3, 1500 | 4500 |
| T-07 | `calcularTotal` | [ {2,1000}, {1,4500} ] | 6500 |
| T-08 | `calcularTotal` | [] | 0 |
| T-09 | `nuevaCantidadAlSumar` | 2, 3 | 5 (RN-07) |
| T-10 | `validarCantidad` | 0, sin permitirCero | `DATOS_INVALIDOS` |
| T-11 | `validarCantidad` | 0, con permitirCero | sin error (RN-05) |
| T-12 | `validarCantidad` | -1 | `DATOS_INVALIDOS` |
| T-13 | `validarCantidad` | 2.5 | `DATOS_INVALIDOS` |
| T-14 | `validarCantidad` | 1000 (> máximo) | `DATOS_INVALIDOS` |
| T-15 | `validarCantidad` | 1 | sin error |
| T-16 | `normalizarTextoBusqueda` | "  ArRóz  " | "arroz" (minúsculas, sin acento, recortado) |
| T-17 | `normalizarCodigo` | " 770123 " | "770123" (recorta; conserva el valor) |
| T-18 | `validarDatosProducto` | precioActual 0 | `DATOS_INVALIDOS` |
| T-19 | `validarDatosProducto` | precioEtiqueta -1 | `DATOS_INVALIDOS` |
| T-20 | `validarDatosProducto` | nombre " " | `DATOS_INVALIDOS` |
| T-21 | `validarDatosProducto` | codigo "770", nombre "Arroz", actual 4500, etiqueta null | sin error |
| T-22 | `validarDatosProducto` | codigo "770", nombre "Arroz", actual 4500, etiqueta 5000 | sin error |

Comando: `npm test`. Las 22 pruebas deben pasar antes de continuar con la fase 3.

### 15.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` con códigos `PV-TEST-*` y un device_id de prueba. Imprime `OK` o `FALLA` por paso y limpia al final.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Crear producto `PV-TEST-1` "Arroz Prueba", actual 4500, etiqueta 4500 | Creado |
| 2 | Crear `PV-TEST-1` otra vez | `CODIGO_DUPLICADO` |
| 3 | Crear `PV-TEST-2` "Aceite Prueba", actual 12000, etiqueta 11000 (discrepancia) | Creado |
| 4 | Crear `PV-TEST-3` "Pan Prueba", actual 3000, etiqueta null | Creado |
| 5 | Buscar "prueba" | Los tres productos |
| 6 | Consultar `PV-TEST-2` | Alerta de discrepancia: cobra 12000, etiqueta 11000 |
| 7 | Consultar `PV-TEST-3` | Sin alerta (etiqueta null) |
| 8 | Agregar `PV-TEST-1` x2 al carrito del device | Total 9000; sin alerta |
| 9 | Agregar `PV-TEST-2` x1 | Total 21000; alerta en la respuesta |
| 10 | Agregar `PV-TEST-1` x3 de nuevo | Suma: ahora `PV-TEST-1` tiene 5; total 34500 (5×4500 + 12000) |
| 11 | Ajustar `PV-TEST-2` a cantidad 0 | Se elimina; total 22500 (5×4500) |
| 12 | Editar `PV-TEST-1` a actual 5000 y releer el carrito | El ítem conserva 4500 (precio congelado); total sigue 22500 |
| 13 | Agregar `PV-TEST-1` x1 ahora | El nuevo ítem... (ya existe) suma a 6 a 4500 (el ítem conserva su precio congelado original); total 27000 |
| 14 | Agregar con cantidad 0 | `DATOS_INVALIDOS` |
| 15 | Cerrar la sesión; ver carrito | Carrito vacío; nueva sesión activa |

Nota del paso 13: como el ítem ya existe con precio congelado 4500, sumar cantidad mantiene ese precio (no se recongela). Si se quisiera el precio nuevo habría que quitar el ítem y agregarlo de nuevo; esto se documenta como comportamiento esperado.

### 15.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md`.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Como admin, crear "Arroz Diana" código 7701 actual $4.500 etiqueta $4.500 | Aparece en el catálogo |
| A-02 | Crear "Aceite Premier" actual $12.000 etiqueta $11.000 | Creado; el catálogo marca discrepancia |
| A-03 | Crear "Pan Bimbo" actual $3.000 sin etiqueta | Creado; sin discrepancia |
| A-04 | Subir una foto a "Arroz Diana" | La foto aparece en el catálogo y en la ficha |
| A-05 | Como cliente (sin login), buscar "arroz" | Encuentra "Arroz Diana" |
| A-06 | Consultar "Aceite Premier" | Alerta: "El estante decía $11.000; se cobra $12.000" |
| A-07 | Consultar "Pan Bimbo" | Sin alerta |
| A-08 | Agregar "Arroz Diana" x2 | Carrito total $9.000, en tiempo real |
| A-09 | Agregar "Aceite Premier" x1 | Total $21.000; alerta mostrada |
| A-10 | Volver a agregar "Arroz Diana" x1 | La cantidad sube a 3; no se crea otro ítem; total $25.500 |
| A-11 | Bajar "Aceite Premier" a 0 | Se elimina del carrito; total $13.500 |
| A-12 | Como admin, cambiar el precio de "Arroz Diana" a $5.000; como cliente, ver el carrito | El ítem ya agregado conserva $4.500 (precio congelado) |
| A-13 | Agregar cantidad 0 de un producto | Rechazo con mensaje |
| A-14 | Vaciar el carrito | Carrito vacío; se puede empezar de nuevo |
| A-15 | Recargar la página del cliente | El carrito persiste (mismo device_id) hasta vaciarlo |
| A-16 | Abrir `/admin` sin sesión | Redirección al login |

A-12 demuestra el precio congelado; A-06 y A-09, la alerta; A-15, la persistencia por device_id.

---

## 16. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Preparación | P00 | Credencial cambiada; `ESTADO_ACTUAL.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; compilación de base | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 y M2 aplicadas; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas`, 22 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión admin, device_id, respuestas, esquemas, formato, blob; `/api/admin/*` protegido | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/*`, `dataService`, rutas públicas y admin; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz | P06, P07, P08 | Componentes base, catálogo admin, consulta de productos, carrito con total en tiempo real y alertas | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación | (en P08) | `ACEPTACION.md` con A-01 a A-16; README | `FASE_6_COMPLETADA.md` |
| 7 · Opcionales | P09 | Cierre por inactividad, foto en el carrito, escaneo con cámara | `FASE_7_COMPLETADA.md` |

Condiciones entre fases: no se inicia una fase sin el archivo de cierre de la anterior; `npm run build` sin errores al final de cada prompt; `npm test` en verde desde P02; cada prompt termina con commit y push, y un fallo de despliegue en Vercel se corrige antes del siguiente prompt.

---

## 17. Funcionalidades opcionales

Se construyen solo con la fase 6 cerrada.

| Prompt | Funcionalidad | Implementación |
|---|---|---|
| P09 | F5 · Ajustar/eliminar ítem | Ya incluido en el carrito del módulo mínimo (sección 3.2): botones +/− y quitar; cantidad 0 elimina (RN-05). P09 solo lo refina si hiciera falta |
| P09 | F6 · Cierre por inactividad | `cerrarSesionesInactivas()` marca cerradas las sesiones activas cuya `ultima_actividad` supere `INACTIVIDAD_MINUTOS`; se puede invocar desde una ruta protegida o un Vercel Cron. La `ultima_actividad` se actualiza en cada operación del carrito |
| P09 | F7 · Foto en el carrito | `ItemCarrito` muestra la `foto_url` del producto (ya disponible en `v_carrito`) |
| P09 | Escaneo con cámara | `EscanerQR` con una librería de lectura de códigos del lado del cliente; alimenta el buscador con el código leído; alternativa manual siempre presente |

---

## 18. Glosario

| Término | Definición |
|---|---|
| Precio actual | El precio vigente del producto en el sistema; el que realmente se cobra |
| Precio de etiqueta | El precio impreso en el estante; puede estar desactualizado o no registrado |
| Discrepancia | Diferencia entre el precio actual y el de etiqueta; dispara una alerta informativa |
| Precio congelado | El `precio_unitario` que se copia al agregar un producto al carrito; no cambia después |
| Sesión (carrito) | Carrito temporal identificado por el `device_id` del dispositivo; el acceso requiere iniciar sesión |
| device_id | UUID guardado en localStorage que identifica el carrito del dispositivo |
| Subtotal | cantidad × precio_unitario de un ítem |
| Total | suma de los subtotales de los ítems activos de la sesión |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |
