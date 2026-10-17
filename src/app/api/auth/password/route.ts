import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, readSession, SESSION_COOKIE_NAME } from '@/lib/auth-session';

export const runtime = 'nodejs';

interface SupabaseUser {
  id: string;
  email?: string;
}

interface SupabaseAuthResult {
  user: SupabaseUser;
  access_token: string;
  expires_in: number;
}

function isSupabaseAuthResult(value: unknown): value is SupabaseAuthResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('user' in value) || typeof value.user !== 'object' || value.user === null) {
    return false;
  }

  return (
    'id' in value.user &&
    typeof value.user.id === 'string' &&
    'access_token' in value &&
    typeof value.access_token === 'string' &&
    'expires_in' in value &&
    typeof value.expires_in === 'number' &&
    Number.isFinite(value.expires_in) &&
    value.expires_in > 0
  );
}

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
    !('currentPassword' in body) ||
    typeof body.currentPassword !== 'string' ||
    !('newPassword' in body) ||
    typeof body.newPassword !== 'string' ||
    body.currentPassword.length === 0 ||
    body.newPassword.length === 0
  ) {
    return NextResponse.json(
      { error: 'Ingresa tu contraseña actual y una nueva contraseña.' },
      { status: 400 },
    );
  }
  if (body.currentPassword === body.newPassword) {
    return NextResponse.json(
      { error: 'La nueva contraseña debe ser distinta de la actual.' },
      { status: 400 },
    );
  }

  try {
    const sessionSecret = process.env.AUTH_SESSION_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!sessionSecret || !supabaseUrl || !supabaseKey) {
      console.error('Supabase Auth or AUTH_SESSION_SECRET is not configured.');
      return NextResponse.json({ error: 'El cambio de contraseña no está configurado.' }, { status: 500 });
    }

    const session = await readSession(
      request.cookies.get(SESSION_COOKIE_NAME)?.value,
      sessionSecret,
    );
    if (!session) {
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    }

    const authUrl = supabaseUrl.replace(/\/$/, '');
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${session.accessToken}`,
    };
    const currentUserResponse = await fetch(`${authUrl}/auth/v1/user`, {
      headers,
      cache: 'no-store',
    });

    if (currentUserResponse.status === 401 || currentUserResponse.status === 403) {
      return NextResponse.json(
        { error: 'La sesión expiró. Inicia sesión de nuevo.' },
        { status: 401 },
      );
    }
    if (!currentUserResponse.ok) {
      console.error(`Supabase current-user request returned HTTP ${currentUserResponse.status}.`);
      return NextResponse.json({ error: 'No se pudo validar la sesión.' }, { status: 502 });
    }

    const currentUser: unknown = await currentUserResponse.json();
    if (
      typeof currentUser !== 'object' ||
      currentUser === null ||
      !('id' in currentUser) ||
      currentUser.id !== session.userId ||
      !('email' in currentUser) ||
      typeof currentUser.email !== 'string'
    ) {
      return NextResponse.json(
        { error: 'No se pudo validar la cuenta de esta sesión.' },
        { status: 401 },
      );
    }

    const verificationResponse = await fetch(
      `${authUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          password: body.currentPassword,
        }),
        cache: 'no-store',
      },
    );

    if (verificationResponse.status === 400 || verificationResponse.status === 401) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta.' },
        { status: 400 },
      );
    }
    if (!verificationResponse.ok) {
      console.error(`Supabase password verification returned HTTP ${verificationResponse.status}.`);
      return NextResponse.json(
        { error: 'No se pudo verificar la contraseña actual.' },
        { status: 502 },
      );
    }

    const authResult: unknown = await verificationResponse.json();
    if (!isSupabaseAuthResult(authResult) || authResult.user.id !== session.userId) {
      console.error('Supabase password verification returned an invalid or mismatched user.');
      return NextResponse.json(
        { error: 'No se pudo verificar la cuenta de esta sesión.' },
        { status: 502 },
      );
    }

    const updateResponse = await fetch(`${authUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${authResult.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: body.newPassword }),
      cache: 'no-store',
    });

    if (updateResponse.status === 401 || updateResponse.status === 403) {
      return NextResponse.json(
        { error: 'No se pudo actualizar la contraseña. Inicia sesión de nuevo.' },
        { status: 401 },
      );
    }
    if (updateResponse.status === 422) {
      return NextResponse.json(
        { error: 'La nueva contraseña no cumple los requisitos de seguridad.' },
        { status: 400 },
      );
    }
    if (!updateResponse.ok) {
      console.error(`Supabase password update returned HTTP ${updateResponse.status}.`);
      return NextResponse.json({ error: 'No se pudo cambiar la contraseña.' }, { status: 502 });
    }

    const remainingSessionSeconds = Math.floor(session.expiresAt - Date.now() / 1000);
    const maxAge = Math.max(1, Math.floor(Math.min(authResult.expires_in, remainingSessionSeconds)));
    const refreshedToken = await createSessionToken(
      session.userId,
      authResult.access_token,
      sessionSecret,
      maxAge,
    );
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
    return response;
  } catch (error) {
    console.error('Unable to change the current user password.', error);
    return NextResponse.json({ error: 'No se pudo cambiar la contraseña.' }, { status: 500 });
  }
}
