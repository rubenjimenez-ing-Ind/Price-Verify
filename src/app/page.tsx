import Link from 'next/link';
import { AppNavigation } from '@/components/layout/AppNavigation';

export default function HomePage() {
  return (
    <>
      <AppNavigation />
      <main className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-slate-950 px-6 py-12 text-white">
        <div className="text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">PriceVerify</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Bienvenido a PriceVerify
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            Consulta productos, verifica precios y gestiona tu lista de compra.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Ver catálogo
            </Link>
            <Link
              href="/profile"
              className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Editar mi perfil
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
