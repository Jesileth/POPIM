
//

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CuadriculaAgenda from "@/Componentes/agenda/CuadriculaAgenda";
import Mensaje from "@/Componentes/Mensaje";
import { IconChevronRight } from "@/Componentes/Iconos";
import { useSesion } from "@/contexto/SesionContext";
import { ESTADOS_CITA } from "@/lib/estados";
import { fechaLarga, hoyISO, sumarDias } from "@/lib/fechas";
import { tienePermiso } from "@/lib/permisos";
import { obtenerAgenda } from "@/servicios/agenda";

// Botón cuadrado de las flechas
const BOTON_ICONO =
  "flex h-10 w-10 items-center justify-center rounded-xl border border-popim-linea bg-white text-popim-ink transition hover:border-popim-primary";

export default function AgendaPage() {
  const { sesion } = useSesion();
  const [fecha, setFecha] = useState(hoyISO);
  const [datos, setDatos] = useState({ cargando: true, error: "", agenda: null });

  // Cada vez que cambia la fecha, pedimos la agenda de ese día
  useEffect(() => {
    let vigente = true; // si cambias de fecha muy rápido, ignoramos la respuesta vieja

    obtenerAgenda(fecha).then((respuesta) => {
      if (!vigente) return;
      setDatos(
        respuesta.ok
          ? { cargando: false, error: "", agenda: respuesta.datos }
          : { cargando: false, error: respuesta.error, agenda: null },
      );
    });

    return () => {
      vigente = false;
    };
  }, [fecha]);

  // Todos los cambios de fecha pasan por aquí: así marcamos "cargando" en el mismo momento
  function cambiarFecha(nueva) {
    if (!nueva || nueva === fecha) return;
    setDatos((actual) => ({ ...actual, cargando: true, error: "" }));
    setFecha(nueva);
  }

  const puedeAgendar = tienePermiso(sesion, "CITAS_AGENDAR");
  const puedeEmergencia = tienePermiso(sesion, "CITAS_EMERGENCIA_REGISTRAR");
  const esHoy = fecha === hoyISO();

  return (
    <div className="flex flex-col gap-5">
      {/* ENCABEZADO */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-popim-ink">Agenda</h1>
          <p className="mt-1 text-sm text-popim-texto">
            Toca un bloque libre para agendar una cita, o una cita para ver su detalle.
          </p>
        </div>
        {puedeEmergencia && (
          <Link
            href="/agenda/nueva-cita?tipo=emergencia"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-estado-emergencia bg-white px-4.5 text-[15px] font-bold text-estado-emergencia transition hover:bg-estado-cancelada"
          >
            Emergencia
          </Link>
        )}
      </div>

      {/* BARRA DE FECHA + LEYENDA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-popim-linea bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarFecha(sumarDias(fecha, -1))}
            aria-label="Día anterior"
            className={BOTON_ICONO}
          >
            <IconChevronRight size={16} className="rotate-180" />
          </button>
          <p className="min-w-52 px-1 text-center font-bold text-popim-ink" aria-live="polite">
            {fechaLarga(fecha)}
          </p>
          <button
            type="button"
            onClick={() => cambiarFecha(sumarDias(fecha, 1))}
            aria-label="Día siguiente"
            className={BOTON_ICONO}
          >
            <IconChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => cambiarFecha(hoyISO())}
            disabled={esHoy}
            className="h-10 rounded-xl border border-popim-linea bg-white px-3.5 text-sm font-semibold text-popim-ink transition hover:border-popim-primary disabled:cursor-default disabled:opacity-50"
          >
            Hoy
          </button>
          <input
            type="date"
            aria-label="Ir a una fecha"
            value={fecha}
            onChange={(evento) => cambiarFecha(evento.target.value)}
            className="h-10 rounded-xl border border-popim-linea bg-white px-2.5 text-sm text-popim-ink"
          />
        </div>

        <ul className="flex flex-wrap gap-3.5 text-[13px] text-popim-texto">
          {[501, 502, 503, 504].map((id) => (
            <li key={id} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded border ${ESTADOS_CITA[id].clases}`} />
              {ESTADOS_CITA[id].nombre}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-estado-emergencia bg-white" />
            Emergencia
          </li>
        </ul>
      </div>

      {/* CONTENIDO */}
      {datos.cargando && (
        <div className="rounded-2xl border border-popim-linea bg-white px-6 py-12 text-center text-sm text-popim-texto">
          Cargando agenda…
        </div>
      )}

      {!datos.cargando && datos.error && <Mensaje tipo="error">{datos.error}</Mensaje>}

      {!datos.cargando && datos.agenda && (
        <CuadriculaAgenda agenda={datos.agenda} puedeAgendar={puedeAgendar} />
      )}
    </div>
  );
}