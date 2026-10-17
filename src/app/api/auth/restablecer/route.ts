import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { obtenerConfiguracionSupabase } from '@/lib/supabase-config';

export const runtime = 'nodejs';

const esquemaSolicitud = z
  .object({
    accessToken: z.string().min(1).max(8192),
    contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmacion'],
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
      { error: validacion.error.issues[0]?.message ?? 'Revisa los datos ingresados.' },
      { status: 400 },
    );
  }

  const supabase = obtenerConfiguracionSupabase();
  if (!supabase) {
    console.error('Supabase password reset is not configured.');
    return NextResponse.json(
      { error: 'No se pudo restablecer la contraseña.' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${supabase.url}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: supabase.anonKey,
        Authorization: `Bearer ${validacion.data.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: validacion.data.contrasena }),
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: 'El enlace no es válido o ya venció. Solicita otro.' },
        { status: 400 },
      );
    }
    if (response.status === 422) {
      return NextResponse.json(
        { error: 'La contraseña no cumple los requisitos de seguridad.' },
        { status: 400 },
      );
    }
    if (!response.ok) {
      console.error(`Supabase password reset returned HTTP ${response.status}.`);
      return NextResponse.json(
        { error: 'No se pudo restablecer la contraseña.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unable to update the password with Supabase Auth.', error);
    return NextResponse.json(
      { error: 'No se pudo restablecer la contraseña.' },
      { status: 502 },
    );
  }
}
