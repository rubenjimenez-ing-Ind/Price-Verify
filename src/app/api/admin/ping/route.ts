import { NextRequest } from 'next/server';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { exigirUsuario } from '@/lib/auth/sesion';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async (_request: NextRequest) => {
  const usuario = await exigirUsuario();
  return responderOk({ email: usuario.email });
});
