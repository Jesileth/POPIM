//

"use client";

import { useState } from "react";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import Paso from "@/Componentes/ui/Paso";
import Selector from "@/Componentes/ui/Selector";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconPlus, IconTrash } from "@/Componentes/Iconos";
import { formatearTelefono, normalizarEmail, validarEmail, validarObligatorio, validarTelefono } from "@/lib/validaciones";

// Mismos valores que el ENUM dia_semana de horarios_clinica
const DIAS = [
  { dia: "LUNES", nombre: "Lunes" },
  { dia: "MARTES", nombre: "Martes" },
  { dia: "MIERCOLES", nombre: "Miércoles" },
  { dia: "JUEVES", nombre: "Jueves" },
  { dia: "VIERNES", nombre: "Viernes" },
  { dia: "SABADO", nombre: "Sábado" },
  { dia: "DOMINGO", nombre: "Domingo" },
];

// Horario que se propone al registrar una clínica nueva
const HORARIO_INICIAL = [
  ...["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"].map((dia) => ({ dia, apertura: "08:00", cierre: "18:00" })),
  { dia: "SABADO", apertura: "08:00", cierre: "12:00" },
];

const DURACIONES = [
  { valor: "30", texto: "30 minutos" },
  { valor: "45", texto: "45 minutos" },
  { valor: "60", texto: "60 minutos" },
];

const ESTADOS_CUENTA = {
  ACTIVO: { texto: "Cuenta activa", clase: "bg-emerald-50 text-emerald-800" },
  PENDIENTE: { texto: "Pendiente de activación", clase: "bg-popim-pendiente text-popim-pendiente-texto" },
  BLOQUEADO: { texto: "Cuenta bloqueada", clase: "bg-red-50 text-red-800" },
  INACTIVO: { texto: "Cuenta inactiva", clase: "bg-slate-100 text-slate-700" },
};

// La lista plana que manda el backend [{dia, apertura, cierre}] → un renglón por día con sus turnos
function aDias(horarios) {
  return DIAS.map(({ dia, nombre }) => {
    const turnos = horarios.filter((h) => h.dia === dia).map((h) => ({ apertura: h.apertura, cierre: h.cierre }));
    return { dia, nombre, abre: turnos.length > 0, turnos };
  });
}

// Y al revés, para enviarlo: solo los días que abren
function aHorarios(dias) {
  return dias.filter((d) => d.abre).flatMap((d) => d.turnos.map((t) => ({ dia: d.dia, ...t })));
}

// Mismas reglas que el backend (super.schemas.js), para avisar antes de enviar
function revisarHorario(dias) {
  const abiertos = dias.filter((d) => d.abre);
  if (abiertos.length === 0) return "Marca al menos un día en que abra la clínica.";
  for (const d of abiertos) {
    for (const t of d.turnos) {
      if (!t.apertura || !t.cierre) return `Completa las horas del ${d.nombre.toLowerCase()}.`;
      if (t.cierre <= t.apertura) return `El ${d.nombre.toLowerCase()}, la hora de cierre debe ser después de la apertura.`;
    }
    const [primero, segundo] = [...d.turnos].sort((a, b) => a.apertura.localeCompare(b.apertura));
    if (segundo && segundo.apertura < primero.cierre) return `Los dos turnos del ${d.nombre.toLowerCase()} se enciman.`;
  }
  return "";
}

// modo = "registrar" | "editar"
// inicial = la clínica que devuelve GET /super/clinicas/:id (solo al editar)
// onGuardar(datos) debe devolver lo que devuelve el servicio: { ok, error, campo }
export default function FormularioClinica({ modo, inicial = null, onGuardar }) {
  const esRegistro = modo === "registrar";

  const [d, setD] = useState({
    razonSocial: inicial?.razonSocial ?? "",
    nombreComercial: inicial?.nombreComercial ?? "",
    ruc: inicial?.ruc ?? "",
    direccion: inicial?.direccion ?? "",
    telefono: inicial?.telefono ?? "",
    correo: inicial?.correo ?? "",
    duracionCitaMin: String(inicial?.duracionCitaMin ?? 60),
    activa: true,
    adminNombre: "",
    adminCorreo: "",
    adminTelefono: "",
  });
  const [dias, setDias] = useState(() => aDias(inicial?.horarios ?? HORARIO_INICIAL));
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  // set("ruc") devuelve la función onChange de ese campo; f transforma lo escrito (ej. el teléfono)
  const set = (campo, f = (v) => v) => (e) => setD((x) => ({ ...x, [campo]: f(e.target.value) }));

  // ---------- Horario ----------
  const cambiarDia = (dia, cambio) => setDias((lista) => lista.map((x) => (x.dia === dia ? { ...x, ...cambio(x) } : x)));

  const alternarDia = (dia) =>
    cambiarDia(dia, (x) => ({
      abre: !x.abre,
      // Si se marca un día que no tenía horas, se le propone 08:00 a 17:00
      turnos: !x.abre && x.turnos.length === 0 ? [{ apertura: "08:00", cierre: "17:00" }] : x.turnos,
    }));

  const cambiarHora = (dia, i, campo, valor) =>
    cambiarDia(dia, (x) => ({ turnos: x.turnos.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)) }));

  const agregarTurno = (dia) => cambiarDia(dia, (x) => ({ turnos: [...x.turnos, { apertura: "14:00", cierre: "18:00" }] }));

  const quitarTurno = (dia, i) => cambiarDia(dia, (x) => ({ turnos: x.turnos.filter((_, j) => j !== i) }));

  // ---------- Enviar ----------
  function validar() {
    const err = {
      razonSocial: d.razonSocial.trim().length < 3 ? "Escribe la razón social." : "",
      nombreComercial: d.nombreComercial.trim().length < 3 ? "Escribe el nombre comercial." : "",
      ruc: /^[A-Z0-9-]{5,20}$/.test(d.ruc.trim().toUpperCase()) ? "" : "Escribe el RUC (solo letras, números y guiones).",
      direccion: d.direccion.trim().length < 5 ? "Escribe la dirección." : "",
      telefono: d.telefono ? validarTelefono(d.telefono) : "",
      correo: validarEmail(d.correo, false),
      horarios: revisarHorario(dias),
    };
    if (esRegistro) {
      err.adminNombre = validarObligatorio(d.adminNombre, "Escribe el nombre del administrador.");
      err.adminCorreo = validarEmail(d.adminCorreo);
      err.adminTelefono = d.adminTelefono ? validarTelefono(d.adminTelefono) : "";
    }
    return err;
  }

  async function enviar(e) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.values(err).some(Boolean)) {
      setAviso("Revisa los campos marcados en rojo.");
      return;
    }
    setAviso("");

    const datos = {
      razonSocial: d.razonSocial.trim(),
      nombreComercial: d.nombreComercial.trim(),
      ruc: d.ruc.trim().toUpperCase(),
      direccion: d.direccion.trim(),
      telefono: d.telefono || null,
      correo: d.correo ? normalizarEmail(d.correo) : null,
      duracionCitaMin: Number(d.duracionCitaMin),
      horarios: aHorarios(dias),
    };
    if (esRegistro) {
      Object.assign(datos, {
        activa: d.activa,
        adminNombre: d.adminNombre.trim(),
        adminCorreo: normalizarEmail(d.adminCorreo),
        adminTelefono: d.adminTelefono || null,
      });
    }

    setGuardando(true);
    const respuesta = await onGuardar(datos);
    setGuardando(false);

    if (!respuesta.ok) {
      // El backend dice qué campo falló (ej. "ruc" si ya existe): se marca ese input
      if (respuesta.campo) setErrores((x) => ({ ...x, [respuesta.campo]: respuesta.error }));
      setAviso(respuesta.error);
    }
  }

  const admin = inicial?.administrador;

  return (
    <form onSubmit={enviar} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-5">
        <Paso numero={1} titulo="Datos generales">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="razonSocial" etiqueta="Razón social" obligatorio value={d.razonSocial} onChange={set("razonSocial")}
              error={errores.razonSocial} placeholder="Nombre legal de la empresa" maxLength={150} />
            <Campo id="nombreComercial" etiqueta="Nombre comercial" obligatorio value={d.nombreComercial} onChange={set("nombreComercial")}
              error={errores.nombreComercial} placeholder="Como la conocen los propietarios" maxLength={120} />
            <Campo id="ruc" etiqueta="RUC" obligatorio value={d.ruc} onChange={set("ruc", (v) => v.toUpperCase())}
              error={errores.ruc} placeholder="J0310000000000" maxLength={20} />
          </div>
          <p className="mt-2 text-xs text-popim-muted">El RUC no se puede repetir en la red.</p>
        </Paso>

        <Paso numero={2} titulo="Contacto y ubicación">
          <div className="grid gap-4">
            <Campo id="direccion" etiqueta="Dirección" obligatorio value={d.direccion} onChange={set("direccion")}
              error={errores.direccion} placeholder="Barrio, referencia y ciudad" maxLength={255} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="telefono" etiqueta="Teléfono" type="tel" value={d.telefono} onChange={set("telefono", formatearTelefono)}
                error={errores.telefono} placeholder="2255-0000" />
              <Campo id="correo" etiqueta="Correo de la clínica" type="email" value={d.correo} onChange={set("correo")}
                error={errores.correo} placeholder="citas@clinica.com" />
            </div>
          </div>
        </Paso>

        <Paso numero={3} titulo="Horario de atención">
          <p className="mb-3 text-sm text-popim-texto">
            Marca los días que abre. Si cierra al mediodía, agrega un segundo turno.
          </p>
          <ul className="flex flex-col divide-y divide-popim-linea">
            {dias.map((x) => (
              <li key={x.dia} className="flex flex-wrap items-center gap-3 py-3">
                <label className="flex min-h-11 w-36 items-center gap-2.5 text-sm font-semibold text-popim-ink">
                  <input type="checkbox" checked={x.abre} onChange={() => alternarDia(x.dia)} className="h-4.5 w-4.5 accent-popim-primary" />
                  {x.nombre}
                </label>

                {!x.abre && <span className="text-sm text-popim-muted">Cerrado</span>}

                {x.abre && (
                  <div className="flex flex-1 flex-wrap items-center gap-2.5">
                    {x.turnos.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-xl border border-popim-linea bg-popim-page py-1 pl-2 pr-1">
                        <input type="time" aria-label={`${x.nombre}: apertura`} value={t.apertura}
                          onChange={(e) => cambiarHora(x.dia, i, "apertura", e.target.value)}
                          className="h-9 rounded-lg border border-popim-linea bg-white px-2 text-sm text-popim-ink" />
                        <span className="text-xs text-popim-muted">a</span>
                        <input type="time" aria-label={`${x.nombre}: cierre`} value={t.cierre}
                          onChange={(e) => cambiarHora(x.dia, i, "cierre", e.target.value)}
                          className="h-9 rounded-lg border border-popim-linea bg-white px-2 text-sm text-popim-ink" />
                        {x.turnos.length > 1 && (
                          <button type="button" onClick={() => quitarTurno(x.dia, i)} aria-label={`Quitar turno del ${x.nombre}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50">
                            <IconTrash size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    {x.turnos.length < 2 && (
                      <button type="button" onClick={() => agregarTurno(x.dia)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-popim-primary/50 px-3 text-[13px] font-semibold text-popim-primary hover:bg-popim-info">
                        <IconPlus size={14} /> Turno
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {errores.horarios && <p role="alert" className="mt-2 text-xs text-red-700">{errores.horarios}</p>}
        </Paso>

        <Paso numero={4} titulo="Agenda">
          <Selector id="duracionCitaMin" etiqueta="Duración de cada cita" obligatorio opciones={DURACIONES}
            value={d.duracionCitaMin} onChange={set("duracionCitaMin")} className="max-w-xs" />
          <p className="mt-2 text-xs text-popim-muted">
            Define el tamaño de los bloques en las agendas. Solo afecta a las citas nuevas.
          </p>
        </Paso>

        <Paso numero={5} titulo="Administrador de la clínica (dueño)">
          {esRegistro ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="adminNombre" etiqueta="Nombre completo" obligatorio value={d.adminNombre} onChange={set("adminNombre")}
                  error={errores.adminNombre} placeholder="Ej.: Andrea Solís" maxLength={160} />
                <Campo id="adminCorreo" etiqueta="Correo" obligatorio type="email" value={d.adminCorreo} onChange={set("adminCorreo")}
                  error={errores.adminCorreo} placeholder="correo@dominio.com" />
                <Campo id="adminTelefono" etiqueta="Teléfono" type="tel" value={d.adminTelefono} onChange={set("adminTelefono", formatearTelefono)}
                  error={errores.adminTelefono} placeholder="8888-8888" />
              </div>
              <div className="mt-4">
                <Aviso>
                  Se crea su cuenta en estado <strong>Pendiente de activación</strong>. Para usarla, entra en
                  «Activar mi cuenta» del login de clínicas con este correo: ahí recibe el código y crea su contraseña.
                  Si el correo ya tiene cuenta en POPIM, se usa esa misma cuenta.
                </Aviso>
              </div>
            </>
          ) : admin ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-popim-page p-4">
              <div>
                <p className="font-semibold text-popim-ink">{admin.nombreCompleto}</p>
                <p className="text-sm text-popim-texto">{admin.correo}{admin.telefono ? ` · ${admin.telefono}` : ""}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADOS_CUENTA[admin.estado]?.clase ?? ""}`}>
                {ESTADOS_CUENTA[admin.estado]?.texto ?? admin.estado}
              </span>
            </div>
          ) : (
            <Aviso tipo="error">Esta clínica no tiene un administrador activo.</Aviso>
          )}
        </Paso>

        {aviso && <Aviso tipo="error">{aviso}</Aviso>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton variante="neutro" href="/super/clinicas">Cancelar</Boton>
          <Boton type="submit" disabled={guardando}>
            {guardando ? "Guardando…" : esRegistro ? "Registrar clínica" : "Guardar cambios"}
          </Boton>
        </div>
      </div>

      {/* Columna derecha */}
      <aside className="flex flex-col gap-5">
        {esRegistro ? (
          <Tarjeta titulo="Estado en la red">
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">Estado de la clínica</legend>
              {[
                { valor: true, titulo: "Activa", texto: "Visible para los propietarios y disponible para citas." },
                { valor: false, titulo: "Inactiva", texto: "Oculta y sin citas nuevas. Útil para preparar todo antes de abrir." },
              ].map((op) => (
                <label key={op.titulo}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${d.activa === op.valor ? "border-2 border-popim-primary bg-popim-info" : "border-popim-linea"}`}>
                  <input type="radio" name="activa" checked={d.activa === op.valor}
                    onChange={() => setD((x) => ({ ...x, activa: op.valor }))} className="mt-1 accent-popim-primary" />
                  <span>
                    <span className="block font-bold text-popim-ink">{op.titulo}</span>
                    <span className="text-[13px] text-popim-texto">{op.texto}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Tarjeta>
        ) : (
          <Tarjeta titulo="Estado en la red">
            <p className="text-sm text-popim-texto">
              Esta clínica está <strong className="text-popim-ink">{inicial?.activa ? "activa" : "inactiva"}</strong>.
              Para cambiarlo usa el interruptor en «Consulta de clínicas».
            </p>
          </Tarjeta>
        )}
      </aside>
    </form>
  );
}