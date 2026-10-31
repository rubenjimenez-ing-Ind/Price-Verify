import { NextRequest } from 'next/server';
import {
  conManejoDeErrores,
  leerCuerpo,
  responderOk,
} from '@/lib/http/respuestas';
import { esquemaCerrar } from '@/lib/validacion/esquemas';
import { cerrarSesion } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const POST = conManejoDeErrores(async (request: NextRequest) => {
  const { deviceId } = await leerCuerpo(request, esquemaCerrar);
  await cerrarSesion(deviceId);
  return responderOk({ cerrada: true });
});
