'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FilaProductoAdmin } from '@/lib/dataService';
import { solicitarApi } from '@/lib/apiClient';
import { formatearPesos } from '@/lib/formato';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Insignia } from '@/components/ui/Insignia';
import { Modal } from '@/components/ui/Modal';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { EstadoVacio } from '@/components/ui/EstadoVacio';

interface TablaProductosProps {
  productos: FilaProductoAdmin[];
  busqueda: string;
  incluirInactivos: boolean;
}

export function TablaProductos({
  productos,
  busqueda,
  incluirInactivos,
}: TablaProductosProps) {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<FilaProductoAdmin | null>(null);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  async function desactivar(): Promise<void> {
    if (!seleccionado) return;
    setProcesando(true);
    setError('');
    try {
      await solicitarApi(`/api/admin/productos/${seleccionado.id}/desactivar`, {
        method: 'POST',
      });
      setSeleccionado(null);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo desactivar el producto.');
    } finally {
      setProcesando(false);
    }
  }

  function acciones(producto: FilaProductoAdmin) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/productos/${producto.id}`}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-pv-primary underline-offset-2 hover:underline"
        >
          Editar
        </Link>
        {producto.activo && (
          <Boton
            variante="peligro"
            onClick={() => setSeleccionado(producto)}
            className="min-h-9 px-3 py-1 text-sm"
          >
            Desactivar
          </Boton>
        )}
      </div>
    );
  }

  function celdas(producto: FilaProductoAdmin) {
    return (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <p className="text-xs font-semibold uppercase text-pv-text-soft">Producto</p>
          <p className="font-semibold">{producto.nombre}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-pv-text-soft">Código</p>
          <p className="font-mono">{producto.codigo}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-pv-text-soft">Precio actual</p>
          <p>{formatearPesos(producto.precioActual)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-pv-text-soft">Precio de etiqueta</p>
          <p>{producto.precioEtiqueta === null ? '—' : formatearPesos(producto.precioEtiqueta)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-pv-text-soft">Discrepancia</p>
          {producto.hayDiscrepancia
            ? <Insignia tono="alerta">Difieren</Insignia>
            : <Insignia tono="neutro">Coinciden</Insignia>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-pv-text-soft">Estado</p>
          {producto.activo
            ? <Insignia tono="primario">Activo</Insignia>
            : <Insignia tono="inactivo">Inactivo</Insignia>}
        </div>
        {acciones(producto)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tarjeta>
        <form action="/admin" className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="space-y-1.5">
            <span className="block text-sm font-semibold">Buscar por código o nombre</span>
            <input
              name="busqueda"
              defaultValue={busqueda}
              maxLength={80}
              className="min-h-11 w-full rounded-xl border border-pv-border bg-white px-3 text-pv-text outline-none focus:border-pv-primary focus:ring-2 focus:ring-pv-primary/20"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input
              name="incluirInactivos"
              type="checkbox"
              value="true"
              defaultChecked={incluirInactivos}
              className="h-4 w-4 accent-pv-primary"
            />
            Incluir inactivos
          </label>
          <div className="flex gap-2">
            <Boton type="submit">Buscar</Boton>
            <Link
              href="/admin/productos/nuevo"
              className="inline-flex min-h-11 items-center rounded-xl bg-pv-primary px-4 py-2 font-semibold text-white hover:bg-emerald-800"
            >
              Nuevo producto
            </Link>
          </div>
        </form>
      </Tarjeta>

      {error && <Aviso tipo="error">{error}</Aviso>}

      {productos.length === 0 ? (
        <EstadoVacio titulo="No hay productos para mostrar">
          Crea un producto o cambia los criterios de búsqueda.
        </EstadoVacio>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-pv-border bg-white md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-pv-text-soft">
                <tr>
                  {['Código', 'Nombre', 'Precio actual', 'Etiqueta', 'Discrepancia', 'Estado', 'Acciones'].map((titulo) => (
                    <th key={titulo} scope="col" className="px-4 py-3 font-semibold">{titulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pv-border">
                {productos.map((producto) => (
                  <tr key={producto.id}>
                    <td className="px-4 py-3 font-mono text-sm">{producto.codigo}</td>
                    <td className="px-4 py-3 font-semibold">{producto.nombre}</td>
                    <td className="px-4 py-3">{formatearPesos(producto.precioActual)}</td>
                    <td className="px-4 py-3">
                      {producto.precioEtiqueta === null ? '—' : formatearPesos(producto.precioEtiqueta)}
                    </td>
                    <td className="px-4 py-3">
                      {producto.hayDiscrepancia
                        ? <Insignia tono="alerta">Difieren</Insignia>
                        : <Insignia tono="neutro">Coinciden</Insignia>}
                    </td>
                    <td className="px-4 py-3">
                      {producto.activo
                        ? <Insignia tono="primario">Activo</Insignia>
                        : <Insignia tono="inactivo">Inactivo</Insignia>}
                    </td>
                    <td className="px-4 py-3">{acciones(producto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {productos.map((producto) => (
              <Tarjeta key={producto.id} className="space-y-3">
                {celdas(producto)}
              </Tarjeta>
            ))}
          </div>
        </>
      )}

      <Modal
        abierto={seleccionado !== null}
        titulo="Desactivar producto"
        alCerrar={() => setSeleccionado(null)}
      >
        <p className="text-sm text-pv-text-soft">
          ¿Desactivar {seleccionado?.nombre}? Ya no aparecerá en las búsquedas del cliente.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secundario" onClick={() => setSeleccionado(null)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" cargando={procesando} onClick={desactivar}>
            Confirmar
          </Boton>
        </div>
      </Modal>
    </div>
  );
}
