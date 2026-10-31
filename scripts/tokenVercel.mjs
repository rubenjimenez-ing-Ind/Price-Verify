import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const archivoTemporal = '.env.vercel.local';
const mensajeAviso =
  'Aviso: no se pudo renovar la conexión con Vercel. El envío de correos no funcionará en local.';
let fallo = false;

try {
  const esWindows = process.platform === 'win32';
  const comando = esWindows ? process.env.ComSpec || 'cmd.exe' : 'npx';
  const argumentos = esWindows
    ? ['/d', '/s', '/c', 'npx vercel env pull .env.vercel.local --yes']
    : ['vercel', 'env', 'pull', archivoTemporal, '--yes'];
  const resultado = spawnSync(
    comando,
    argumentos,
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'ignore',
    },
  );

  if (resultado.error || resultado.status !== 0 || !existsSync(archivoTemporal)) {
    throw new Error();
  }

  const contenidoVercel = readFileSync(archivoTemporal, 'utf8');
  const lineaToken = contenidoVercel
    .split(/\r?\n/)
    .find((linea) => linea.startsWith('VERCEL_OIDC_TOKEN='));
  if (!lineaToken) {
    throw new Error();
  }

  const rutaLocal = '.env.local';
  const contenidoLocal = readFileSync(rutaLocal, 'utf8');
  const coincidencia = /(^|\r?\n)VERCEL_OIDC_TOKEN=[^\r\n]*/;

  if (coincidencia.test(contenidoLocal)) {
    writeFileSync(
      rutaLocal,
      contenidoLocal.replace(coincidencia, (_linea, separador) => `${separador}${lineaToken}`),
      'utf8',
    );
  } else {
    const salto = contenidoLocal.includes('\r\n') ? '\r\n' : '\n';
    const separadorFinal =
      contenidoLocal.length > 0 && !/[\r\n]$/.test(contenidoLocal) ? salto : '';
    writeFileSync(rutaLocal, `${contenidoLocal}${separadorFinal}${lineaToken}`, 'utf8');
  }
} catch {
  fallo = true;
} finally {
  try {
    rmSync(archivoTemporal, { force: true });
  } catch {
    fallo = true;
  }
}

if (fallo) {
  console.warn(mensajeAviso);
}
