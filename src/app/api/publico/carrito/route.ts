import { NextRequest } from 'next/server';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaAgregar, esquemaDeviceId } from '@/lib/validacion/esquemas';
import { agregarAlCarrito, verCarrito } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (request: NextRequest) => {
  const deviceId = esquemaDeviceId.parse(request.nextUrl.searchParams.get('deviceId'));
  return responderOk(await verCarrito(deviceId));
});

export const POST = conManejoDeErrores(async (request: NextRequest) => {
  const datos = await leerCuerpo(request, esquemaAgregar);
  return responderOk(
    await agregarAlCarrito(datos.deviceId, datos.codigo, datos.cantidad),
    201,
  );
});
