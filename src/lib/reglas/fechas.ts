import { ErrorDeNegocio } from './errores';

export function ahoraISO(reloj: Date = new Date()): string {
  return reloj.toISOString();
}

export function minutosDesde(fechaISO: string, reloj: Date = new Date()): number {
  const fecha = Date.parse(fechaISO);
  if (!Number.isFinite(fecha) || !Number.isFinite(reloj.getTime())) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }

  return (reloj.getTime() - fecha) / 60_000;
}
