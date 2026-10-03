'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AppNavigation } from '@/components/layout/AppNavigation';

interface Profile {
  id: string;
  email: string;
  fullName: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    fetch('/api/auth/profile')
      .then(async (response) => {
        const result = (await response.json()) as { profile?: Profile; error?: string };
        if (!response.ok || !result.profile) {
          throw new Error(result.error ?? 'No se pudo cargar el perfil.');
        }
        if (isCurrent) {
          setProfile(result.profile);
          setFullName(result.profile.fullName);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el perfil.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedName = fullName.trim();
    if (!normalizedName || normalizedName.length > 100) {
      setError('Escribe tu nombre (máximo 100 caracteres).');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: normalizedName }),
      });
      const result = (await response.json()) as { profile?: Profile; error?: string };
      if (!response.ok || !result.profile) {
        throw new Error(result.error ?? 'No se pudo guardar el perfil.');
      }
      setProfile(result.profile);
      setFullName(result.profile.fullName);
      setSuccess('Tu perfil se guardó correctamente.');
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <AppNavigation />
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
        <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Cuenta
          </p>
          <h1 className="mt-2 text-3xl font-bold">Mi perfil</h1>
          <p className="mt-2 text-sm text-slate-400">
            Consulta y actualiza los datos de tu propia cuenta.
          </p>

          {isLoading ? (
            <p className="mt-8 text-slate-300" role="status">Cargando perfil...</p>
          ) : error && !profile ? (
            <p className="mt-8 text-sm text-rose-400" role="alert">{error}</p>
          ) : profile ? (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-slate-200">
                  Correo electrónico
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  readOnly
                  className="block w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-base text-slate-400"
                />
                <p className="mt-2 text-xs text-slate-500">
                  El correo de acceso se administra desde la autenticación de Supabase.
                </p>
              </div>

              <div>
                <label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-slate-200">
                  Nombre
                </label>
                <input
                  id="profile-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  required
                  className="block w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Tu nombre"
                />
              </div>

              {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}
              {success && <p className="text-sm text-emerald-400" role="status">{success}</p>}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
              >
                {isSaving ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </form>
          ) : null}
        </section>
      </main>
    </>
  );
}
