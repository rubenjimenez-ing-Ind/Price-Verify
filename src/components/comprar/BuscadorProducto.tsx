'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { FilaProducto } from '@/lib/dataService';
import { solicitarApi } from '@/lib/apiClient';
import { formatearPesos } from '@/lib/formato';
import { Aviso } from '@/components/ui/Aviso';
import { EstadoVacio } from '@/components/ui/EstadoVacio';

interface BuscadorProductoProps {
  alSeleccionar: (codigo: string) => void;
  codigoInicial?: string;
}

export function BuscadorProducto({ alSeleccionar, codigoInicial }: BuscadorProductoProps) {
  const [texto, setTexto] = useState(codigoInicial ?? '');
  const [productos, setProductos] = useState<FilaProducto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (codigoInicial) setTexto(codigoInicial);
  }, [codigoInicial]);

  useEffect(() => {
    const consulta = texto.trim();
    if (!consulta) {
      setProductos([]);
      setError('');
      setCargando(false);
      return;
    }

    const abortador = new AbortController();
    const temporizador = window.setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const resultado = await solicitarApi<FilaProducto[]>(
          `/api/publico/productos?q=${encodeURIComponent(consulta)}`,
          { signal: abortador.signal },
        );
        setProductos(resultado);
      } catch (causa) {
        if (abortador.signal.aborted) return;
        setError(causa instanceof Error ? causa.message : 'No se pudo buscar productos.');
      } finally {
        if (!abortador.signal.aborted) setCargando(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(temporizador);
      abortador.abort();
    };
  }, [texto]);

  return (
    <section aria-labelledby="buscador-titulo" className="space-y-3">
      <label htmlFor="buscar-producto" className="block text-lg font-bold">
        <span id="buscador-titulo">Buscar un producto</span>
      </label>
      <input
        id="buscar-producto"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        autoComplete="off"
        maxLength={80}
        placeholder="Escribe nombre o código"
        className="min-h-12 w-full rounded-xl border border-pv-border bg-white px-4 text-base text-pv-text outline-none focus:border-pv-primary focus:ring-2 focus:ring-pv-primary/20"
      />
      {cargando && <p className="text-sm text-pv-text-soft" role="status">Buscando…</p>}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {!cargando && !error && texto.trim() && productos.length === 0 && (
        <EstadoVacio titulo="No encontramos productos">
          Revisa el nombre o el código e inténtalo de nuevo.
        </EstadoVacio>
      )}
      {productos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Resultados de búsqueda">
          {productos.map((producto) => (
            <li key={producto.codigo}>
              <button
                type="button"
                onClick={() => alSeleccionar(producto.codigo)}
                className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-pv-border bg-white p-3 text-left shadow-sm transition hover:border-pv-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pv-primary"
              >
                {producto.fotoUrl ? (
                  <Image
                    src={producto.fotoUrl}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    loader={({ src }) => src}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-pv-primary-soft text-xs font-semibold text-pv-primary">
                    Producto
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-pv-text">{producto.nombre}</span>
                  <span className="block text-sm text-pv-text-soft">{producto.codigo}</span>
                </span>
                <span className="font-bold tabular-nums text-pv-text">{formatearPesos(producto.precioActual)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
