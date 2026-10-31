import { NextRequest } from 'next/server';
import { exigirUsuario } from '@/lib/auth/sesion';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaBusqueda, esquemaProducto } from '@/lib/validacion/esquemas';
import { crearProducto, listarProductosAdmin } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: NextRequest) => {
  await exigirUsuario();
  const parametros = request.nextUrl.searchParams;
  const busquedaParametro = parametros.get('busqueda');
  const busqueda = busquedaParametro
    ? esquemaBusqueda.parse({ q: busquedaParametro }).q
    : undefined;
  const incluirParametro = parametros.get('incluirInactivos');
  if (incluirParametro !== null && !['true', 'false'].includes(incluirParametro)) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return responderOk(
    await listarProductosAdmin({
      busqueda,
      incluirInactivos: incluirParametro === 'true',
    }),
  );
});

export const POST = conManejoDeErrores(async (request: NextRequest) => {
  await exigirUsuario();
  const datos = await leerCuerpo(request, esquemaProducto);
  return responderOk(
    await crearProducto({
      ...datos,
      precioEtiqueta: datos.precioEtiqueta ?? null,
    }),
    201,
  );
});
