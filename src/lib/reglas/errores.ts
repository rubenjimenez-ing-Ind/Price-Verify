export type CodigoError =
  | 'DATOS_INVALIDOS'
  | 'NO_AUTORIZADO'
  | 'PRODUCTO_NO_ENCONTRADO'
  | 'CODIGO_DUPLICADO'
  | 'ITEM_NO_ENCONTRADO'
  | 'SESION_CERRADA'
  | 'ERROR_INTERNO';

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: 'Revise los datos ingresados.',
  NO_AUTORIZADO: 'Debe iniciar sesión como administrador.',
  PRODUCTO_NO_ENCONTRADO: 'No encontramos un producto con ese código o nombre.',
  CODIGO_DUPLICADO: 'Ya existe un producto con ese código.',
  ITEM_NO_ENCONTRADO: 'Ese producto no está en el carrito.',
  SESION_CERRADA: 'La sesión del carrito ya se cerró. Inicie una nueva.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intente de nuevo.',
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  PRODUCTO_NO_ENCONTRADO: 404,
  CODIGO_DUPLICADO: 409,
  ITEM_NO_ENCONTRADO: 404,
  SESION_CERRADA: 409,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  constructor(
    public codigo: CodigoError,
    mensaje?: string,
    public detalles?: unknown,
  ) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = 'ErrorDeNegocio';
  }
}
