import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">404</p>
        <h1 className="mt-4 text-4xl font-bold">Página no encontrada</h1>
        <p className="mt-4 text-slate-300">
          La ruta que buscas no existe en PriceVerify.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
