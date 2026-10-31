import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FormularioProducto } from '@/components/admin/FormularioProducto';
import { listarProductosAdmin } from '@/lib/dataService';

interface EditarProductoPageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditarProductoPage({ params }: EditarProductoPageProps) {
  const { id } = await params;
  const productos = await listarProductosAdmin({ incluirInactivos: true });
  const producto = productos.find((actual) => actual.id === id);
  if (!producto) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <Link href="/admin" className="font-semibold text-pv-primary underline-offset-2 hover:underline">
        Volver al catálogo
      </Link>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-pv-primary">Catálogo</p>
        <h1 className="mt-1 text-3xl font-bold">Editar producto</h1>
      </div>
      <FormularioProducto producto={producto} />
    </main>
  );
}
