// Un cuadrito de "Mi agenda" del veterinario (vista semana o día).
// Es parecido a CeldaAgenda (la de recepción), pero aquí no se agenda nada:
// el bloque libre solo dice "Libre" y la cita se abre en una ventana con su detalle.
import { ESTADOS_CITA } from "@/lib/estados";

const CAJA = "flex h-full min-h-14 w-full flex-col rounded-lg px-2 py-1.5 text-left";

// En la agenda del veterinario la 501 se lee "Por confirmar" (así sale en el diseño)
export const NOMBRE_ESTADO_VET = { 501: "Por confirmar" };
export const nombreEstado = (id) => NOMBRE_ESTADO_VET[id] ?? ESTADOS_CITA[id]?.nombre ?? "";

// Rayas diagonales para almuerzo, permisos y cirugías (igual que en CeldaAgenda)
const RAYAS = { background: "repeating-linear-gradient(45deg, #e4e9f0 0 6px, #f4f6f9 6px 12px)" };

export default function CeldaMiAgenda({ celda, esHoy, onAbrir }) {
  // ---------- Cita ----------
  if (celda.tipo === "cita") {
    const { cita } = celda;
    const colores = cita.esEmergencia
      ? "border-estado-emergencia bg-estado-cancelada text-estado-cancelada-texto"
      : ESTADOS_CITA[cita.estadoId]?.clases ?? ESTADOS_CITA[502].clases;

    return (
      <button
        type="button"
        onClick={() => onAbrir(cita)}
        aria-label={`${cita.mascota.nombre}, ${cita.horaInicio.slice(0, 5)}, ${cita.esEmergencia ? "emergencia" : nombreEstado(cita.estadoId)}`}
        className={`${CAJA} border transition hover:brightness-95 ${colores}`}
      >
        <span className="flex items-start justify-between gap-1.5">
          <span className="truncate text-[13px] font-bold">{cita.mascota.nombre}</span>
          <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wide">
            {cita.esEmergencia ? "Emergencia" : nombreEstado(cita.estadoId)}
          </span>
        </span>
        <span className="line-clamp-2 text-[11px] leading-snug">{cita.motivo}</span>
      </button>
    );
  }

  // ---------- Bloqueo (almuerzo, permiso, cirugía) ----------
  if (celda.tipo === "bloqueo") {
    return (
      <div className={`${CAJA} border border-[#c5cfdb] text-[11px] font-semibold text-popim-texto`} style={RAYAS}>
        {celda.motivo ?? "No disponible"}
      </div>
    );
  }

  // ---------- Libre ----------
  if (celda.tipo === "libre" || celda.tipo === "pasado") {
    return (
      <div
        className={`${CAJA} items-center justify-center border border-dashed border-popim-linea text-[11px] text-popim-etiqueta ${
          esHoy ? "bg-popim-info/50" : ""
        }`}
      >
        Libre
      </div>
    );
  }

  // ---------- Fuera de horario (ej.: sábado en la tarde) ----------
  return <div className={`${CAJA} bg-[#f0f3f7]`} aria-label="Fuera de horario" />;
}
