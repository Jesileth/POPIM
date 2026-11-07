"use client";

// Ventana que se abre al tocar una cita en "Mi agenda" del veterinario.
// Muestra lo básico de la cita y el botón que corresponde (Iniciar, Atender ahora, Continuar…).
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Modal from "@/Componentes/ui/Modal";
import { nombreEstado } from "@/Componentes/agenda/CeldaMiAgenda";
import { accionDeCita } from "@/lib/atencion";
import { ESTADOS_CITA } from "@/lib/estados";
import { fechaLarga } from "@/lib/fechas";
import { useIniciarConsulta } from "@/lib/useIniciarConsulta";

export default function DetalleCitaVet({ cita, onCerrar }) {
  const { iniciar, iniciando, error } = useIniciarConsulta();
  const accion = accionDeCita(cita);
  const estado = ESTADOS_CITA[cita.estadoId];

  // El botón de abajo cambia según la cita
  let boton = null;
  if (accion?.tipo === "enlace") boton = <Boton href={accion.href}>{accion.texto}</Boton>;
  if (accion?.tipo === "iniciar") {
    boton = (
      <Boton
        variante={cita.esEmergencia ? "urgente" : "primario"}
        disabled={iniciando === cita.id}
        onClick={() => iniciar(cita.id)}
      >
        {iniciando === cita.id ? "Abriendo…" : accion.texto}
      </Boton>
    );
  }

  const fila = (titulo, valor) => (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-popim-muted">{titulo}</dt>
      <dd className="text-right font-semibold text-popim-ink">{valor}</dd>
    </div>
  );

  return (
    <Modal
      titulo={`Cita de ${cita.mascota.nombre}`}
      onCerrar={onCerrar}
      pie={<><Boton variante="neutro" onClick={onCerrar}>Cerrar</Boton>{boton}</>}
    >
      <div className="flex items-center gap-3">
        <Avatar texto={cita.mascota.nombre[0]} tono={cita.esEmergencia ? "emergencia" : "claro"} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold text-popim-ink">
            {cita.mascota.nombre}
            <span className="rounded-md bg-popim-ink px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
              {cita.mascota.codigoUnico}
            </span>
          </p>
          <p className="text-[13px] text-popim-texto">
            {[cita.mascota.especie, cita.mascota.raza, cita.mascota.edad].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-popim-linea">
        {fila("Fecha", `${fechaLarga(cita.fecha)} · ${cita.horaInicio.slice(0, 5)}`)}
        {fila(
          "Estado",
          cita.esEmergencia ? (
            <span className="rounded-full bg-estado-cancelada px-2.5 py-0.5 text-xs text-estado-cancelada-texto">Emergencia</span>
          ) : (
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${estado?.clases ?? ""}`}>{nombreEstado(cita.estadoId)}</span>
          ),
        )}
        {fila("Motivo", cita.motivo)}
        {fila("Propietario", `${cita.propietario.nombreCompleto} · ${cita.propietario.telefono}`)}
      </dl>

      {accion?.tipo === "nota" && <div className="mt-4"><Aviso>{accion.texto}</Aviso></div>}
      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}
    </Modal>
  );
}
