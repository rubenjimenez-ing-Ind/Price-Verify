import { ProductList } from '@/components/products/ProductList';
import { getProducts } from '@/modules/products/service';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">PriceVerify</p>
            <h1 className="mt-2 text-4xl font-bold">Catálogo de productos</h1>
          </div>
          <a
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Volver al inicio
          </a>
        </div>

        <ProductList products={products} />
      </div>
    </main>
  );
}
