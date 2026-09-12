import type { ProductRecord } from '@/modules/products/types';

export function ProductList({ products }: { products: ProductRecord[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] border-b border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">
        <span>Producto</span>
        <span>Categoría</span>
        <span>Precio</span>
        <span>Stock</span>
      </div>

      {products.length === 0 ? (
        <div className="px-4 py-10 text-center text-slate-400">No hay productos registrados.</div>
      ) : (
        products.map((product) => (
          <div
            key={product.id}
            className="grid grid-cols-[1.5fr_1fr_1fr_0.7fr] items-center border-b border-slate-800 px-4 py-3 text-sm text-slate-200 last:border-b-0"
          >
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-slate-400">{product.brand}</p>
            </div>
            <span className="capitalize text-slate-300">{product.category}</span>
            <span className="font-semibold text-cyan-300">${product.price.toFixed(2)}</span>
            <span className={product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}>{product.stock}</span>
          </div>
        ))
      )}
    </div>
  );
}
