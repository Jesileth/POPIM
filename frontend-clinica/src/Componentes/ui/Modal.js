"use client";

import { useEffect, useRef } from "react";
import { IconX } from "@/Componentes/Iconos";

// Ventana flotante genérica (la misma técnica de ModalMotivo: la etiqueta <dialog> del navegador).
// <Modal titulo="Cita de Bella" onCerrar={cerrar} pie={<Boton>…</Boton>}>contenido</Modal>
export default function Modal({ titulo, onCerrar, pie, children }) {
  const dialogo = useRef(null);

  // showModal() la abre encima de todo y oscurece el fondo
  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-modal-generico"
      // Esc o clic en lo oscuro también cierran
      onCancel={(e) => { e.preventDefault(); onCerrar(); }}
      onClick={(e) => { if (e.target === dialogo.current) onCerrar(); }}
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-popim-linea bg-white p-0 shadow-2xl backdrop:bg-popim-ink/40"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="titulo-modal-generico" className="text-lg font-bold text-popim-ink">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1 text-popim-etiqueta hover:bg-popim-page hover:text-popim-ink">
            <IconX size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {pie && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{pie}</div>}
      </div>
    </dialog>
  );
}
