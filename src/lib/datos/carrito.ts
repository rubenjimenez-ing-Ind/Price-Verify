import type { PoolClient, QueryResultRow } from 'pg';
import { conTransaccion, pool } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { INACTIVIDAD_MINUTOS } from '@/lib/config/priceverify';
import { validarCantidad, nuevaCantidadAlSumar } from '@/lib/reglas/carrito';
import { describirDiscrepancia } from '@/lib/reglas/precio';
import { obtenerProductoActivo } from './productos';
import type { EstadoCarrito, ItemCarrito, ResultadoCarrito } from './tipos';

interface SesionBD extends QueryResultRow {
  id: string;
  estado: 'activa' | 'cerrada';
  total: number;
}

interface ItemBD extends QueryResultRow {
  id: number;
  sesion_id: string;
  producto_id: string;
  codigo_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  nombre: string;
  foto_url: string | null;
  precio_actual_vigente: number;
}

export async function cerrarPoolDatos(): Promise<void> {
  await pool.end();
}

async function obtenerOCrearSesionActiva(
  tx: PoolClient,
  deviceId: string,
): Promise<SesionBD> {
  await tx.query(
    `UPDATE sesiones
     SET estado = 'cerrada', fecha_cierre = NOW()
     WHERE device_id = $1
       AND estado = 'activa'
       AND ultima_actividad < NOW() - ($2 * INTERVAL '1 minute')`,
    [deviceId, INACTIVIDAD_MINUTOS],
  );

  const existente = await tx.query<SesionBD>(
    `SELECT id, estado, total
     FROM sesiones
     WHERE device_id = $1 AND estado = 'activa'
     LIMIT 1
     FOR UPDATE`,
    [deviceId],
  );
  if (existente.rows[0]) {
    const actualizado = await tx.query<SesionBD>(
      `UPDATE sesiones
       SET ultima_actividad = NOW()
       WHERE id = $1
       RETURNING id, estado, total`,
      [existente.rows[0].id],
    );
    return actualizado.rows[0];
  }

  const creada = await tx.query<SesionBD>(
    `INSERT INTO sesiones (device_id)
     VALUES ($1)
     ON CONFLICT (device_id) WHERE estado = 'activa' DO NOTHING
     RETURNING id, estado, total`,
    [deviceId],
  );
  if (creada.rows[0]) return creada.rows[0];

  const concurrente = await tx.query<SesionBD>(
    `SELECT id, estado, total
     FROM sesiones
     WHERE device_id = $1 AND estado = 'activa'
     LIMIT 1
     FOR UPDATE`,
    [deviceId],
  );
  if (!concurrente.rows[0]) {
    throw new Error('No fue posible obtener o crear la sesión activa del carrito.');
  }
  return concurrente.rows[0];
}

async function recalcularTotal(tx: PoolClient, sesionId: string): Promise<void> {
  await tx.query(
    `UPDATE sesiones
     SET total = (
       SELECT COALESCE(SUM(subtotal), 0)::INTEGER
       FROM items_carrito
       WHERE sesion_id = $1
     ),
     ultima_actividad = NOW()
     WHERE id = $1`,
    [sesionId],
  );
}

async function leerCarrito(
  tx: PoolClient,
  sesionId: string,
): Promise<EstadoCarrito> {
  const [sesion, items] = await Promise.all([
    tx.query<SesionBD>(
      'SELECT id, estado, total FROM sesiones WHERE id = $1',
      [sesionId],
    ),
    tx.query<ItemBD>(
      `SELECT id, sesion_id, producto_id, codigo_producto, cantidad,
              precio_unitario, subtotal, nombre, foto_url, precio_actual_vigente
       FROM v_carrito
       WHERE sesion_id = $1
       ORDER BY id`,
      [sesionId],
    ),
  ]);
  const datosSesion = sesion.rows[0];
  if (!datosSesion) throw new Error('La sesión del carrito dejó de existir.');

  return {
    sesionId: datosSesion.id,
    estado: datosSesion.estado,
    total: datosSesion.total,
    items: items.rows.map((item): ItemCarrito => ({
      codigo: item.codigo_producto,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precio_unitario,
      subtotal: item.subtotal,
      fotoUrl: item.foto_url,
      precioActualVigente: item.precio_actual_vigente,
    })),
  };
}

async function sumarOCrearItem(
  tx: PoolClient,
  entrada: {
    sesionId: string;
    productoId: string;
    codigo: string;
    cantidad: number;
    precioUnitario: number;
  },
): Promise<void> {
  const existente = await tx.query<{ id: number; cantidad: number } & QueryResultRow>(
    `SELECT id, cantidad
     FROM items_carrito
     WHERE sesion_id = $1 AND producto_id = $2
     FOR UPDATE`,
    [entrada.sesionId, entrada.productoId],
  );
  const item = existente.rows[0];
  if (item) {
    const cantidad = nuevaCantidadAlSumar(item.cantidad, entrada.cantidad);
    await tx.query(
      'UPDATE items_carrito SET cantidad = $1 WHERE id = $2',
      [cantidad, item.id],
    );
    return;
  }

  await tx.query(
    `INSERT INTO items_carrito
       (sesion_id, producto_id, codigo_producto, cantidad, precio_unitario)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      entrada.sesionId,
      entrada.productoId,
      entrada.codigo,
      entrada.cantidad,
      entrada.precioUnitario,
    ],
  );
}

export async function verCarrito(deviceId: string): Promise<EstadoCarrito> {
  return conTransaccion(async (tx) => {
    const sesion = await obtenerOCrearSesionActiva(tx, deviceId);
    return leerCarrito(tx, sesion.id);
  });
}

export async function agregarAlCarrito(
  deviceId: string,
  codigo: string,
  cantidad: number,
): Promise<ResultadoCarrito> {
  validarCantidad(cantidad);
  return conTransaccion(async (tx) => {
    const sesion = await obtenerOCrearSesionActiva(tx, deviceId);
    const producto = await obtenerProductoActivo(tx, codigo);
    const alerta = describirDiscrepancia(producto.precio_actual, producto.precio_etiqueta);

    await sumarOCrearItem(tx, {
      sesionId: sesion.id,
      productoId: producto.id,
      codigo: producto.codigo,
      cantidad,
      precioUnitario: producto.precio_actual,
    });
    await recalcularTotal(tx, sesion.id);
    const carrito = await leerCarrito(tx, sesion.id);
    return { carrito, alerta };
  });
}

export async function ajustarCantidad(
  deviceId: string,
  codigo: string,
  nuevaCantidad: number,
): Promise<ResultadoCarrito> {
  validarCantidad(nuevaCantidad, { permitirCero: true });
  return conTransaccion(async (tx) => {
    const sesion = await obtenerOCrearSesionActiva(tx, deviceId);
    const item = await tx.query<{ id: number } & QueryResultRow>(
      `SELECT id
       FROM items_carrito
       WHERE sesion_id = $1 AND codigo_producto = $2
       FOR UPDATE`,
      [sesion.id, codigo],
    );
    if (!item.rows[0]) throw new ErrorDeNegocio('ITEM_NO_ENCONTRADO');

    if (nuevaCantidad === 0) {
      await tx.query('DELETE FROM items_carrito WHERE id = $1', [item.rows[0].id]);
    } else {
      await tx.query('UPDATE items_carrito SET cantidad = $1 WHERE id = $2', [
        nuevaCantidad,
        item.rows[0].id,
      ]);
    }

    await recalcularTotal(tx, sesion.id);
    return { carrito: await leerCarrito(tx, sesion.id) };
  });
}

export async function eliminarItem(
  deviceId: string,
  codigo: string,
): Promise<ResultadoCarrito> {
  return conTransaccion(async (tx) => {
    const sesion = await obtenerOCrearSesionActiva(tx, deviceId);
    const resultado = await tx.query(
      `DELETE FROM items_carrito
       WHERE sesion_id = $1 AND codigo_producto = $2`,
      [sesion.id, codigo],
    );
    if (resultado.rowCount === 0) throw new ErrorDeNegocio('ITEM_NO_ENCONTRADO');
    await recalcularTotal(tx, sesion.id);
    return { carrito: await leerCarrito(tx, sesion.id) };
  });
}

export async function cerrarSesion(deviceId: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const sesion = await tx.query<SesionBD>(
      `SELECT id, estado, total
       FROM sesiones
       WHERE device_id = $1 AND estado = 'activa'
       LIMIT 1
       FOR UPDATE`,
      [deviceId],
    );
    const actual = sesion.rows[0];
    if (!actual) return;

    await tx.query('DELETE FROM items_carrito WHERE sesion_id = $1', [actual.id]);
    await tx.query(
      `UPDATE sesiones
       SET estado = 'cerrada', total = 0, fecha_cierre = NOW(), ultima_actividad = NOW()
       WHERE id = $1`,
      [actual.id],
    );
  });
}

export async function cerrarSesionesInactivas(): Promise<{ cerradas: number }> {
  return conTransaccion(async (tx) => {
    const resultado = await tx.query(
      `UPDATE sesiones
       SET estado = 'cerrada', fecha_cierre = NOW()
       WHERE estado = 'activa'
         AND ultima_actividad < NOW() - ($1 * INTERVAL '1 minute')`,
      [INACTIVIDAD_MINUTOS],
    );
    return { cerradas: resultado.rowCount ?? 0 };
  });
}
