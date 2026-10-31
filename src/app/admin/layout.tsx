import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { obtenerUsuario } from '@/lib/auth/sesion';
import { NavegacionAdmin } from '@/components/admin/NavegacionAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect('/login');

  return (
    <div className="min-h-screen bg-pv-background text-pv-text">
      <NavegacionAdmin correo={usuario.email} />
      {children}
    </div>
  );
}
