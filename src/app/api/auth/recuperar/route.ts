import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obtenerConfiguracionSupabase } from '@/lib/supabase-config';
import { obtenerUrlBase } from '@/lib/url-base';

export const runtime = 'nodejs';

const esquemaSolicitud = z.object({
  email: z.string().email('Ingresa un correo electrónico válido.'),
});

export async function POST(request: NextRequest) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
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

  const supabase = obtenerConfiguracionSupabase();
  if (!supabase) {
    console.error('Supabase password recovery is not configured.');
    return NextResponse.json(
      { error: 'No se pudo solicitar el restablecimiento. Inténtalo más tarde.' },
      { status: 500 },
    );
  }

  try {
    const redirectTo = `${obtenerUrlBase()}/restablecer-contrasena`;
    const response = await fetch(
      `${supabase.url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: 'POST',
        headers: {
          apikey: supabase.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: validacion.data.email }),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      console.error(`Supabase password recovery returned HTTP ${response.status}.`);
      return NextResponse.json(
        { error: 'No se pudo solicitar el restablecimiento. Inténtalo más tarde.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.',
    });
  } catch (error) {
    console.error('Unable to request a Supabase password recovery email.', error);
    return NextResponse.json(
      { error: 'No se pudo solicitar el restablecimiento. Inténtalo más tarde.' },
      { status: 502 },
    );
  }
}
