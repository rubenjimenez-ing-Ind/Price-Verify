export type EstadoSesion = 'activa' | 'cerrada';

export interface FilaProducto {
  codigo: string;
  nombre: string;
  precioActual: number;
  fotoUrl: string | null;
}

export interface ProductoConAlerta {
  producto: FilaProducto & {
    descripcion: string | null;
  };
  alerta: {
    hay: boolean;
    precioCobrado: number;
    precioEtiqueta: number | null;
  };
}

export interface ItemCarrito {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  fotoUrl: string | null;
  precioActualVigente: number;
}

export interface EstadoCarrito {
  sesionId: string;
  items: ItemCarrito[];
  total: number;
  estado: EstadoSesion;
}

export interface ResultadoCarrito {
  carrito: EstadoCarrito;
  alerta?: {
    hay: boolean;
    precioCobrado: number;
    precioEtiqueta: number | null;
  };
}

export interface DatosProducto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioActual: number;
  precioEtiqueta: number | null;
}

export interface FilaProductoAdmin extends FilaProducto {
  id: string;
  descripcion: string | null;
  precioEtiqueta: number | null;
  activo: boolean;
  hayDiscrepancia: boolean;
}
