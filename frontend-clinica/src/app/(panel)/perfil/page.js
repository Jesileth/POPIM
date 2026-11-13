"use client";

import { useRef, useState } from "react";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconLock } from "@/Componentes/Iconos";
import { fechaDia, iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { formatearTelefono, validarImagen, validarObligatorio, validarPassword, validarTelefono } from "@/lib/validaciones";
import { useSesion } from "@/contexto/SesionContext";
import { actualizarPerfil, cambiarPassword, obtenerPerfil, quitarFotoPerfil, subirFotoPerfil } from "@/servicios/sesion";

const MAX_PRESENTACION = 500; // perfil_veterinario.presentacion

function Perfil({ usuario, clinica, horario }) {
  // Solo el veterinario tiene personalId + licencia/especialidad, presentación y horario
  const esVeterinario = Boolean(usuario.personalId);
  const [d, setD] = useState({ nombre: usuario.nombreCompleto, telefono: usuario.telefono ?? "", presentacion: usuario.presentacion ?? "" });  const [clave, setClave] = useState({ actual: "", nueva: "", confirmar: "" });
  const { recargar } = useSesion();   // para que el encabezado muestre la foto nueva
  const [foto, setFoto] = useState(usuario.fotoPerfilUrl ?? null);   // la que ya está guardada en la base
  const [avisoFoto, setAvisoFoto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errD, setErrD] = useState({});
  const [errC, setErrC] = useState({});
  const [avisoD, setAvisoD] = useState(null);
  const [avisoC, setAvisoC] = useState(null);
  const archivo = useRef(null);


    // Se sube en cuanto la elige: no espera al botón "Guardar cambios"
  async function elegirFoto(e) {
    const elegido = e.target.files?.[0];
    e.target.value = "";   // así se puede volver a elegir el mismo archivo
    if (!elegido) return;
    const error = validarImagen(elegido);
    if (error) return setAvisoFoto({ tipo: "error", texto: error });

    setSubiendo(true);
    setAvisoFoto(null);
    const r = await subirFotoPerfil(elegido);
    setSubiendo(false);
    if (!r.ok) return setAvisoFoto({ tipo: "error", texto: r.error });
    setFoto(r.datos.url);
    setAvisoFoto({ tipo: "ok", texto: "Foto actualizada." });
    recargar();
  }

  async function quitarFoto() {
    setSubiendo(true);
    const r = await quitarFotoPerfil();
    setSubiendo(false);
    if (!r.ok) return setAvisoFoto({ tipo: "error", texto: r.error });
    setFoto(null);
    setAvisoFoto({ tipo: "ok", texto: "Foto quitada." });
    recargar();
  }

  async function guardar() {
    const e = { nombre: validarObligatorio(d.nombre, "Escribe tu nombre."), telefono: validarTelefono(d.telefono) };
    setErrD(e);
    if (Object.values(e).some(Boolean)) return;
    const r = await actualizarPerfil({
      nombreCompleto: d.nombre.trim(),
      telefono: d.telefono,
      // la presentación solo se manda si es veterinario
      ...(esVeterinario && { presentacion: d.presentacion.trim() }),
    });
    setAvisoD(r.ok ? { tipo: "ok", texto: "Datos actualizados." } : { tipo: "error", texto: r.error });
  }
  async function actualizar() {
    const e = {
      actual: validarObligatorio(clave.actual, "Escribe tu contraseña actual."),
      nueva: validarPassword(clave.nueva),
      confirmar: clave.nueva === clave.confirmar ? "" : "Las contraseñas no coinciden.",
    };
    setErrC(e);
    if (Object.values(e).some(Boolean)) return;
    const r = await cambiarPassword({ actual: clave.actual, nueva: clave.nueva });
    setAvisoC(r.ok ? { tipo: "ok", texto: "Contraseña actualizada." } : { tipo: "error", texto: r.error });
    if (r.ok) setClave({ actual: "", nueva: "", confirmar: "" });
  }
  const setC = (k) => (e) => setClave((x) => ({ ...x, [k]: e.target.value }));
  const fila = (k, v) => <div className="flex justify-between gap-3 py-1.5 text-sm"><dt className="text-popim-muted">{k}</dt><dd className="text-right font-semibold text-popim-ink">{v}</dd></div>;

  return (
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <Tarjeta titulo="Datos personales">
          <div className="flex flex-wrap items-center gap-4">
            {foto ? // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="Tu foto" className="h-24 w-24 rounded-full object-cover" /> : <Avatar texto={iniciales(d.nombre)} tono="oscuro" tamano="xl" />}
           
            <input ref={archivo} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={elegirFoto} />
            <Boton variante="secundario" tamano="sm" onClick={() => archivo.current?.click()} disabled={subiendo}>
              {subiendo ? "Subiendo…" : foto ? "Cambiar foto" : "Subir foto"}
            </Boton>
            {foto && <Boton variante="neutro" tamano="sm" onClick={quitarFoto} disabled={subiendo}>Quitar</Boton>}
          </div>
          {avisoFoto && <div className="mt-3"><Aviso tipo={avisoFoto.tipo}>{avisoFoto.texto}</Aviso>
          </div>}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo id="nombre" etiqueta="Nombre completo" value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} error={errD.nombre} />
            <Campo id="telefono" etiqueta="Teléfono" maxLength={9} value={d.telefono} onChange={(e) => setD({ ...d, telefono: formatearTelefono(e.target.value) })} error={errD.telefono} />
            <Campo id="correo" etiqueta="Correo (para iniciar sesión)" className="sm:col-span-2" value={usuario.correo} readOnly />
            {esVeterinario && (
              <div className="sm:col-span-2">
                <Campo
                  id="presentacion" etiqueta="Presentación" multilinea maxLength={MAX_PRESENTACION}
                  value={d.presentacion} onChange={(e) => setD({ ...d, presentacion: e.target.value })}
                />
                <p className="mt-1 flex justify-between gap-3 text-xs text-popim-muted">
                  <span>Los propietarios la ven al elegir veterinario para su cita. Máximo {MAX_PRESENTACION} caracteres.</span>
                  <span>{d.presentacion.length}/{MAX_PRESENTACION}</span>
                </p>
              </div>
            )}
          </div>
          {avisoD && <div className="mt-4"><Aviso tipo={avisoD.tipo}>{avisoD.texto}</Aviso></div>}
          <div className="mt-4 flex justify-end"><Boton onClick={guardar}>Guardar cambios</Boton></div>
        </Tarjeta>

        <Tarjeta titulo="Cambiar contraseña">
          <div className="grid gap-4 md:grid-cols-3">
            <Campo id="actual" type="password" etiqueta="Contraseña actual" autoComplete="current-password" value={clave.actual} onChange={setC("actual")} error={errC.actual} />
            <Campo id="nueva" type="password" etiqueta="Nueva contraseña" autoComplete="new-password" value={clave.nueva} onChange={setC("nueva")} error={errC.nueva} />
            <Campo id="confirmar" type="password" etiqueta="Confirmar nueva" autoComplete="new-password" value={clave.confirmar} onChange={setC("confirmar")} error={errC.confirmar} />
          </div>
          {avisoC && <div className="mt-4"><Aviso tipo={avisoC.tipo}>{avisoC.texto}</Aviso></div>}
          <div className="mt-4 flex justify-end"><Boton variante="secundario" onClick={actualizar}>Actualizar contraseña</Boton></div>
        </Tarjeta>
      </div>

      {esVeterinario ? (
        <div className="space-y-5">
          <Tarjeta titulo="Datos profesionales">
            <dl className="divide-y divide-popim-linea">
              {fila("Licencia", usuario.licencia)}
              {fila("Especialidad", usuario.especialidad)}
              {fila("Clínica", clinica.nombreComercial)}
              {fila("Ingreso", fechaDia(usuario.fechaIngreso))}
            </dl>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-popim-borde p-3 text-xs text-popim-muted"><IconLock size={13} className="mt-0.5 shrink-0" />La licencia y la especialidad solo las cambia el administrador de la clínica.</p>
          </Tarjeta>

          <Tarjeta titulo="Mi horario">
            <dl className="divide-y divide-popim-linea">
              {(horario ?? []).map((h) => (
                <div key={h.dias} className="flex justify-between gap-3 py-2.5 text-sm">
                  <dt className="font-semibold text-popim-ink">{h.dias}</dt>
                  <dd className={`text-right ${h.tramos.length ? "text-popim-ink" : "text-popim-muted"}`}>
                    {h.tramos.length ? h.tramos.map((t) => `${t.inicio} – ${t.fin}`).join(" · ") : "No atiende"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-popim-muted">Para cambios de horario o vacaciones, habla con el administrador.</p>
          </Tarjeta>
        </div>
      ) : (
      <Tarjeta titulo="Datos laborales">
        <div className="flex items-center gap-3 rounded-xl border border-popim-linea p-3">
          {clinica.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={clinica.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-popim-linea object-cover" />
            : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-popim-info text-xs font-bold text-popim-primary">{iniciales(clinica.nombreComercial)}</span>}          <div className="leading-tight"><p className="font-bold text-popim-ink">{clinica.nombreComercial}</p><p className="text-xs text-popim-muted">{clinica.direccion}</p></div>
        </div>
        <dl className="mt-3 divide-y divide-popim-linea">
          {fila("Rol", usuario.rol)}
          {fila("Ingreso", fechaDia(usuario.fechaIngreso))}
          {fila("Estado", <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">{usuario.estado}</span>)}
          
          {fila("Último acceso", usuario.ultimoAcceso
            ? new Date(usuario.ultimoAcceso).toLocaleString("es-NI", { dateStyle: "medium", timeStyle: "short" })
            : "—")}

        </dl>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-popim-borde p-3 text-xs text-popim-muted"><IconLock size={13} className="mt-0.5 shrink-0" />Solo el administrador de la clínica puede cambiar estos datos.</p>
      </Tarjeta>
      )}
    </div>
  );
}

export default function MiPerfilPage() {
  const { datos, error } = useCarga(obtenerPerfil, []);
  return (
    <>
      <EncabezadoVista titulo="Mi perfil" />
      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}
      {!datos && !error && <div role="status" className="mt-5 h-72 animate-pulse rounded-2xl border border-popim-linea bg-white" />}
      {datos && <Perfil usuario={datos.usuario} clinica={datos.clinica} horario={datos.horario} />}
    </>
  );
}
