import { z } from 'zod';

const esquemaCodigo = z.string().trim().min(1).max(64);
const esquemaCantidadAgregar = z.number().int().min(1).max(999);

export const esquemaBusqueda = z.object({
  q: z.string().trim().min(1).max(80),
});

export const esquemaCodigoConsulta = z.object({
  codigo: esquemaCodigo,
});

export const esquemaDeviceId = z.string().uuid();

export const esquemaAgregar = z.object({
  deviceId: esquemaDeviceId,
  codigo: esquemaCodigo,
  cantidad: esquemaCantidadAgregar,
});

export const esquemaAjustar = z.object({
  deviceId: esquemaDeviceId,
  codigo: esquemaCodigo,
  cantidad: z.number().int().min(0).max(999),
});

export const esquemaEliminar = z.object({
  deviceId: esquemaDeviceId,
  codigo: esquemaCodigo,
});

export const esquemaCerrar = z.object({
  deviceId: esquemaDeviceId,
});

export const esquemaProducto = z.object({
  codigo: esquemaCodigo,
  nombre: z.string().trim().min(2).max(160),
  descripcion: z.string().trim().max(2000).optional(),
  precioActual: z.number().int().min(1),
  precioEtiqueta: z.number().int().min(1).nullable().optional(),
});

export type DatosBusqueda = z.infer<typeof esquemaBusqueda>;
export type DatosAgregar = z.infer<typeof esquemaAgregar>;
export type DatosAjustar = z.infer<typeof esquemaAjustar>;
export type DatosEliminar = z.infer<typeof esquemaEliminar>;
export type DatosProductoValidado = z.infer<typeof esquemaProducto>;
