import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enviarCorreo } from '@/lib/correo';

const esquemaSolicitud = z.object({
  para: z.string().email('Ingresa un correo electrónico válido.'),
});

export async function POST(solicitud: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await solicitud.json();
  } catch {
    return NextResponse.json({ error: 'La solicitud no contiene JSON válido.' }, { status: 400 });
  }

  const validacion = esquemaSolicitud.safeParse(cuerpo);
  if (!validacion.success) {
    return NextResponse.json(
      { error: validacion.error.issues[0]?.message ?? 'Ingresa un correo válido.' },
      { status: 400 },
    );
  }

  const resultado = await enviarCorreo({
    para: validacion.data.para,
    asunto: 'Prueba de correo',
    html: '<h1>Correo enviado</h1><p>La conexión con Resend funciona correctamente.</p>',
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: resultado.id }, { status: 200 });
}
