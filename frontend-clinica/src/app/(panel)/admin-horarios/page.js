"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Aviso from "@/Componentes/ui/Aviso";
import Avatar from "@/Componentes/ui/Avatar";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Selector from "@/Componentes/ui/Selector";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconPlus, IconTrash } from "@/Componentes/Iconos";
import { iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { borrarBloqueo, crearBloqueo, guardarHorario, listarPersonal, obtenerHorario } from "@/servicios/administrador";

// Mismos valores que el ENUM dia_semana de la base de datos
const DIAS = [
  { dia: "LUNES", nombre: "Lunes" }, { dia: "MARTES", nombre: "Martes" }, { dia: "MIERCOLES", nombre: "Miércoles" },
  { dia: "JUEVES", nombre: "Jueves" }, { dia: "VIERNES", nombre: "Viernes" }, { dia: "SABADO", nombre: "Sábado" },
  { dia: "DOMINGO", nombre: "Domingo" },
];
const HABILES = ["MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
const MOTIVOS = ["Vacaciones", "Permiso personal", "Cirugía programada", "Capacitación", "Feriado", "Incapacidad médica"]
  .map((m) => ({ valor: m, texto: m }));
const NOMBRE_ROL = { VETERINARIO: "Veterinario", RECEPCIONISTA: "Recepcionista", ADMINISTRADOR: "Administrador" };

// [{dia, inicio, fin}] (como lo guarda la base) → un renglón por día con sus turnos (como lo muestra la pantalla)
const aDias = (turnos) =>
  DIAS.map(({ dia, nombre }) => ({ dia, nombre, turnos: turnos.filter((t) => t.dia === dia).map(({ inicio, fin }) => ({ inicio, fin })) }));

// Y al revés, para guardarlo
const aTurnos = (dias) => dias.flatMap((d) => d.turnos.map((t) => ({ dia: d.dia, ...t })));

// "Lunes 08:00 – 18:00 · ... · Domingo cerrado" para el aviso del horario de la clínica
function textoHorarioClinica(horario) {
  if (horario.length === 0) return null;
  return DIAS.map(({ dia, nombre }) => {
    const del = horario.filter((h) => h.dia === dia);
    return `${nombre} ${del.length ? del.map((h) => `${h.apertura} – ${h.cierre}`).join(" y ") : "cerrado"}`;
  }).join(" · ");
}

const formatoBloqueo = (iso) =>
  new Date(iso).toLocaleString("es-NI", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// ---------- Horario semanal ----------
function HorarioSemanal({ personalId, persona, horario, clinica }) {
  const [dias, setDias] = useState(() => aDias(horario));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cambiarDia = (dia, cambio) => {
    setMensaje(null);
    setDias((lista) => lista.map((x) => (x.dia === dia ? { ...x, turnos: cambio(x.turnos) } : x)));
  };
  const cambiarHora = (dia, i, campo, valor) => cambiarDia(dia, (ts) => ts.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)));
  const agregarTurno = (dia) => cambiarDia(dia, (ts) => [...ts, ts.length ? { inicio: "14:00", fin: "18:00" } : { inicio: "08:00", fin: "12:00" }]);
  const quitarTurno = (dia, i) => cambiarDia(dia, (ts) => ts.filter((_, j) => j !== i));

  // Copia los turnos del lunes a martes, miércoles, jueves y viernes
  function copiarLunes() {
    const lunes = dias.find((d) => d.dia === "LUNES").turnos;
    setMensaje(null);
    setDias((lista) => lista.map((d) => (HABILES.includes(d.dia) ? { ...d, turnos: lunes.map((t) => ({ ...t })) } : d)));
  }

  async function guardar() {
    setGuardando(true);
    const respuesta = await guardarHorario(personalId, aTurnos(dias));
    setGuardando(false);
    if (!respuesta.ok) {
      setMensaje({ tipo: "error", texto: respuesta.error });
      return;
    }
    const fuera = respuesta.datos.citasFueraDeHorario;
    setMensaje(fuera > 0
      ? { tipo: "info", texto: `Horario guardado. Ojo: ${fuera} ${fuera === 1 ? "cita pendiente quedó" : "citas pendientes quedaron"} fuera del nuevo horario; la recepción debe reprogramarlas en «Citas › Reprogramación».` }
      : { tipo: "ok", texto: "Horario guardado. La agenda y las citas en línea ya usan el horario nuevo." });
  }

  const textoClinica = textoHorarioClinica(clinica.horario);

  return (
    <Tarjeta titulo={`Horario semanal de ${persona.nombreCompleto}`}
      acciones={<Boton variante="neutro" tamano="sm" onClick={copiarLunes}>Copiar lunes a días hábiles</Boton>}>
      <p className="-mt-2 mb-4 text-xs text-popim-texto">
        Cada turno se divide en bloques de {clinica.duracionCitaMin} minutos (la duración de cita de tu clínica).
      </p>
      {textoClinica
        ? <Aviso>Horario de atención de la clínica: <strong>{textoClinica}</strong>. Los turnos deben quedar dentro de ese horario.</Aviso>
        : <Aviso>Tu clínica todavía no tiene horario de atención registrado; pídeselo a POPIM.</Aviso>}

      <ul className="mt-2 flex flex-col divide-y divide-popim-linea">
        {dias.map((d) => (
          <li key={d.dia} className="flex flex-wrap items-center gap-3 py-3">
            <span className="w-28 text-sm font-bold text-popim-ink">{d.nombre}</span>
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              {d.turnos.length === 0 && <span className="text-sm text-popim-muted">Sin turno</span>}
              {d.turnos.map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-xl border border-popim-linea bg-popim-page py-1 pl-2 pr-1">
                  <input type="time" aria-label={`${d.nombre}: entrada`} value={t.inicio}
                    onChange={(e) => cambiarHora(d.dia, i, "inicio", e.target.value)}
                    className="h-9 rounded-lg border border-popim-linea bg-white px-2 text-sm text-popim-ink" />
                  <span className="text-xs text-popim-muted">a</span>
                  <input type="time" aria-label={`${d.nombre}: salida`} value={t.fin}
                    onChange={(e) => cambiarHora(d.dia, i, "fin", e.target.value)}
                    className="h-9 rounded-lg border border-popim-linea bg-white px-2 text-sm text-popim-ink" />
                  <button type="button" onClick={() => quitarTurno(d.dia, i)} aria-label={`Quitar turno del ${d.nombre}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50">
                    <IconTrash size={15} />
                  </button>
                </div>
              ))}
              {d.turnos.length < 2 && (
                <button type="button" onClick={() => agregarTurno(d.dia)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-popim-primary/50 px-3 text-[13px] font-semibold text-popim-primary hover:bg-popim-info">
                  <IconPlus size={14} /> Turno
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {mensaje && <div className="mt-3"><Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso></div>}

      <div className="mt-4 flex justify-end">
        <Boton onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar horario"}</Boton>
      </div>
    </Tarjeta>
  );
}

// ---------- Bloqueos de agenda ----------
function Bloqueos({ personalId, inicial }) {
  const [bloqueos, setBloqueos] = useState(inicial);
  const [nuevo, setNuevo] = useState({ inicio: "", fin: "", motivo: "Vacaciones" });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [trabajando, setTrabajando] = useState(null); // "nuevo" o el id del bloqueo que se borra

  async function agregar(e) {
    e.preventDefault();
    const err = {
      inicio: nuevo.inicio ? "" : "Elige cuándo empieza.",
      fin: !nuevo.fin ? "Elige cuándo termina." : nuevo.fin <= nuevo.inicio ? "Debe terminar después de empezar." : "",
    };
    setErrores(err);
    setMensaje(null);
    if (err.inicio || err.fin) return;

    setTrabajando("nuevo");
    const respuesta = await crearBloqueo(personalId, nuevo);
    setTrabajando(null);
    if (!respuesta.ok) {
      if (respuesta.campo) setErrores({ [respuesta.campo]: respuesta.error });
      else setMensaje({ tipo: "error", texto: respuesta.error });
      return;
    }
    setBloqueos(respuesta.datos.bloqueos);
    setNuevo((x) => ({ ...x, inicio: "", fin: "" }));
    const n = respuesta.datos.citasAfectadas;
    setMensaje(n > 0
      ? { tipo: "info", texto: `Bloqueo guardado. Choca con ${n} ${n === 1 ? "cita pendiente" : "citas pendientes"}: la recepción debe reprogramarlas.` }
      : { tipo: "ok", texto: "Bloqueo guardado. Nadie podrá agendar en ese rango." });
  }

  async function quitar(b) {
    setTrabajando(b.id);
    setMensaje(null);
    const respuesta = await borrarBloqueo(b.id);
    setTrabajando(null);
    if (!respuesta.ok) {
      setMensaje({ tipo: "error", texto: respuesta.error });
      return;
    }
    setBloqueos(respuesta.datos.bloqueos);
    setMensaje({ tipo: "ok", texto: "Bloqueo quitado: esas horas vuelven a estar disponibles." });
  }

  return (
    <Tarjeta titulo="Bloqueos de agenda">
      <p className="-mt-2 mb-4 text-xs text-popim-texto">Durante un bloqueo nadie puede agendar con esta persona.</p>

      <form onSubmit={agregar} noValidate className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-start">
        <Campo id="bInicio" etiqueta="Desde" type="datetime-local" value={nuevo.inicio} error={errores.inicio}
          onChange={(e) => setNuevo((x) => ({ ...x, inicio: e.target.value }))} />
        <Campo id="bFin" etiqueta="Hasta" type="datetime-local" value={nuevo.fin} error={errores.fin} min={nuevo.inicio || undefined}
          onChange={(e) => setNuevo((x) => ({ ...x, fin: e.target.value }))} />
        <Selector id="bMotivo" etiqueta="Motivo" opciones={MOTIVOS} vacio="Elige el motivo" value={nuevo.motivo}
          error={errores.motivo} onChange={(e) => setNuevo((x) => ({ ...x, motivo: e.target.value }))} />
        <Boton type="submit" className="lg:mt-6" disabled={trabajando === "nuevo"}>
          <IconPlus size={16} /> {trabajando === "nuevo" ? "Guardando…" : "Agregar bloqueo"}
        </Boton>
      </form>

      {mensaje && <div className="mt-3"><Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso></div>}

      <ul className="mt-4 flex flex-col divide-y divide-popim-linea border-t border-popim-linea">
        {bloqueos.length === 0 && <li className="py-4 text-sm text-popim-texto">No tiene bloqueos próximos.</li>}
        {bloqueos.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-semibold text-popim-ink">{formatoBloqueo(b.inicio)} → {formatoBloqueo(b.fin)}</p>
              <p className="text-popim-texto">{b.motivo}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.citasAfectadas > 0 ? "bg-popim-pendiente text-popim-pendiente-texto" : "bg-emerald-50 text-emerald-800"}`}>
                {b.citasAfectadas > 0 ? `${b.citasAfectadas} por reprogramar` : "Sin citas afectadas"}
              </span>
              <button type="button" onClick={() => quitar(b)} disabled={trabajando === b.id} aria-label={`Quitar bloqueo: ${b.motivo}`}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50">
                <IconTrash size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

// ---------- Lo de una persona: pide sus datos y muestra horario + bloqueos ----------
function EditorPersona({ personalId }) {
  const { datos, error, cargando } = useCarga(() => obtenerHorario(personalId), [personalId]);
  if (cargando) return <p className="text-sm text-popim-texto">Cargando horario…</p>;
  if (error) return <Aviso tipo="error">{error}</Aviso>;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <HorarioSemanal personalId={personalId} persona={datos.persona} horario={datos.horario} clinica={datos.clinica} />
      <Bloqueos personalId={personalId} inicial={datos.bloqueos} />
    </div>
  );
}

// ---------- La página ----------
function Contenido() {
  const router = useRouter();
  const parametros = useSearchParams();
  const { datos, error, cargando } = useCarga(() => listarPersonal(), []);

  // Solo el personal con vínculo activo tiene horario
  const activos = (datos?.personal ?? []).filter((p) => p.vinculoActivo);
  // La persona elegida va en la URL (?persona=...): así "Ver y editar su horario" y "Vincular" llegan directo
  
    const elegidoId = parametros.get("persona")
    ?? (activos.find((p) => p.rol === "VETERINARIO") ?? activos[0])?.personalId
    ?? null;

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        titulo="Horarios y bloqueos"
        descripcion="El horario semanal define los bloques que ven los propietarios y la recepción. Un bloqueo cierra un rango puntual: vacaciones, permisos, cirugías largas o capacitaciones."
      />
      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="grid items-start gap-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <Tarjeta titulo="Elegir persona">
          {cargando && <p className="text-sm text-popim-texto">Cargando…</p>}
          <ul className="flex flex-col gap-1">
            {activos.map((p) => {
              const activo = p.personalId === elegidoId;
              return (
                <li key={p.personalId}>
                  <button type="button" aria-pressed={activo} onClick={() => router.replace(`/admin-horarios?persona=${p.personalId}`)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${activo ? "bg-popim-info ring-1 ring-popim-primary" : "hover:bg-popim-page"}`}>
                    <Avatar texto={iniciales(p.nombreCompleto)} tono="oscuro" tamano="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-popim-ink">{p.nombreCompleto}</span>
                      <span className="block text-xs text-popim-texto">{NOMBRE_ROL[p.rol] ?? p.rol}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Tarjeta>

        {elegidoId
          // key: al cambiar de persona, todo el editor se vuelve a crear con SUS datos
          ? <EditorPersona key={elegidoId} personalId={elegidoId} />
          : !cargando && <p className="text-sm text-popim-texto">Tu clínica todavía no tiene personal activo.</p>}
      </div>
    </div>
  );
}

// useSearchParams necesita Suspense (si no, "pnpm build" falla)
export default function HorariosPage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}