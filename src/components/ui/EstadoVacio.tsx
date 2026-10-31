import type { ReactNode } from 'react';

interface EstadoVacioProps {
  titulo: string;
  children?: ReactNode;
}

export function EstadoVacio({ titulo, children }: EstadoVacioProps) {
  return (
    <div className="rounded-2xl border border-dashed border-pv-border bg-white p-6 text-center">
      <h3 className="font-semibold text-pv-text">{titulo}</h3>
      {children && <div className="mt-2 text-sm text-pv-text-soft">{children}</div>}
    </div>
  );
}
