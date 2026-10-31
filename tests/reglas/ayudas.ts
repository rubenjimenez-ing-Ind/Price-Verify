import { expect } from 'vitest';
import { ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';

export function esperarCodigo(fn: () => unknown, codigo: CodigoError): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorDeNegocio);
    if (error instanceof ErrorDeNegocio) {
      expect(error.codigo).toBe(codigo);
    }
    return;
  }

  throw new Error(`Se esperaba el error de negocio ${codigo}.`);
}
