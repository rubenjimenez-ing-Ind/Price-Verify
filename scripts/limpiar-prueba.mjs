import { createDatabasePool } from './db-connection.mjs';

const pool = createDatabasePool();
const argumentos = new Set(process.argv.slice(2));
const prefijos = [];
if (argumentos.has('--prueba')) prefijos.push({ producto: 'PV-TEST%', device: 'dev-test%' });
if (argumentos.has('--demo')) prefijos.push({ producto: 'PV-DEMO%', device: 'dev-demo%' });

if (prefijos.length === 0 || [...argumentos].some((arg) => !['--prueba', '--demo'].includes(arg))) {
  console.error('Uso: npm run db:limpiar -- --prueba [--demo]');
  process.exitCode = 1;
} else {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    let items = 0;
    let sesiones = 0;
    let productos = 0;

    for (const prefijo of prefijos) {
      const resultadoItems = await cliente.query(
        `DELETE FROM items_carrito
         WHERE sesion_id IN (
           SELECT id FROM sesiones WHERE device_id LIKE $1
         )`,
        [prefijo.device],
      );
      items += resultadoItems.rowCount ?? 0;

      const resultadoSesiones = await cliente.query(
        'DELETE FROM sesiones WHERE device_id LIKE $1',
        [prefijo.device],
      );
      sesiones += resultadoSesiones.rowCount ?? 0;

      const resultadoProductos = await cliente.query(
        'DELETE FROM productos WHERE codigo LIKE $1',
        [prefijo.producto],
      );
      productos += resultadoProductos.rowCount ?? 0;
    }

    await cliente.query('COMMIT');
    console.log(`Eliminados: ${items} ítems, ${sesiones} sesiones y ${productos} productos.`);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('No se pudieron limpiar los datos de prueba.', error instanceof Error ? error.message : 'Error desconocido');
    process.exitCode = 1;
  } finally {
    cliente.release();
    await pool.end();
  }
}

if (prefijos.length === 0 || [...argumentos].some((arg) => !['--prueba', '--demo'].includes(arg))) {
  await pool.end();
}
