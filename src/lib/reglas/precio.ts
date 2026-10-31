export interface DescripcionDiscrepancia {
  hay: boolean;
  precioCobrado: number;
  precioEtiqueta: number | null;
}

export function hayDiscrepancia(
  precioActual: number,
  precioEtiqueta: number | null,
): boolean {
  return precioEtiqueta !== null && precioActual !== precioEtiqueta;
}

export function describirDiscrepancia(
  precioActual: number,
  precioEtiqueta: number | null,
): DescripcionDiscrepancia {
  return {
    hay: hayDiscrepancia(precioActual, precioEtiqueta),
    precioCobrado: precioActual,
    precioEtiqueta,
  };
}
