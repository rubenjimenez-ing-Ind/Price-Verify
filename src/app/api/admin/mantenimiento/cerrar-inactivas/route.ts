import { NextRequest } from 'next/server';
import { exigirUsuario } from '@/lib/auth/sesion';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { cerrarSesionesInactivas } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (_request: NextRequest) => {
  await exigirUsuario();
  return responderOk(await cerrarSesionesInactivas());
});
