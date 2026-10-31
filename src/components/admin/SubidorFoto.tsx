'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface SubidorFotoProps {
  fotoUrl: string | null;
  archivo: File | null;
  alCambiar: (archivo: File | null) => void;
}

export function SubidorFoto({ fotoUrl, archivo, alCambiar }: SubidorFotoProps) {
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  useEffect(() => {
    if (!archivo) {
      setVistaPrevia(null);
      return;
    }

    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const imagen = vistaPrevia ?? fotoUrl;
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-pv-text" htmlFor="foto-producto">
        Foto del producto (opcional)
      </label>
      {imagen ? (
        <Image
          src={imagen}
          alt="Vista previa del producto"
          width={128}
          height={128}
          unoptimized
          loader={({ src }) => src}
          className="h-32 w-32 rounded-xl border border-pv-border object-cover"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-pv-border text-sm text-pv-text-soft">
          Sin foto
        </div>
      )}
      <input
        id="foto-producto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(evento) => alCambiar(evento.target.files?.[0] ?? null)}
        className="block w-full text-sm text-pv-text file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-pv-primary-soft file:px-3 file:font-semibold file:text-pv-primary"
      />
      <p className="text-sm text-pv-text-soft">JPG, PNG o WebP; máximo 2 MB.</p>
    </div>
  );
}
