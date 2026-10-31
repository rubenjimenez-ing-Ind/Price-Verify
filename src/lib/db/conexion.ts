import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';

types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1114, (valor) => valor);
types.setTypeParser(1184, (valor) => valor);
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));

type GlobalConPool = typeof globalThis & { poolPriceVerify?: Pool };
const globalParaPool = globalThis as GlobalConPool;

function obtenerUrlConexion(): string {
  const configurada = process.env.POSTGRES_URL_NON_POOLING;
  if (!configurada) {
    throw new Error('Falta configurar la variable POSTGRES_URL_NON_POOLING.');
  }

  const url = new URL(configurada);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('ssl');
  return url.toString();
}

export const pool =
  globalParaPool.poolPriceVerify ??
  new Pool({
    connectionString: obtenerUrlConexion(),
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalParaPool.poolPriceVerify = pool;
}

export async function consultar<T extends QueryResultRow>(
  sql: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const resultado = await pool.query<T>(sql, valores);
  return resultado.rows;
}

export async function conTransaccion<T>(
  trabajo: (tx: PoolClient) => Promise<T>,
): Promise<T> {
  const tx = await pool.connect();
  try {
    await tx.query('BEGIN');
    const resultado = await trabajo(tx);
    await tx.query('COMMIT');
    return resultado;
  } catch (error) {
    try {
      await tx.query('ROLLBACK');
    } catch (errorRollback) {
      console.error('No se pudo revertir la transacción de PriceVerify.', errorRollback);
    }
    throw error;
  } finally {
    tx.release();
  }
}
