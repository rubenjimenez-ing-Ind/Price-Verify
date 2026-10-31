import type { HTMLAttributes, ReactNode } from 'react';

interface TarjetaProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Tarjeta({ children, className = '', ...props }: TarjetaProps) {
  return (
    <section
      {...props}
      className={`rounded-2xl border border-pv-border bg-pv-surface p-4 shadow-sm sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}
