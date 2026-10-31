import { CANTIDAD_MAXIMA_ITEM } from '@/lib/config/priceverify';
import { ErrorDeNegocio } from './errores';

export interface ItemParaTotal {
  cantidad: number;
  precioUnitario: number;
}

export function validarCantidad(
  cantidad: number,
  opciones: { permitirCero?: boolean } = {},
): void {
  const minimo = opciones.permitirCero ? 0 : 1;
  if (
    !Number.isInteger(cantidad) ||
    cantidad < minimo ||
    cantidad > CANTIDAD_MAXIMA_ITEM
  ) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}

export function subtotal(cantidad: number, precioUnitario: number): number {
  validarCantidad(cantidad);
  if (!Number.isInteger(precioUnitario) || precioUnitario <= 0) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return cantidad * precioUnitario;
}

export function calcularTotal(items: ItemParaTotal[]): number {
  return items.reduce(
    (total, item) => total + subtotal(item.cantidad, item.precioUnitario),
    0,
  );
}

export function nuevaCantidadAlSumar(
  cantidadActual: number,
  cantidadAgregada: number,
): number {
  validarCantidad(cantidadActual, { permitirCero: true });
  validarCantidad(cantidadAgregada);
  const cantidad = cantidadActual + cantidadAgregada;
  validarCantidad(cantidad);
  return cantidad;
}
