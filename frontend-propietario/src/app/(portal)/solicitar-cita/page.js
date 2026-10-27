"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BotonPrimario from "@/Componentes/BotonPrimario";
import CampoSelect from "@/Componentes/CampoSelect";
import EncabezadoPagina from "@/Componentes/EncabezadoPagina";
import EstadoVacio from "@/Componentes/EstadoVacio";
import Mensaje from "@/Componentes/Mensaje";
import PawIcon from "@/Componentes/PawIcon";
import {
  IconCheckCircle,
  IconClock,
  IconGeoAlt,
  IconPersonBadge,
} from "@/Componentes/Iconos";
import { listarClinicas, listarVeterinarios, obtenerDisponibilidad } from "@/servicios/clinicas";
import { solicitarCita } from "@/servicios/citas";
import { listarMascotas } from "@/servicios/mascotas";
import { formatearFecha, formatearHora, hoyISO, resumirHorario } from "@/lib/formato";

const MAX_MOTIVO = 255; // citas.motivo_consulta VARCHAR(255)

const CLASE_FECHA =
  "h-11 w-full rounded-xl border border-popim-linea bg-popim-campo px-4 text-sm text-popim-ink outline-none transition focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15";

function Paso({ numero, titulo, children }) {
  return (
    <section className="rounded-2xl border border-popim-linea bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-3 text-base font-semibold text-popim-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-popim-primary text-xs font-bold text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SolicitarCitaPage() {
  const [mascotas, setMascotas] = useState(null); // null = cargando
  const [clinicas, setClinicas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [cargandoVeterinarios, setCargandoVeterinarios] = useState(false);
  const [bloques, setBloques] = useState([]);
  const [cargandoBloques, setCargandoBloques] = useState(false);

  const [mascotaId, setMascotaId] = useState("");
  const [clinicaId, setClinicaId] = useState("");
  const [veterinarioId, setVeterinarioId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [motivo, setMotivo] = useState("");

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [citaCreada, setCitaCreada] = useState(null);

  // Evitan que una respuesta lenta pise a una más reciente
  const consultaVeterinarios = useRef(0);
  const consultaBloques = useRef(0);

  useEffect(() => {
    let activo = true;
    Promise.all([listarMascotas(), listarClinicas()]).then(([resMascotas, resClinicas]) => {
      if (!activo) return;
      if (!resMascotas.ok || !resClinicas.ok) {
        setErrorGeneral(resMascotas.error ?? resClinicas.error);
        setMascotas([]);
        return;
      }
      setMascotas(resMascotas.datos.mascotas);
      setClinicas(resClinicas.datos.clinicas);
    });
    return () => {
      activo = false;
    };
  }, []);

  const limpiarError = (campo) => setErrores((previos) => ({ ...previos, [campo]: "" }));
  const clinicaElegida = clinicas.find((clinica) => clinica.id === clinicaId);

  async function cargarBloques(idVeterinario, dia) {
    const consulta = ++consultaBloques.current;
    setBloques([]);
    setHoraInicio("");
    if (!idVeterinario || !dia) {
      setCargandoBloques(false);
      return;
    }
    setCargandoBloques(true);
    const respuesta = await obtenerDisponibilidad(idVeterinario, dia);
    if (consulta !== consultaBloques.current) return;
    setCargandoBloques(false);
    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setBloques(respuesta.datos.bloques);
  }

  async function alElegirClinica(evento) {
    const id = evento.target.value;
    const consulta = ++consultaVeterinarios.current;
    consultaBloques.current++; // descarta cualquier consulta de horarios en curso
    setClinicaId(id);
    setVeterinarios([]);
    setVeterinarioId("");
    setBloques([]);
    setHoraInicio("");
    setCargandoBloques(false);
    setErrorGeneral("");
    setErrores((previos) => ({ ...previos, clinica: "", veterinario: "", hora: "" }));

    setCargandoVeterinarios(true);
    const respuesta = await listarVeterinarios(id);
    if (consulta !== consultaVeterinarios.current) return;
    setCargandoVeterinarios(false);
    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      return;
    }
    setVeterinarios(respuesta.datos.veterinarios);
  }

  function alElegirVeterinario(id) {
    setVeterinarioId(id);
    limpiarError("veterinario");
    cargarBloques(id, fecha);
  }

  function alElegirFecha(evento) {
    const valor = evento.target.value;
    setFecha(valor);
    limpiarError("fecha");
    if (valor && valor < hoyISO()) {
      setErrores((previos) => ({ ...previos, fecha: "No puedes elegir una fecha pasada." }));
      cargarBloques("", "");
      return;
    }
    cargarBloques(veterinarioId, valor);
  }

  async function confirmar(evento) {
    evento.preventDefault();
    const nuevosErrores = {
      mascota: mascotaId ? "" : "Selecciona la mascota.",
      clinica: clinicaId ? "" : "Selecciona la clínica.",
      veterinario: veterinarioId ? "" : "Elige un veterinario.",
      fecha: !fecha
        ? "Elige el día de la cita."
        : fecha < hoyISO()
          ? "No puedes elegir una fecha pasada."
          : "",
      hora: horaInicio ? "" : "Elige un horario disponible.",
      motivo: motivo.trim() ? "" : "Cuéntanos brevemente el motivo de la consulta.",
    };
    setErrores(nuevosErrores);
    setErrorGeneral("");
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setEnviando(true);
    const respuesta = await solicitarCita({
      mascotaId,
      veterinarioId,
      fecha,
      horaInicio,
      motivoConsulta: motivo.trim(),
    });
    setEnviando(false);

    if (!respuesta.ok) {
      setErrorGeneral(respuesta.error);
      if (respuesta.estado === 409) cargarBloques(veterinarioId, fecha); // el horario ya no está libre
      return;
    }
    setCitaCreada(respuesta.datos.cita);
  }

  function reiniciar() {
    setCitaCreada(null);
    setMascotaId("");
    setClinicaId("");
    setVeterinarios([]);
    setVeterinarioId("");
    setFecha("");
    setBloques([]);
    setHoraInicio("");
    setMotivo("");
    setErrores({});
    setErrorGeneral("");
  }

  // ---------- Cita creada ----------
  if (citaCreada) {
    return (
      <>
        <EncabezadoPagina etiqueta="Tu espacio" titulo="Solicitar cita" />
        <div className="mt-8 rounded-2xl border border-popim-linea bg-white p-8 text-center">
          <IconCheckCircle size={46} className="mx-auto text-popim-exito" />
          <h2 className="mt-4 text-xl font-bold text-popim-ink">¡Cita solicitada!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-popim-muted">
            La clínica revisará tu solicitud y la confirmará. Te avisaremos por correo cuando
            cambie de estado.
          </p>

          <dl className="mx-auto mt-6 grid max-w-md gap-2 rounded-xl bg-popim-page p-4 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-popim-etiqueta">Mascota</dt>
              <dd className="font-semibold text-popim-ink">{citaCreada.mascota.nombre}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-popim-etiqueta">Veterinario</dt>
              <dd className="font-semibold text-popim-ink">{citaCreada.veterinario.nombreCompleto}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-popim-etiqueta">Clínica</dt>
              <dd className="text-right font-semibold text-popim-ink">{citaCreada.clinica.nombreComercial}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-popim-etiqueta">Fecha y hora</dt>
              <dd className="text-right font-semibold text-popim-ink">
                {formatearFecha(citaCreada.fecha)} · {formatearHora(citaCreada.horaInicio)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/mis-citas"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-popim-primary px-6 text-sm font-semibold text-white shadow-lg shadow-popim-primary/25 transition hover:bg-popim-primary-dark"
            >
              Ver mis citas
            </Link>
            <button
              type="button"
              onClick={reiniciar}
              className="h-11 rounded-xl border border-popim-linea px-6 text-sm font-semibold text-popim-texto transition hover:bg-popim-page"
            >
              Solicitar otra
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---------- Formulario ----------
  return (
    <>
      <EncabezadoPagina
        etiqueta="Tu espacio"
        titulo="Solicitar cita"
        descripcion="Elige una clínica de la red, un veterinario y un horario disponible."
      />

      <div className="mt-6">
        {mascotas === null && !errorGeneral && (
          <div role="status" className="h-64 animate-pulse rounded-2xl border border-popim-linea bg-white" />
        )}

        {mascotas?.length === 0 && (
          <EstadoVacio
            icono={(props) => <PawIcon className="h-5.5 w-5.5" {...props} />}
            titulo="Primero registra una mascota"
            texto="Necesitas al menos una mascota registrada para solicitar una cita."
            accion={{ href: "/mis-mascotas/nueva", texto: "Registrar mascota" }}
          />
        )}

        {mascotas?.length > 0 && (
          <form onSubmit={confirmar} noValidate className="space-y-5">
            <Paso numero="1" titulo="Mascota y clínica">
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoSelect
                  id="mascota"
                  etiqueta="Mascota"
                  opciones={mascotas.map((m) => ({ valor: m.id, texto: `${m.nombre} - ${m.codigoUnico}` }))}
                  onChange={(evento) => {
                    setMascotaId(evento.target.value);
                    limpiarError("mascota");
                  }}
                  error={errores.mascota}
                />
                <CampoSelect
                  id="clinica"
                  etiqueta="Clínica"
                  opciones={clinicas.map((c) => ({ valor: c.id, texto: c.nombreComercial }))}
                  onChange={alElegirClinica}
                  error={errores.clinica}
                />
              </div>
              {clinicaElegida && (
                <p className="mt-3 flex items-center gap-2 text-xs text-popim-muted">
                  <IconGeoAlt size={14} />
                  {clinicaElegida.direccion} · Citas de {clinicaElegida.duracionCitaMin} min
                </p>
              )}
            </Paso>

            {clinicaId && (
              <Paso numero="2" titulo="Elige veterinario o veterinaria">
                {cargandoVeterinarios && (
                  <p role="status" className="text-sm text-popim-muted">Buscando veterinarios...</p>
                )}
                {!cargandoVeterinarios && veterinarios.length === 0 && (
                  <p className="text-sm text-popim-muted">
                    Esta clínica aún no tiene veterinarios disponibles.
                  </p>
                )}
                {veterinarios.length > 0 && (
                  <fieldset>
                    <legend className="sr-only">Veterinario</legend>
                    <div className="grid gap-3">
                      {veterinarios.map((vet) => (
                        <label key={vet.id} className="cursor-pointer">
                          <input
                            type="radio"
                            name="veterinario"
                            value={vet.id}
                            checked={veterinarioId === vet.id}
                            onChange={() => alElegirVeterinario(vet.id)}
                            className="peer sr-only"
                          />
                          <div className="flex items-start gap-3 rounded-xl border border-popim-linea bg-white p-4 transition hover:border-popim-primary/50 peer-checked:border-popim-primary peer-checked:bg-popim-info peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-popim-primary">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-popim-info text-popim-primary">
                              <IconPersonBadge size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-popim-ink">{vet.nombreCompleto}</p>
                              <p className="text-xs font-medium text-popim-primary">
                                {vet.especialidad ?? "Medicina veterinaria"}
                              </p>
                              {vet.presentacion && (
                                <p className="mt-1 text-xs text-popim-texto">{vet.presentacion}</p>
                              )}
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-popim-muted">
                                <IconClock size={12} />
                                {resumirHorario(vet.horarios)}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                {errores.veterinario && (
                  <p role="alert" className="mt-2 text-xs text-red-700">{errores.veterinario}</p>
                )}
              </Paso>
            )}

            {veterinarioId && (
              <Paso numero="3" titulo="Fecha, hora y motivo">
                <div className="max-w-xs">
                  <label htmlFor="fecha" className="mb-1.5 block text-sm font-semibold text-popim-ink">
                    Día de la cita
                  </label>
                  <input
                    id="fecha"
                    type="date"
                    min={hoyISO()}
                    value={fecha}
                    onChange={alElegirFecha}
                    aria-invalid={errores.fecha ? "true" : undefined}
                    className={`${CLASE_FECHA} ${errores.fecha ? "border-red-700" : ""}`}
                  />
                  {errores.fecha && (
                    <p role="alert" className="mt-1 text-xs text-red-700">{errores.fecha}</p>
                  )}
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-sm font-semibold text-popim-ink">
                    Horarios disponibles{fecha ? ` · ${formatearFecha(fecha)}` : ""}
                  </p>

                  {!fecha && <p className="text-sm text-popim-muted">Elige un día para ver los horarios.</p>}
                  {cargandoBloques && (
                    <p role="status" className="text-sm text-popim-muted">Consultando horarios...</p>
                  )}
                  {fecha && !cargandoBloques && bloques.length === 0 && !errores.fecha && (
                    <p className="text-sm text-popim-muted">
                      Este veterinario no atiende ese día. Prueba con otra fecha.
                    </p>
                  )}
                  {bloques.length > 0 && !bloques.some((b) => b.disponible) && (
                    <p className="mb-2 text-sm text-popim-muted">No quedan horarios libres ese día.</p>
                  )}

                  {bloques.length > 0 && (
                    <fieldset>
                      <legend className="sr-only">Horario</legend>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {bloques.map((bloque) => (
                          <label key={bloque.horaInicio} className="cursor-pointer">
                            <input
                              type="radio"
                              name="hora"
                              value={bloque.horaInicio}
                              checked={horaInicio === bloque.horaInicio}
                              disabled={!bloque.disponible}
                              onChange={() => {
                                setHoraInicio(bloque.horaInicio);
                                limpiarError("hora");
                              }}
                              className="peer sr-only"
                            />
                            <span className="flex h-10 items-center justify-center rounded-xl border border-popim-linea bg-popim-campo text-sm font-semibold text-popim-texto transition peer-checked:border-popim-primary peer-checked:bg-popim-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-popim-primary peer-disabled:cursor-not-allowed peer-disabled:bg-slate-100 peer-disabled:text-slate-400 peer-disabled:line-through">
                              {formatearHora(bloque.horaInicio)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  {errores.hora && (
                    <p role="alert" className="mt-2 text-xs text-red-700">{errores.hora}</p>
                  )}
                </div>

                <div className="mt-5">
                  <label htmlFor="motivo" className="mb-1.5 block text-sm font-semibold text-popim-ink">
                    Motivo de la consulta
                  </label>
                  <textarea
                    id="motivo"
                    value={motivo}
                    onChange={(evento) => {
                      setMotivo(evento.target.value);
                      limpiarError("motivo");
                    }}
                    maxLength={MAX_MOTIVO}
                    rows={3}
                    placeholder="Ej. Vacuna anual, revisión de la piel, vómitos desde ayer..."
                    aria-invalid={errores.motivo ? "true" : undefined}
                    className={`w-full rounded-xl border bg-popim-campo p-3 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 ${
                      errores.motivo ? "border-red-700" : "border-popim-linea"
                    }`}
                  />
                  <div className="mt-1 flex justify-between gap-3 text-xs">
                    <span role="alert" className="text-red-700">{errores.motivo}</span>
                    <span className="text-popim-etiqueta">{motivo.length}/{MAX_MOTIVO}</span>
                  </div>
                </div>
              </Paso>
            )}

            {errorGeneral && <Mensaje tipo="error">{errorGeneral}</Mensaje>}

            {veterinarioId && (
              <div className="sm:max-w-xs">
                <BotonPrimario cargando={enviando}>Confirmar solicitud</BotonPrimario>
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
}