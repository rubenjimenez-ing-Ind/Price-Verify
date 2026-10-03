import { NextRequest, NextResponse } from 'next/server';
import { readSession, SESSION_COOKIE_NAME } from '@/lib/auth-session';

export const runtime = 'nodejs';

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

async function updateAuthMetadata(
  accessToken: string,
  metadata?: Record<string, unknown>,
): Promise<SupabaseUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase Auth is not configured.');
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    method: metadata ? 'PATCH' : 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      ...(metadata ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(metadata ? { body: JSON.stringify({ data: metadata }) } : {}),
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    console.error(`Supabase profile request returned HTTP ${response.status}.`);
    throw new Error('Supabase profile request failed.');
  }

  const user: unknown = await response.json();
  if (
    typeof user !== 'object' ||
    user === null ||
    !('id' in user) ||
    typeof user.id !== 'string' ||
    !('user_metadata' in user) ||
    typeof user.user_metadata !== 'object' ||
    user.user_metadata === null
  ) {
    throw new Error('Supabase returned an invalid user profile.');
  }

  return user as SupabaseUser;
}

function toProfile(user: SupabaseUser) {
  const fullName = user.user_metadata?.full_name;
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: typeof fullName === 'string' ? fullName : '',
    isAdmin: user.app_metadata?.role === 'admin',
  };
}

async function getCurrentSession(request: NextRequest) {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET is not configured.');
  }

  return readSession(request.cookies.get(SESSION_COOKIE_NAME)?.value, secret);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    }

    const user = await updateAuthMetadata(session.accessToken);
    if (!user) {
      return NextResponse.json({ error: 'La sesión expiró. Inicia sesión de nuevo.' }, { status: 401 });
    }

    return NextResponse.json({ profile: toProfile(user) });
  } catch (error) {
    console.error('Unable to load the current Supabase profile.', error);
    return NextResponse.json({ error: 'No se pudo cargar el perfil.' }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('fullName' in body) ||
    typeof body.fullName !== 'string' ||
    body.fullName.trim().length === 0 ||
    body.fullName.trim().length > 100
  ) {
    return NextResponse.json(
      { error: 'Escribe un nombre de hasta 100 caracteres.' },
      { status: 400 },
    );
  }

  try {
    const session = await getCurrentSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
    }

    const currentUser = await updateAuthMetadata(session.accessToken);
    if (!currentUser) {
      return NextResponse.json({ error: 'La sesión expiró. Inicia sesión de nuevo.' }, { status: 401 });
    }

    const user = await updateAuthMetadata(session.accessToken, {
      ...currentUser.user_metadata,
      full_name: body.fullName.trim(),
    });
    if (!user) {
      return NextResponse.json({ error: 'La sesión expiró. Inicia sesión de nuevo.' }, { status: 401 });
    }

    return NextResponse.json({ profile: toProfile(user) });
  } catch (error) {
    console.error('Unable to update the current Supabase profile.', error);
    return NextResponse.json({ error: 'No se pudo guardar el perfil.' }, { status: 502 });
  }
}
