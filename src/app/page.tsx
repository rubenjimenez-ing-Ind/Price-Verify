import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">PriceVerify</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Bienvenido a PriceVerify
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-300">
          Esta es la base inicial del proyecto para consultar, comparar y gestionar precios.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/products"
            className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Ver catálogo
          </Link>
          <Link
            href="/api/health"
            className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Revisar salud
          </Link>
        </div>
      </div>
    </main>
  );
}
