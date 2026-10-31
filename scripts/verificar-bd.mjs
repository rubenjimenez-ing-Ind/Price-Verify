import { createDatabasePool } from './db-connection.mjs';

const pool = createDatabasePool();
const expectedConstraints = [
  'productos_codigo_unico',
  'ux_sesiones_activa_por_device',
  'items_unico_por_sesion',
];
let failures = 0;
let savepointSequence = 0;

function report(ok, message) {
  console.log(`${ok ? 'OK' : 'FALLA'} ${message}`);
  if (!ok) failures += 1;
}

async function expectedFailure(client, name, expectedCode, expectedConstraint, action) {
  const savepoint = `caso_${++savepointSequence}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    await action();
    report(false, `${name}: se esperaba ${expectedCode}${expectedConstraint ? ` (${expectedConstraint})` : ''}`);
  } catch (error) {
    const correct =
      error.code === expectedCode &&
      (!expectedConstraint || error.constraint === expectedConstraint);
    report(correct, `${name}: ${correct ? expectedCode : `recibido ${error.code || 'sin código'}`}`);
  } finally {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
  }
}

async function successfulCase(client, name, action) {
  const savepoint = `caso_${++savepointSequence}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    const result = await action();
    report(true, name);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    return result;
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    report(false, `${name}: ${error instanceof Error ? error.message : 'error'}`);
    return null;
  }
}

try {
  const targets = ['productos', 'sesiones', 'items_carrito'];
  let allTablesExist = true;
  for (const table of targets) {
    const result = await pool.query('SELECT to_regclass($1) IS NOT NULL AS existe', [`public.${table}`]);
    const exists = result.rows[0].existe;
    console.log(`${exists ? 'OK' : 'FALLA'} tabla ${table}`);
    allTablesExist &&= exists;
    if (exists) {
      const count = await pool.query(`SELECT COUNT(*)::text AS cantidad FROM public."${table}"`);
      console.log(`  filas: ${count.rows[0].cantidad}`);
    } else {
      failures += 1;
    }
  }

  const viewResult = await pool.query(
    "SELECT to_regclass('public.v_carrito') IS NOT NULL AS existe",
  );
  report(viewResult.rows[0].existe, 'vista v_carrito');

  if (allTablesExist) {
    const constraintRows = await pool.query(
      `SELECT conname AS nombre FROM pg_constraint
       WHERE conname = ANY($1::text[])`,
      [expectedConstraints.filter((name) => name !== 'ux_sesiones_activa_por_device')],
    );
    const indexRows = await pool.query(
      `SELECT indexname AS nombre FROM pg_indexes
       WHERE schemaname = 'public'
       AND indexname = ANY($1::text[])`,
      [expectedConstraints.filter((name) => name === 'ux_sesiones_activa_por_device')],
    );
    const names = new Set([
      ...constraintRows.rows.map((row) => row.nombre),
      ...indexRows.rows.map((row) => row.nombre),
    ]);
    for (const name of expectedConstraints) report(names.has(name), `restricción/índice ${name}`);

    const rlsRows = await pool.query(
      `SELECT relname AS nombre, relrowsecurity AS rls
       FROM pg_class
       WHERE relnamespace = 'public'::regnamespace
       AND relname = ANY($1::text[])`,
      [targets],
    );
    for (const table of targets) {
      report(rlsRows.rows.some((row) => row.nombre === table && row.rls), `RLS activo en ${table}`);
    }

    const client = await pool.connect();
    let productId;
    let sessionId;
    try {
      await client.query('BEGIN');
      const product = await successfulCase(client, 'producto válido', () =>
        client.query(
          `INSERT INTO productos (codigo, nombre, precio_actual, precio_etiqueta)
           VALUES ('PV-A', 'Arroz', 4500, 4500) RETURNING id`,
        ),
      );
      productId = product?.rows[0]?.id;

      if (productId) {
        await expectedFailure(client, 'código duplicado', '23505', 'productos_codigo_unico', () =>
          client.query(
            `INSERT INTO productos (codigo, nombre, precio_actual)
             VALUES ('PV-A', 'Arroz repetido', 4500)`,
          ),
        );
        await expectedFailure(client, 'precio actual cero', '23514', null, () =>
          client.query(
            `INSERT INTO productos (codigo, nombre, precio_actual)
             VALUES ('PV-INVALIDO-A', 'Arroz', 0)`,
          ),
        );
        await expectedFailure(client, 'precio etiqueta cero', '23514', null, () =>
          client.query(
            `INSERT INTO productos (codigo, nombre, precio_actual, precio_etiqueta)
             VALUES ('PV-INVALIDO-E', 'Arroz', 4500, 0)`,
          ),
        );

        const session = await successfulCase(client, 'sesión activa', () =>
          client.query(
            `INSERT INTO sesiones (device_id, estado)
             VALUES ('dev-test', 'activa') RETURNING id`,
          ),
        );
        sessionId = session?.rows[0]?.id;
      }

      if (sessionId && productId) {
        await expectedFailure(
          client,
          'sesión activa duplicada',
          '23505',
          'ux_sesiones_activa_por_device',
          () => client.query(`INSERT INTO sesiones (device_id) VALUES ('dev-test')`),
        );

        const item = await successfulCase(client, 'subtotal generado', () =>
          client.query(
            `INSERT INTO items_carrito (sesion_id, producto_id, codigo_producto, cantidad, precio_unitario)
             VALUES ($1, $2, 'PV-A', 2, 4500) RETURNING subtotal`,
            [sessionId, productId],
          ),
        );
        report(Number(item?.rows[0]?.subtotal) === 9000, 'subtotal igual a 9000');

        await expectedFailure(
          client,
          'ítem duplicado',
          '23505',
          'items_unico_por_sesion',
          () =>
            client.query(
              `INSERT INTO items_carrito (sesion_id, producto_id, codigo_producto, cantidad, precio_unitario)
               VALUES ($1, $2, 'PV-A', 1, 4500)`,
              [sessionId, productId],
            ),
        );
        await expectedFailure(client, 'cantidad cero', '23514', null, () =>
          client.query(
            `INSERT INTO items_carrito (sesion_id, producto_id, codigo_producto, cantidad, precio_unitario)
             VALUES ($1, $2, 'PV-A', 0, 4500)`,
            [sessionId, productId],
          ),
        );
      } else {
        report(false, 'pruebas de sesión e ítems omitidas por falta de datos de prueba');
      }
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
  }

  console.log(`Total de fallas: ${failures}`);
  if (failures > 0) process.exitCode = 1;
} catch (error) {
  console.error('No se pudo verificar la base de datos.', error instanceof Error ? error.message : 'Error desconocido');
  process.exitCode = 1;
} finally {
  await pool.end();
}
