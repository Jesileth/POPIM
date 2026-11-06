

//
import Link from "next/link";
import { IconPlus } from "@/Componentes/Iconos";
import { ESTADOS_CITA } from "@/lib/estados";

const CAJA = "flex h-full min-h-17.5 w-full flex-col rounded-xl px-2.5 py-2 text-left";

export default function CeldaAgenda({ celda, fecha, puedeAgendar }) {
  // ---------- Cita ----------
  if (celda.tipo === "cita") {
    const { cita } = celda;
    const estado = ESTADOS_CITA[cita.estadoId] ?? ESTADOS_CITA[502];

    const contenido = (
      <>
        <span className="flex items-start justify-between gap-1.5">
          <span className="text-sm font-bold">{cita.mascota}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wide">
            {cita.esEmergencia ? "Emergencia" : estado.nombre}
          </span>
        </span>
        <span className="text-xs leading-snug">{cita.motivo}</span>
        <span className="mt-auto text-xs opacity-80">{cita.propietario}</span>
      </>
    );

    // Las emergencias solo se ven: la recepcionista no las modifica
    if (cita.esEmergencia) {
      return (
        <div
          className={`${CAJA} border-2 border-estado-emergencia ${estado.clases}`}
          title="Emergencia: solo lectura"
        >
          {contenido}
        </div>
      );
    }

    return (
      <Link
        href={`/citas/${cita.id}`}
        className={`${CAJA} border border-l-4 transition hover:brightness-95 ${estado.clases}`}
      >
        {contenido}
      </Link>
    );
  }

  // ---------- Bloque libre ----------
  if (celda.tipo === "libre") {
    if (!puedeAgendar) {
      return (
        <div className={`${CAJA} items-center justify-center border border-dashed border-popim-linea text-xs text-popim-etiqueta`}>
          Libre
        </div>
      );
    }
    // Lleva al formulario con el veterinario, la fecha y la hora ya elegidos
    const destino = `/agenda/nueva-cita?veterinario=${celda.personalId}&fecha=${fecha}&hora=${celda.hora}`;
    return (
      <Link
        href={destino}
        aria-label={`Agendar a las ${celda.hora}`}
        className={`${CAJA} flex-row items-center justify-center gap-1.5 border border-dashed border-popim-linea text-[13px] font-semibold text-popim-primary transition hover:border-popim-primary hover:bg-popim-info`}
      >
        <IconPlus size={14} />
        Agendar
      </Link>
    );
  }

  // ---------- Bloqueo ----------
  if (celda.tipo === "bloqueo") {
    return (
      <div
        className={`${CAJA} border border-[#a9b6c6] text-xs font-semibold text-popim-texto`}
        style={{
          // Rayas diagonales (no hay clase de Tailwind para esto)
          background: "repeating-linear-gradient(45deg, #e4e9f0 0 6px, #f4f6f9 6px 12px)",
        }}
      >
        {celda.motivo ?? "No disponible"}
      </div>
    );
  }

  // ---------- Ya pasó ----------
  if (celda.tipo === "pasado") {
    return <div className={`${CAJA} bg-[#f3f5f8]`} aria-label="Hora pasada" />;
  }

  // ---------- Fuera de horario (incluye el almuerzo) ----------
  return (
    <div className={`${CAJA} items-center justify-center bg-[#f3f5f8] text-xs text-popim-etiqueta`}>
      Fuera de horario
    </div>
  );
}