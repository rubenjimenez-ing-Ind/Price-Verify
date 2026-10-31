import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/modules/auth/admin';
import {
  updateRegisteredUsersMarkdown,
  type RegisteredUserForMarkdown,
} from '@/modules/auth/users-markdown';

export const runtime = 'nodejs';

interface SupabaseAdminUser {
  id: string;
  email?: string;
  created_at?: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
}

function serializeUser(user: SupabaseAdminUser) {
  return {
    id: user.id,
    email: user.email ?? '',
    createdAt: user.created_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

async function fetchAllUsers(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<SupabaseAdminUser[]> {
  const users: SupabaseAdminUser[] = [];
  const perPage = 100;

  for (let page = 1; ; page += 1) {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(`Supabase Admin list users returned HTTP ${response.status}.`);
    }

    const result: unknown = await response.json();
    if (
      typeof result !== 'object' ||
      result === null ||
      !('users' in result) ||
      !Array.isArray(result.users)
    ) {
      throw new Error('Supabase Admin returned an invalid users list.');
    }

    const batch = result.users.filter(
      (user): user is SupabaseAdminUser =>
        typeof user === 'object' &&
        user !== null &&
        'id' in user &&
        typeof user.id === 'string',
    );
    users.push(...batch);

    if (batch.length < perPage) {
      return users;
    }
  }
}

async function syncMarkdown(users: SupabaseAdminUser[]): Promise<boolean> {
  const markdownUsers: RegisteredUserForMarkdown[] = users.map((user) => ({
    email: user.email ?? '',
    createdAt: user.created_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  }));

  try {
    await updateRegisteredUsersMarkdown(markdownUsers);
    return true;
  } catch (error) {
    console.error('Could not update usuarios-registrados.md.', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession(request);
    if (!admin) {
      return NextResponse.json({ error: 'Esta sección es solo para administradores.' }, { status: 403 });
    }

    const users = await fetchAllUsers(admin.supabaseUrl, admin.serviceRoleKey);
    const markdownUpdated = await syncMarkdown(users);

    return NextResponse.json({
      users: users.map(serializeUser),
      markdownUpdated,
    });
  } catch (error) {
    console.error('Unable to list Supabase users.', error);
    return NextResponse.json({ error: 'No se pudo cargar la lista de usuarios.' }, { status: 502 });
  }
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
    !('email' in body) ||
    typeof body.email !== 'string' ||
    !('password' in body) ||
    typeof body.password !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    body.password.length < 8 ||
    body.password.length > 128
  ) {
    return NextResponse.json(
      { error: 'Ingresa un correo válido y una contraseña de 8 a 128 caracteres.' },
      { status: 400 },
    );
  }

  try {
    const admin = await getAdminSession(request);
    if (!admin) {
      return NextResponse.json({ error: 'Esta sección es solo para administradores.' }, { status: 403 });
    }

    const response = await fetch(
      `${admin.supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users`,
      {
        method: 'POST',
        headers: {
          apikey: admin.serviceRoleKey,
          Authorization: `Bearer ${admin.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email.trim().toLowerCase(),
          password: body.password,
          email_confirm: true,
        }),
        cache: 'no-store',
      },
    );

    if (response.status === 409 || response.status === 422) {
      return NextResponse.json({ error: 'No se pudo crear la cuenta. Revisa si el correo ya está registrado.' }, { status: 409 });
    }

    if (!response.ok) {
      console.error(`Supabase Admin create user returned HTTP ${response.status}.`);
      return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 502 });
    }

    const result: unknown = await response.json();
    if (
      typeof result !== 'object' ||
      result === null ||
      !('id' in result) ||
      typeof result.id !== 'string'
    ) {
      console.error('Supabase Admin returned an invalid created user.');
      return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 502 });
    }

    const createdUser = result as SupabaseAdminUser;
    let markdownUpdated = false;
    try {
      const users = await fetchAllUsers(admin.supabaseUrl, admin.serviceRoleKey);
      markdownUpdated = await syncMarkdown(users);
    } catch (error) {
      console.error('The user was created, but registered-user Markdown could not be synchronized.', error);
    }

    return NextResponse.json(
      { user: serializeUser(createdUser), markdownUpdated },
      { status: 201 },
    );
  } catch (error) {
    console.error('Unable to create Supabase user.', error);
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 502 });
  }
}
