import { NextRequest } from 'next/server';
import { exigirUsuario } from '@/lib/auth/sesion';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { desactivarProducto } from '@/lib/dataService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface ContextoId {
  params: { id: string } | Promise<{ id: string }>;
}

export const POST = conManejoDeErrores(
  async (_request: NextRequest, contexto?: ContextoId) => {
    await exigirUsuario();
    if (!contexto) throw new Error('Faltan los parámetros de ruta.');
    const { id } = await contexto.params;
    await desactivarProducto(z.string().uuid().parse(id));
    return responderOk({ desactivado: true });
  },
);
