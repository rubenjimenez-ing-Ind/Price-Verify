import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabasePool } from './db-connection.mjs';

const pool = createDatabasePool();
const migrationsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = (await readdir(migrationsPath))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const name of files) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM public._migrations WHERE name = $1',
      [name],
    );
    if (rowCount) {
      console.log(`omitida ${name}`);
      continue;
    }

    const sql = await readFile(path.join(migrationsPath, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO public._migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`aplicada ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} catch (error) {
  console.error('Falló la migración de PriceVerify.', error instanceof Error ? error.message : 'Error desconocido');
  process.exitCode = 1;
} finally {
  await pool.end();
}
