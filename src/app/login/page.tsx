'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const hasPassword = password.trim().length > 0;

    setEmailError(isValidEmail ? '' : 'Ingresa un correo electrónico válido.');
    setPasswordError(hasPassword ? '' : 'La contraseña no puede estar vacía.');

    if (!isValidEmail || !hasPassword) {
      return;
    }

    setIsSubmitting(true);

    // TODO: conectar con la API real
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (normalizedEmail.toLowerCase() === 'demo@priceverify.com' && password === 'demo1234') {
      router.push('/');
      return;
    }

    setPasswordError('Correo o contraseña incorrectos');
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-bold text-slate-950">
            PV
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            PriceVerify
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Inicia sesión</h1>
          <p className="mt-2 text-sm text-slate-400">
            Accede para consultar y verificar tus precios.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError('');
                setPasswordError('');
              }}
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
              className="block w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="tu@correo.com"
            />
            {emailError && (
              <p id="email-error" className="mt-2 text-sm text-rose-400">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                Contraseña
              </label>
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="text-sm text-cyan-400 transition hover:text-cyan-300"
              >
                Olvidé mi contraseña
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError('');
              }}
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={passwordError ? 'password-error' : undefined}
              className="block w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Ingresa tu contraseña"
            />
            {passwordError && (
              <p id="password-error" className="mt-2 text-sm text-rose-400">
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  );
}
