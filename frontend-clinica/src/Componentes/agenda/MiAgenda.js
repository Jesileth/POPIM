"use client";

// "Mi agenda" del VETERINARIO: solo sus citas, por semana (o por día).
// La página /agenda decide: si el usuario NO tiene AGENDA_VER_TODOS, muestra esta pantalla.
import { useState } from "react";
import Aviso from "@/Componentes/ui/Aviso";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import CeldaMiAgenda from "@/Componentes/agenda/CeldaMiAgenda";
import DetalleCitaVet from "@/Componentes/agenda/DetalleCitaVet";
import { IconChevronLeft, IconChevronRight } from "@/Componentes/Iconos";
import { armarSemana } from "@/lib/agenda";
import { ESTADOS_CITA } from "@/lib/estados";
import { fechaLarga, hoyISO, lunesDe, partesDia, sumarDias, textoRango } from "@/lib/fechas";
import { useCarga } from "@/lib/useCarga";
import { obtenerMiAgenda } from "@/servicios/veterinario";

const BOTON_ICONO =
  "flex h-10 w-10 items-center justify-center rounded-xl border border-popim-linea bg-white text-popim-ink transition hover:border-popim-primary";

// Leyenda de colores (la 501 se lee "Por confirmar")
const LEYENDA = [
  { id: 501, nombre: "Por confirmar" },
  { id: 502, nombre: "Confirmada" },
  { id: 503, nombre: "En curso" },
  { id: 504, nombre: "Finalizada" },
];

export default function MiAgenda() {
  const hoy = hoyISO();
  const [vista, setVista] = useState("SEMANA"); // "SEMANA" o "DIA"
  const [fecha, setFecha] = useState(hoy); // día de referencia (en semana: cualquier día de esa semana)
  const [citaAbierta, setCitaAbierta] = useState(null); // la cita que se ve en la ventana

  // Siempre pedimos la semana completa (lunes a domingo) del día elegido.
  // Si en vista "Día" pasas de martes a miércoles, la semana es la misma y no se vuelve a pedir.
  const desde = lunesDe(fecha);
  const hasta = sumarDias(desde, 6);
  const { datos, error, cargando } = useCarga(() => obtenerMiAgenda(desde, hasta), [desde]);

  // Qué días se dibujan: de lunes a sábado siempre; el domingo solo si ese día atiende o tiene citas
  const todos = datos?.desde === desde ? datos.dias : [];
  const dias =
    vista === "DIA"
      ? todos.filter((d) => d.fecha === fecha)
      : todos.filter((d, i) => i < 6 || d.horario.length > 0 || d.citas.length > 0);
  const filas = armarSemana(datos?.duracionBloqueMin ?? 60, dias);

  // Flechas: en semana saltan 7 días; en día, 1
  const paso = vista === "SEMANA" ? 7 : 1;
  const titulo =
    vista === "SEMANA"
      ? `Semana del ${textoRango(desde, dias.at(-1)?.fecha ?? sumarDias(desde, 5))}`
      : fechaLarga(fecha);

  // Tocar el encabezado de un día abre ese día solo
  function verDia(dia) {
    setFecha(dia);
    setVista("DIA");
  }

  const columnas = { gridTemplateColumns: `64px repeat(${Math.max(dias.length, 1)}, minmax(118px, 1fr))` };

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoVista titulo="Mi agenda" descripcion="Solo tus citas. Toca una para ver el detalle o iniciar la consulta.">
        {/* Interruptor Semana / Día */}
        <div role="group" aria-label="Vista de la agenda" className="flex rounded-xl border border-popim-linea bg-white p-1">
          {[
            { valor: "SEMANA", texto: "Semana" },
            { valor: "DIA", texto: "Día" },
          ].map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setVista(opcion.valor)}
              aria-pressed={vista === opcion.valor}
              className={`h-9 rounded-lg px-4 text-sm font-semibold transition ${
                vista === opcion.valor ? "bg-popim-page text-popim-ink shadow-sm" : "text-popim-texto hover:text-popim-ink"
              }`}
            >
              {opcion.texto}
            </button>
          ))}
        </div>
      </EncabezadoVista>

      {/* BARRA: flechas, "Hoy" y leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-popim-linea bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFecha(sumarDias(fecha, -paso))} aria-label="Anterior" className={BOTON_ICONO}>
            <IconChevronLeft size={16} />
          </button>
          <p className="min-w-56 px-1 text-center font-bold text-popim-ink" aria-live="polite">{titulo}</p>
          <button type="button" onClick={() => setFecha(sumarDias(fecha, paso))} aria-label="Siguiente" className={BOTON_ICONO}>
            <IconChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => setFecha(hoy)}
            className="h-10 rounded-xl border border-popim-linea bg-white px-3.5 text-sm font-semibold text-popim-ink transition hover:border-popim-primary"
          >
            Hoy
          </button>
        </div>

        <ul className="flex flex-wrap gap-3.5 text-[13px] text-popim-texto">
          {LEYENDA.map((item) => (
            <li key={item.id} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded border ${ESTADOS_CITA[item.id].clases}`} />
              {item.nombre}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-estado-emergencia bg-estado-cancelada" />
            Emergencia
          </li>
        </ul>
      </div>

      {/* CONTENIDO */}
      {error && <Aviso tipo="error">{error}</Aviso>}

      {!error && (cargando || todos.length === 0) && (
        <div className="rounded-2xl border border-popim-linea bg-white px-6 py-12 text-center text-sm text-popim-texto">
          Cargando agenda…
        </div>
      )}

      {!error && todos.length > 0 && filas.length === 0 && (
        <div className="rounded-2xl border border-popim-linea bg-white px-6 py-12 text-center text-sm text-popim-texto">
          {vista === "DIA" ? "No atiendes este día." : "No tienes horario esta semana."}
        </div>
      )}

      {!error && filas.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-popim-linea bg-white">
          <div style={{ minWidth: 64 + dias.length * 124 }}>
            {/* Encabezado: un día por columna */}
            <div className="grid border-b border-popim-linea" style={columnas}>
              <div />
              {dias.map((dia) => {
                const { corto, numero } = partesDia(dia.fecha);
                const esHoy = dia.fecha === hoy;
                return (
                  <button
                    key={dia.fecha}
                    type="button"
                    onClick={() => verDia(dia.fecha)}
                    title="Ver solo este día"
                    className={`border-l border-popim-linea py-2.5 text-center transition hover:bg-popim-page ${
                      esHoy ? "bg-popim-info" : ""
                    }`}
                  >
                    <span className={`block text-[11px] font-bold tracking-wide ${esHoy ? "text-popim-primary" : "text-popim-texto"}`}>
                      {corto}
                    </span>
                    <span className="block text-xl font-extrabold text-popim-ink">{numero}</span>
                  </button>
                );
              })}
            </div>

            {/* Una fila por bloque de tiempo */}
            {filas.map((fila) => (
              <div key={fila.hora} className="grid border-b border-popim-linea last:border-b-0" style={columnas}>
                <div className="px-3 py-2.5 text-[13px] font-bold text-popim-texto">{fila.hora}</div>
                {fila.celdas.map((celda) => (
                  <div key={celda.fecha} className="border-l border-popim-linea p-1">
                    <CeldaMiAgenda celda={celda} esHoy={celda.fecha === hoy} onAbrir={setCitaAbierta} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {citaAbierta && (
        <DetalleCitaVet key={citaAbierta.id} cita={citaAbierta} onCerrar={() => setCitaAbierta(null)} />
      )}
    </div>
  );
}
