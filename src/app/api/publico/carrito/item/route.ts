import { NextRequest } from 'next/server';
import {
  conManejoDeErrores,
  leerCuerpo,
  responderOk,
} from '@/lib/http/respuestas';
import {
  esquemaAjustar,
  esquemaEliminar,
} from '@/lib/validacion/esquemas';
import { ajustarCantidad, eliminarItem } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const PATCH = conManejoDeErrores(async (request: NextRequest) => {
  const datos = await leerCuerpo(request, esquemaAjustar);
  return responderOk(
    await ajustarCantidad(datos.deviceId, datos.codigo, datos.cantidad),
  );
});

export const DELETE = conManejoDeErrores(async (request: NextRequest) => {
  const datos = await leerCuerpo(request, esquemaEliminar);
  return responderOk(await eliminarItem(datos.deviceId, datos.codigo));
});
