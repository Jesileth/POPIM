"use client";

import { useState } from "react";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Selector from "@/Componentes/ui/Selector";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconUpload } from "@/Componentes/Iconos";
import { useSesion } from "@/contexto/SesionContext";
import { iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { formatearTelefono, validarEmail, validarImagen, validarTelefono } from "@/lib/validaciones";
import { guardarMiClinica, obtenerMiClinica, quitarLogo, subirLogo } from "@/servicios/administrador";

const DIAS = [
  { dia: "LUNES", nombre: "Lunes" }, { dia: "MARTES", nombre: "Martes" }, { dia: "MIERCOLES", nombre: "Miércoles" },
  { dia: "JUEVES", nombre: "Jueves" }, { dia: "VIERNES", nombre: "Viernes" }, { dia: "SABADO", nombre: "Sábado" },
  { dia: "DOMINGO", nombre: "Domingo" },
];
const DURACIONES = [30, 45, 60].map((m) => ({ valor: String(m), texto: `${m} minutos` }));

// Los turnos de un día como texto: "08:00 – 12:00 y 14:00 – 18:00" o "Cerrado"
const horasDelDia = (horario, dia) => {
  const turnos = horario.filter((h) => h.dia === dia);
  return turnos.length ? turnos.map((h) => `${h.apertura} – ${h.cierre}`).join(" y ") : "Cerrado";
};

// El día de hoy como en el ENUM (getDay: 0 = domingo)
const HOY = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"][new Date().getDay()];

// ---------- Logo ----------
function Logo({ inicial, nombre }) {
  const { recargar } = useSesion();   // para que el encabezado muestre el logo nuevo sin recargar la página
  const [logoUrl, setLogoUrl] = useState(inicial);
  const [mensaje, setMensaje] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  async function elegir(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";   // así se puede volver a elegir el mismo archivo
    if (!archivo) return;
    const error = validarImagen(archivo);
    if (error) return setMensaje({ tipo: "error", texto: error });

    setSubiendo(true);
    setMensaje(null);
    const respuesta = await subirLogo(archivo);
    setSubiendo(false);
    if (!respuesta.ok) return setMensaje({ tipo: "error", texto: respuesta.error });
    setLogoUrl(respuesta.datos.logoUrl);
    setMensaje({ tipo: "ok", texto: "Logo actualizado." });
    recargar();
  }

  async function quitar() {
    setSubiendo(true);
    const respuesta = await quitarLogo();
    setSubiendo(false);
    if (!respuesta.ok) return setMensaje({ tipo: "error", texto: respuesta.error });
    setLogoUrl(null);
    setMensaje({ tipo: "ok", texto: "Logo quitado. Se mostrarán las iniciales de la clínica." });
    recargar();
  }

  return (
    <Tarjeta titulo="Logo">
      <div className="flex flex-wrap items-center gap-5">
        {logoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={logoUrl} alt={`Logo de ${nombre}`} className="h-24 w-24 rounded-2xl border border-popim-linea object-cover" />
          : <div aria-hidden="true" className="flex h-24 w-24 items-center justify-center rounded-2xl border border-popim-linea bg-popim-info text-2xl font-extrabold text-popim-primary">{iniciales(nombre)}</div>}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* El <label> abre el selector de archivos; el input queda escondido pero accesible */}
            <label className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-popim-primary px-4 text-sm font-semibold text-white hover:bg-popim-primary-dark focus-within:ring-4 focus-within:ring-popim-primary/30 ${subiendo ? "pointer-events-none opacity-60" : ""}`}>
              <IconUpload size={16} /> {subiendo ? "Subiendo…" : logoUrl ? "Cambiar logo" : "Subir logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={elegir} disabled={subiendo} />
            </label>
            {logoUrl && <Boton variante="enlace" onClick={quitar} disabled={subiendo}>Quitar</Boton>}
          </div>
          <p className="mt-2 text-xs text-popim-texto">JPG, PNG o WebP · máximo 2 MB · mejor si es cuadrado. Se muestra junto al nombre de la clínica en los dos portales.</p>
        </div>
      </div>
      {mensaje && <div className="mt-3"><Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso></div>}
    </Tarjeta>
  );
}

// ---------- Formulario (con los datos ya cargados) ----------
function Formulario({ clinica }) {
  const original = {
    telefono: clinica.telefono,
    correo: clinica.correo,
    duracionCitaMin: String(clinica.duracionCitaMin),
  };
  const [datos, setDatos] = useState(original);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(original);   // lo último que quedó en la base (para "Descartar")

  const cambiar = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: "" }));
    setMensaje(null);
  };
  const hayCambios = JSON.stringify(datos) !== JSON.stringify(guardado);

  async function guardar(e) {
    e.preventDefault();
    // Teléfono y correo son opcionales: solo se revisan si escribieron algo
    const err = {
      telefono: datos.telefono.trim() ? validarTelefono(datos.telefono) : "",
      correo: validarEmail(datos.correo, false),
    };
    setErrores(err);
    if (err.telefono || err.correo) return;

    setGuardando(true);
    const respuesta = await guardarMiClinica({
      telefono: datos.telefono.trim(),
      correo: datos.correo.trim(),
      duracionCitaMin: Number(datos.duracionCitaMin),   // el <select> da texto; el backend espera número
    });
    setGuardando(false);
    if (!respuesta.ok) {
      if (respuesta.campo) setErrores({ [respuesta.campo]: respuesta.error });
      else setMensaje({ tipo: "error", texto: respuesta.error });
      return;
    }
    const nuevo = { telefono: respuesta.datos.telefono, correo: respuesta.datos.correo, duracionCitaMin: String(respuesta.datos.duracionCitaMin) };
    setDatos(nuevo);
    setGuardado(nuevo);
    setMensaje({ tipo: "ok", texto: "Cambios guardados." });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <Logo inicial={clinica.logoUrl} nombre={clinica.nombreComercial} />

        <Tarjeta titulo="Datos generales" acciones={<span className="rounded-full bg-popim-page px-2.5 py-1 text-xs font-semibold text-popim-texto">Solo lectura · lo administra POPIM</span>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo id="razon" etiqueta="Razón social" value={clinica.razonSocial} readOnly />
            <Campo id="nombre" etiqueta="Nombre comercial" value={clinica.nombreComercial} readOnly />
            <Campo id="ruc" etiqueta="RUC" value={clinica.ruc} readOnly />
            <Campo id="estado" etiqueta="Estado en la red" value={clinica.activa ? "Activa · visible para propietarios" : "Inactiva"} readOnly />
            <Campo id="direccion" etiqueta="Dirección" value={clinica.direccion} readOnly className="sm:col-span-2" />
          </div>
          <p className="mt-3 text-xs text-popim-texto">Si algún dato está mal, pide la corrección al equipo de POPIM.</p>
        </Tarjeta>

        <form onSubmit={guardar} noValidate className="flex flex-col gap-6">
          <Tarjeta titulo="Contacto">
            <p className="-mt-2 mb-4 text-xs text-popim-texto">Aparece en la ficha de la clínica y en los correos de citas.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo id="telefono" etiqueta="Teléfono" inputMode="tel" placeholder="2222-2222" value={datos.telefono} error={errores.telefono}
                onChange={(e) => cambiar("telefono", formatearTelefono(e.target.value))} />
              <Campo id="correo" etiqueta="Correo de la clínica" type="email" placeholder="contacto@clinica.com" value={datos.correo} error={errores.correo}
                onChange={(e) => cambiar("correo", e.target.value)} />
            </div>
          </Tarjeta>

          <Tarjeta titulo="Agenda">
            <Selector id="duracion" etiqueta="Duración de cada cita" opciones={DURACIONES} vacio="Elige la duración"
              value={datos.duracionCitaMin} error={errores.duracionCitaMin} onChange={(e) => cambiar("duracionCitaMin", e.target.value)} />
            <p className="mt-2 text-xs text-popim-texto">Define el tamaño de cada bloque en las agendas. Solo aplica a las citas nuevas: las ya agendadas conservan su hora.</p>
          </Tarjeta>

          {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" disabled={!hayCambios || guardando}
              onClick={() => { setDatos(guardado); setErrores({}); setMensaje(null); }}>Descartar</Boton>
            <Boton type="submit" disabled={!hayCambios || guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</Boton>
          </div>
        </form>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <Tarjeta titulo="Horario de atención" acciones={<span className="text-xs text-popim-texto">Lo administra POPIM</span>}>
          {clinica.horario.length === 0
            ? <p className="text-sm text-popim-texto">Todavía no hay horario registrado.</p>
            : (
              <dl className="flex flex-col gap-2.5 text-sm">
                {DIAS.map(({ dia, nombre }) => (
                  <div key={dia} className="flex justify-between gap-3">
                    <dt className="text-popim-texto">{nombre}</dt>
                    <dd className="text-right font-bold text-popim-ink">{horasDelDia(clinica.horario, dia)}</dd>
                  </div>
                ))}
              </dl>
            )}
        </Tarjeta>

        <Tarjeta titulo="Vista para el propietario">
          <p className="-mt-2 mb-4 text-xs text-popim-texto">Así aparece al elegir clínica en «Solicitar cita».</p>
          <div className="rounded-xl border border-popim-linea p-4">
            <b className="text-sm text-popim-ink">{clinica.nombreComercial}</b>
            <p className="mt-1 text-xs text-popim-texto">{clinica.direccion}</p>
            <p className="mt-2 text-xs text-popim-texto">
              {datos.telefono || "Sin teléfono"} · Hoy {horasDelDia(clinica.horario, HOY).toLowerCase()}
            </p>
            <p className="mt-2 text-xs font-semibold text-popim-primary">
              {clinica.veterinariosActivos} {clinica.veterinariosActivos === 1 ? "veterinario" : "veterinarios"}
            </p>
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}

// ---------- La página ----------
export default function MiClinicaPage() {
  const { datos, error, cargando } = useCarga(() => obtenerMiClinica(), []);
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        titulo="Mi clínica"
        descripcion="Así se presenta tu clínica a los propietarios. Los datos legales y el horario de atención los registra POPIM."
      />
      {cargando && <p className="text-sm text-popim-texto">Cargando…</p>}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {datos && <Formulario clinica={datos} />}
    </div>
  );
}