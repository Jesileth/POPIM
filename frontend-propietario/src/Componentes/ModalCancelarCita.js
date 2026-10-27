"use client";

import { useEffect, useRef, useState } from "react";
import Mensaje from "@/Componentes/Mensaje";
import { IconX } from "@/Componentes/Iconos";
import { formatearFecha, formatearHora } from "@/lib/formato";

const MAX_MOTIVO = 255; // citas.motivo_cancelacion VARCHAR(255)

export default function ModalCancelarCita({ cita, onCerrar, onConfirmar }) {
  const dialogo = useRef(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, []);

  async function confirmar(evento) {
    evento.preventDefault();
    const texto = motivo.trim();
    if (texto.length < 5) {
      setError("Cuéntanos por qué cancelas (mínimo 5 caracteres).");
      return;
    }
    setError("");
    setCargando(true);
    const respuesta = await onConfirmar(texto);
    setCargando(false);
    if (!respuesta.ok) setError(respuesta.error);
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-cancelar"
      onCancel={(evento) => {
        evento.preventDefault();
        onCerrar();
      }}
      onClick={(evento) => {
        if (evento.target === dialogo.current) onCerrar();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-popim-borde bg-white p-0 shadow-2xl backdrop:bg-popim-ink/40"
    >
      <form onSubmit={confirmar} noValidate className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="titulo-cancelar" className="text-lg font-bold text-popim-ink">
            Cancelar cita
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-popim-etiqueta hover:bg-popim-page hover:text-popim-ink"
          >
            <IconX size={18} />
          </button>
        </div>

        <p className="mt-2 text-sm text-popim-muted">
          {cita.mascota.nombre} · {formatearFecha(cita.fecha)} a las {formatearHora(cita.horaInicio)}.
          Al cancelar, el horario queda libre para otra persona.
        </p>

        <label htmlFor="motivo-cancelacion" className="mb-1.5 mt-4 block text-sm font-semibold text-popim-ink">
          Motivo de la cancelación
        </label>
        <textarea
          id="motivo-cancelacion"
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          maxLength={MAX_MOTIVO}
          rows={3}
          placeholder="Ej. Surgió un viaje y no podré asistir"
          className="w-full rounded-xl border border-popim-linea bg-popim-campo p-3 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15"
        />
        <p className="mt-1 text-right text-xs text-popim-etiqueta">
          {motivo.length}/{MAX_MOTIVO}
        </p>

        {error && (
          <div className="mt-2">
            <Mensaje tipo="error">{error}</Mensaje>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="h-11 rounded-xl border border-popim-linea px-5 text-sm font-semibold text-popim-texto transition hover:bg-popim-page"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? "Cancelando..." : "Cancelar cita"}
          </button>
        </div>
      </form>
    </dialog>
  );
}