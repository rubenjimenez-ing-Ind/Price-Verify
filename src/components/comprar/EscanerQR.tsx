'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { Tarjeta } from '@/components/ui/Tarjeta';

export function EscanerQR() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlesRef = useRef<IScannerControls | null>(null);
  const yaLeidoRef = useRef(false);
  const canceladoRef = useRef(false);
  const [iniciando, setIniciando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    canceladoRef.current = false;
    return () => {
      canceladoRef.current = true;
      controlesRef.current?.stop();
      controlesRef.current = null;
    };
  }, []);

  async function iniciarEscaneo(): Promise<void> {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      setError('Este navegador no tiene cámara disponible. Puedes buscar el código manualmente.');
      return;
    }

    setIniciando(true);
    yaLeidoRef.current = false;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const lector = new BrowserMultiFormatReader();
      const controles = await lector.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (resultado, _error, controlesActivos) => {
          if (!resultado || yaLeidoRef.current || canceladoRef.current) return;
          yaLeidoRef.current = true;
          controlesActivos.stop();
          controlesRef.current = null;
          setLeyendo(false);
          router.push(`/comprar?codigo=${encodeURIComponent(resultado.getText())}`);
        },
      );
      if (yaLeidoRef.current || canceladoRef.current) {
        controles.stop();
        return;
      }
      controlesRef.current = controles;
      setLeyendo(true);
    } catch {
      if (!canceladoRef.current) {
        setError('No se pudo acceder a la cámara. Revisa el permiso del navegador o busca el código manualmente.');
        setLeyendo(false);
      }
    } finally {
      if (!canceladoRef.current) setIniciando(false);
    }
  }

  function detenerEscaneo(): void {
    yaLeidoRef.current = true;
    controlesRef.current?.stop();
    controlesRef.current = null;
    setLeyendo(false);
  }

  return (
    <Tarjeta className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-pv-primary">Compra</p>
        <h1 className="mt-1 text-2xl font-bold">Escanear código</h1>
        <p className="mt-2 text-sm text-pv-text-soft">
          Permite el acceso a la cámara y apunta al código QR o de barras del producto.
        </p>
      </div>
      {error && <Aviso tipo="advertencia">{error}</Aviso>}
      <video
        ref={videoRef}
        className="max-h-[60vh] w-full rounded-xl bg-slate-950"
        muted
        playsInline
        aria-label="Vista de la cámara para escanear productos"
      />
      {leyendo && <p role="status" className="text-sm text-pv-text-soft">Buscando un código…</p>}
      <div className="flex flex-wrap gap-2">
        {!leyendo ? (
          <Boton onClick={iniciarEscaneo} cargando={iniciando}>
            Activar cámara
          </Boton>
        ) : (
          <Boton variante="secundario" onClick={detenerEscaneo}>
            Detener cámara
          </Boton>
        )}
        <Link
          href="/comprar"
          className="inline-flex min-h-11 items-center rounded-xl px-4 py-2 font-semibold text-pv-primary underline-offset-2 hover:underline"
        >
          Volver a búsqueda manual
        </Link>
      </div>
    </Tarjeta>
  );
}
