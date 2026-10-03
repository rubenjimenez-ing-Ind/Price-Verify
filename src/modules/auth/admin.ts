import { NextRequest } from 'next/server';
import { readSession, SESSION_COOKIE_NAME } from '@/lib/auth-session';

const SUPABASE_AUTH_USER_PATH = '/auth/v1/user';

export interface AdminSession {
  accessToken: string;
  supabaseUrl: string;
  publishableKey: string;
  serviceRoleKey: string;
}

export async function getAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const sessionSecret = process.env.AUTH_SESSION_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !sessionSecret ||
    !supabaseUrl ||
    !publishableKey ||
    !serviceRoleKey ||
    serviceRoleKey.startsWith('sb_publishable_') ||
    serviceRoleKey === publishableKey
  ) {
    throw new Error('Supabase admin configuration is incomplete.');
  }

  const session = await readSession(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    sessionSecret,
  );
  if (!session) {
    return null;
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}${SUPABASE_AUTH_USER_PATH}`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Supabase user verification returned HTTP ${response.status}.`);
  }

  const user: unknown = await response.json();
  if (
    typeof user !== 'object' ||
    user === null ||
    !('id' in user) ||
    user.id !== session.userId ||
    !('app_metadata' in user) ||
    typeof user.app_metadata !== 'object' ||
    user.app_metadata === null ||
    !('role' in user.app_metadata) ||
    user.app_metadata.role !== 'admin'
  ) {
    return null;
  }

  return { accessToken: session.accessToken, supabaseUrl, publishableKey, serviceRoleKey };
}
