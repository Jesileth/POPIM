"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Aviso from "@/Componentes/ui/Aviso";
import Avatar from "@/Componentes/ui/Avatar";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Modal from "@/Componentes/ui/Modal";
import Selector from "@/Componentes/ui/Selector";
import { IconClock, IconLock, IconPlus } from "@/Componentes/Iconos";
import { fechaDia, iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import {
  actualizarDatosProfesionales, cambiarVinculo, desbloquearPersonal, listarEspecialidades, listarPersonal,
} from "@/servicios/administrador";

// Códigos que manda el backend → texto y colores
const ROLES = [
  { valor: "VETERINARIO", texto: "Veterinario" },
  { valor: "RECEPCIONISTA", texto: "Recepcionista" },
  { valor: "ADMINISTRADOR", texto: "Administrador" },
];
const NOMBRE_ROL = Object.fromEntries(ROLES.map((r) => [r.valor, r.texto]));

const CUENTAS = {
  ACTIVO: { texto: "Activa", clase: "bg-emerald-50 text-emerald-800" },
  BLOQUEADO: { texto: "Bloqueada", clase: "bg-red-50 text-red-800" },
  PENDIENTE: { texto: "Pendiente de activación", clase: "bg-popim-pendiente text-popim-pendiente-texto" },
  INACTIVO: { texto: "Inactiva", clase: "bg-slate-100 text-slate-700" },
  PROVISIONAL: { texto: "Provisional", clase: "bg-violet-50 text-violet-800" },
};
const FILTRO_CUENTA = Object.entries(CUENTAS).map(([valor, c]) => ({ valor, texto: c.texto }));
const FILTRO_VINCULO = [
  { valor: "ACTIVO", texto: "Vínculo activo" },
  { valor: "INACTIVO", texto: "Vínculo inactivo" },
];

const momento = (iso) =>
  iso ? new Date(iso).toLocaleString("es-NI", { dateStyle: "medium", timeStyle: "short" }) : "Nunca ha entrado";

function Chip({ clase, children }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${clase}`}>{children}</span>;
}

// ---------- Panel derecho: el detalle de la persona elegida ----------
function Detalle({ p, especialidades, onCambio }) {
  const [prof, setProf] = useState({ licencia: p.licencia ?? "", especialidadId: p.especialidadId ? String(p.especialidadId) : "" });
  const [guardando, setGuardando] = useState("");   // qué acción se está guardando
  const [error, setError] = useState({ texto: "", campo: "" });
  const [confirmar, setConfirmar] = useState(false); // cuadro "¿Desactivar vínculo?"
  const cuenta = CUENTAS[p.cuenta] ?? { texto: p.cuenta, clase: "" };

  // Ejecuta una acción del backend, muestra su error o avisa a la página para recargar
  async function ejecutar(nombre, accion, textoOk) {
    setGuardando(nombre);
    setError({ texto: "", campo: "" });
    const respuesta = await accion();
    setGuardando("");
    setConfirmar(false);
    if (!respuesta.ok) {
      setError({ texto: respuesta.error, campo: respuesta.campo ?? "" });
      return;
    }
    onCambio(textoOk);
  }

  const guardarProfesional = () =>
    ejecutar("profesional", () => actualizarDatosProfesionales(p.personalId, {
      licencia: prof.licencia.trim(),
      especialidadId: prof.especialidadId ? Number(prof.especialidadId) : null,
    }), "Los datos profesionales quedaron guardados.");

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-popim-linea bg-white p-5">
      <div className="flex items-center gap-3">
        <Avatar texto={iniciales(p.nombreCompleto)} tono="oscuro" tamano="lg" />
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-popim-ink">{p.nombreCompleto}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip clase="bg-popim-info text-popim-primary">{NOMBRE_ROL[p.rol] ?? p.rol}</Chip>
            <Chip clase={cuenta.clase}>{cuenta.texto}</Chip>
            {!p.vinculoActivo && <Chip clase="bg-slate-100 text-slate-700">Vínculo inactivo</Chip>}
          </div>
        </div>
      </div>

      {p.cuenta === "BLOQUEADO" && (
        <Aviso tipo="error">
          <strong>Cuenta bloqueada</strong> tras {p.intentosFallidos} intentos fallidos. La recuperación de contraseña
          por correo no la desbloquea: solo tú (o POPIM) puedes hacerlo.
        </Aviso>
      )}
      {p.cuenta === "PENDIENTE" && (
        <Aviso>
          Todavía no activa su cuenta. Debe entrar en <strong>«Activar mi cuenta»</strong> del login de clínicas con su
          correo: ahí recibe el código y crea su contraseña.
        </Aviso>
      )}

      <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        <dt className="text-popim-texto">Correo</dt><dd className="break-all font-semibold text-popim-ink">{p.correo ?? "—"}</dd>
        <dt className="text-popim-texto">Teléfono</dt><dd className="font-semibold text-popim-ink">{p.telefono ?? "—"}</dd>
        <dt className="text-popim-texto">En la clínica desde</dt><dd className="font-semibold text-popim-ink">{fechaDia(p.fechaIngreso)}</dd>
        <dt className="text-popim-texto">Último acceso</dt><dd className="font-semibold text-popim-ink">{momento(p.ultimoAcceso)}</dd>
      </dl>

      {/* Solo el administrador cambia licencia y especialidad (el veterinario no, desde Mi perfil) */}
      {p.rol === "VETERINARIO" && (
        <div className="flex flex-col gap-3 border-t border-popim-linea pt-4">
          <h3 className="text-sm font-bold text-popim-ink">Datos profesionales</h3>
          <Campo id="licencia" etiqueta="Número de licencia" value={prof.licencia}
            onChange={(e) => setProf((x) => ({ ...x, licencia: e.target.value.toUpperCase() }))}
            error={error.campo === "licencia" ? error.texto : ""} />
          <Selector id="especialidad" etiqueta="Especialidad" vacio="Sin especialidad"
            opciones={especialidades.map((e) => ({ valor: String(e.id), texto: e.nombre }))}
            value={prof.especialidadId} onChange={(e) => setProf((x) => ({ ...x, especialidadId: e.target.value }))} />
          <Boton variante="neutro" onClick={guardarProfesional} disabled={guardando === "profesional" || prof.licencia.trim().length < 3}>
            {guardando === "profesional" ? "Guardando…" : "Guardar datos profesionales"}
          </Boton>
        </div>
      )}

      {error.texto && !error.campo && <Aviso tipo="error">{error.texto}</Aviso>}

      <div className="flex flex-col gap-2.5 border-t border-popim-linea pt-4">
        {p.cuenta === "BLOQUEADO" && (
          <Boton onClick={() => ejecutar("desbloquear", () => desbloquearPersonal(p.personalId), `La cuenta de ${p.nombreCompleto} quedó desbloqueada.`)}
            disabled={guardando === "desbloquear"}>
            <IconLock size={16} /> {guardando === "desbloquear" ? "Desbloqueando…" : "Desbloquear cuenta"}
          </Boton>
        )}
        {p.vinculoActivo && (
          <Boton variante="neutro" href={`/admin-horarios?persona=${p.personalId}`}>
            <IconClock size={16} /> Ver y editar su horario
          </Boton>
        )}
        {/* Nadie puede desactivarse a sí mismo */}
        {p.vinculoActivo && !p.esYo && (
          <Boton variante="peligro" onClick={() => setConfirmar(true)}>Desactivar vínculo con la clínica</Boton>
        )}
        {!p.vinculoActivo && (
          <Boton variante="neutro" onClick={() => ejecutar("reactivar", () => cambiarVinculo(p.personalId, true), `${p.nombreCompleto} vuelve a estar activo en tu clínica.`)}
            disabled={guardando === "reactivar"}>
            {guardando === "reactivar" ? "Reactivando…" : "Reactivar vínculo"}
          </Boton>
        )}
        <p className="text-xs leading-relaxed text-popim-muted">
          Desactivar el vínculo no borra a la persona ni su historial: las consultas y dosis que firmó siguen a su nombre.
          Úsalo cuando renuncia o se traslada a otra clínica.
        </p>
      </div>

      {confirmar && (
        <Modal
          titulo={`¿Desactivar a ${p.nombreCompleto}?`}
          onCerrar={() => setConfirmar(false)}
          pie={
            <>
              <Boton variante="neutro" onClick={() => setConfirmar(false)}>Cancelar</Boton>
              <Boton variante="emergencia" disabled={guardando === "desactivar"}
                onClick={() => ejecutar("desactivar", () => cambiarVinculo(p.personalId, false), `${p.nombreCompleto} ya no está activo en tu clínica.`)}>
                {guardando === "desactivar" ? "Desactivando…" : "Desactivar vínculo"}
              </Boton>
            </>
          }
        >
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-popim-texto">
            <li>Ya no podrá entrar al portal de tu clínica ni aparecerá en la agenda.</li>
            <li>Su historial (consultas, dosis, recetas) se conserva.</li>
            <li>Si tiene citas pendientes, primero hay que reprogramarlas o cancelarlas.</li>
            <li>Puedes reactivarlo cuando quieras.</li>
          </ul>
        </Modal>
      )}
    </section>
  );
}

// ---------- La página ----------
function Contenido() {
  const parametros = useSearchParams();
  const [texto, setTexto] = useState("");
  const [rol, setRol] = useState("");
  const [cuenta, setCuenta] = useState("");
  const [vinculo, setVinculo] = useState("ACTIVO");
  const [elegidoId, setElegidoId] = useState(null);
  const [mensaje, setMensaje] = useState(() => {
    const vinculado = parametros.get("vinculado");
    return vinculado ? `${vinculado} quedó vinculado a tu clínica.` : "";
  });

  const { datos, error, cargando, recargar } = useCarga(() => listarPersonal(), []);
  const { datos: datosEsp } = useCarga(() => listarEspecialidades(), []);
  const personal = useMemo(() => datos?.personal ?? [], [datos]);

  // El personal de una clínica es poco: se filtra aquí mismo, sin volver a pedirlo al servidor
  const filtrados = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return personal.filter((p) =>
      (!q || [p.nombreCompleto, p.correo, p.licencia].some((v) => v?.toLowerCase().includes(q))) &&
      (!rol || p.rol === rol) &&
      (!cuenta || p.cuenta === cuenta) &&
      (!vinculo || (vinculo === "ACTIVO") === p.vinculoActivo)
    );
  }, [personal, texto, rol, cuenta, vinculo]);

  // Si todavía no eligió a nadie, se muestra a la primera persona bloqueada (lo más urgente)
  // o a la primera de la lista. Se calcula aquí, sin guardarlo en otro estado.
  const elegido = personal.find((p) => p.personalId === elegidoId)
    ?? filtrados.find((p) => p.cuenta === "BLOQUEADO") ?? filtrados[0] ?? null;

  function alCambiar(textoOk) {
    setMensaje(textoOk);
    recargar(); // vuelve a pedir la lista: el estado de la persona viene del servidor
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        subtitulo="Personal › Consulta de personal"
        titulo="Personal de la clínica"
        descripcion="Personas vinculadas a tu clínica. Solo el administrador desbloquea cuentas y cambia la licencia o la especialidad de un veterinario."
      >
        <Boton href="/admin-personal/vincular"><IconPlus size={16} /> Vincular personal</Boton>
      </EncabezadoVista>

      {mensaje && <Aviso tipo="ok">{mensaje}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="grid gap-3 rounded-2xl border border-popim-linea bg-white p-4 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-end">
        <Buscador value={texto} onChange={setTexto} placeholder="Nombre, correo o número de licencia" />
        <Selector id="rol" opciones={ROLES} vacio="Todos los roles" value={rol} onChange={(e) => setRol(e.target.value)} />
        <Selector id="cuenta" opciones={FILTRO_CUENTA} vacio="Todas las cuentas" value={cuenta} onChange={(e) => setCuenta(e.target.value)} />
        <Selector id="vinculo" opciones={FILTRO_VINCULO} vacio="Activos e inactivos" value={vinculo} onChange={(e) => setVinculo(e.target.value)} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="overflow-x-auto rounded-2xl border border-popim-linea bg-white">
          <table className="w-full min-w-2xl text-left text-sm">
            <thead className="border-b border-popim-linea text-xs uppercase tracking-wide text-popim-texto">
              <tr>
                <th scope="col" className="px-5 py-3 font-bold">Persona</th>
                <th scope="col" className="px-3 py-3 font-bold">Rol</th>
                <th scope="col" className="px-3 py-3 font-bold">Licencia · especialidad</th>
                <th scope="col" className="px-3 py-3 font-bold">Cuenta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-popim-linea">
              {cargando && <tr><td colSpan={4} className="px-5 py-8 text-center text-popim-texto">Cargando personal…</td></tr>}
              {!cargando && filtrados.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-popim-texto">No hay personas con esos filtros.</td></tr>
              )}
              {!cargando && filtrados.map((p) => {
                const c = CUENTAS[p.cuenta] ?? { texto: p.cuenta, clase: "" };
                const activo = p.personalId === elegido?.personalId;
                return (
                  <tr key={p.personalId} className={activo ? "bg-popim-info" : ""}>
                    <td className="px-5 py-3">
                      {/* Un botón (y no un clic en la fila) para que también funcione con el teclado */}
                      <button type="button" onClick={() => { setElegidoId(p.personalId); setMensaje(""); }}
                        aria-pressed={activo} className="flex w-full items-center gap-3 text-left">
                        <Avatar texto={iniciales(p.nombreCompleto)} tono="oscuro" tamano="sm" />
                        <span className="min-w-0">
                          <span className="block font-bold text-popim-ink">{p.nombreCompleto}{p.esYo && " (tú)"}</span>
                          <span className="block break-all text-xs text-popim-texto">{p.correo}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-popim-ink">{NOMBRE_ROL[p.rol] ?? p.rol}</td>
                    <td className="px-3 py-3 text-popim-texto">
                      {p.licencia ? <>{p.licencia}<br /><span className="text-xs">{p.especialidad ?? "Sin especialidad"}</span></> : "—"}
                    </td>
                    <td className="px-3 py-3"><Chip clase={c.clase}>{c.texto}</Chip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {elegido ? (
          // key: al elegir a otra persona, el panel se vuelve a crear con SUS datos
          <Detalle key={`${elegido.personalId}-${elegido.licencia}-${elegido.especialidadId}`} p={elegido}
            especialidades={datosEsp?.especialidades ?? []} onCambio={alCambiar} />
        ) : (
          !cargando && <p className="text-sm text-popim-texto">Elige a una persona para ver sus datos.</p>
        )}
      </div>
    </div>
  );
}

// useSearchParams necesita Suspense (si no, "pnpm build" falla)
export default function PersonalPage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}