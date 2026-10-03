import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    !('password' in body) ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    body.password.length === 0
  ) {
    return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 400 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secret = process.env.AUTH_SESSION_SECRET;

    if (!supabaseUrl || !supabaseKey || !secret || secret.length < 32) {
      console.error('Supabase login or AUTH_SESSION_SECRET is not configured.');
      return NextResponse.json({ error: 'El acceso no está configurado.' }, { status: 500 });
    }

    const supabaseResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email.trim(),
          password: body.password,
        }),
        cache: 'no-store',
      },
    );

    if (supabaseResponse.status === 400 || supabaseResponse.status === 401) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    if (!supabaseResponse.ok) {
      console.error(`Supabase Auth returned HTTP ${supabaseResponse.status}.`);
      return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 502 });
    }

    const authResult: unknown = await supabaseResponse.json();
    if (
      typeof authResult !== 'object' ||
      authResult === null ||
      !('user' in authResult) ||
      typeof authResult.user !== 'object' ||
      authResult.user === null ||
      !('id' in authResult.user) ||
      typeof authResult.user.id !== 'string' ||
      !('access_token' in authResult) ||
      typeof authResult.access_token !== 'string' ||
      !('expires_in' in authResult) ||
      typeof authResult.expires_in !== 'number' ||
      !Number.isFinite(authResult.expires_in) ||
      authResult.expires_in <= 0
    ) {
      console.error('Supabase Auth returned an invalid successful response.');
      return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 502 });
    }

    const maxAge = Math.min(SESSION_DURATION, Math.floor(authResult.expires_in));
    const token = await createSessionToken(authResult.user.id, authResult.access_token, secret, maxAge);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error) {
    console.error('Unable to authenticate against Supabase Auth.', error);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}
