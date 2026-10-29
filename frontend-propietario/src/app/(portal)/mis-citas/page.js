"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BotonDescarga from "@/Componentes/BotonDescarga";
import EncabezadoPagina from "@/Componentes/EncabezadoPagina";
import EstadoVacio from "@/Componentes/EstadoVacio";
import InsigniaCita from "@/Componentes/InsigniaCita";
import Mensaje from "@/Componentes/Mensaje";
import ModalCancelarCita from "@/Componentes/ModalCancelarCita";
import { IconCalendarCheck, IconFilePdf, IconGeoAlt } from "@/Componentes/Iconos";
import { descargarAgendaCitas, descargarComprobanteCita } from "@/lib/pdf";
import { cancelarCita, listarCitas } from "@/servicios/citas";
import { ahoraISO, formatearFecha, formatearHora } from "@/lib/formato";

const ACTIVAS = ["SOLICITADA", "CONFIRMADA", "ATENCION"];
const CANCELABLES = ["SOLICITADA", "CONFIRMADA"];
const clave = (cita) => `${cita.fecha}T${cita.horaInicio}`;

export default function MisCitasPage() {
  const [citas, setCitas] = useState(null); // null = cargando
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("proximas");
  const [citaACancelar, setCitaACancelar] = useState(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let activo = true;
    listarCitas().then((respuesta) => {
      if (!activo) return;
      if (respuesta.ok) setCitas(respuesta.datos.citas);
      else setError(respuesta.error);
    });
    return () => {
      activo = false;
    };
  }, []);

  async function confirmarCancelacion(motivo) {
    const respuesta = await cancelarCita(citaACancelar.id, motivo);
    if (respuesta.ok) {
      setCitas((actuales) =>
        actuales.map((cita) =>
          cita.id === citaACancelar.id
            ? { ...cita, estado: { codigo: "CANCELADA", nombre: "Cancelada" }, motivoCancelacion: motivo }
            : cita,
        ),
      );
      setCitaACancelar(null);
      setAviso("Tu cita fue cancelada.");
    }
    return respuesta;
  }

  const esProxima = (cita) => ACTIVAS.includes(cita.estado.codigo);
  const proximas = (citas ?? []).filter(esProxima);
  const historial = (citas ?? []).filter((cita) => !esProxima(cita));
  const visibles = [...(filtro === "proximas" ? proximas : historial)].sort(
    (a, b) => (filtro === "proximas" ? 1 : -1) * clave(a).localeCompare(clave(b)),
  );
  const ahora = ahoraISO();

  return (
    <>
      <EncabezadoPagina
        etiqueta="Tu espacio"
        titulo="Mis citas"
        descripcion="Consulta el estado de tus citas, descarga tu agenda como respaldo y cancela las que ya no necesites."
      >
        <BotonDescarga
          icono={IconFilePdf}
          disabled={visibles.length === 0}
          onDescargar={() =>
            descargarAgendaCitas(visibles, {
              titulo: filtro === "proximas" ? "Mis próximas citas" : "Historial de citas",
            })
          }
        >
          Agenda en PDF
        </BotonDescarga>
      </EncabezadoPagina>

      <div className="mt-6 space-y-4">
        {error && <Mensaje tipo="error">{error}</Mensaje>}
        {aviso && <Mensaje tipo="info">{aviso}</Mensaje>}

        <div role="group" aria-label="Filtrar citas" className="inline-flex rounded-xl border border-popim-linea bg-white p-1">
          {[
            { id: "proximas", texto: "Próximas", total: proximas.length },
            { id: "historial", texto: "Historial", total: historial.length },
          ].map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={filtro === opcion.id}
              onClick={() => setFiltro(opcion.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filtro === opcion.id ? "bg-popim-primary text-white" : "text-popim-texto hover:bg-popim-page"
              }`}
            >
              {opcion.texto}
              {citas && <span className="ml-1.5 opacity-70">{opcion.total}</span>}
            </button>
          ))}
        </div>

        {citas === null && !error && (
          <div role="status" aria-label="Cargando citas" className="h-48 animate-pulse rounded-2xl border border-popim-linea bg-white" />
        )}

        {citas && visibles.length === 0 && (
          <EstadoVacio
            icono={IconCalendarCheck}
            titulo={filtro === "proximas" ? "No tienes citas próximas" : "Tu historial está vacío"}
            texto={
              filtro === "proximas"
                ? "Cuando solicites una cita, la verás aquí con su estado."
                : "Aquí aparecerán tus citas finalizadas y canceladas."
            }
            accion={filtro === "proximas" ? { href: "/solicitar-cita", texto: "Solicitar cita" } : undefined}
          />
        )}

        {visibles.length > 0 && (
          <ul className="divide-y divide-popim-linea overflow-hidden rounded-2xl border border-popim-linea bg-white">
            {visibles.map((cita) => {
              const puedeCancelar = CANCELABLES.includes(cita.estado.codigo) && clave(cita) > ahora;
              const tieneConsulta = cita.estado.codigo === "COMPLETADA" && cita.consultaId;

              return (
                <li key={cita.id} className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-5">
                  <div className="flex shrink-0 items-center gap-3 lg:w-44">
                    <span className="rounded-lg bg-popim-info px-2.5 py-1.5 text-xs font-bold text-popim-primary">
                      {formatearHora(cita.horaInicio)}
                    </span>
                    <span className="text-sm font-medium text-popim-texto">{formatearFecha(cita.fecha)}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-popim-ink">
                      {cita.mascota.nombre}
                      <span className="font-normal text-popim-muted"> · {cita.motivoConsulta}</span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-popim-muted">
                      <span>Con {cita.veterinario.nombreCompleto}</span>
                      <span className="flex items-center gap-1">
                        <IconGeoAlt size={12} />
                        {cita.clinica.nombreComercial}
                      </span>
                    </p>
                    {cita.estado.codigo === "CANCELADA" && cita.motivoCancelacion && (
                      <p className="mt-1 text-xs text-popim-etiqueta">Motivo: {cita.motivoCancelacion}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <InsigniaCita estado={cita.estado} />
                    {tieneConsulta && (
                      <Link
                        href={`/consultas/${cita.consultaId}`}
                        className="inline-flex h-9 items-center rounded-xl bg-popim-primary px-3.5 text-xs font-semibold text-white transition hover:bg-popim-primary-dark"
                      >
                        Ver consulta
                      </Link>
                    )}
                    <BotonDescarga icono={IconFilePdf} onDescargar={() => descargarComprobanteCita(cita)}>
                      PDF
                    </BotonDescarga>
                    {puedeCancelar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAviso("");
                          setCitaACancelar(cita);
                        }}
                        className="h-9 rounded-xl border border-popim-linea px-3.5 text-xs font-semibold text-popim-texto transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {citaACancelar && (
        <ModalCancelarCita
          key={citaACancelar.id}
          cita={citaACancelar}
          onCerrar={() => setCitaACancelar(null)}
          onConfirmar={confirmarCancelacion}
        />
      )}
    </>
  );
}