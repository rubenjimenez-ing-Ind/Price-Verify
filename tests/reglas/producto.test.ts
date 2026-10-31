import { describe, expect, it } from 'vitest';
import { normalizarCodigo, normalizarTextoBusqueda, validarDatosProducto } from '@/lib/reglas/producto';
import { esperarCodigo } from './ayudas';

describe('reglas del producto', () => {
  it('T-16: normaliza texto sin acentos ni mayúsculas', () => {
    expect(normalizarTextoBusqueda('  ArRóz  ')).toBe('arroz');
  });

  it('T-17: recorta el código y conserva sus caracteres', () => {
    expect(normalizarCodigo(' 770123 ')).toBe('770123');
  });

  it('T-18: rechaza un precio actual igual a cero', () => {
    esperarCodigo(
      () => validarDatosProducto({ codigo: '770', nombre: 'Arroz', precioActual: 0, precioEtiqueta: null }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-19: rechaza un precio de etiqueta negativo', () => {
    esperarCodigo(
      () => validarDatosProducto({ codigo: '770', nombre: 'Arroz', precioActual: 4500, precioEtiqueta: -1 }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-20: rechaza un nombre vacío', () => {
    esperarCodigo(
      () => validarDatosProducto({ codigo: '770', nombre: ' ', precioActual: 4500, precioEtiqueta: null }),
      'DATOS_INVALIDOS',
    );
  });

  it('T-21: acepta un producto sin precio de etiqueta', () => {
    expect(() =>
      validarDatosProducto({ codigo: '770', nombre: 'Arroz', precioActual: 4500, precioEtiqueta: null }),
    ).not.toThrow();
  });

  it('T-22: acepta precios enteros válidos', () => {
    expect(() =>
      validarDatosProducto({ codigo: '770', nombre: 'Arroz', precioActual: 4500, precioEtiqueta: 5000 }),
    ).not.toThrow();
  });
});
