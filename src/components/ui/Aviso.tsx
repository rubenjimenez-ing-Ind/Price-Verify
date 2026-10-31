import type { ReactNode } from 'react';

type TipoAviso = 'info' | 'exito' | 'advertencia' | 'error';

interface AvisoProps {
  tipo: TipoAviso;
  children: ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}

const clasesPorTipo: Record<TipoAviso, string> = {
  info: 'border-sky-300 bg-sky-50 text-sky-950',
  exito: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  advertencia: 'border-amber-400 bg-amber-50 text-amber-950',
  error: 'border-red-300 bg-red-50 text-red-950',
};

export function Aviso({
  tipo,
  children,
  className = '',
  role = tipo === 'error' ? 'alert' : 'status',
}: AvisoProps) {
  return (
    <div role={role} className={`rounded-xl border p-3 text-sm ${clasesPorTipo[tipo]} ${className}`}>
      {children}
    </div>
  );
}
