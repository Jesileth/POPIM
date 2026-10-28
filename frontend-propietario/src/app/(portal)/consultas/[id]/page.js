"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BotonDescarga from "@/Componentes/BotonDescarga";
import FilaExamen from "@/Componentes/FilaExamen";
import InsigniaCita from "@/Componentes/InsigniaCita";
import Mensaje from "@/Componentes/Mensaje";
import TarjetaSeccion from "@/Componentes/TarjetaSeccion";
import {
  IconArrowLeft,
  IconCapsule,
  IconClipboardPulse,
  IconFileMedical,
  IconFilePdf,
  IconGauge,
  IconHeartPulse,
  IconShieldPlus,
  IconThermometer,
} from "@/Componentes/Iconos";
import { descargarRecetaPdf } from "@/lib/pdf";
import { useCarga } from "@/lib/useCarga";
import { obtenerConsulta } from "@/servicios/consultas";
import { formatearFecha, formatearFechaHora, hoyISO, sumarDias } from "@/lib/formato";

// MySQL entrega los DECIMAL como texto ("4.20"): se convierten a número
const numero = (valor) => (valor === null || valor === undefined || valor === "" ? null : Number(valor));

// Tratamientos: fecha fin = fecha_inicio + duracion_dias
function estadoTratamiento(tratamiento) {
  if (!tratamiento.duracionDias) return { fin: null, enCurso: true };
  const fin = sumarDias(tratamiento.fechaInicio, tratamiento.duracionDias);
  return { fin, enCurso: fin >= hoyISO() };
}

const Etiqueta = ({ children, tono = "rojo" }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
      tono === "rojo" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-800 ring-amber-200"
    }`}
  >
    {children}
  </span>
);

export default function ConsultaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { datos, error } = useCarga(obtenerConsulta, id);
  const c = datos?.consulta;

  const volver = (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-popim-primary hover:underline"
    >
      <IconArrowLeft size={14} />
      Volver
    </button>
  );

  if (error) {
    return (
      <>
        {volver}
        <div className="mt-6">
          <Mensaje tipo="error">{error}</Mensaje>
        </div>
      </>
    );
  }
  if (!c) {
    return <div role="status" aria-label="Cargando" className="h-64 animate-pulse rounded-2xl border border-popim-linea bg-white" />;
  }

  const vitales = [
    { icono: IconGauge, etiqueta: "Peso", valor: numero(c.pesoKg), unidad: "kg" },
    { icono: IconThermometer, etiqueta: "Temperatura", valor: numero(c.temperaturaC), unidad: "°C" },
    { icono: IconHeartPulse, etiqueta: "Frecuencia cardíaca", valor: numero(c.frecuenciaCardiaca), unidad: "lpm" },
  ].filter((v) => v.valor !== null);

  return (
    <>
      {volver}

      <header className="mt-4 border-b border-popim-linea pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-popim-primary">Consulta médica</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-popim-ink">{formatearFechaHora(c.fechaInicio)}</h1>
          {c.esEmergencia && <Etiqueta>Emergencia</Etiqueta>}
          {c.prioridad !== "NORMAL" && (
            <Etiqueta tono="ambar">{c.prioridad === "CRITICA" ? "Prioridad crítica" : "Prioridad urgente"}</Etiqueta>
          )}
        </div>
        <p className="mt-2 text-sm text-popim-muted">
          <Link href={`/mis-mascotas/${c.mascota.id}`} className="font-semibold text-popim-primary hover:underline">
            {c.mascota.nombre}
          </Link>
          {" · "}
          {c.veterinario ? `Atendió ${c.veterinario.nombreCompleto}` : "Atención sin veterinario registrado"}
          {c.clinica ? ` · ${c.clinica.nombreComercial}` : ""}
        </p>
        {c.cita && <p className="mt-1 text-sm text-popim-muted">Motivo de la cita: {c.cita.motivoConsulta}</p>}
      </header>

      <div className="mt-6 space-y-5">
        {vitales.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {vitales.map((v) => (
              <div key={v.etiqueta} className="flex items-center gap-3 rounded-2xl border border-popim-linea bg-white p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-popim-info text-popim-primary">
                  <v.icono size={18} />
                </span>
                <div>
                  <p className="text-xs text-popim-etiqueta">{v.etiqueta}</p>
                  <p className="text-lg font-bold text-popim-ink">
                    {v.valor} <span className="text-xs font-medium text-popim-muted">{v.unidad}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <TarjetaSeccion titulo="Diagnóstico" icono={IconClipboardPulse}>
          {c.diagnosticos.length === 0 ? (
            <p className="text-sm text-popim-muted">El veterinario no registró un diagnóstico en esta consulta.</p>
          ) : (
            <ul className="divide-y divide-popim-linea">
              {c.diagnosticos.map((d) => (
                <li key={d.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold text-popim-ink">{d.padecimiento.nombre}</p>
                    {d.padecimiento.codigo && (
                      <span className="rounded-md bg-popim-info px-2 py-0.5 font-mono text-[11px] font-semibold text-popim-primary">
                        {d.padecimiento.codigo}
                      </span>
                    )}
                    <span className="text-xs text-popim-etiqueta">{d.padecimiento.clasificacion}</span>
                  </div>
                  {d.descripcion && <p className="mt-1 text-sm text-popim-texto">{d.descripcion}</p>}
                </li>
              ))}
            </ul>
          )}
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Receta"
          icono={IconCapsule}
          acciones={
            c.receta && (
              <BotonDescarga icono={IconFilePdf} onDescargar={() => descargarRecetaPdf(c)}>
                Descargar receta (PDF)
              </BotonDescarga>
            )
          }
        >
          {!c.receta ? (
            <p className="text-sm text-popim-muted">El veterinario no emitió una receta en esta consulta.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-lg text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-popim-etiqueta">
                      <th className="pb-2 pr-4 font-semibold">Medicamento</th>
                      <th className="pb-2 pr-4 font-semibold">Dosis</th>
                      <th className="pb-2 pr-4 font-semibold">Frecuencia</th>
                      <th className="pb-2 font-semibold">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-popim-linea">
                    {c.receta.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-popim-ink">{item.medicamento.nombre}</p>
                          {item.medicamento.presentacion && (
                            <p className="text-xs text-popim-muted">{item.medicamento.presentacion}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-popim-texto">{item.dosis}</td>
                        <td className="py-3 pr-4 text-popim-texto">{item.frecuencia}</td>
                        <td className="py-3 text-popim-texto">
                          {item.duracionDias} {item.duracionDias === 1 ? "día" : "días"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {c.receta.observaciones && (
                <p className="mt-4 rounded-xl bg-popim-page p-3 text-sm text-popim-texto">
                  <span className="font-semibold text-popim-ink">Observaciones: </span>
                  {c.receta.observaciones}
                </p>
              )}
            </>
          )}
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Tratamiento" icono={IconHeartPulse}>
          {c.tratamientos.length === 0 ? (
            <p className="text-sm text-popim-muted">No se indicó un tratamiento en esta consulta.</p>
          ) : (
            <ul className="divide-y divide-popim-linea">
              {c.tratamientos.map((t) => {
                const { fin, enCurso } = estadoTratamiento(t);
                return (
                  <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[15px] font-semibold text-popim-ink">{t.descripcion}</p>
                      <InsigniaCita
                        estado={{ codigo: enCurso ? "ATENCION" : "COMPLETADA", nombre: enCurso ? "En curso" : "Finalizado" }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-popim-muted">
                      Desde {formatearFecha(t.fechaInicio)}
                      {fin ? ` · hasta ${formatearFecha(fin)} (${t.duracionDias} días)` : " · sin fecha de fin"}
                    </p>
                    {t.indicaciones && <p className="mt-1.5 text-sm text-popim-texto">{t.indicaciones}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </TarjetaSeccion>

        {c.examenes.length > 0 && (
          <TarjetaSeccion titulo="Exámenes de esta consulta" icono={IconFileMedical}>
            <ul className="divide-y divide-popim-linea">
              {c.examenes.map((examen) => (
                <FilaExamen key={examen.id} examen={examen} />
              ))}
            </ul>
          </TarjetaSeccion>
        )}

        {c.dosisAplicadas.length > 0 && (
          <TarjetaSeccion titulo="Vacunas y desparasitaciones aplicadas" icono={IconShieldPlus}>
            <ul className="divide-y divide-popim-linea">
              {c.dosisAplicadas.map((dosis) => (
                <li key={dosis.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-popim-ink">{dosis.producto.nombre}</p>
                  <p className="text-xs text-popim-muted">
                    {formatearFecha(dosis.fechaAplicada)}
                    {dosis.lote ? ` · Lote ${dosis.lote}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </TarjetaSeccion>
        )}

        {(c.hallazgos.length > 0 || c.observacionesGenerales) && (
          <TarjetaSeccion titulo="Hallazgos y observaciones">
            {c.hallazgos.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-popim-texto">
                {c.hallazgos.map((h) => (
                  <li key={h.id}>{h.descripcion}</li>
                ))}
              </ul>
            )}
            {c.observacionesGenerales && (
              <p className={`text-sm text-popim-texto ${c.hallazgos.length > 0 ? "mt-4" : ""}`}>
                {c.observacionesGenerales}
              </p>
            )}
          </TarjetaSeccion>
        )}
      </div>
    </>
  );
}