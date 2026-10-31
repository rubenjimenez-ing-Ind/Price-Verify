'use client';

import { useCallback, useEffect, useState } from 'react';
import type { EstadoCarrito, ResultadoCarrito } from '@/lib/dataService';
import { solicitarApi } from '@/lib/apiClient';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { ItemCarrito } from '@/components/comprar/ItemCarrito';
import { TotalCarrito } from '@/components/comprar/TotalCarrito';

interface CarritoProps {
  deviceId: string | null;
  version: number;
}

export function Carrito({ deviceId, version }: CarritoProps) {
  const [carrito, setCarrito] = useState<EstadoCarrito | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const cargarCarrito = useCallback(async (signal?: AbortSignal) => {
    if (!deviceId) return;
    setCargando(true);
    setError('');
    try {
      const estado = await solicitarApi<EstadoCarrito>(
        `/api/publico/carrito?deviceId=${encodeURIComponent(deviceId)}`,
        { signal },
      );
      if (!signal?.aborted) setCarrito(estado);
    } catch (causa) {
      if (!signal?.aborted) {
        setError(causa instanceof Error ? causa.message : 'No se pudo cargar el carrito.');
      }
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    const abortador = new AbortController();
    void cargarCarrito(abortador.signal);
    return () => abortador.abort();
  }, [cargarCarrito, deviceId, version]);

  async function aplicarCambio(
    url: string,
    opciones: RequestInit,
  ): Promise<void> {
    if (!deviceId) return;
    setProcesando(true);
    setError('');
    try {
      const resultado = await solicitarApi<ResultadoCarrito>(url, opciones);
      setCarrito(resultado.carrito);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo actualizar el carrito.');
    } finally {
      setProcesando(false);
    }
  }

  async function ajustar(codigo: string, cantidad: number): Promise<void> {
    await aplicarCambio('/api/publico/carrito/item', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, codigo, cantidad }),
    });
  }

  async function quitar(codigo: string): Promise<void> {
    await aplicarCambio('/api/publico/carrito/item', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, codigo }),
    });
  }

  async function cerrarSesionCompra(): Promise<void> {
    if (!deviceId) return;
    setProcesando(true);
    setError('');
    try {
      await solicitarApi<{ cerrada: boolean }>('/api/publico/carrito/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      setCarrito((actual) => actual
        ? { ...actual, estado: 'cerrada', items: [], total: 0 }
        : actual);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cerrar la sesión de compra.');
    } finally {
      setProcesando(false);
    }
  }

  async function iniciarNuevaCompra(): Promise<void> {
    await cargarCarrito();
  }

  return (
    <Tarjeta id="carrito" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Tu carrito</h2>
        {carrito?.estado === 'activa' && (
          <Boton
            type="button"
            variante="fantasma"
            disabled={procesando || !deviceId}
            onClick={() => void cerrarSesionCompra()}
            className="min-h-10 px-2 text-sm text-pv-danger"
          >
            Cerrar sesión de compra
          </Boton>
        )}
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}
      {cargando && <p role="status" className="text-sm text-pv-text-soft">Cargando carrito…</p>}
      {!cargando && carrito?.items.length === 0 && (
        <>
          <EstadoVacio titulo={carrito.estado === 'cerrada' ? 'Sesión de compra cerrada' : 'Tu carrito está vacío'}>
            {carrito.estado === 'cerrada'
              ? 'La sesión terminó. Puedes iniciar una nueva compra cuando quieras.'
              : 'Agrega productos para calcular el total.'}
          </EstadoVacio>
          {carrito.estado === 'cerrada' && (
            <Boton
              type="button"
              variante="secundario"
              disabled={procesando}
              onClick={() => void iniciarNuevaCompra()}
            >
              Iniciar nueva compra
            </Boton>
          )}
        </>
      )}
      {!cargando && carrito && carrito.items.length > 0 && (
        <ul>
          {carrito.items.map((item) => (
            <ItemCarrito
              key={item.codigo}
              item={item}
              deshabilitado={procesando}
              alAjustar={(cantidad) => void ajustar(item.codigo, cantidad)}
              alEliminar={() => void quitar(item.codigo)}
            />
          ))}
        </ul>
      )}
      <p className="text-xs leading-relaxed text-pv-text-soft">
        El total se calcula con el precio vigente al momento de agregar cada producto.
      </p>
      <TotalCarrito total={carrito?.total ?? 0} />
    </Tarjeta>
  );
}
