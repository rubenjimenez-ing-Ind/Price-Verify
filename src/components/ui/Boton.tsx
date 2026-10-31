import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
  children: ReactNode;
}

const clasesPorVariante: Record<Variante, string> = {
  primario: 'bg-pv-primary text-white hover:bg-emerald-800',
  secundario: 'border border-pv-border bg-white text-pv-text hover:bg-pv-primary-soft',
  peligro: 'bg-pv-danger text-white hover:bg-red-800',
  fantasma: 'text-pv-text-soft hover:bg-pv-primary-soft',
};

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  children,
  className = '',
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pv-primary disabled:cursor-not-allowed disabled:opacity-60 ${clasesPorVariante[variante]} ${className}`}
    >
      {cargando ? 'Procesando…' : children}
    </button>
  );
}
