
//

"use client";

import { useEffect, useState } from "react";
import { borrarAviso, leerAviso } from "@/lib/aviso";

const DURACION_MS = 5000;

export default function AvisoFlotante() {
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const aviso = leerAviso();
    if (!aviso) return;
    setTexto(aviso);

    const reloj = setTimeout(() => {
      setTexto("");
      borrarAviso();
    }, DURACION_MS);
    return () => clearTimeout(reloj);
  }, []);

  function cerrar() {
    setTexto("");
    borrarAviso();
  }

  if (!texto) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 flex max-w-sm animate-aparecer items-start gap-3 rounded-2xl border border-white/40 bg-teal-500/80 px-4 py-3 text-white shadow-lg backdrop-blur-md motion-reduce:animate-none"
    >
      <span aria-hidden="true" className="mt-0.5 text-lg leading-none">✓</span>
      <p className="text-sm font-medium leading-snug">{texto}</p>
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar aviso"
        className="ml-1 text-lg leading-none text-white/80 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}