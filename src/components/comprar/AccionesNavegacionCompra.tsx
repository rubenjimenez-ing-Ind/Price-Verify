'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AccionesNavegacionCompra() {
  const router = useRouter();
  const [sesionAutenticada, setSesionAutenticada] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controlador = new AbortController();

    async function verificarSesion(): Promise<void> {
      try {
        const respuesta = await fetch('/api/auth/profile', {
          cache: 'no-store',
          signal: controlador.signal,
        });
        if (respuesta.status === 401) {
          setSesionAutenticada(false);
          return;
        }
        if (!respuesta.ok) {
          throw new Error('No se pudo verificar la sesión de administrador.');
        }
        setSesionAutenticada(true);
      } catch (causa) {
        if (!controlador.signal.aborted) {
          setError(causa instanceof Error ? causa.message : 'No se pudo verificar la sesión.');
        }
      } finally {
        if (!controlador.signal.aborted) setVerificando(false);
      }
    }

    void verificarSesion();
    return () => controlador.abort();
  }, []);

  async function cerrarSesion(): Promise<void> {
    setCerrando(true);
    setError('');
    try {
      const respuesta = await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });
      if (!respuesta.ok) throw new Error('No se pudo cerrar la sesión.');
      setSesionAutenticada(false);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cerrar la sesión.');
    } finally {
      setCerrando(false);
    }
  }

  return (
    <>
      {error && <span role="alert" className="text-sm font-normal text-amber-100">{error}</span>}
      {!verificando && sesionAutenticada && (
        <button
          type="button"
          onClick={cerrarSesion}
          disabled={cerrando}
          className="rounded-lg px-2 py-2 text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 disabled:opacity-60"
        >
          {cerrando ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
      )}
    </>
  );
}
