import type { InputHTMLAttributes, ReactNode } from 'react';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
  ayuda?: ReactNode;
  className?: string;
}

export function Campo({ etiqueta, error, ayuda, id, className = '', ...props }: CampoProps) {
  const campoId = id ?? props.name;
  const mensajeId = error ? `${campoId}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={campoId} className="block text-sm font-semibold text-pv-text">
        {etiqueta}
      </label>
      <input
        {...props}
        id={campoId}
        aria-invalid={Boolean(error)}
        aria-describedby={mensajeId}
        className={`min-h-11 w-full rounded-xl border bg-white px-3 py-2 text-base text-pv-text outline-none transition placeholder:text-pv-text-soft focus:border-pv-primary focus:ring-2 focus:ring-pv-primary/20 ${error ? 'border-pv-danger' : 'border-pv-border'} ${className}`}
      />
      {ayuda && <div className="text-sm text-pv-text-soft">{ayuda}</div>}
      {error && <p id={mensajeId} className="text-sm font-medium text-pv-danger">{error}</p>}
    </div>
  );
}
