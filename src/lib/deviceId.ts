const CLAVE_DEVICE_ID = 'pv_device_id';

export function getOrCreateDeviceId(): string {
  const existente = localStorage.getItem(CLAVE_DEVICE_ID);
  if (existente && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existente)) {
    return existente;
  }

  const nuevo = crypto.randomUUID();
  localStorage.setItem(CLAVE_DEVICE_ID, nuevo);
  return nuevo;
}
