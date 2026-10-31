'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Boton } from '@/components/ui/Boton';
import { Aviso } from '@/components/ui/Aviso';

interface NavegacionAdminProps {
  correo: string;
}

export function NavegacionAdmin({ correo }: NavegacionAdminProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [cerrando, setCerrando] = useState(false);

  async function cerrarSesion(): Promise<void> {
    setCerrando(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cerrar la sesión.');
      router.push('/login');
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cerrar la sesión.');
      setCerrando(false);
    }
  }

  return (
    <header className="bg-pv-primary text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <Link href="/admin" className="text-lg font-bold focus-visible:outline focus-visible:outline-2">
            PriceVerify · Administración
          </Link>
          <p className="text-sm text-white/85">{correo}</p>
        </div>
        <nav aria-label="Administración" className="flex items-center gap-2">
          <Link
            href="/admin"
            className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2"
          >
            Catálogo
          </Link>
          <Boton
            variante="secundario"
            cargando={cerrando}
            onClick={cerrarSesion}
            className="min-h-10"
          >
            Cerrar sesión
          </Boton>
        </nav>
      </div>
      {error && (
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}
    </header>
  );
}
