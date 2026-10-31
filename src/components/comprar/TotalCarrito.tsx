import { formatearPesos } from '@/lib/formato';

interface TotalCarritoProps {
  total: number;
}

export function TotalCarrito({ total }: TotalCarritoProps) {
  return (
    <div className="sticky bottom-2 z-20 rounded-2xl border border-pv-primary/20 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-pv-text-soft">Total estimado</p>
      <p className="text-3xl font-bold tabular-nums text-pv-total" aria-live="polite">
        {formatearPesos(total)}
      </p>
    </div>
  );
}
