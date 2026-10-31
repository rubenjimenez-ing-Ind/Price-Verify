const FORMATEADOR_PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatearPesos(monto: number): string {
  return FORMATEADOR_PESOS.format(monto);
}
