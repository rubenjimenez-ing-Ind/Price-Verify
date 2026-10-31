import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { ESTADO_HTTP, ErrorDeNegocio, MENSAJES, type CodigoError } from '@/lib/reglas/errores';

const CABECERAS = { 'Cache-Control': 'no-store' };

export function responderOk<T>(datos: T, estado = 200): NextResponse {
  return NextResponse.json({ ok: true, datos }, { status: estado, headers: CABECERAS });
}

function esErrorPostgres(error: unknown): error is { code: string; constraint?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    (!('constraint' in error) || typeof error.constraint === 'string')
  );
}

function crearErrorNegocio(error: unknown): ErrorDeNegocio {
  if (error instanceof ErrorDeNegocio) return error;
  if (error instanceof ZodError) {
    return new ErrorDeNegocio('DATOS_INVALIDOS', undefined, error.flatten());
  }
  if (esErrorPostgres(error)) {
    if (error.code === '23505' && error.constraint === 'productos_codigo_unico') {
      return new ErrorDeNegocio('CODIGO_DUPLICADO');
    }
    if (error.code === '23514') return new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  console.error('Error interno en una ruta de PriceVerify.', error);
  return new ErrorDeNegocio('ERROR_INTERNO');
}

export function responderError(error: unknown): NextResponse {
  const negocio = crearErrorNegocio(error);
  const codigo: CodigoError = negocio.codigo;
  return NextResponse.json(
    {
      ok: false,
      error: {
        codigo,
        mensaje: MENSAJES[codigo],
        detalles: negocio.detalles ?? null,
      },
    },
    { status: ESTADO_HTTP[codigo], headers: CABECERAS },
  );
}

type ManejadorRuta<TContexto> = (
  request: NextRequest,
  contexto?: TContexto,
) => Promise<NextResponse>;

export function conManejoDeErrores<TContexto>(
  manejador: ManejadorRuta<TContexto>,
): ManejadorRuta<TContexto> {
  return async (request, contexto) => {
    try {
      return await manejador(request, contexto);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo<T>(
  request: NextRequest,
  esquema: ZodType<T>,
): Promise<T> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return esquema.parse(cuerpo);
}
