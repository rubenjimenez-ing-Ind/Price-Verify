import { ProductList } from '@/components/products/ProductList';
import { AppNavigation } from '@/components/layout/AppNavigation';
import { getProducts } from '@/modules/products/service';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <AppNavigation />
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold sm:text-4xl">Catálogo de productos</h1>
          </div>
          <ProductList products={products} />
        </div>
      </main>
    </>
  );
}
