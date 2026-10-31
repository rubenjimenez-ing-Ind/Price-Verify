import { TablaProductos } from '@/components/admin/TablaProductos';
import { listarProductosAdmin } from '@/lib/dataService';

interface AdminPageProps {
  searchParams?: {
    busqueda?: string;
    incluirInactivos?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const busqueda = searchParams?.busqueda ?? '';
  const incluirInactivos = searchParams?.incluirInactivos === 'true';
  const productos = await listarProductosAdmin({ busqueda, incluirInactivos });

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-pv-primary">Catálogo</p>
        <h1 className="mt-1 text-3xl font-bold">Productos</h1>
      </div>
      <TablaProductos
        productos={productos}
        busqueda={busqueda}
        incluirInactivos={incluirInactivos}
      />
    </main>
  );
}
