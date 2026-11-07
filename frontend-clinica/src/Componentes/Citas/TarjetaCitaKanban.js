import Link from "next/link";
import Avatar from "@/Componentes/ui/Avatar";
import Boton from "@/Componentes/ui/Boton";

// Tarjeta de "Recepción de hoy". Las acciones dependen del estado de la cita.
export default function TarjetaCitaKanban({ cita, onConfirmar, onCancelar }) {
  const { estado, esEmergencia: e } = cita;
  return (
    <article className={`rounded-xl bg-white p-4 ${e ? "border-2 border-red-700" : "border border-popim-linea"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold text-popim-ink">{cita.horaInicio}</span>
        {e ? (
          <span className="rounded-md bg-red-700 px-2 py-0.5 text-[10px] font-bold text-white">EMERGENCIA</span>
        ) : (
          <Link href={`/citas/${cita.id}`} className="text-xs font-semibold text-popim-primary hover:underline">
            Ver detalle →
          </Link>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <Avatar texto={cita.mascota.nombre[0]} tamano="sm" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-popim-ink">{cita.mascota.nombre}</p>
          <p className="truncate text-xs text-popim-muted">{cita.mascota.especie} · {cita.mascota.raza}</p>
        </div>
      </div>

      <p className="mt-3 text-[13px] text-popim-texto">{cita.propietario.nombreCompleto} · {cita.veterinario.nombreCompleto}</p>
      {["SOLICITADA", "CONFIRMADA"].includes(estado) && <p className="text-[13px] font-bold text-popim-ink">{cita.motivoConsulta}</p>}

      {estado === "SOLICITADA" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Boton variante="neutro" tamano="sm" onClick={() => onCancelar(cita)}>Cancelar</Boton>
          <Boton tamano="sm" onClick={() => onConfirmar(cita)}>Confirmar</Boton>
        </div>
      )}
      {estado === "CONFIRMADA" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Boton variante="neutro" tamano="sm" onClick={() => onCancelar(cita)}>Cancelar</Boton>
          <Boton variante="secundario" tamano="sm" href={`/citas/reprogramacion?cita=${cita.id}`}>Reprogramar</Boton>
        </div>
      )}
      {estado === "ATENCION" && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800">
          En consulta desde las {cita.enConsultaDesde}
        </p>
      )}
      {estado === "COMPLETADA" && (
        <Boton variante="secundario" tamano="sm" href="/agenda" className="mt-3 w-full">Agendar cita de control</Boton>
      )}
    </article>
  );
}
