'use client';

import Image from 'next/image';
import type { ItemCarrito as ItemCarritoTipo } from '@/lib/dataService';
import { formatearPesos } from '@/lib/formato';
import { Boton } from '@/components/ui/Boton';

interface ItemCarritoProps {
  item: ItemCarritoTipo;
  deshabilitado: boolean;
  alAjustar: (cantidad: number) => void;
  alEliminar: () => void;
}

export function ItemCarrito({
  item,
  deshabilitado,
  alAjustar,
  alEliminar,
}: ItemCarritoProps) {
  return (
    <li className="flex gap-3 border-b border-pv-border py-3 last:border-0">
      {item.fotoUrl ? (
        <Image
          src={item.fotoUrl}
          alt=""
          width={56}
          height={56}
          unoptimized
          loader={({ src }) => src}
          className="h-14 w-14 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-pv-text-soft">
          Sin foto
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.nombre}</p>
        <p className="text-sm text-pv-text-soft">
          {formatearPesos(item.precioUnitario)} c/u
        </p>
        <p className="mt-1 font-bold tabular-nums">{formatearPesos(item.subtotal)}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1">
          <Boton
            type="button"
            variante="secundario"
            aria-label={`Disminuir cantidad de ${item.nombre}`}
            disabled={deshabilitado}
            onClick={() => alAjustar(item.cantidad - 1)}
            className="min-h-10 min-w-10 px-2"
          >
            −
          </Boton>
          <span className="min-w-7 text-center font-bold tabular-nums" aria-label={`Cantidad ${item.cantidad}`}>
            {item.cantidad}
          </span>
          <Boton
            type="button"
            variante="secundario"
            aria-label={`Aumentar cantidad de ${item.nombre}`}
            disabled={deshabilitado || item.cantidad >= 999}
            onClick={() => alAjustar(item.cantidad + 1)}
            className="min-h-10 min-w-10 px-2"
          >
            +
          </Boton>
        </div>
        <button
          type="button"
          disabled={deshabilitado}
          onClick={alEliminar}
          className="text-sm font-semibold text-pv-danger underline-offset-2 hover:underline disabled:opacity-50"
        >
          Quitar
        </button>
      </div>
    </li>
  );
}
