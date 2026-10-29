"use client";

import { useState } from "react";
import { IconDownload } from "@/Componentes/Iconos";

export default function BotonDescarga({
  children,
  onDescargar,
  icono: Icono = IconDownload,
  grande = false,
  disabled = false,
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    setError("");
    setCargando(true);
    try {
      const resultado = await onDescargar();
      if (resultado?.ok === false) setError(resultado.error);
    } catch {
      setError("No pudimos generar el archivo. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={descargar}
        disabled={cargando || disabled}
        aria-busy={cargando}
        className={`inline-flex items-center gap-2 rounded-xl border border-popim-primary/40 bg-white font-semibold text-popim-primary transition hover:bg-popim-info disabled:cursor-not-allowed disabled:opacity-60 ${
          grande ? "h-11 px-6 text-sm" : "h-9 px-3.5 text-xs"
        }`}
      >
        <Icono size={grande ? 16 : 14} />
        {cargando ? "Generando..." : children}
      </button>
      {error && (
        <span role="alert" className="mt-1 text-[11px] text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}