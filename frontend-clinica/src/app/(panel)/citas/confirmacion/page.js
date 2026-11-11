"use client";

import { useState } from "react";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import ModalMotivo from "@/Componentes/ui/ModalMotivo";
import Selector from "@/Componentes/ui/Selector";
import { IconInfo } from "@/Componentes/Iconos";
import { coincide } from "@/lib/busqueda";
import { diaRelativo, hoyISO, pedida, sumarDias } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { listarVeterinarios } from "@/servicios/agenda";
import { cancelarCita, citasSolicitadas, confirmarCita } from "@/servicios/citas";

const RANGOS = [{ valor: "7", texto: "Próximos 7 días" }, { valor: "hoy", texto: "Hoy" }, { valor: "todas", texto: "Todas" }];
const FILA = "grid grid-cols-[110px_1.3fr_1.2fr_1fr_1.5fr_auto] items-center gap-4 px-5";

export default function ConfirmacionPage() {
  const { datos, error, recargar } = useCarga(citasSolicitadas, []);
  const { datos: dv } = useCarga(listarVeterinarios, []);
  const [q, setQ] = useState("");
  const [rango, setRango] = useState("7");
  const [vetId, setVetId] = useState("");
  const [cancelar, setCancelar] = useState(null);
  const [errorAccion, setErrorAccion] = useState("");

  const hoy = hoyISO();
  const todas = datos?.citas ?? [];
  const citas = todas.filter((c) =>
    coincide(q, c.mascota.nombre, c.propietario.nombreCompleto, c.mascota.codigoUnico) &&
    (!vetId || c.veterinario.id === vetId) &&
    (rango === "todas" || (rango === "hoy" ? c.fecha === hoy : c.fecha <= sumarDias(hoy, 6))));

  async function confirmar(c) {
    setErrorAccion("");
    const r = await confirmarCita(c.id);
    if (!r.ok) return setErrorAccion(r.error);
    recargar();
  }
  async function confirmarCancelacion(motivo) {
    const r = await cancelarCita(cancelar.id, motivo);
    if (r.ok) { setCancelar(null); recargar(); }
    return r;
  }

  return (
    <>
      <EncabezadoVista titulo="Confirmación de citas" descripcion="Citas que los propietarios solicitaron desde su portal y esperan respuesta.">
        <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-800">{todas.length} por confirmar</span>
      </EncabezadoVista>

      <p className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-popim-borde px-4 py-3 text-sm text-popim-texto">
        <IconInfo size={15} className="shrink-0 text-popim-muted" />
        Las emergencias no aparecen aquí: se registran ya confirmadas y no se pueden confirmar, reprogramar ni cancelar.
      </p>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-popim-linea bg-white p-3 md:flex-row">
        <Buscador className="flex-1" value={q} onChange={setQ} placeholder="Mascota, propietario o PET" />
        <Selector id="rango" vacio="Todas" className="md:w-48" opciones={RANGOS.slice(0, 2)} value={rango === "todas" ? "" : rango} onChange={(e) => setRango(e.target.value || "todas")} />
        <Selector id="vet" vacio="Todos los veterinarios" className="md:w-56" opciones={(dv?.veterinarios ?? []).map((v) => ({ valor: v.id, texto: v.nombreCompleto }))} value={vetId} onChange={(e) => setVetId(e.target.value)} />
      </div>

      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}
      {errorAccion && <div className="mt-4"><Aviso tipo="error">{errorAccion}</Aviso></div>}

      {!datos && !error && <div role="status" className="mt-4 h-40 animate-pulse rounded-2xl bg-white" />}
      {datos && citas.length === 0 && <p className="mt-4 rounded-2xl border border-popim-linea bg-white p-8 text-center text-sm text-popim-muted">No hay citas por confirmar con esos filtros.</p>}

      {/* Móvil y tablet: tarjetas */}
      <ul className="mt-4 space-y-3 2xl:hidden">
        {citas.map((c) => (
          <li key={c.id} className="rounded-2xl border border-popim-linea bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar texto={c.mascota.nombre[0]} />
                <div className="min-w-0 leading-tight"><p className="truncate font-bold text-popim-ink">{c.mascota.nombre}</p><p className="truncate text-xs text-popim-muted">{c.mascota.especie} · {c.mascota.raza}</p></div>
              </div>
              <p className="shrink-0 text-right text-sm font-bold leading-tight text-popim-ink">{diaRelativo(c.fecha)}<br />{c.horaInicio}</p>
            </div>
            <p className="mt-3 text-sm text-popim-texto"><b className="text-popim-ink">{c.propietario.nombreCompleto}</b> · {c.propietario.telefono}</p>
            <p className="text-sm text-popim-texto">{c.veterinario.nombreCompleto}</p>
            <p className="mt-1 text-sm text-popim-ink">{c.motivoConsulta}<span className="block text-xs text-popim-muted">{pedida(c.solicitadaEl)}</span></p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Boton variante="enlace" href={`/citas/${c.id}`} className="font-semibold">Detalle</Boton>
              <div className="ml-auto flex gap-2">
                <Boton variante="neutro" tamano="sm" onClick={() => setCancelar(c)}>Cancelar</Boton>
                <Boton tamano="sm" onClick={() => confirmar(c)}>Confirmar</Boton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pantallas muy anchas: tabla */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-popim-linea bg-white 2xl:block">
        <div className={`${FILA} border-b border-popim-linea py-3 text-[11px] font-bold uppercase tracking-wide text-popim-muted`}>
          <span>Fecha</span><span>Mascota</span><span>Propietario</span><span>Veterinario</span><span>Motivo</span><span className="text-right">Acciones</span>
        </div>
        {citas.map((c) => (
          <div key={c.id} className={`${FILA} border-b border-popim-linea py-3.5 last:border-0`}>
            <div className="text-sm font-bold leading-tight text-popim-ink">{diaRelativo(c.fecha)}<br /><span className="font-semibold">{c.horaInicio}</span></div>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar texto={c.mascota.nombre[0]} />
              <div className="min-w-0 leading-tight"><p className="truncate font-bold text-popim-ink">{c.mascota.nombre}</p><p className="truncate text-xs text-popim-muted">{c.mascota.especie} · {c.mascota.raza}</p></div>
            </div>
            <div className="min-w-0 text-sm leading-tight"><p className="truncate font-bold text-popim-ink">{c.propietario.nombreCompleto}</p><p className="text-xs text-popim-muted">{c.propietario.telefono}</p></div>
            <span className="text-sm text-popim-texto">{c.veterinario.nombreCompleto}</span>
            <div className="text-sm leading-tight"><p className="text-popim-texto">{c.motivoConsulta}</p><p className="text-xs text-popim-muted">{pedida(c.solicitadaEl)}</p></div>
            <div className="flex items-center justify-end gap-2">
              <Boton variante="enlace" href={`/citas/${c.id}`} className="font-semibold">Detalle</Boton>
              <Boton variante="neutro" tamano="sm" onClick={() => setCancelar(c)}>Cancelar</Boton>
              <Boton tamano="sm" onClick={() => confirmar(c)}>Confirmar</Boton>
            </div>
          </div>
        ))}
      </div>

      {cancelar && (
        <ModalMotivo key={cancelar.id} titulo="Rechazar cita" etiqueta="Motivo" textoConfirmar="Cancelar cita"
          descripcion={`${cancelar.mascota.nombre} · ${diaRelativo(cancelar.fecha)} ${cancelar.horaInicio}. Se le avisará al propietario.`}
          onCerrar={() => setCancelar(null)} onConfirmar={confirmarCancelacion} />
      )}
    </>
  );
}
