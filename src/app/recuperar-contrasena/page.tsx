'use client';

import { useState, type FormEvent } from 'react';

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function solicitarEnlace(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje('');
    setEsError(false);
    setEnviando(true);

    try {
      const respuesta = await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const resultado = (await respuesta.json()) as { message?: string; error?: string };

      if (!respuesta.ok) {
        setEsError(true);
        setMensaje(resultado.error ?? 'No se pudo solicitar el restablecimiento.');
        return;
      }

      setMensaje(resultado.message ?? 'Revisa tu correo electrónico.');
    } catch {
      setEsError(true);
      setMensaje('No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          PriceVerify
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Te enviaremos un enlace para crear una contraseña nueva.
        </p>

        <form className="mt-8 space-y-5" onSubmit={solicitarEnlace}>
          <div>
            <label htmlFor="email-recuperacion" className="mb-2 block text-sm font-medium text-slate-200">
              Correo electrónico
            </label>
            <input
              id="email-recuperacion"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
              className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="tu@correo.com"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        {mensaje && (
          <p className={`mt-5 text-sm ${esError ? 'text-rose-400' : 'text-emerald-400'}`} role={esError ? 'alert' : 'status'}>
            {mensaje}
          </p>
        )}

        <a href="/login" className="mt-6 inline-block text-sm text-cyan-400 transition hover:text-cyan-300">
          Volver al inicio de sesión
        </a>
      </section>
    </main>
  );
}
