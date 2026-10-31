'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { FilaProductoAdmin } from '@/lib/dataService';
import { esquemaProducto } from '@/lib/validacion/esquemas';
import { solicitarApi } from '@/lib/apiClient';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { SubidorFoto } from '@/components/admin/SubidorFoto';

interface FormularioProductoProps {
  producto?: FilaProductoAdmin;
}

export function FormularioProducto({ producto }: FormularioProductoProps) {
  const router = useRouter();
  const [codigo, setCodigo] = useState(producto?.codigo ?? '');
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [precioActual, setPrecioActual] = useState(
    producto ? String(producto.precioActual) : '',
  );
  const [precioEtiqueta, setPrecioEtiqueta] = useState(
    producto?.precioEtiqueta === null || !producto ? '' : String(producto.precioEtiqueta),
  );
  const [archivo, setArchivo] = useState<File | null>(null);
  const [idProducto, setIdProducto] = useState(producto?.id ?? null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError('');

    const validacion = esquemaProducto.safeParse({
      codigo,
      nombre,
      descripcion: descripcion || undefined,
      precioActual: Number(precioActual),
      precioEtiqueta: precioEtiqueta === '' ? null : Number(precioEtiqueta),
    });
    if (!validacion.success) {
      setError('Revisa el código, el nombre y los precios ingresados.');
      return;
    }

    setGuardando(true);
    try {
      let id = idProducto;
      if (id) {
        await solicitarApi(`/api/admin/productos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validacion.data),
        });
      } else {
        const creado = await solicitarApi<{ id: string; codigo: string }>(
          '/api/admin/productos',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validacion.data),
          },
        );
        id = creado.id;
        setIdProducto(id);
      }

      if (archivo && id) {
        const formulario = new FormData();
        formulario.set('foto', archivo);
        await solicitarApi(`/api/admin/productos/${id}/foto`, {
          method: 'POST',
          body: formulario,
        });
      }

      router.push('/admin');
      router.refresh();
    } catch (causa) {
      setError(
        causa instanceof Error
          ? causa.message
          : 'No se pudo guardar el producto.',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Tarjeta>
      <form onSubmit={guardar} className="space-y-5">
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Código"
            name="codigo"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            maxLength={64}
            required
          />
          <Campo
            etiqueta="Nombre"
            name="nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            maxLength={160}
            required
          />
          <label className="space-y-1.5 sm:col-span-2">
            <span className="block text-sm font-semibold text-pv-text">Descripción (opcional)</span>
            <textarea
              name="descripcion"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full rounded-xl border border-pv-border bg-white px-3 py-2 text-pv-text outline-none focus:border-pv-primary focus:ring-2 focus:ring-pv-primary/20"
            />
          </label>
          <Campo
            etiqueta="Precio actual (pesos)"
            name="precioActual"
            type="number"
            min="1"
            step="1"
            value={precioActual}
            onChange={(evento) => setPrecioActual(evento.target.value)}
            required
          />
          <Campo
            etiqueta="Precio de etiqueta (opcional)"
            name="precioEtiqueta"
            type="number"
            min="1"
            step="1"
            value={precioEtiqueta}
            onChange={(evento) => setPrecioEtiqueta(evento.target.value)}
          />
        </div>

        <p className="rounded-xl bg-pv-primary-soft p-3 text-sm text-pv-text">
          Si el precio de etiqueta difiere del actual, el cliente verá una alerta.
        </p>
        <SubidorFoto
          fotoUrl={producto?.fotoUrl ?? null}
          archivo={archivo}
          alCambiar={setArchivo}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Boton
            type="button"
            variante="secundario"
            onClick={() => router.push('/admin')}
          >
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando}>
            Guardar producto
          </Boton>
        </div>
      </form>
    </Tarjeta>
  );
}
