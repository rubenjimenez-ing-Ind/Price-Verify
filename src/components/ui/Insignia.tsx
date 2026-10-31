import type { ReactNode } from 'react';

type Tono = 'neutro' | 'primario' | 'alerta' | 'peligro' | 'inactivo';

interface InsigniaProps {
  tono?: Tono;
  children: ReactNode;
}

const clasesPorTono: Record<Tono, string> = {
  neutro: 'bg-slate-100 text-slate-700',
  primario: 'bg-pv-primary-soft text-pv-primary',
  alerta: 'bg-amber-100 text-amber-900',
  peligro: 'bg-red-100 text-red-900',
  inactivo: 'bg-slate-200 text-pv-inactive',
};

export function Insignia({ tono = 'neutro', children }: InsigniaProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${clasesPorTono[tono]}`}>
      {children}
    </span>
  );
}
