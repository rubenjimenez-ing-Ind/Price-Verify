# PriceVerify · Instrucciones para Copilot

## Documentos rectores

- Plan técnico: `Doc/PLAN_PRICEVERIFY.md`. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: `Doc/ESTADO_ACTUAL.md`.
- Avance: `Doc/ESTADO_EJECUCION.md`. Se actualiza al final de cada tarea.

## Stack

- Next.js App Router 14 + TypeScript + Tailwind CSS 3. Despliegue en Vercel.
- Postgres de Supabase con `pg` y `POSTGRES_URL_NON_POOLING`.
- Supabase Auth para el administrador; carrito del cliente anónimo por `device_id`.
- Fotos en Vercel Blob. Validación con Zod. Pruebas con Vitest.
- Login existente en `/login`; no se reescribe.

## Dos tipos de uso

- Cliente: público, sin cuenta. Carrito identificado por `device_id` (UUID en localStorage). Rutas `/comprar` y `/api/publico/*`.
- Administrador: login existente, con `app_metadata.role=admin`. Gestiona el catálogo. Rutas `/admin` y `/api/admin/*`.

## Convenciones

- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas puras en `src/lib/reglas/`: sin base, red, variables de entorno ni reloj (excepto fechas.ts). Se prueban con Vitest.
- El total se recalcula desde los ítems; nunca se acumula a mano.
- `precio_unitario` se congela al agregar; subtotal y total usan ese valor.
- Discrepancia: `precio_etiqueta` no nulo y `precio_actual !== precio_etiqueta`.
- Solo `src/lib/datos/` importa `src/lib/db/conexion.ts`. Rutas y páginas acceden a datos mediante `src/lib/dataService.ts`.
- Toda ruta `src/app/api/admin/*` debe exigir usuario administrador antes de operar. Las rutas públicas reciben `device_id`.
- Entradas validadas con `src/lib/validacion/esquemas.ts`.
- Errores de negocio con `ErrorDeNegocio`; respuestas con `src/lib/http/respuestas.ts`.
- Montos en pesos enteros. Nunca decimales.
- Búsqueda sin distinción de mayúsculas ni acentos; códigos recortados.
- En rutas dinámicas `params` se obtiene con `await params`.
- SQL parametrizado; no concatenar valores.
- Un producto se desactiva, no se elimina. Las sesiones cerradas no se reabren.
- No instalar librerías de componentes; usar `src/components/ui/`.
- Imports de `src/lib`: `@/lib/...`.
- Protección en `src/middleware.ts`. Login en `/login`.
- No tocar archivos de autenticación salvo la redirección de éxito indicada en el plan.
- No versionar credenciales ni datos de usuarios sensibles; nunca imprimir valores de `.env.local`.

## Al terminar cada tarea

1. `npm run build` sin errores.
2. `npm test` sin fallas desde que existan las pruebas.
3. Actualizar `Doc/ESTADO_EJECUCION.md`.
4. No hacer commit; la persona usuaria revisa y decide.
