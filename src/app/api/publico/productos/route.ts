import { NextRequest } from 'next/server';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaBusqueda } from '@/lib/validacion/esquemas';
import { buscarProductos } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: NextRequest) => {
  const { q } = esquemaBusqueda.parse({
    q: request.nextUrl.searchParams.get('q'),
  });
  return responderOk(await buscarProductos(q));
});
