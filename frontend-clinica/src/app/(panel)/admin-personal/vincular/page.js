"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Paso from "@/Componentes/ui/Paso";
import Selector from "@/Componentes/ui/Selector";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { IconSearch } from "@/Componentes/Iconos";
import { useCarga } from "@/lib/useCarga";
import { formatearTelefono, normalizarEmail, validarEmail, validarObligatorio, validarTelefono } from "@/lib/validaciones";
import { buscarPorCorreo, listarEspecialidades, vincularPersonal } from "@/servicios/administrador";

const ROLES = [
  { valor: "RECEPCIONISTA", titulo: "Recepcionista", texto: "Agenda, recepción del día, propietarios, mascotas y confirmación de citas." },
  { valor: "VETERINARIO", titulo: "Veterinario", texto: "Su agenda, consultas, expediente, recetas, dosis y exámenes." },
  { valor: "ADMINISTRADOR", titulo: "Administrador", texto: "Personal, horarios, bloqueos y datos de la clínica." },
];

export default function VincularPersonalPage() {
  const router = useRouter();
  const { datos: datosEsp } = useCarga(() => listarEspecialidades(), []);

  // Paso 1: el correo y lo que respondió el backend al buscarlo
  const [correo, setCorreo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Pasos 2 y 3
  const [d, setD] = useState({ nombre: "", telefono: "", rol: "VETERINARIO", licencia: "", especialidadId: "", presentacion: "" });
  const [irAHorario, setIrAHorario] = useState(true);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  const set = (campo, f = (v) => v) => (e) => setD((x) => ({ ...x, [campo]: f(e.target.value) }));

  const existe = resultado?.existe;
  const puede = resultado?.puedeVincular;
  const rolFijo = resultado?.rolActual ?? null;           // si ya tiene un rol del portal, se queda con ese
  const yaEsVeterinario = Boolean(resultado?.licencia);   // ya tiene licencia: no se vuelve a pedir

  async function buscar() {
    const errorCorreo = validarEmail(correo);
    setErrores({ correo: errorCorreo });
    setAviso("");
    if (errorCorreo) return;

    setBuscando(true);
    const respuesta = await buscarPorCorreo(normalizarEmail(correo));
    setBuscando(false);
    if (!respuesta.ok) {
      setErrores({ correo: respuesta.error });
      return;
    }
    const r = respuesta.datos;
    setResultado(r);
    // Si la persona ya tiene cuenta, se usan SUS datos (los cambia ella desde Mi perfil)
    setD((x) => ({
      ...x,
      nombre: r.existe ? r.nombreCompleto : "",
      telefono: r.existe ? r.telefono ?? "" : "",
      rol: r.rolActual ?? x.rol,
    }));
  }

  function validar() {
    const err = {};
    if (!existe) {
      err.nombre = validarObligatorio(d.nombre, "Escribe el nombre completo.");
      err.telefono = d.telefono ? validarTelefono(d.telefono) : "";
    }
    if (d.rol === "VETERINARIO" && !yaEsVeterinario) {
      err.licencia = d.licencia.trim().length < 3 ? "Escribe el número de licencia." : "";
    }
    return err;
  }

  async function guardar(e) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.values(err).some(Boolean)) {
      setAviso("Revisa los campos marcados en rojo.");
      return;
    }
    setAviso("");
    setGuardando(true);
    const respuesta = await vincularPersonal({
      correo: normalizarEmail(correo),
      nombreCompleto: d.nombre.trim(),
      telefono: d.telefono || null,
      rol: d.rol,
      licencia: d.rol === "VETERINARIO" ? d.licencia.trim() || null : null,
      especialidadId: d.rol === "VETERINARIO" && d.especialidadId ? Number(d.especialidadId) : null,
      presentacion: d.rol === "VETERINARIO" ? d.presentacion.trim() || null : null,
    });
    setGuardando(false);

    if (!respuesta.ok) {
      if (respuesta.campo) setErrores((x) => ({ ...x, [respuesta.campo]: respuesta.error }));
      setAviso(respuesta.error);
      return;
    }
    // Recién vinculado: o directo a asignarle horario, o de vuelta a la lista con el aviso verde
    router.push(irAHorario
      ? `/admin-horarios?persona=${respuesta.datos.personalId}`
      : `/admin-personal?vinculado=${encodeURIComponent(d.nombre.trim())}`);
  }

  const nombreRol = ROLES.find((r) => r.valor === d.rol)?.titulo.toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        subtitulo="Personal › Vincular personal"
        titulo="Vincular personal"
        descripcion="Primero busca por correo. Si la persona ya tiene cuenta en POPIM solo se vincula; si no existe, se crea su cuenta y la persona la activa desde «Activar mi cuenta»."
      />

      <form onSubmit={guardar} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <Paso numero={1} titulo="Buscar por correo">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Campo id="correo" etiqueta="Correo electrónico" obligatorio type="email" className="flex-1"
                value={correo} placeholder="nombre@correo.com" error={errores.correo}
                // Si cambia el correo, la búsqueda anterior ya no vale
                onChange={(e) => { setCorreo(e.target.value); setResultado(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }} />
              <Boton variante="neutro" onClick={buscar} disabled={buscando}>
                <IconSearch size={16} /> {buscando ? "Buscando…" : "Buscar"}
              </Boton>
            </div>
            <div className="mt-3">
              {resultado && !existe && (
                <Aviso>
                  <strong>Este correo no está registrado en POPIM.</strong> Completa sus datos: la cuenta se crea en estado
                  Pendiente de activación y la persona la activa desde «Activar mi cuenta».
                </Aviso>
              )}
              {existe && puede && (
                <Aviso tipo="ok">
                  <strong>Encontramos a {resultado.nombreCompleto}.</strong>{" "}
                  {resultado.estuvoAqui ? "Ya trabajó en tu clínica: se reactivará su vínculo." : "Se vinculará con su cuenta actual."}{" "}
                  Conserva su contraseña y su historial.
                </Aviso>
              )}
              {existe && !puede && <Aviso tipo="error">{resultado.motivo}</Aviso>}
            </div>
          </Paso>

          {/* Los pasos 2 y 3 solo se muestran cuando ya se buscó y se puede vincular */}
          {resultado && puede && (
            <>
              <Paso numero={2} titulo="Datos de la persona">
                {existe && <p className="mb-3 text-xs text-popim-muted">Ya tiene cuenta: estos datos solo se muestran; los cambia ella desde Mi perfil.</p>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="nombre" etiqueta="Nombre completo" obligatorio value={d.nombre} onChange={set("nombre")}
                    readOnly={existe} error={errores.nombre} placeholder="Ej.: María José Castillo" maxLength={160} />
                  <Campo id="telefono" etiqueta="Teléfono" type="tel" value={d.telefono} onChange={set("telefono", formatearTelefono)}
                    readOnly={existe} error={errores.telefono} placeholder="8888-8888" />
                </div>
              </Paso>

              <Paso numero={3} titulo="Rol en tu clínica">
                <p className="mb-3 text-xs text-popim-muted">
                  {rolFijo ? "Esta persona ya tiene un rol en el portal de clínicas: se vincula con ese mismo." : "Define qué menú y qué permisos tendrá al entrar al portal."}
                </p>
                <div role="radiogroup" aria-label="Rol" className="grid gap-3 sm:grid-cols-3">
                  {ROLES.map((r) => {
                    const elegido = d.rol === r.valor;
                    const bloqueado = rolFijo && rolFijo !== r.valor;
                    return (
                      <button key={r.valor} type="button" role="radio" aria-checked={elegido} disabled={Boolean(bloqueado)}
                        onClick={() => setD((x) => ({ ...x, rol: r.valor }))}
                        className={`flex flex-col gap-1 rounded-xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          elegido ? "border-2 border-popim-primary bg-popim-info" : "border-popim-linea hover:bg-popim-page"
                        }`}>
                        <span className="text-sm font-bold text-popim-ink">{r.titulo}</span>
                        <span className="text-xs leading-relaxed text-popim-texto">{r.texto}</span>
                      </button>
                    );
                  })}
                </div>
                {errores.rol && <p role="alert" className="mt-2 text-xs text-red-700">{errores.rol}</p>}

                {d.rol === "VETERINARIO" && (
                  <div className="mt-5 flex flex-col gap-4 border-t border-popim-linea pt-4">
                    <h3 className="text-sm font-bold text-popim-ink">Datos profesionales del veterinario</h3>
                    {yaEsVeterinario ? (
                      <p className="text-sm text-popim-texto">Ya está registrado como veterinario con la licencia <strong className="text-popim-ink">{resultado.licencia}</strong>.</p>
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Campo id="licencia" etiqueta="Número de licencia" obligatorio value={d.licencia}
                            onChange={set("licencia", (v) => v.toUpperCase())} error={errores.licencia} placeholder="Ej.: VET-1234" maxLength={40} />
                          <Selector id="especialidad" etiqueta="Especialidad" vacio="Sin especialidad"
                            opciones={(datosEsp?.especialidades ?? []).map((x) => ({ valor: String(x.id), texto: x.nombre }))}
                            value={d.especialidadId} onChange={set("especialidadId")} />
                        </div>
                        <p className="-mt-2 text-xs text-popim-muted">La licencia no se puede repetir en toda la red.</p>
                        <Campo id="presentacion" etiqueta="Presentación" multilinea rows={3} maxLength={500}
                          value={d.presentacion} onChange={set("presentacion")}
                          placeholder="Breve texto que verá el propietario al elegir veterinario (máximo 500 letras)" />
                      </>
                    )}
                  </div>
                )}
              </Paso>

              {aviso && <Aviso tipo="error">{aviso}</Aviso>}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex min-h-11 items-center gap-2 text-sm text-popim-texto">
                  <input type="checkbox" checked={irAHorario} onChange={(e) => setIrAHorario(e.target.checked)} className="h-4 w-4 accent-popim-primary" />
                  Ir a asignar su horario al terminar
                </label>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Boton variante="neutro" href="/admin-personal">Cancelar</Boton>
                  <Boton type="submit" disabled={guardando}>
                    {guardando ? "Guardando…" : existe ? "Vincular a mi clínica" : "Crear cuenta y vincular"}
                  </Boton>
                </div>
              </div>
            </>
          )}
        </div>

        <aside>
          <Tarjeta titulo="Qué pasará al guardar">
            <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-sm leading-relaxed text-popim-texto">
              {existe ? (
                <>
                  <li>No se crea una cuenta nueva: se usa la que ya tiene.</li>
                  <li>Se crea (o reactiva) su vínculo con tu clínica como {nombreRol}.</li>
                  <li>Desde ese momento ve tu clínica al entrar al portal.</li>
                </>
              ) : (
                <>
                  <li>Se crea la cuenta en estado Pendiente de activación.</li>
                  <li>Se crea su vínculo con tu clínica como {nombreRol}.</li>
                  <li>Avísale que entre en «Activar mi cuenta» del login de clínicas con este correo.</li>
                  <li>Ahí recibe el código, crea su contraseña y la cuenta pasa a Activa.</li>
                </>
              )}
            </ol>
            <p className="mt-4 border-t border-popim-linea pt-3 text-xs leading-relaxed text-popim-muted">
              Una persona del personal trabaja en una sola clínica a la vez. Si viene de otra clínica, esa clínica
              debe desactivar su vínculo primero; su historial no se pierde.
            </p>
          </Tarjeta>
        </aside>
      </form>
    </div>
  );
}