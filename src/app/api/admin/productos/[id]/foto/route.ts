import { NextRequest } from 'next/server';
import { exigirUsuario } from '@/lib/auth/sesion';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { subirFotoProducto } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

interface ContextoId {
  params: { id: string } | Promise<{ id: string }>;
}

export const POST = conManejoDeErrores(
  async (request: NextRequest, contexto?: ContextoId) => {
    await exigirUsuario();
    if (!contexto) throw new Error('Faltan los parámetros de ruta.');
    const { id } = await contexto.params;
    const idValidado = z.string().uuid().parse(id);
    const formulario = await request.formData();
    const foto = formulario.get('foto');
    if (!(foto instanceof File) || foto.size > 2 * 1024 * 1024) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS');
    }

    const resultado = await subirFotoProducto(
      idValidado,
      Buffer.from(await foto.arrayBuffer()),
      foto.type,
    );
    return responderOk(resultado);
  },
);
