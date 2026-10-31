export interface RespuestaApi<T> {
  ok: boolean;
  datos?: T;
  error?: {
    codigo: string;
    mensaje: string;
    detalles: unknown;
  };
}

export async function solicitarApi<T>(
  url: string,
  opciones: RequestInit = {},
): Promise<T> {
  const respuesta = await fetch(url, {
    ...opciones,
    cache: 'no-store',
  });
  let resultado: RespuestaApi<T>;
  try {
    resultado = await respuesta.json();
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida.');
  }

  if (!respuesta.ok || !resultado.ok) {
    throw new Error(resultado.error?.mensaje ?? 'No se pudo completar la solicitud.');
  }
  if (resultado.datos === undefined) {
    throw new Error('La respuesta del servidor no contiene datos.');
  }
  return resultado.datos;
}
