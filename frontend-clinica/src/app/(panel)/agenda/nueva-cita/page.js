

// paparazzi

"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import BuscadorPropietario from "@/Componentes/Citas/BuscadorPropietario";
import SelectorMascota from "@/Componentes/Citas/SelectorMascota";
import Mensaje from "@/Componentes/Mensaje";
import { IconArrowLeft, IconCalendarEvent, IconCheckCircle, IconInfo } from "@/Componentes/Iconos";
import { useSesion } from "@/contexto/SesionContext";
import { fechaLarga } from "@/lib/fechas";
import { tienePermiso } from "@/lib/permisos";
import { crearCita, crearEmergencia } from "@/servicios/citas";
import { obtenerDisponiblesAhora, obtenerVeterinarios } from "@/servicios/veterinarios";

const PRIORIDADES = [
  { valor: "URGENTE", nombre: "Urgente" },
  { valor: "CRITICA", nombre: "Crítica" },
];

const CAMPO =
  "w-full rounded-xl border border-popim-linea bg-popim-campo px-4 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15";

// Tarjeta numerada de cada paso
function Paso({ numero, titulo, children }) {
  return (
    <section className="rounded-2xl border border-popim-linea bg-white p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-popim-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-popim-primary text-sm text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function ErrorCampo({ texto }) {
  if (!texto) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-red-700">
      {texto}
    </p>
  );
}

export default function NuevaCitaPage({ searchParams }) {
  // Los datos de la URL (?veterinario=…&fecha=…&hora=… o ?tipo=emergencia)
  const params = use(searchParams);
  const { sesion } = useSesion();
  const puedeCita = tienePermiso(sesion, "CITAS_AGENDAR");
  const puedeEmergencia = tienePermiso(sesion, "CITAS_EMERGENCIA_REGISTRAR");

  const [tipo, setTipo] = useState(
    params.tipo === "emergencia" && puedeEmergencia ? "emergencia" : "cita",
  );
  const [propietario, setPropietario] = useState(null);
  const [mascota, setMascota] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [prioridad, setPrioridad] = useState("URGENTE");
  const [vetEmergencia, setVetEmergencia] = useState(null);
  const [presentador, setPresentador] = useState("");

  const [veterinarios, setVeterinarios] = useState([]); // para mostrar el nombre del bloque
  const [disponibles, setDisponibles] = useState(null); // null = todavía no se pidió
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState(null); // cuando se guarda, aquí va el resumen

  const esEmergencia = tipo === "emergencia";

  // El bloque que se tocó en la agenda (si se llegó desde ahí)
  const bloque =
    params.veterinario && params.fecha && params.hora
      ? { veterinarioId: params.veterinario, fecha: params.fecha, hora: params.hora }
      : null;
  const vetBloque = veterinarios.find((v) => v.personalId === bloque?.veterinarioId);

  // Una sola vez: la lista de veterinarios
  useEffect(() => {
    let vigente = true;
    obtenerVeterinarios().then((respuesta) => {
      if (vigente && respuesta.ok) setVeterinarios(respuesta.datos);
    });
    return () => {
      vigente = false;
    };
  }, []);

  // Solo al entrar al modo emergencia (y solo la primera vez): quién está disponible
  useEffect(() => {
    if (!esEmergencia || disponibles) return;
    let vigente = true;
    obtenerDisponiblesAhora().then((respuesta) => {
      if (vigente) setDisponibles(respuesta.ok ? respuesta.datos : []);
    });
    return () => {
      vigente = false;
    };
  }, [esEmergencia, disponibles]);

  // Al cambiar de propietario, la mascota elegida ya no vale
  function elegirPropietario(nuevo) {
    setPropietario(nuevo);
    setMascota(null);
  }

  function validar() {
    const nuevos = {};
    if (!propietario) nuevos.propietario = "Busca y elige al propietario.";
    if (!mascota) nuevos.mascota = "Elige la mascota.";
    const texto = motivo.trim();
    if (texto.length < 3 || texto.length > 255) {
      nuevos.motivo = "Escribe el motivo (entre 3 y 255 caracteres).";
    }
    if (!esEmergencia && !bloque) nuevos.bloque = "Elige un bloque libre en la agenda.";
    if (esEmergencia && !vetEmergencia) nuevos.veterinario = "Elige quién atenderá la emergencia.";
    return nuevos;
  }

  async function guardar() {
    const nuevos = validar();
    setErrores(nuevos);
    setErrorGeneral("");
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    const respuesta = esEmergencia
      ? await crearEmergencia({
          mascotaId: mascota.id,
          veterinarioId: vetEmergencia.personalId,
          prioridad,
          motivo: motivo.trim(),
          personaPresentador: presentador.trim() || null,
        })
      : await crearCita({
          mascotaId: mascota.id,
          veterinarioId: bloque.veterinarioId,
          fecha: bloque.fecha,
          horaInicio: bloque.hora,
          motivo: motivo.trim(),
        });
    setGuardando(false);

    if (!respuesta.ok) {
      // Si el backend dice qué campo falló, lo marcamos; si no, mensaje general
      if (respuesta.campo === "motivo") setErrores({ motivo: respuesta.error });
      else setErrorGeneral(respuesta.error);
      return;
    }
    setCreada({ mascota: mascota.nombre, propietario: propietario.nombreCompleto });
  }

  // Texto de "cuándo" para el resumen
  const cuando = esEmergencia
    ? `Ahora · prioridad ${prioridad === "CRITICA" ? "crítica" : "urgente"}`
    : bloque
      ? `${fechaLarga(bloque.fecha)} · ${bloque.hora}`
      : "Sin elegir";
  const nombreVet = esEmergencia ? vetEmergencia?.nombre : vetBloque?.nombre;

  // ---------- Pantalla de éxito ----------
  if (creada) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-popim-linea bg-white px-6 py-10 text-center">
        <IconCheckCircle size={48} className="text-estado-finalizada-borde" />
        <h1 className="text-2xl font-extrabold text-popim-ink">
          {esEmergencia ? "Emergencia registrada" : "Cita agendada"}
        </h1>
        <p className="text-[15px] text-popim-texto">
          {creada.mascota} ({creada.propietario}) con {nombreVet} · {cuando}.
          <br />
          El propietario recibirá la notificación.
        </p>
        <Link
          href="/agenda"
          className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-popim-primary px-5 text-sm font-bold text-white transition hover:bg-popim-primary-dark"
        >
          Volver a la agenda
        </Link>
      </div>
    );
  }

  // ---------- Formulario ----------
  return (
    <div className="flex flex-col gap-5">
      {/* ENCABEZADO + selector Cita / Emergencia */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/agenda"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-popim-primary hover:underline"
          >
            <IconArrowLeft size={14} />
            Volver a la agenda
          </Link>
          <h1 className="mt-1.5 text-[28px] font-extrabold text-popim-ink">
            {esEmergencia ? "Atender emergencia" : "Agendar cita"}
          </h1>
        </div>

        {puedeCita && puedeEmergencia && (
          <div role="group" aria-label="Tipo de atención" className="flex rounded-xl bg-popim-info p-1">
            {[
              { valor: "cita", nombre: "Cita", activa: "bg-popim-primary" },
              { valor: "emergencia", nombre: "Emergencia", activa: "bg-estado-emergencia" },
            ].map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setTipo(opcion.valor)}
                aria-pressed={tipo === opcion.valor}
                className={`h-10 rounded-lg px-5 text-sm transition ${
                  tipo === opcion.valor
                    ? `${opcion.activa} font-bold text-white`
                    : "font-semibold text-popim-ink hover:bg-white"
                }`}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aviso de cada modo */}
      {esEmergencia ? (
        <div className="flex items-start gap-3 rounded-2xl border border-estado-cancelada-borde/40 bg-estado-cancelada px-4 py-3.5 text-sm text-estado-cancelada-texto">
          <IconInfo size={18} className="mt-0.5 shrink-0" />
          <p>
            <strong>La emergencia también es una cita.</strong> Se asigna al veterinario que elijas y
            entra ya confirmada. Después no se puede reprogramar ni cancelar desde recepción.
          </p>
        </div>
      ) : bloque ? (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border-[1.5px] border-popim-primary bg-white px-5 py-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-popim-info text-popim-primary">
            <IconCalendarEvent size={22} />
          </span>
          <div className="min-w-60 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-popim-primary">
              Bloque elegido en la agenda
            </p>
            <p className="text-lg font-extrabold text-popim-ink">{cuando}</p>
            <p className="text-sm text-popim-texto">
              {vetBloque ? `${vetBloque.nombre} · ${vetBloque.especialidad}` : "Cargando veterinario…"}
            </p>
          </div>
          <Link
            href="/agenda"
            className="inline-flex min-h-11 items-center rounded-xl border border-popim-linea px-4 text-sm font-semibold text-popim-ink transition hover:border-popim-primary"
          >
            Cambiar bloque
          </Link>
        </div>
      ) : (
        <Mensaje tipo="error">
          No elegiste un bloque. <Link href="/agenda" className="font-bold underline">Ve a la agenda</Link> y toca un
          bloque libre.
        </Mensaje>
      )}

      <div className="flex flex-wrap items-start gap-6">
        {/* COLUMNA IZQUIERDA: los pasos */}
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <Paso numero={1} titulo="Propietario">
            <BuscadorPropietario
              seleccionado={propietario}
              alSeleccionar={elegirPropietario}
              error={errores.propietario}
            />
          </Paso>

          <Paso numero={2} titulo="Mascota">
            {propietario ? (
              <SelectorMascota
                key={propietario.id}
                propietarioId={propietario.id}
                seleccionada={mascota}
                alSeleccionar={setMascota}
                error={errores.mascota}
              />
            ) : (
              <p className="text-sm text-popim-texto">Primero elige al propietario.</p>
            )}
          </Paso>

          <Paso numero={3} titulo={esEmergencia ? "Prioridad, veterinario y motivo" : "Motivo"}>
            <div className="flex flex-col gap-5">
              {esEmergencia && (
                <>
                  {/* Prioridad */}
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-popim-ink">Prioridad</legend>
                    <div className="flex flex-wrap gap-2">
                      {PRIORIDADES.map((p) => (
                        <button
                          key={p.valor}
                          type="button"
                          onClick={() => setPrioridad(p.valor)}
                          aria-pressed={prioridad === p.valor}
                          className={`h-11 rounded-xl border px-5 text-sm font-bold transition ${
                            prioridad === p.valor
                              ? "border-estado-emergencia bg-estado-emergencia text-white"
                              : "border-estado-emergencia bg-white text-estado-emergencia"
                          }`}
                        >
                          {p.nombre}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Veterinario disponible ahora */}
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-popim-ink">
                      Veterinario que la atenderá
                    </legend>
                    {disponibles === null ? (
                      <p className="text-sm text-popim-texto">Revisando quién está disponible…</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {disponibles.map((v) => {
                          const elegido = vetEmergencia?.personalId === v.personalId;
                          return (
                            <label
                              key={v.personalId}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl p-3.5 transition ${
                                elegido
                                  ? "border-[1.5px] border-popim-primary bg-popim-info"
                                  : "border border-popim-linea hover:border-popim-primary"
                              }`}
                            >
                              <input
                                type="radio"
                                name="veterinario-emergencia"
                                checked={elegido}
                                onChange={() => setVetEmergencia(v)}
                                className="h-4.5 w-4.5 accent-popim-primary"
                              />
                              <span className="flex-1">
                                <span className="font-bold text-popim-ink">{v.nombre}</span>
                                <span className="text-sm text-popim-texto"> · {v.especialidad}</span>
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  v.ocupadoHasta ? "text-estado-solicitada-texto" : "text-estado-finalizada-texto"
                                }`}
                              >
                                {v.ocupadoHasta ? `Ocupado hasta ${v.ocupadoHasta}` : "Libre ahora"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <ErrorCampo texto={errores.veterinario} />
                  </fieldset>

                  {/* Quién la trae */}
                  <div>
                    <label htmlFor="presentador" className="mb-1.5 block text-sm font-semibold text-popim-ink">
                      Persona que trae a la mascota <span className="font-normal text-popim-texto">(si no es el propietario)</span>
                    </label>
                    <input
                      id="presentador"
                      type="text"
                      value={presentador}
                      onChange={(evento) => setPresentador(evento.target.value)}
                      maxLength={160}
                      placeholder="Nombre del acompañante"
                      className={`${CAMPO} h-12`}
                    />
                  </div>
                </>
              )}

              {/* Motivo (los dos modos) */}
              <div>
                <label htmlFor="motivo" className="mb-1.5 block text-sm font-semibold text-popim-ink">
                  Motivo de la consulta
                </label>
                <textarea
                  id="motivo"
                  rows={3}
                  maxLength={255}
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  placeholder="Describe brevemente el motivo"
                  aria-invalid={errores.motivo ? "true" : undefined}
                  className={`${CAMPO} resize-y py-3 ${errores.motivo ? "border-red-700" : ""}`}
                />
                <div className="mt-1 flex justify-between gap-3">
                  <ErrorCampo texto={errores.motivo} />
                  <span className="ml-auto text-xs text-popim-etiqueta">{motivo.length}/255</span>
                </div>
              </div>
            </div>
          </Paso>
        </div>

        {/* COLUMNA DERECHA: resumen y guardar */}
        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-2xl border border-popim-linea bg-white p-5 lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-popim-ink">Resumen</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-popim-texto">Propietario</dt>
            <dd className="font-semibold text-popim-ink">{propietario?.nombreCompleto ?? "—"}</dd>
            <dt className="text-popim-texto">Mascota</dt>
            <dd className="font-semibold text-popim-ink">{mascota?.nombre ?? "—"}</dd>
            <dt className="text-popim-texto">Veterinario</dt>
            <dd className="font-semibold text-popim-ink">{nombreVet ?? "—"}</dd>
            <dt className="text-popim-texto">Cuándo</dt>
            <dd className="font-semibold text-popim-ink">{cuando}</dd>
            <dt className="text-popim-texto">Estado</dt>
            <dd>
              <span className="rounded-full bg-estado-confirmada px-2.5 py-1 text-xs font-bold text-estado-confirmada-texto">
                Confirmada
              </span>
            </dd>
          </dl>
          <p className="text-xs text-popim-texto">
            Como la registra la clínica, nace confirmada y el propietario recibe la notificación.
          </p>

          {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}
          <ErrorCampo texto={errores.bloque} />

          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className={`min-h-12 rounded-xl text-[15px] font-bold text-white transition disabled:opacity-60 ${
              esEmergencia ? "bg-estado-emergencia hover:brightness-95" : "bg-popim-primary hover:bg-popim-primary-dark"
            }`}
          >
            {guardando ? "Guardando…" : esEmergencia ? "Registrar emergencia" : "Agendar cita"}
          </button>
          <Link href="/agenda" className="text-center text-sm font-semibold text-popim-primary hover:underline">
            Cancelar
          </Link>
        </aside>
      </div>
    </div>
  );
}