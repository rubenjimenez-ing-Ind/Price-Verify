'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
}

export function Modal({ abierto, titulo, alCerrar, children }: ModalProps) {
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };
    document.addEventListener('keydown', alPresionarTecla);
    dialogoRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus();
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [abierto, alCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className="w-full max-w-md rounded-2xl bg-white p-5 text-pv-text shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-titulo" className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            aria-label="Cerrar diálogo"
            onClick={alCerrar}
            className="rounded-lg px-2 py-1 text-pv-text-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-pv-primary"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
