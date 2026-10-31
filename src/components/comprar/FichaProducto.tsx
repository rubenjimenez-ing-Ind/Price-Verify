'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ProductoConAlerta, ResultadoCarrito } from '@/lib/dataService';
import { solicitarApi } from '@/lib/apiClient';
import { formatearPesos } from '@/lib/formato';
import { AlertaDiscrepancia } from '@/components/comprar/AlertaDiscrepancia';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';

interface FichaProductoProps {
  codigo: string | null;
  alAgregar: (codigo: string, cantidad: number) => Promise<ResultadoCarrito>;
}

export function FichaProducto({ codigo, alAgregar }: FichaProductoProps) {
  const [ficha, setFicha] = useState<ProductoConAlerta | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cantidad, setCantidad] = useState('1');
  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setFicha(null);
    setMensaje('');
    setError('');
    if (!codigo) {
      setCargando(false);
      return;
    }

    const abortador = new AbortController();
    setCargando(true);
    solicitarApi<ProductoConAlerta>(
      `/api/publico/productos/${encodeURIComponent(codigo)}`,
      { signal: abortador.signal },
    )
      .then(setFicha)
      .catch((causa: unknown) => {
        if (!abortador.signal.aborted) {
          setError(causa instanceof Error ? causa.message : 'No se pudo cargar el producto.');
        }
      })
      .finally(() => {
        if (!abortador.signal.aborted) setCargando(false);
      });

    return () => abortador.abort();
  }, [codigo]);

  async function agregar(): Promise<void> {
    if (!ficha) return;
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 1 || numero > 999) {
      setError('La cantidad debe ser un entero entre 1 y 999.');
      return;
    }
    setAgregando(true);
    setError('');
    setMensaje('');
    try {
      const resultado = await alAgregar(ficha.producto.codigo, numero);
      setMensaje('Producto agregado al carrito.');
      const alerta = resultado.alerta;
      if (alerta?.hay) {
        setFicha((actual) => actual ? { ...actual, alerta } : actual);
      }
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo agregar el producto.');
    } finally {
      setAgregando(false);
    }
  }

  if (!codigo) {
    return <EstadoVacio titulo="Selecciona un producto">La ficha y su precio vigente aparecerán aquí.</EstadoVacio>;
  }
  if (cargando) return <p role="status" className="text-sm text-pv-text-soft">Cargando producto…</p>;
  if (error && !ficha) return <Aviso tipo="error">{error}</Aviso>;
  if (!ficha) return null;

  return (
    <Tarjeta className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        {ficha.producto.fotoUrl ? (
          <Image
            src={ficha.producto.fotoUrl}
            alt=""
            width={128}
            height={128}
            unoptimized
            loader={({ src }) => src}
            className="h-24 w-24 rounded-xl object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-pv-primary-soft text-center text-sm font-semibold text-pv-primary sm:h-32 sm:w-32">
            Sin foto
          </div>
        )}
        <div className="min-w-[12rem] flex-1">
          <p className="font-mono text-sm text-pv-text-soft">{ficha.producto.codigo}</p>
          <h2 className="mt-1 text-2xl font-bold">{ficha.producto.nombre}</h2>
          {ficha.producto.descripcion && (
            <p className="mt-2 text-sm text-pv-text-soft">{ficha.producto.descripcion}</p>
          )}
          <p className="mt-3 text-3xl font-bold tabular-nums text-pv-primary">
            {formatearPesos(ficha.producto.precioActual)}
          </p>
        </div>
      </div>

      {ficha.alerta.hay && ficha.alerta.precioEtiqueta !== null && (
        <AlertaDiscrepancia
          precioEtiqueta={ficha.alerta.precioEtiqueta}
          precioActual={ficha.alerta.precioCobrado}
        />
      )}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}

      <div className="flex flex-wrap items-end gap-3">
        <Campo
          etiqueta="Cantidad"
          name="cantidad"
          type="number"
          min="1"
          max="999"
          step="1"
          value={cantidad}
          onChange={(evento) => setCantidad(evento.target.value)}
          className="max-w-32"
        />
        <Boton cargando={agregando} onClick={agregar}>
          Agregar al carrito
        </Boton>
      </div>
    </Tarjeta>
  );
}
