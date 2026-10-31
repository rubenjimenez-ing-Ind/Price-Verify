import { formatearPesos } from '@/lib/formato';
import { Aviso } from '@/components/ui/Aviso';

interface AlertaDiscrepanciaProps {
  precioEtiqueta: number;
  precioActual: number;
}

export function AlertaDiscrepancia({
  precioEtiqueta,
  precioActual,
}: AlertaDiscrepanciaProps) {
  return (
    <Aviso tipo="advertencia">
      El precio del estante ({formatearPesos(precioEtiqueta)}) no coincide con el
      precio vigente. Se cobrará {formatearPesos(precioActual)}.
    </Aviso>
  );
}
