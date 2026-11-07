"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import { InsigniaCuenta } from "@/Componentes/ui/Insignia";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconPlus } from "@/Componentes/Iconos";
import { coincide } from "@/lib/busqueda";
import { formatearEdad, iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { formatearCedula, formatearTelefono, validarCedula, validarEmail, validarObligatorio, validarTelefono } from "@/lib/validaciones";
import { actualizarPropietario, listarPropietarios, obtenerPropietario, reenviarCodigo } from "@/servicios/propietarios";

function FormularioPropietario({ propietario, onGuardado }) {
  const editable = propietario.estado !== "ACTIVO";
  const [d, setD] = useState({
    nombreCompleto: propietario.nombreCompleto, telefono: propietario.telefono, cedula: propietario.cedula ?? "",
    correo: propietario.correo ?? "", direccion: propietario.direccion ?? "",
  });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [cargando, setCargando] = useState("");
  const set = (k, f = (v) => v) => (e) => setD((x) => ({ ...x, [k]: f(e.target.value) }));
  const ro = { readOnly: !editable };

  async function guardar() {
    const err = {
      nombreCompleto: validarObligatorio(d.nombreCompleto, "Escribe el nombre."),
      telefono: validarTelefono(d.telefono),
      cedula: d.cedula ? validarCedula(d.cedula) : "",
      correo: validarEmail(d.correo, false),
    };
    setErrores(err);
    setAviso(null);
    if (Object.values(err).some(Boolean)) return;
    setCargando("guardar");
    const r = await actualizarPropietario(propietario.id, { ...d, cedula: d.cedula || null, correo: d.correo || null });
    setCargando("");
    if (!r.ok) return setAviso({ tipo: "error", texto: r.error });
    setAviso({ tipo: "ok", texto: "Datos actualizados." });
    onGuardado();
  }
  async function reenviar() {
    setCargando("codigo");
    setAviso(null);
    const r = await reenviarCodigo(propietario.id);
    setCargando("");
    setAviso(r.ok ? { tipo: "ok", texto: `Código enviado a ${r.datos.enviadoA}.` } : { tipo: "error", texto: r.error });
  }

  return (
    <Tarjeta>
      <div className="flex items-center gap-4">
        <Avatar texto={iniciales(propietario.nombreCompleto)} tono="oscuro" tamano="lg" />
        <div>
          <h2 className="text-2xl font-bold text-popim-ink">{propietario.nombreCompleto}</h2>
          <InsigniaCuenta estado={propietario.estado} className="mt-1" />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-popim-aviso-borde bg-popim-info/60 px-4 py-3 text-sm text-popim-texto">
        {editable
          ? "Registrado por la clínica y sin activar todavía: puedes corregir sus datos. Cuando el propietario active su cuenta, solo él podrá cambiarlos."
          : "La cuenta está activa: solo el propietario puede cambiar sus datos."}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Campo id="nombre" etiqueta="Nombre completo" value={d.nombreCompleto} onChange={set("nombreCompleto")} error={errores.nombreCompleto} {...ro} />
        <Campo id="telefono" etiqueta="Teléfono" value={d.telefono} onChange={set("telefono", formatearTelefono)} error={errores.telefono} maxLength={9} {...ro} />
        <Campo id="cedula" etiqueta="Cédula" placeholder="Sin registrar" value={d.cedula} onChange={set("cedula", formatearCedula)} error={errores.cedula} maxLength={16} {...ro} />
        <Campo id="correo" etiqueta="Correo" type="email" placeholder="Sin registrar" value={d.correo} onChange={set("correo")} error={errores.correo} {...ro} />
        <Campo id="direccion" etiqueta="Dirección" placeholder="Sin registrar" className="md:col-span-3" value={d.direccion} onChange={set("direccion")} {...ro} />
      </div>

      {aviso && <div className="mt-4"><Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso></div>}
      {editable && (
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <Boton variante="secundario" onClick={reenviar} disabled={!!cargando}>{cargando === "codigo" ? "Enviando..." : "Reenviar código de activación"}</Boton>
          <Boton onClick={guardar} disabled={!!cargando}>{cargando === "guardar" ? "Guardando..." : "Guardar cambios"}</Boton>
        </div>
      )}
    </Tarjeta>
  );
}

function Detalle({ id, onGuardado }) {
  const { datos, error } = useCarga(() => obtenerPropietario(id), [id]);
  if (error) return <Aviso tipo="error">{error}</Aviso>;
  if (!datos) return <div role="status" className="h-80 animate-pulse rounded-2xl border border-popim-linea bg-white" />;
  return (
    <div className="space-y-5">
      <FormularioPropietario key={id} propietario={datos.propietario} onGuardado={onGuardado} />
      <Tarjeta titulo="Mascotas" acciones={<Boton variante="enlace" href={`/mascotas/registrar?propietario=${id}`} className="font-semibold"><IconPlus size={12} /> Agregar mascota</Boton>}>
        {datos.mascotas.length === 0 && <p className="text-sm text-popim-muted">Este propietario aún no tiene mascotas.</p>}
        <ul className="space-y-2">
          {datos.mascotas.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-popim-linea p-3">
              <Avatar texto={m.nombre[0]} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-popim-ink">{m.nombre} <span className="ml-1 rounded bg-popim-info px-1.5 py-0.5 font-mono text-[11px] text-popim-primary">{m.codigoUnico}</span></p>
                <p className="text-xs text-popim-muted">{m.especie} · {m.raza} · {m.sexo === "MACHO" ? "Macho" : "Hembra"} · {formatearEdad(m.edadActualMeses)}</p>
              </div>
              <Boton variante="secundario" tamano="sm" href="/agenda">Agendar cita</Boton>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}

function Contenido() {
  const params = useSearchParams();
  const { datos, error, recargar } = useCarga(listarPropietarios, []);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(params.get("id") || "");
  const todos = datos?.propietarios ?? [];
  const lista = todos.filter((p) => coincide(q, p.nombreCompleto, p.cedula, p.telefono, p.correo, ...p.codigosMascotas));
  const actual = todos.find((p) => p.id === sel) ?? lista[0];

  return (
    <>
      <EncabezadoVista titulo="Consulta de propietarios">
        <Boton href="/propietarios/registrar"><IconPlus size={14} /> Registrar propietario</Boton>
      </EncabezadoVista>
      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[340px_1fr]">
        <Tarjeta className="space-y-3">
          <Buscador value={q} onChange={setQ} placeholder="Nombre, cédula, teléfono o PET" />
          <ul className="max-h-80 space-y-1 overflow-y-auto xl:max-h-none">
            {lista.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setSel(p.id)} aria-pressed={actual?.id === p.id}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${actual?.id === p.id ? "border-popim-primary bg-popim-info/60" : "border-transparent hover:bg-popim-page"}`}>
                  <Avatar texto={iniciales(p.nombreCompleto)} tono="oscuro" />
                  <span className="min-w-0 flex-1 text-sm leading-tight">
                    <b className="block truncate text-popim-ink">{p.nombreCompleto}</b>
                    <span className="text-xs text-popim-muted">{p.telefono} · {p.totalMascotas} {p.totalMascotas === 1 ? "mascota" : "mascotas"}</span>
                    <span className="mt-1 block 2xl:hidden"><InsigniaCuenta estado={p.estado} /></span>
                  </span>
                  <InsigniaCuenta estado={p.estado} className="hidden shrink-0 2xl:inline-flex" />
                </button>
              </li>
            ))}
            {datos && lista.length === 0 && <li className="py-4 text-center text-sm text-popim-muted">Sin resultados.</li>}
          </ul>
        </Tarjeta>
        {actual ? <Detalle key={actual.id} id={actual.id} onGuardado={recargar} /> : <Tarjeta punteada><p className="text-sm text-popim-muted">Elige un propietario de la lista.</p></Tarjeta>}
      </div>
    </>
  );
}

export default function PropietariosPage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}
