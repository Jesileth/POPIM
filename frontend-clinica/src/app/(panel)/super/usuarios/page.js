
//

"use client";

import { useEffect, useState } from "react";
import Aviso from "@/Componentes/ui/Aviso";
import Avatar from "@/Componentes/ui/Avatar";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import Selector from "@/Componentes/ui/Selector";
import { IconLock } from "@/Componentes/Iconos";
import { iniciales } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { desbloquearUsuario, listarUsuarios } from "@/servicios/super";

// Pestañas: valor = estado que se manda al backend ("" = todas)
const PESTANAS = [
  { valor: "", texto: "Todas", total: "TODOS" },
  { valor: "BLOQUEADO", texto: "Bloqueadas", total: "BLOQUEADO" },
  { valor: "PENDIENTE", texto: "Pendientes de activación", total: "PENDIENTE" },
  { valor: "PROVISIONAL", texto: "Provisionales", total: "PROVISIONAL" },
];

const ROLES = [
  { valor: "PROPIETARIO", texto: "Propietario" },
  { valor: "RECEPCIONISTA", texto: "Recepcionista" },
  { valor: "VETERINARIO", texto: "Veterinario" },
  { valor: "ADMINISTRADOR", texto: "Administrador" },
  { valor: "SUPER_ADMIN", texto: "Super Administrador" },
];
const NOMBRE_ROL = Object.fromEntries(ROLES.map((r) => [r.valor, r.texto]));

const ESTADOS = {
  ACTIVO: { texto: "Activa", clase: "bg-emerald-50 text-emerald-800" },
  BLOQUEADO: { texto: "Bloqueada", clase: "bg-red-50 text-red-800" },
  PENDIENTE: { texto: "Pendiente de activación", clase: "bg-popim-pendiente text-popim-pendiente-texto" },
  PROVISIONAL: { texto: "Provisional", clase: "bg-violet-50 text-violet-800" },
  INACTIVO: { texto: "Inactiva", clase: "bg-slate-100 text-slate-700" },
};

const formatoMomento = (iso) =>
  iso ? new Date(iso).toLocaleString("es-NI", { dateStyle: "medium", timeStyle: "short" }) : "Nunca";

export default function UsuariosPage() {
  const [pestana, setPestana] = useState("");
  const [rol, setRol] = useState("");
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [desbloqueando, setDesbloqueando] = useState(null); // id de la cuenta que se está guardando
  const [mensaje, setMensaje] = useState(null);

  // Igual que en Clínicas: espera 350 ms después de la última letra
  useEffect(() => {
    const espera = setTimeout(() => setBusqueda(texto), 350);
    return () => clearTimeout(espera);
  }, [texto]);

  const { datos, error, cargando, recargar } = useCarga(
    () => listarUsuarios({ q: busqueda, rol, estado: pestana }),
    [busqueda, rol, pestana]
  );
  const usuarios = datos?.usuarios ?? [];
  const totales = datos?.totales ?? {};

  async function desbloquear(usuario) {
    setDesbloqueando(usuario.id);
    setMensaje(null);
    const respuesta = await desbloquearUsuario(usuario.id);
    setDesbloqueando(null);
    if (!respuesta.ok) {
      setMensaje({ tipo: "error", texto: respuesta.error });
      return;
    }
    setMensaje({
      tipo: "ok",
      texto: `La cuenta de ${usuario.nombreCompleto} quedó desbloqueada. Sus intentos fallidos volvieron a 0 y ya puede iniciar sesión.`,
    });
    recargar();
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoVista
        titulo="Usuarios y accesos"
        descripcion="Busca cualquier cuenta de la red. Desde aquí se desbloquean propietarios y personal; recuperar la contraseña por correo no desbloquea una cuenta."
      />

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      {/* Pestañas por estado, con cuántas cuentas hay en cada una */}
      <div role="tablist" aria-label="Estado de las cuentas" className="flex flex-wrap gap-2">
        {PESTANAS.map((p) => {
          const activa = pestana === p.valor;
          return (
            <button key={p.texto} type="button" role="tab" aria-selected={activa} onClick={() => setPestana(p.valor)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                activa ? "border-2 border-popim-primary bg-popim-info text-popim-ink" : "border border-popim-linea bg-white text-popim-ink hover:bg-popim-page"
              }`}>
              {p.texto}
              <span className="inline-flex min-w-6 justify-center rounded-full bg-popim-ink px-2 py-0.5 text-xs font-bold text-white">
                {totales[p.total] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-popim-linea bg-white p-4 sm:flex-row sm:items-center">
        <Buscador value={texto} onChange={setTexto} placeholder="Buscar por nombre, correo, teléfono o cédula" className="flex-1" />
        <Selector id="rol" opciones={ROLES} vacio="Todos los roles" value={rol}
          onChange={(e) => setRol(e.target.value)} className="sm:w-56" />
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}

      <section className="overflow-x-auto rounded-2xl border border-popim-linea bg-white">
        <table className="w-full min-w-240 text-left text-sm">
          <thead className="border-b border-popim-linea text-xs uppercase tracking-wide text-popim-texto">
            <tr>
              <th scope="col" className="px-5 py-3 font-bold">Usuario</th>
              <th scope="col" className="px-3 py-3 font-bold">Rol</th>
              <th scope="col" className="px-3 py-3 font-bold">Clínica</th>
              <th scope="col" className="px-3 py-3 font-bold">Estado</th>
              <th scope="col" className="px-3 py-3 font-bold">Último acceso</th>
              <th scope="col" className="px-5 py-3 font-bold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-popim-linea">
            {cargando && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-popim-texto">Cargando cuentas…</td></tr>
            )}
            {!cargando && usuarios.length === 0 && !error && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-popim-texto">No hay cuentas con esos filtros.</td></tr>
            )}
            {!cargando && usuarios.map((u) => {
              const estado = ESTADOS[u.estado] ?? { texto: u.estado, clase: "" };
              return (
                <tr key={u.id} className="align-middle">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar texto={iniciales(u.nombreCompleto)} tono="oscuro" tamano="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-popim-ink">{u.nombreCompleto}</p>
                        <p className="break-all text-xs text-popim-texto">
                          {[u.correo, u.telefono, u.cedula].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-popim-ink">{u.roles.map((r) => NOMBRE_ROL[r] ?? r).join(", ")}</td>
                  <td className="px-3 py-3 text-popim-texto">{u.clinica ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estado.clase}`}>{estado.texto}</span>
                    {u.estado === "BLOQUEADO" && (
                      <p className="mt-1 text-xs text-popim-texto">{u.intentosFallidos} intentos fallidos</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-popim-texto">{formatoMomento(u.ultimoAcceso)}</td>
                  <td className="px-5 py-3">
                    {u.estado === "BLOQUEADO" ? (
                      <Boton tamano="sm" onClick={() => desbloquear(u)} disabled={desbloqueando === u.id}>
                        <IconLock size={14} /> {desbloqueando === u.id ? "Desbloqueando…" : "Desbloquear"}
                      </Boton>
                    ) : (
                      <span className="text-xs text-popim-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-xs leading-relaxed text-popim-muted">
        Se muestran hasta 200 cuentas; usa el buscador para encontrar una en particular. Las cuentas
        <strong> pendientes</strong> se activan cuando la persona usa «Activar mi cuenta»; las <strong>provisionales</strong>{" "}
        las crea la recepción para propietarios sin credenciales.
      </p>
    </div>
  );
}