import { createRequire } from 'node:module';
import { Pool } from 'pg';

const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());

export function createDatabasePool() {
  const configuredUrl = process.env.POSTGRES_URL_NON_POOLING;
  if (!configuredUrl) {
    throw new Error('Falta configurar la variable POSTGRES_URL_NON_POOLING.');
  }

  const url = new URL(configuredUrl);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('ssl');

  return new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
  });
}
