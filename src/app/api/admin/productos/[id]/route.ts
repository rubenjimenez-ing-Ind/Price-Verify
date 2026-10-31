import { NextRequest } from 'next/server';
import { exigirUsuario } from '@/lib/auth/sesion';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaProducto } from '@/lib/validacion/esquemas';
import { editarProducto } from '@/lib/dataService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface ContextoId {
  params: { id: string } | Promise<{ id: string }>;
}

export const PATCH = conManejoDeErrores(
  async (request: NextRequest, contexto?: ContextoId) => {
    await exigirUsuario();
    if (!contexto) throw new Error('Faltan los parámetros de ruta.');
    const { id } = await contexto.params;
    const idValidado = z.string().uuid().parse(id);
    const datos = await leerCuerpo(request, esquemaProducto);
    await editarProducto(idValidado, {
      ...datos,
      precioEtiqueta: datos.precioEtiqueta ?? null,
    });
    return responderOk({ actualizado: true });
  },
);
