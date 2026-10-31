'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import type { ResultadoCarrito } from '@/lib/dataService';
import { useDeviceId } from '@/lib/hooks/useDeviceId';
import { solicitarApi } from '@/lib/apiClient';
import { BuscadorProducto } from '@/components/comprar/BuscadorProducto';
import { Carrito } from '@/components/comprar/Carrito';
import { FichaProducto } from '@/components/comprar/FichaProducto';

export function ComprarExperiencia() {
  const deviceId = useDeviceId();
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string | null>(null);
  const [codigoInicial, setCodigoInicial] = useState<string | undefined>();
  const [versionCarrito, setVersionCarrito] = useState(0);

  useEffect(() => {
    const codigo = new URLSearchParams(window.location.search).get('codigo');
    if (!codigo) return;
    setCodigoInicial(codigo);
    setCodigoSeleccionado(codigo);
    window.history.replaceState(null, '', '/comprar');
  }, []);

  async function agregar(codigo: string, cantidad: number): Promise<ResultadoCarrito> {
    if (!deviceId) throw new Error('No se pudo identificar este dispositivo.');
    const resultado = await solicitarApi<ResultadoCarrito>('/api/publico/carrito', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, codigo, cantidad }),
    });
    setVersionCarrito((actual) => actual + 1);
    return resultado;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-pv-primary">Compra sencilla</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Verifica tus precios</h1>
        <p className="mt-2 max-w-2xl text-pv-text-soft">
          Busca por nombre o código, compara el precio de etiqueta y calcula el total de tu compra.
        </p>
        <Link
          href="/comprar/escanear"
          className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-pv-border bg-white px-3 py-2 text-sm font-semibold text-pv-primary hover:bg-pv-primary-soft"
        >
          Escanear código
        </Link>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-pv-border bg-white p-4 shadow-sm sm:p-5">
            <BuscadorProducto
              codigoInicial={codigoInicial}
              alSeleccionar={setCodigoSeleccionado}
            />
          </div>
          <FichaProducto codigo={codigoSeleccionado} alAgregar={agregar} />
        </section>
        <Carrito deviceId={deviceId} version={versionCarrito} />
      </div>
    </main>
  );
}
