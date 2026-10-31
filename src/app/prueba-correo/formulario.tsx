'use client';

import { useState, type FormEvent } from 'react';

export function FormularioPruebaCorreo() {
  const [para, setPara] = useState('rubenjimenezposada@gmail.com');
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviarPrueba(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje('');
    setEsError(false);
    setEnviando(true);

    try {
      const respuesta = await fetch('/api/correo/prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ para }),
      });
      const resultado = (await respuesta.json()) as { error?: string };

      if (!respuesta.ok) {
        setEsError(true);
        setMensaje(resultado.error ?? 'No se pudo enviar el correo.');
        return;
      }

      setMensaje('Correo enviado');
    } catch {
      setEsError(true);
      setMensaje('No se pudo conectar para enviar el correo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Resend
        </p>
        <h1 className="mt-2 text-3xl font-bold">Prueba de correo</h1>
        <p className="mt-2 text-sm text-slate-400">
          Envía un mensaje de prueba para comprobar la conexión.
        </p>

        <form className="mt-8 space-y-5" onSubmit={enviarPrueba}>
          <div>
            <label htmlFor="correo-destino" className="mb-2 block text-sm font-medium text-slate-200">
              Correo de destino
            </label>
            <input
              id="correo-destino"
              name="para"
              type="email"
              autoComplete="email"
              value={para}
              onChange={(evento) => {
                setPara(evento.target.value);
                setMensaje('');
              }}
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
            {enviando ? 'Enviando...' : 'Enviar prueba'}
          </button>
        </form>

        {mensaje && (
          <p className={`mt-5 text-sm ${esError ? 'text-rose-400' : 'text-emerald-400'}`} role={esError ? 'alert' : 'status'}>
            {mensaje}
          </p>
        )}
      </section>
    </main>
  );
}
