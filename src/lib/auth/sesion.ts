import { cookies } from 'next/headers';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { readSession, SESSION_COOKIE_NAME } from '@/lib/auth-session';
import { obtenerConfiguracionSupabase } from '@/lib/supabase-config';

interface UsuarioSupabase {
  id: string;
  email?: string;
  app_metadata?: { role?: unknown };
}

function esUsuarioSupabase(valor: unknown): valor is UsuarioSupabase {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'id' in valor &&
    typeof valor.id === 'string'
  );
}

export async function obtenerUsuario(): Promise<{ id: string; email: string } | null> {
  const sessionSecret = process.env.AUTH_SESSION_SECRET;
  const sesion = await readSession(
    cookies().get(SESSION_COOKIE_NAME)?.value,
    sessionSecret,
  );
  if (!sesion) return null;

  const supabase = obtenerConfiguracionSupabase();
  if (!supabase) {
    throw new Error('Supabase Auth no está configurado.');
  }

  const response = await fetch(`${supabase.url}/auth/v1/user`, {
    headers: {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${sesion.accessToken}`,
    },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error(`Supabase Auth respondió HTTP ${response.status}.`);
  }

  const usuario: unknown = await response.json();
  if (!esUsuarioSupabase(usuario)) {
    throw new Error('Supabase Auth devolvió un usuario inválido.');
  }
  if (
    usuario.id !== sesion.userId ||
    usuario.app_metadata?.role !== 'admin'
  ) {
    return null;
  }

  return { id: usuario.id, email: usuario.email ?? '' };
}

export async function exigirUsuario(): Promise<{ id: string; email: string }> {
  const usuario = await obtenerUsuario();
  if (!usuario) throw new ErrorDeNegocio('NO_AUTORIZADO');
  return usuario;
}
