import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase password reset is not configured.');
    return NextResponse.json(
      { error: 'No se pudo restablecer la contraseña.' },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: supabaseKey,
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
