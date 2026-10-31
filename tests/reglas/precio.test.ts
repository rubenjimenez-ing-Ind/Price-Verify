import { describe, expect, it } from 'vitest';
import { describirDiscrepancia, hayDiscrepancia } from '@/lib/reglas/precio';

describe('reglas de precio', () => {
  it('T-01: no alerta si los precios son iguales', () => {
    expect(hayDiscrepancia(4500, 4500)).toBe(false);
  });

  it('T-02: alerta ante una diferencia de un peso', () => {
    expect(hayDiscrepancia(4500, 4499)).toBe(true);
  });

  it('T-03: no alerta cuando no hay precio de etiqueta', () => {
    expect(hayDiscrepancia(4500, null)).toBe(false);
  });

  it('T-04: alerta si la etiqueta está por encima del precio actual', () => {
    expect(hayDiscrepancia(4500, 5000)).toBe(true);
  });

  it('T-05: describe el precio cobrado y el precio de etiqueta', () => {
    expect(describirDiscrepancia(4500, 5000)).toEqual({
      hay: true,
      precioCobrado: 4500,
      precioEtiqueta: 5000,
    });
  });
});
