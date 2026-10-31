import { NextRequest } from 'next/server';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaCodigoConsulta } from '@/lib/validacion/esquemas';
import { obtenerProductoPorCodigo } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

interface ContextoCodigo {
  params: { codigo: string } | Promise<{ codigo: string }>;
}

export const GET = conManejoDeErrores(
  async (_request: NextRequest, contexto?: ContextoCodigo) => {
    if (!contexto) throw new Error('Faltan los parámetros de ruta.');
    const { codigo } = await contexto.params;
    const datos = esquemaCodigoConsulta.parse({ codigo });
    return responderOk(await obtenerProductoPorCodigo(datos.codigo));
  },
);
