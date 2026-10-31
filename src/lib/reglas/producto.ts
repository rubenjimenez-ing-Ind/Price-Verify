import { ErrorDeNegocio } from './errores';

export interface DatosProductoRegla {
  codigo: string;
  nombre: string;
  precioActual: number;
  precioEtiqueta: number | null;
}

export function normalizarCodigo(codigo: string): string {
  return codigo.trim();
}

export function normalizarTextoBusqueda(texto: string): string {
  return texto
    .trim()
    .toLocaleLowerCase('es-CO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function validarDatosProducto(datos: DatosProductoRegla): void {
  if (
    normalizarCodigo(datos.codigo).length === 0 ||
    datos.nombre.trim().length < 2 ||
    !Number.isInteger(datos.precioActual) ||
    datos.precioActual <= 0 ||
    (datos.precioEtiqueta !== null &&
      (!Number.isInteger(datos.precioEtiqueta) || datos.precioEtiqueta <= 0))
  ) {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
}
