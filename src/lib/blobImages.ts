import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

const TIPOS_PERMITIDOS = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const TAMANO_MAXIMO = 2 * 1024 * 1024;

function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Falta configurar la variable BLOB_READ_WRITE_TOKEN.');
  return token;
}

export async function subirFotoProducto(
  id: string,
  archivo: Buffer,
  mime: string,
): Promise<{ fotoUrl: string }> {
  const extension = TIPOS_PERMITIDOS.get(mime);
  if (
    !extension ||
    archivo.byteLength === 0 ||
    archivo.byteLength > TAMANO_MAXIMO
  ) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  const blob = await put(
    `productos/${id}/${randomUUID()}.${extension}`,
    archivo,
    { access: 'public', contentType: mime, token: getBlobToken() },
  );
  return { fotoUrl: blob.url };
}
