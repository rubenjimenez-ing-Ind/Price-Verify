import { describe, expect, it } from 'vitest';
import { calcularTotal, nuevaCantidadAlSumar, subtotal, validarCantidad } from '@/lib/reglas/carrito';
import { esperarCodigo } from './ayudas';

describe('reglas del carrito', () => {
  it('T-06: calcula el subtotal', () => {
    expect(subtotal(3, 1500)).toBe(4500);
  });

  it('T-07: calcula el total desde los ítems', () => {
    expect(
      calcularTotal([
        { cantidad: 2, precioUnitario: 1000 },
        { cantidad: 1, precioUnitario: 4500 },
      ]),
    ).toBe(6500);
  });

  it('T-08: el total de una lista vacía es cero', () => {
    expect(calcularTotal([])).toBe(0);
  });

  it('T-09: al sumar se acumula la cantidad', () => {
    expect(nuevaCantidadAlSumar(2, 3)).toBe(5);
  });

  it('T-10: rechaza cantidad cero al agregar', () => {
    esperarCodigo(() => validarCantidad(0), 'DATOS_INVALIDOS');
  });

  it('T-11: permite cantidad cero al ajustar', () => {
    expect(() => validarCantidad(0, { permitirCero: true })).not.toThrow();
  });

  it('T-12: rechaza una cantidad negativa', () => {
    esperarCodigo(() => validarCantidad(-1), 'DATOS_INVALIDOS');
  });

  it('T-13: rechaza una cantidad fraccionaria', () => {
    esperarCodigo(() => validarCantidad(2.5), 'DATOS_INVALIDOS');
  });

  it('T-14: rechaza cantidades por encima del máximo', () => {
    esperarCodigo(() => validarCantidad(1000), 'DATOS_INVALIDOS');
  });

  it('T-15: acepta una unidad', () => {
    expect(() => validarCantidad(1)).not.toThrow();
  });
});
