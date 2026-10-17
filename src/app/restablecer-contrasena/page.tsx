'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function RestablecerContrasenaPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [enlaceListo, setEnlaceListo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.hash.slice(1));
    const token = parametros.get('access_token');
    const tipo = parametros.get('type');

    if (token && tipo === 'recovery') {
      setAccessToken(token);
      setEnlaceListo(true);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const descripcion = parametros.get('error_description');
    setError(
      descripcion
        ? 'El enlace no es válido o ya venció. Solicita otro.'
        : 'Abre esta página desde el enlace de recuperación que recibiste por correo.',
    );
    setEnlaceListo(true);
  }, []);

  async function guardarContrasena(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError('');

    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch('/api/auth/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, contrasena, confirmacion }),
      });
      const resultado = (await respuesta.json()) as { error?: string };

      if (!respuesta.ok) {
        setError(resultado.error ?? 'No se pudo restablecer la contraseña.');
        return;
      }

      router.replace('/login?contrasenaRestablecida=1');
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          PriceVerify
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Crear contraseña nueva
        </h1>

        {!enlaceListo ? (
          <p className="mt-6 text-sm text-slate-300" role="status">Validando el enlace...</p>
        ) : accessToken ? (
          <form className="mt-8 space-y-5" onSubmit={guardarContrasena}>
            <div>
              <label htmlFor="nueva-contrasena" className="mb-2 block text-sm font-medium text-slate-200">
                Nueva contraseña
              </label>
              <input
                id="nueva-contrasena"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                required
                className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div>
              <label htmlFor="confirmar-contrasena" className="mb-2 block text-sm font-medium text-slate-200">
                Confirmar contraseña
              </label>
              <input
                id="confirmar-contrasena"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmacion}
                onChange={(evento) => setConfirmacion(evento.target.value)}
                required
                className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-rose-400" role="alert">{error}</p>
            <a href="/recuperar-contrasena" className="inline-block text-sm text-cyan-400 transition hover:text-cyan-300">
              Solicitar otro enlace
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
