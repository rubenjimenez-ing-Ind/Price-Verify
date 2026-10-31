import { writeFile } from 'fs/promises';
import path from 'path';

export interface RegisteredUserForMarkdown {
  email: string;
  createdAt: string | null;
  emailConfirmedAt: string | null;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/[\r\n]/g, ' ');
}

export async function updateRegisteredUsersMarkdown(
  users: RegisteredUserForMarkdown[],
): Promise<void> {
  const rows = users
    .map((user) => {
      const email = escapeTableCell(user.email || '(sin correo)');
      const createdAt = user.createdAt ? user.createdAt.slice(0, 10) : 'No disponible';
      const confirmed = user.emailConfirmedAt ? 'Sí' : 'Pendiente';
      return `| ${email} | ${createdAt} | ${confirmed} | No disponible |`;
    })
    .join('\n');
  const updatedAt = new Date().toISOString();
  const contents = `# Usuarios registrados en PriceVerify

> Listado actualizado automáticamente desde Supabase Auth: ${updatedAt}.
> Este archivo contiene datos básicos de cuenta; nunca incluye contraseñas.

| Usuario (correo) | Fecha de registro | Correo confirmado | Clave |
| --- | --- | --- | --- |
${rows || '| No hay usuarios registrados | — | — | No disponible |'}

## Sobre las claves

Supabase Auth no permite recuperar ni consultar las contraseñas. Por seguridad,
este documento nunca almacena claves en texto plano. Si una persona olvidó su
contraseña, usa el flujo de recuperación de Supabase Auth o restablécela desde
el panel de administración y entrégala por un canal seguro.

El servidor local actualiza este archivo al consultar o crear cuentas desde el
menú de administración. En despliegues con sistema de archivos de solo lectura,
la actualización automática puede no estar disponible.
`;

  await writeFile(path.resolve(process.cwd(), 'usuarios-registrados.md'), contents, 'utf8');
}
