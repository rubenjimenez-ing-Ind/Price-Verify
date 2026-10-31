import Link from 'next/link';
import { FormularioProducto } from '@/components/admin/FormularioProducto';

export default function NuevoProductoPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <Link href="/admin" className="font-semibold text-pv-primary underline-offset-2 hover:underline">
        Volver al catálogo
      </Link>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-pv-primary">Catálogo</p>
        <h1 className="mt-1 text-3xl font-bold">Nuevo producto</h1>
      </div>
      <FormularioProducto />
    </main>
  );
}
