//

"use client";

// PACIENTES (veterinario): a la izquierda sus pacientes; a la derecha el expediente del elegido.
// Se puede llegar con /pacientes?mascota=m12 (desde "Ver en expediente" o "Ver" en Mis consultas).
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import { IconLock } from "@/Componentes/Iconos";
import { textoAlerta } from "@/lib/atencion";
import { coincide } from "@/lib/busqueda";
import { hoyISO } from "@/lib/fechas";
import { fechaDia } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { obtenerExpediente, obtenerMisPacientes } from "@/servicios/veterinario";

const SEXO = { MACHO: "Macho", HEMBRA: "Hembra" };

// "hoy" · "lun 2 nov" · "jun 2026" (para "última vez …")
function ultimaVez(fecha) {
  if (!fecha) return "sin consultas aún";
  if (fecha === hoyISO()) return "última vez hoy";
  const f = new Date(`${fecha}T00:00:00`);
  const dias = (new Date(`${hoyISO()}T00:00:00`) - f) / 86400000;
  const opciones = dias <= 7 ? { weekday: "short", day: "numeric", month: "short" } : { month: "short", year: "numeric" };
  return `última vez ${new Intl.DateTimeFormat("es", opciones).format(f).replace(/\./g, "").replace(",", "")}`;
}

// Cajita de aviso: amarilla (por vencer, sin agendar) o roja (vencida)
function ChipAlerta({ alerta }) {
  const { texto, grave } = textoAlerta(alerta);
  return (
    <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${grave ? "bg-estado-cancelada text-estado-cancelada-texto" : "bg-popim-pendiente text-popim-pendiente-texto"}`}>
      {texto}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pestaña "Consultas": cada consulta se abre y se cierra (+ / −)
// ---------------------------------------------------------------------------
function ListaConsultas({ consultas }) {
  // La primera (la más reciente) empieza abierta
  const [abierta, setAbierta] = useState(consultas[0]?.id ?? null);
  if (consultas.length === 0) return <p className="text-sm text-popim-muted">Todavía no tiene consultas.</p>;

  const bloque = (titulo, contenido) => (
    <div>
      <p className="text-xs font-bold text-popim-ink">{titulo}</p>
      <div className="mt-0.5 text-[13px] text-popim-texto">{contenido}</div>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {consultas.map((co) => {
        const esta = abierta === co.id;
        return (
          <article key={co.id} className="overflow-hidden rounded-xl border border-popim-linea">
            <button
              type="button"
              onClick={() => setAbierta(esta ? null : co.id)}
              aria-expanded={esta}
              className="flex w-full flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-left hover:bg-popim-page"
            >
              <span className="w-24 shrink-0 text-sm font-bold text-popim-ink">{fechaDia(co.fecha)}</span>
              <span className="min-w-40 flex-1">
                <span className="block font-bold text-popim-ink">{co.motivo}</span>
                <span className="block text-xs text-popim-muted">
                  {co.veterinario} · {co.esEstaClinica ? "esta clínica" : co.clinica}
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  co.abierta ? "bg-estado-curso text-estado-curso-texto" : "bg-popim-page text-popim-ink ring-1 ring-popim-linea"
                }`}
              >
                {co.abierta ? "En curso" : co.diagnostico ?? "Sin diagnóstico"}
              </span>
              <span aria-hidden="true" className="w-4 text-center text-lg text-popim-texto">{esta ? "−" : "+"}</span>
            </button>

            {esta && (
              <div className="grid gap-4 border-t border-popim-linea bg-popim-page/60 px-4 py-4 sm:grid-cols-3">
                {bloque(
                  "Signos",
                  co.signos ? `${co.signos.pesoKg} kg · ${co.signos.temperatura} °C · ${co.signos.frecuenciaCardiaca} lpm` : "Sin registrar",
                )}
                {bloque("Hallazgos", co.hallazgos.length ? co.hallazgos.join(" ") : co.tratamiento || "Sin hallazgos")}
                {bloque(
                  "Receta",
                  co.receta.length ? co.receta.map((r) => `${r.medicamento} ${r.indicaciones}`).join("; ") : "Sin receta",
                )}
                {co.examenes.length > 0 &&
                  bloque(
                    "Exámenes",
                    co.examenes.map((e) => `${e.tipo}${e.estado === "PENDIENTE" ? " (esperando resultado)" : ""}`).join(", "),
                  )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestaña "Cartilla": vacunas y desparasitaciones
// ---------------------------------------------------------------------------
const ESTADO_DOSIS = {
  APLICADA: { texto: "Aplicada", clases: "bg-estado-finalizada text-estado-finalizada-texto" },
  PENDIENTE: { texto: "Pendiente", clases: "bg-popim-pendiente text-popim-pendiente-texto" },
  VENCIDA: { texto: "Vencida", clases: "bg-estado-cancelada text-estado-cancelada-texto" },
};
function Cartilla({ dosis }) {
  if (dosis.length === 0) return <p className="text-sm text-popim-muted">La cartilla está vacía.</p>;
  return (
    <ul className="divide-y divide-popim-linea rounded-xl border border-popim-linea">
      {dosis.map((ds) => (
        <li key={ds.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-bold text-popim-ink">{ds.nombre}</p>
            <p className="text-xs text-popim-muted">
              {ds.tipo === "VACUNA" ? "Vacuna" : "Desparasitación"}
              {ds.fechaAplicada && ` · aplicada ${fechaDia(ds.fechaAplicada)}`}
              {` · próxima ${fechaDia(ds.proximaFecha)}`}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ESTADO_DOSIS[ds.estado].clases}`}>
            {ESTADO_DOSIS[ds.estado].texto}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Pestaña "Exámenes"
// ---------------------------------------------------------------------------
function Examenes({ examenes }) {
  if (examenes.length === 0) return <p className="text-sm text-popim-muted">No tiene exámenes.</p>;
  return (
    <ul className="divide-y divide-popim-linea rounded-xl border border-popim-linea">
      {examenes.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-bold text-popim-ink">{e.tipo}</p>
            <p className="text-xs text-popim-muted">{fechaDia(e.fecha)} · {e.motivo}</p>
            {e.resultado && <p className="mt-1 text-[13px] text-popim-texto">{e.resultado}</p>}
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              e.estado === "PENDIENTE" ? "bg-popim-pendiente text-popim-pendiente-texto" : "bg-estado-finalizada text-estado-finalizada-texto"
            }`}
          >
            {e.estado === "PENDIENTE" ? "Esperando resultado" : "Con resultado"}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Expediente (lado derecho)
// ---------------------------------------------------------------------------
function Expediente({ mascotaId }) {
  const { datos, error } = useCarga(() => obtenerExpediente(mascotaId), [mascotaId]);
  const [pestana, setPestana] = useState("CONSULTAS");

  if (error) return <Aviso tipo="error">{error}</Aviso>;
  // datos de OTRA mascota (todavía cargando la nueva) → se muestra el esqueleto
  if (!datos || datos.mascota.id !== mascotaId) {
    return <div role="status" aria-label="Cargando expediente" className="h-96 animate-pulse rounded-2xl border border-popim-linea bg-white" />;
  }
  const { mascota, propietario } = datos;

  const pestanas = [
    { valor: "CONSULTAS", texto: "Consultas" },
    { valor: "CARTILLA", texto: "Cartilla" },
    { valor: "EXAMENES", texto: "Exámenes" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera de la mascota */}
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-popim-linea bg-white p-5">
        <Avatar texto={mascota.nombre[0]} tamano="xl" />
        <div className="min-w-48 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-2xl font-bold text-popim-ink">
            {mascota.nombre}
            <span className="rounded-md bg-popim-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">{mascota.codigoUnico}</span>
          </p>
          <p className="text-sm text-popim-texto">
            {[mascota.especie, mascota.raza, SEXO[mascota.sexo], mascota.edad].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-popim-muted">Propietario: {propietario.nombreCompleto} · {propietario.telefono}</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl bg-popim-page px-4 py-2.5">
            <p className="text-xs text-popim-muted">Último peso</p>
            <p className="font-bold text-popim-ink">{datos.ultimoPeso ? `${datos.ultimoPeso} kg` : "—"}</p>
          </div>
          <div className="rounded-xl bg-popim-page px-4 py-2.5">
            <p className="text-xs text-popim-muted">Consultas</p>
            <p className="font-bold text-popim-ink">{datos.consultas.length}</p>
          </div>
        </div>
      </section>

      {/* Pestañas */}
      <section className="rounded-2xl border border-popim-linea bg-white">
        <div role="tablist" className="flex gap-1 border-b border-popim-linea px-3">
          {pestanas.map((p) => (
            <button
              key={p.valor}
              type="button"
              role="tab"
              aria-selected={pestana === p.valor}
              onClick={() => setPestana(p.valor)}
              className={`-mb-px border-b-2 px-3 py-3 text-sm font-semibold transition ${
                pestana === p.valor ? "border-popim-ink text-popim-ink" : "border-transparent text-popim-texto hover:text-popim-ink"
              }`}
            >
              {p.texto}
            </button>
          ))}
        </div>
        <div className="p-4">
          {pestana === "CONSULTAS" && <ListaConsultas key={mascota.id} consultas={datos.consultas} />}
          {pestana === "CARTILLA" && <Cartilla dosis={datos.cartilla} />}
          {pestana === "EXAMENES" && <Examenes examenes={datos.examenes} />}
        </div>
      </section>

      <p className="flex items-center justify-center gap-1.5 text-xs text-popim-muted">
        <IconLock size={12} /> Cada vez que abres un expediente queda registrado en la auditoría.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
function Pacientes() {
  const parametros = useSearchParams();
  const { datos, error } = useCarga(obtenerMisPacientes, []);
  const [q, setQ] = useState("");
  const [soloAtencion, setSoloAtencion] = useState(false);
  const [elegido, setElegido] = useState(parametros.get("mascota"));

  const todos = datos?.pacientes ?? [];
  const conAlerta = todos.filter((p) => p.alertas.length > 0);
  const visibles = (soloAtencion ? conAlerta : todos).filter((p) =>
    coincide(q, p.mascota.nombre, p.mascota.codigoUnico, p.propietario.nombreCompleto),
  );
  // Si no viene ?mascota= se muestra el primero de la lista
  const mascotaId = elegido ?? todos[0]?.mascota.id ?? null;

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoVista titulo="Pacientes" />
      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
        {/* LISTA */}
        <aside className="rounded-2xl border border-popim-linea bg-white p-4">
          <Buscador value={q} onChange={setQ} placeholder="Código PET, nombre o propietario" />
          <div role="group" aria-label="Filtrar pacientes" className="mt-3 grid grid-cols-2 rounded-xl bg-popim-page p-1">
            {[
              { valor: false, texto: "Todos" },
              { valor: true, texto: `Necesitan atención (${conAlerta.length})` },
            ].map((op) => (
              <button
                key={op.texto}
                type="button"
                onClick={() => setSoloAtencion(op.valor)}
                aria-pressed={soloAtencion === op.valor}
                className={`min-h-9 rounded-lg px-2 text-[13px] font-semibold transition ${
                  soloAtencion === op.valor ? "bg-white text-popim-ink shadow-sm" : "text-popim-texto hover:text-popim-ink"
                }`}
              >
                {op.texto}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-popim-muted">Mascotas que tienen o tuvieron cita contigo.</p>

          {!datos && !error && <div className="mt-3 h-64 animate-pulse rounded-xl bg-popim-page" />}
          <ul className="mt-3 space-y-2">
            {visibles.map((p) => {
              const activo = p.mascota.id === mascotaId;
              return (
                <li key={p.mascota.id}>
                  <button
                    type="button"
                    onClick={() => setElegido(p.mascota.id)}
                    aria-current={activo ? "true" : undefined}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      activo ? "border-popim-primary bg-popim-info/60" : "border-transparent hover:bg-popim-page"
                    }`}
                  >
                    <Avatar texto={p.mascota.nombre[0]} tamano="sm" />
                    <span className="min-w-0">
                      <span className="block font-bold text-popim-ink">{p.mascota.nombre}</span>
                      <span className="block text-xs text-popim-muted">{p.mascota.especie} · {ultimaVez(p.ultimaVisita)}</span>
                      {p.alertas.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {p.alertas.map((a, i) => <ChipAlerta key={i} alerta={a} />)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
            {datos && visibles.length === 0 && <li className="py-6 text-center text-sm text-popim-muted">No hay pacientes con ese filtro.</li>}
          </ul>
        </aside>

        {/* EXPEDIENTE */}
        {mascotaId ? (
          <Expediente mascotaId={mascotaId} />
        ) : (
          datos && <p className="rounded-2xl border border-popim-linea bg-white p-10 text-center text-sm text-popim-muted">Todavía no tienes pacientes.</p>
        )}
      </div>
    </div>
  );
}

// useSearchParams necesita Suspense (si no, "pnpm build" falla, como pasó en nueva-cita)
export default function PacientesPage() {
  return (
    <Suspense fallback={null}>
      <Pacientes />
    </Suspense>
  );
}