"use client";

import { useEffect, useRef, useState } from "react";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import { IconX } from "@/Componentes/Iconos";

const MAX = 255; // Citas.motivo_cancelacion VARCHAR(255)

// onConfirmar(motivo) debe devolver { ok, error } (lo que devuelve un servicio)
export default function ModalMotivo({ titulo, descripcion, etiqueta = "Motivo", textoConfirmar = "Confirmar", placeholder, onCerrar, onConfirmar }) {
  const dialogo = useRef(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, []);

  async function enviar(e) {
    e.preventDefault();
    if (motivo.trim().length < 5) return setError("Escribe el motivo (mínimo 5 caracteres).");
    setError("");
    setCargando(true);
    const r = await onConfirmar(motivo.trim());
    setCargando(false);
    if (!r.ok) setError(r.error);
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-modal"
      onCancel={(e) => { e.preventDefault(); onCerrar(); }}
      onClick={(e) => { if (e.target === dialogo.current) onCerrar(); }}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-popim-linea bg-white p-0 shadow-2xl backdrop:bg-popim-ink/40"
    >
      <form onSubmit={enviar} noValidate className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="titulo-modal" className="text-lg font-bold text-popim-ink">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1 text-popim-etiqueta hover:bg-popim-page hover:text-popim-ink">
            <IconX size={18} />
          </button>
        </div>
        {descripcion && <p className="mt-2 text-sm text-popim-muted">{descripcion}</p>}

        <label htmlFor="motivo-modal" className="mb-1.5 mt-4 block text-[13px] font-semibold text-popim-ink">{etiqueta} *</label>
        <textarea
          id="motivo-modal" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={MAX} rows={3} placeholder={placeholder}
          className="w-full rounded-xl border border-popim-linea bg-white p-3 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15"
        />
        <p className="mt-1 text-right text-xs text-popim-etiqueta">{motivo.length}/{MAX}</p>
        {error && <div className="mt-2"><Aviso tipo="error">{error}</Aviso></div>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="neutro" onClick={onCerrar}>Volver</Boton>
          <button type="submit" disabled={cargando} className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {cargando ? "Procesando..." : textoConfirmar}
          </button>
        </div>
      </form>
    </dialog>
  );
}
