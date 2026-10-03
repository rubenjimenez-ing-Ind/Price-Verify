'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AppNavigation() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    fetch('/api/auth/profile')
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { profile?: { isAdmin?: boolean } };
        if (isCurrent) {
          setIsAdmin(result.profile?.isAdmin === true);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsAdmin(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('No se pudo cerrar la sesión.');
      }
      router.replace('/login');
      router.refresh();
    } catch {
      setIsSigningOut(false);
      setError('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    }
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/70 px-4 py-3 sm:px-6"
    >
      <Link href="/" className="font-semibold tracking-wide text-cyan-400">
        PriceVerify
      </Link>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {error && <span className="text-rose-400" role="alert">{error}</span>}
        <Link
          href="/"
          className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          Inicio
        </Link>
        <Link
          href="/products"
          className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          Productos
        </Link>
        <Link
          href="/profile"
          className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          Mi perfil
        </Link>
        {isAdmin && (
          <Link
            href="/users"
            className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Usuarios
          </Link>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-rose-400 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? 'Saliendo...' : 'Cerrar sesión'}
        </button>
      </div>
    </nav>
  );
}
