
//

"use client";

import { useState } from "react";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Selector from "@/Componentes/ui/Selector";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconDownload, IconPrinter } from "@/Componentes/Iconos";
import { hoyISO } from "@/lib/fechas";
import { useCarga } from "@/lib/useCarga";
import { descargarReportePdf, listarClinicas, obtenerReporte } from "@/servicios/super";

const PERIODOS = [
  { valor: "MES", texto: "Este mes" },
  { valor: "MES_ANTERIOR", texto: "Mes anterior" },
  { valor: "TRES_MESES", texto: "Últimos 3 meses" },
  { valor: "ANIO", texto: "Este año" },
  { valor: "PERSONALIZADO", texto: "Personalizado" },
];

// Colores de cómo terminaron las citas (los mismos en la barra y en la leyenda)
const COLORES_CITAS = [
  { campo: "atendidas", texto: "Atendidas", color: "#3f75b3" },
  { campo: "canceladas", texto: "Canceladas", color: "#d08a12" },
  { campo: "noAsistio", texto: "No asistió", color: "#8a97a8" },
  { campo: "pendientes", texto: "Pendientes", color: "#c9d6e5" },
];

const dosDigitos = (n) => String(n).padStart(2, "0");
const primerDia = (anio, mes) => `${anio}-${dosDigitos(mes)}-01`;
// Date.UTC(anio, mes, 0) = el día 0 del mes siguiente = el último día de "mes" (mes de 1 a 12)
const ultimoDia = (anio, mes) => new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);

// Convierte el período elegido en fechas desde/hasta
function rangoDe(periodo) {
  const hoy = hoyISO();
  const [anio, mes] = hoy.split("-").map(Number);
  if (periodo === "MES_ANTERIOR") {
    const m = mes === 1 ? 12 : mes - 1;
    const a = mes === 1 ? anio - 1 : anio;
    return { desde: primerDia(a, m), hasta: ultimoDia(a, m) };
  }
  if (periodo === "TRES_MESES") {
    const m = mes - 2 < 1 ? mes + 10 : mes - 2;
    const a = mes - 2 < 1 ? anio - 1 : anio;
    return { desde: primerDia(a, m), hasta: hoy };
  }
  if (periodo === "ANIO") return { desde: `${anio}-01-01`, hasta: hoy };
  return { desde: primerDia(anio, mes), hasta: hoy }; // "MES"
}

const fechaCorta = (f) => `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}`;
const nombreMes = (aaaaMm) =>
  new Date(`${aaaaMm}-01T00:00:00`).toLocaleDateString("es-NI", { month: "short", year: "2-digit" }).replace(".", "");
const pct = (v) => (v === null || v === undefined ? "—" : `${v} %`);

function Cifra({ etiqueta, valor, detalle }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-popim-linea bg-white px-5 py-4">
      <p className="text-[13px] font-semibold text-popim-texto">{etiqueta}</p>
      <p className="text-3xl font-extrabold text-popim-ink">{valor}</p>
      {detalle && <p className="text-xs text-popim-texto">{detalle}</p>}
    </div>
  );
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("MES");
  const [rango, setRango] = useState(() => rangoDe("MES"));
  const [clinicaId, setClinicaId] = useState("");
  const [descargando, setDescargando] = useState(false);
  const [errorPdf, setErrorPdf] = useState("");

  const filtros = { ...rango, clinicaId };
  const rangoValido = rango.desde && rango.hasta && rango.desde <= rango.hasta;

  // Las clínicas solo se piden una vez, para el selector
  const { datos: datosClinicas } = useCarga(() => listarClinicas(), []);
  const opcionesClinicas = (datosClinicas?.clinicas ?? []).map((c) => ({ valor: c.id, texto: c.nombreComercial }));

  // Si las fechas están al revés no se le pregunta al servidor
  const { datos: r, error, cargando } = useCarga(
    () => (rangoValido ? obtenerReporte(filtros) : Promise.resolve({ ok: false, error: "La fecha «desde» debe ser antes de «hasta»." })),
    [rango.desde, rango.hasta, clinicaId]
  );

  function cambiarPeriodo(valor) {
    setPeriodo(valor);
    if (valor !== "PERSONALIZADO") setRango(rangoDe(valor));
  }

  // Si mueve una fecha a mano, el período pasa a "Personalizado"
  const cambiarFecha = (campo) => (e) => {
    setPeriodo("PERSONALIZADO");
    setRango((x) => ({ ...x, [campo]: e.target.value }));
  };

  async function exportarPdf() {
    setErrorPdf("");
    setDescargando(true);
    const respuesta = await descargarReportePdf(filtros);
    setDescargando(false);
    if (!respuesta.ok) setErrorPdf(respuesta.error);
  }

  const maxTotal = Math.max(1, ...(r?.porClinica ?? []).map((c) => c.total));
  const maxMes = Math.max(1, ...(r?.propietariosPorMes ?? []).map((m) => m.total));
  const maxServicio = Math.max(1, ...(r?.servicios ?? []).map((s) => s.total));

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        titulo="Reportes globales"
        descripcion="Rendimiento de toda la red: citas por clínica, propietarios nuevos y frecuencia de servicios."
      >
        <div className="flex flex-wrap gap-2 print:hidden">
          <Boton variante="neutro" onClick={() => window.print()} disabled={!r}>
            <IconPrinter size={16} /> Imprimir
          </Boton>
          <Boton onClick={exportarPdf} disabled={!r || descargando}>
            <IconDownload size={16} /> {descargando ? "Generando…" : "Exportar PDF"}
          </Boton>
        </div>
      </EncabezadoVista>

      {/* Filtros (no salen al imprimir: en su lugar se imprime la línea del período) */}
      <div className="grid gap-3 rounded-2xl border border-popim-linea bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <Selector id="periodo" etiqueta="Período" opciones={PERIODOS} value={periodo} onChange={(e) => cambiarPeriodo(e.target.value)} />
        <Campo id="desde" etiqueta="Desde" type="date" value={rango.desde} onChange={cambiarFecha("desde")} max={rango.hasta} />
        <Campo id="hasta" etiqueta="Hasta" type="date" value={rango.hasta} onChange={cambiarFecha("hasta")} min={rango.desde} />
        <Selector id="clinica" etiqueta="Clínica" opciones={opcionesClinicas} vacio="Todas las clínicas"
          value={clinicaId} onChange={(e) => setClinicaId(e.target.value)} />
      </div>

      {errorPdf && <Aviso tipo="error">{errorPdf}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {cargando && <p className="text-sm text-popim-texto">Calculando el reporte…</p>}

      {r && !cargando && (
        <>
          <p className="text-sm text-popim-texto">
            Del <strong className="text-popim-ink">{fechaCorta(r.periodo.desde)}</strong> al{" "}
            <strong className="text-popim-ink">{fechaCorta(r.periodo.hasta)}</strong> ·{" "}
            {r.clinica ? r.clinica.nombre : "Todas las clínicas de la red"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Cifra etiqueta="Citas totales" valor={r.resumen.citas} detalle={`${r.resumen.pendientes} aún pendientes`} />
            <Cifra etiqueta="Atendidas" valor={r.resumen.atendidas} detalle={`Asistencia ${pct(r.resumen.asistencia)}`} />
            <Cifra etiqueta="Canceladas" valor={r.resumen.canceladas} detalle={`${pct(r.resumen.cancelacion)} del total`} />
            <Cifra etiqueta="No asistió" valor={r.resumen.noAsistio} />
            <Cifra etiqueta="Propietarios nuevos" valor={r.resumen.propietariosNuevos} detalle="En toda la red" />
          </div>

          {/* ---------- Citas por clínica ---------- */}
          <Tarjeta titulo="Total de citas por clínica">
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-popim-texto">
              {COLORES_CITAS.map((c) => (
                <span key={c.campo} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm" style={{ background: c.color }} />{c.texto}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-184 text-left text-sm">
                <thead className="border-b border-popim-linea text-xs uppercase tracking-wide text-popim-texto">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-bold">Clínica</th>
                    <th scope="col" className="w-[40%] px-3 py-2 font-bold">Distribución</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Total</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Asistencia</th>
                    <th scope="col" className="py-2 pl-3 text-right font-bold">Cancelación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-popim-linea">
                  {r.porClinica.map((c) => (
                    <tr key={c.clinicaId}>
                      <td className="py-2.5 pr-3 font-semibold text-popim-ink">
                        {c.nombre}
                        {!c.activa && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Inactiva</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {/* La barra mide según la clínica con más citas; adentro, cada color es un estado */}
                        <div className="flex h-4 overflow-hidden rounded bg-popim-page" style={{ width: `${(c.total / maxTotal) * 100}%` }}
                          role="img" aria-label={`${c.atendidas} atendidas, ${c.canceladas} canceladas, ${c.noAsistio} no asistió, ${c.pendientes} pendientes`}>
                          {COLORES_CITAS.map((k) => c[k.campo] > 0 && (
                            <span key={k.campo} style={{ width: `${(c[k.campo] / c.total) * 100}%`, background: k.color }} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-popim-ink">{c.total}</td>
                      <td className="px-3 py-2.5 text-right text-popim-ink">{pct(c.asistencia)}</td>
                      <td className="py-2.5 pl-3 text-right text-popim-ink">{pct(c.cancelacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ---------- Propietarios nuevos por mes ---------- */}
            <Tarjeta titulo="Propietarios nuevos registrados">
              <p className="-mt-1 mb-4 text-xs text-popim-texto">Últimos 6 meses hasta el {fechaCorta(r.periodo.hasta)}.</p>
              <div role="img" aria-label={r.propietariosPorMes.map((m) => `${nombreMes(m.mes)}: ${m.total}`).join(", ")}
                className="flex h-48 items-end gap-3 border-b border-popim-linea">
                {r.propietariosPorMes.map((m) => (
                  <div key={m.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-xs font-bold text-popim-ink">{m.total}</span>
                    <span className="w-full max-w-12 rounded-t-md bg-popim-primary" style={{ height: `${(m.total / maxMes) * 85}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex gap-3">
                {r.propietariosPorMes.map((m) => (
                  <span key={m.mes} className="flex-1 text-center text-xs text-popim-texto">{nombreMes(m.mes)}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-popim-muted">
                Último mes: {r.propietariosPorMes.at(-1)?.porSuCuenta ?? 0} se registraron en su portal y{" "}
                {r.propietariosPorMes.at(-1)?.porRecepcion ?? 0} los registró una recepción. Los propietarios no pertenecen a una clínica.
              </p>
            </Tarjeta>

            {/* ---------- Frecuencia de servicios ---------- */}
            <Tarjeta titulo="Frecuencia de servicios">
              <ul className="flex flex-col gap-3">
                {r.servicios.map((s) => (
                  <li key={s.clave} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-popim-ink">{s.nombre}</span>
                      <span><strong className="text-popim-ink">{s.total}</strong> <span className="text-popim-muted">· {pct(s.porcentaje)}</span></span>
                    </div>
                    <span className="block h-2.5 overflow-hidden rounded-full bg-popim-page">
                      <span className="block h-full rounded-full bg-popim-ink" style={{ width: `${(s.total / maxServicio) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-popim-muted">
                Consultas y emergencias: consultas cerradas. Vacunación y desparasitación: dosis aplicadas.
                Exámenes: resultados cargados.
              </p>
            </Tarjeta>
          </div>

          <p className="text-xs text-popim-muted">Generado el {r.generadoEn} (hora de Managua).</p>
        </>
      )}
    </div>
  );
}