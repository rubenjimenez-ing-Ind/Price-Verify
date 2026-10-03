'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppNavigation } from '@/components/layout/AppNavigation';

interface ManagedUser {
  id: string;
  email: string;
  createdAt: string | null;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users');
      const result = (await response.json()) as { users?: ManagedUser[]; error?: string };
      if (response.status === 403) {
        setIsAdmin(false);
        return;
      }
      if (!response.ok || !result.users) {
        throw new Error(result.error ?? 'No se pudo cargar la lista de usuarios.');
      }
      setIsAdmin(true);
      setUsers(result.users);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la lista de usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { user?: ManagedUser; error?: string };
      if (!response.ok || !result.user) {
        throw new Error(result.error ?? 'No se pudo crear el usuario.');
      }
      setEmail('');
      setPassword('');
      setSuccess(`La cuenta de ${result.user.email} se creó correctamente.`);
      await loadUsers();
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AppNavigation />
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <header>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Administración
            </p>
            <h1 className="mt-2 text-3xl font-bold">Usuarios</h1>
            <p className="mt-2 text-sm text-slate-400">
              Crea cuentas de acceso y consulta los usuarios registrados.
            </p>
          </header>

          {isLoading ? (
            <p className="text-slate-300" role="status">Verificando permisos...</p>
          ) : !isAdmin ? (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
              <h2 className="text-lg font-semibold text-amber-200">Acceso de administrador requerido</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Para habilitar este menú, asigna <code>app_metadata.role = admin</code> a tu usuario
                desde Supabase. La guía y la consulta SQL están en{' '}
                <code>supabase/assign-admin-role.sql</code>. Después cierra sesión y vuelve a entrar.
              </p>
            </section>
          ) : (
            <>
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
                <h2 className="text-xl font-semibold">Crear usuario</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Se creará una cuenta confirmada. Comparte la contraseña inicial por un canal seguro.
                </p>
                <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="new-user-email" className="mb-2 block text-sm font-medium text-slate-200">
                      Correo electrónico
                    </label>
                    <input
                      id="new-user-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="block w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="persona@correo.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-user-password" className="mb-2 block text-sm font-medium text-slate-200">
                      Contraseña inicial
                    </label>
                    <input
                      id="new-user-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="block w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  {error && <p className="text-sm text-rose-400 sm:col-span-2" role="alert">{error}</p>}
                  {success && <p className="text-sm text-emerald-400 sm:col-span-2" role="status">{success}</p>}
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isSubmitting ? 'Creando usuario...' : 'Crear usuario'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
                <h2 className="text-xl font-semibold">Cuentas registradas</h2>
                {users.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-400">Aún no hay cuentas para mostrar.</p>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[36rem] text-left text-sm">
                      <thead className="border-b border-slate-700 text-slate-400">
                        <tr>
                          <th className="px-3 py-3 font-medium">Correo</th>
                          <th className="px-3 py-3 font-medium">Estado</th>
                          <th className="px-3 py-3 font-medium">Creado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-slate-800 last:border-0">
                            <td className="break-all px-3 py-3 text-slate-200">{user.email}</td>
                            <td className="px-3 py-3">
                              {user.emailConfirmedAt ? (
                                <span className="text-emerald-400">Confirmado</span>
                              ) : (
                                <span className="text-amber-300">Pendiente</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-slate-400">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
