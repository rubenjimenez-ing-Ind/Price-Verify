import Link from 'next/link';
import type { ReactNode } from 'react';
import { AccionesNavegacionCompra } from '@/components/comprar/AccionesNavegacionCompra';

export default function ComprarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-pv-background text-pv-text">
      <header className="bg-pv-primary text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/comprar" className="text-xl font-bold focus-visible:outline focus-visible:outline-2">
            PriceVerify
          </Link>
          <nav aria-label="Navegación principal" className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold">
            <Link href="/comprar#carrito" className="rounded-lg px-2 py-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2">
              Carrito
            </Link>
            <Link href="/login" className="rounded-lg px-2 py-2 text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2">
              Administración
            </Link>
            <AccionesNavegacionCompra />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
