"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import { InsigniaEstado } from "@/Componentes/ui/Insignia";
import ModalMotivo from "@/Componentes/ui/ModalMotivo";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { fechaCorta, fechaHoraCorta, fechaLargaHora, formatearEdad } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { cancelarCita, confirmarCita, obtenerCita } from "@/servicios/citas";

export default function DetalleCitaPage() {
  const { id } = useParams();
  const { datos, error, recargar } = useCarga(() => obtenerCita(id), [id]);
  const [cancelando, setCancelando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const c = datos?.cita;

  const volver = <Boton href="/citas/confirmacion" variante="enlace" className="mb-1">← Volver a confirmación de citas</Boton>;
  if (error) return <>{volver}<Aviso tipo="error">{error}</Aviso></>;
  if (!c) return <div role="status" className="h-64 animate-pulse rounded-2xl border border-popim-linea bg-white" />;

  const abierta = ["SOLICITADA", "CONFIRMADA"].includes(c.estado) && !c.esEmergencia;
  async function confirmar() {
    setErrorAccion("");
    const r = await confirmarCita(c.id);
    if (!r.ok) return setErrorAccion(r.error);
    recargar();
  }
  async function cancelar(motivo) {
    const r = await cancelarCita(c.id, motivo);
    if (r.ok) { setCancelando(false); recargar(); }
    return r;
  }
  const etiqueta = (t) => <p className="text-xs text-popim-muted">{t}</p>;

  return (
    <>
      {volver}
      <EncabezadoVista
        titulo={<span className="flex flex-wrap items-center gap-3">Cita de {c.mascota.nombre} <InsigniaEstado codigo={c.estado} /></span>}
        descripcion={c.creadaPor === "PROPIETARIO" ? `Pedida por el propietario desde su portal el ${fechaLargaHora(c.solicitadaEl)}.` : "Registrada por recepción."} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Tarjeta titulo="Datos de la cita">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-popim-info/60 p-3">{etiqueta("Fecha y hora")}<p className="font-bold text-popim-ink">{fechaCorta(c.fecha)} · {c.horaInicio} – {c.horaFin}</p></div>
              <div className="rounded-xl bg-popim-info/60 p-3">{etiqueta("Veterinario")}<p className="font-bold text-popim-ink">{c.veterinario.nombreCompleto}</p><p className="text-xs text-popim-muted">{c.veterinario.especialidad}</p></div>
            </div>
            <div className="mt-4">{etiqueta("Motivo de la consulta")}<p className="text-sm text-popim-ink">{c.motivoConsulta}</p></div>
            {c.motivoCancelacion && <div className="mt-3">{etiqueta("Motivo de la cancelación")}<p className="text-sm text-popim-ink">{c.motivoCancelacion}</p></div>}
          </Tarjeta>

          <Tarjeta titulo="Mascota">
            <div className="flex items-center gap-3">
              <Avatar texto={c.mascota.nombre[0]} tamano="lg" />
              <div><p className="font-bold text-popim-ink">{c.mascota.nombre}</p><p className="font-mono text-[11px] font-bold text-popim-muted">{c.mascota.codigoUnico}</p></div>
            </div>
            <p className="mt-3 text-sm text-popim-muted">{c.mascota.especie} · {c.mascota.raza} · {c.mascota.sexo === "MACHO" ? "Macho" : "Hembra"} · {formatearEdad(c.mascota.edadActualMeses)}</p>
          </Tarjeta>

          <Tarjeta titulo="Propietario">
            <p className="font-bold text-popim-ink">{c.propietario.nombreCompleto}</p>
            <p className="mt-1 text-sm text-popim-muted">{c.propietario.telefono}</p>
            {c.propietario.correo && <p className="text-sm text-popim-muted">{c.propietario.correo}</p>}
            <Boton variante="enlace" href={`/propietarios?id=${c.propietario.id}`} className="mt-2 font-semibold">Ver propietario →</Boton>
          </Tarjeta>
        </div>

        <aside className="space-y-5">
          <Tarjeta titulo="Acciones">
            <div className="space-y-2.5">
              {c.estado === "SOLICITADA" && <Boton className="w-full" onClick={confirmar}>Confirmar cita</Boton>}
              {abierta && <Boton variante="secundario" className="w-full" href={`/citas/reprogramacion?cita=${c.id}`}>Reprogramar</Boton>}
              {abierta && <Boton variante="peligro" className="w-full" onClick={() => setCancelando(true)}>Cancelar cita</Boton>}
              {!abierta && <p className="text-sm text-popim-muted">Esta cita ya no admite acciones.</p>}
            </div>
            {errorAccion && <div className="mt-3"><Aviso tipo="error">{errorAccion}</Aviso></div>}
          </Tarjeta>

          <Tarjeta titulo="Historial">
            <ol className="space-y-3">
              {c.historial.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                  <div><p className="font-bold text-popim-ink">{h.titulo}</p><p className="text-xs text-popim-muted">{h.detalle} · {fechaHoraCorta(h.fecha)}</p></div>
                </li>
              ))}
              {c.estado === "SOLICITADA" && (
                <li className="flex gap-3 text-sm text-popim-muted"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-popim-etiqueta" />Pendiente de confirmar</li>
              )}
            </ol>
          </Tarjeta>
        </aside>
      </div>

      {cancelando && (
        <ModalMotivo titulo="Cancelar cita" etiqueta="Motivo de la cancelación" textoConfirmar="Cancelar cita"
          descripcion="Se le avisará al propietario y el bloque quedará libre." onCerrar={() => setCancelando(false)} onConfirmar={cancelar} />
      )}
    </>
  );
}
