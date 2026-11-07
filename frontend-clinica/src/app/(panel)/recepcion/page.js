"use client";

import { useState } from "react";
import Boton from "@/Componentes/ui/Boton";
import Aviso from "@/Componentes/ui/Aviso";
import Buscador from "@/Componentes/ui/Buscador";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import ModalMotivo from "@/Componentes/ui/ModalMotivo";
import Selector from "@/Componentes/ui/Selector";
import TarjetaCitaKanban from "@/Componentes/Citas/TarjetaCitaKanban";
import TarjetaResumen from "@/Componentes/Citas/TarjetaResumen";
import { IconWarning } from "@/Componentes/Iconos";
import { coincide } from "@/lib/busqueda";
import { fechaCompleta, hoyISO } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { listarVeterinarios } from "@/servicios/agenda";
import { cancelarCita, citasDelDia, confirmarCita } from "@/servicios/citas";

const COLUMNAS = [
  { codigo: "SOLICITADA", titulo: "Solicitadas", punto: "bg-amber-500" },
  { codigo: "CONFIRMADA", titulo: "Confirmadas", punto: "bg-popim-primary" },
  { codigo: "ATENCION", titulo: "En curso", punto: "bg-emerald-600" },
  { codigo: "COMPLETADA", titulo: "Finalizadas", punto: "bg-emerald-600" },
];

export default function RecepcionHoyPage() {
  const hoy = hoyISO();
  const { datos, error, recargar } = useCarga(() => citasDelDia(hoy), [hoy]);
  const { datos: dv } = useCarga(listarVeterinarios, []);
  const [q, setQ] = useState("");
  const [vetId, setVetId] = useState("");
  const [cancelar, setCancelar] = useState(null);
  const [errorAccion, setErrorAccion] = useState("");

  const todas = datos?.citas ?? [];
  const activas = todas.filter((c) => c.estado !== "CANCELADA");
  const visibles = activas.filter((c) => coincide(q, c.mascota.nombre, c.propietario.nombreCompleto, c.mascota.codigoUnico) && (!vetId || c.veterinario.id === vetId));
  const por = (codigo) => visibles.filter((c) => c.estado === codigo)
    .sort((a, b) => Number(b.esEmergencia) - Number(a.esEmergencia) || a.horaInicio.localeCompare(b.horaInicio));
  const cuenta = (codigo) => activas.filter((c) => c.estado === codigo).length;
  const ocupados = new Set(activas.filter((c) => c.estado === "ATENCION").map((c) => c.veterinario.id)).size;

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
      <EncabezadoVista subtitulo={fechaCompleta(hoy)} titulo="Recepción de hoy">
        <Buscador value={q} onChange={setQ} placeholder="Mascota, propietario o PET" className="w-full sm:w-64" />
        <Selector id="vet" vacio="Todos los veterinarios" className="w-full sm:w-56" opciones={(dv?.veterinarios ?? []).map((v) => ({ valor: v.id, texto: v.nombreCompleto }))} value={vetId} onChange={(e) => setVetId(e.target.value)} />
        <Boton href="/agenda/nueva-cita?tipo=emergencia" variante="emergencia"><IconWarning size={15} /> Emergencia</Boton>
      </EncabezadoVista>

      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}
      {errorAccion && <div className="mt-4"><Aviso tipo="error">{errorAccion}</Aviso></div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TarjetaResumen punto="bg-popim-ink" titulo="Citas de hoy" valor={activas.length}
          pie={`${activas.filter((c) => c.esEmergencia).length} emergencia · ${todas.length - activas.length} cancelada`} />
        <TarjetaResumen punto="bg-amber-500" titulo="Por confirmar" valor={cuenta("SOLICITADA")} pie="Ir a confirmación →" destacada href="/citas/confirmacion" />
        <TarjetaResumen punto="bg-popim-primary" titulo="Pendientes" valor={cuenta("CONFIRMADA")} pie="Confirmadas, aún no pasan" />
        <TarjetaResumen punto="bg-emerald-600" titulo="En consulta" valor={cuenta("ATENCION")} pie={`${ocupados} de ${datos?.totalVeterinarios ?? 0} veterinarios ocupados`} />
        <TarjetaResumen punto="bg-emerald-600" titulo="Atendidas" valor={cuenta("COMPLETADA")} pie="Finalizadas hoy" />
      </div>

      <div className="mt-5 grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {COLUMNAS.map((col) => {
          const citas = por(col.codigo);
          return (
            <section key={col.codigo} className="rounded-2xl bg-popim-info/70 p-3">
              <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-bold text-popim-ink">
                <span className={`h-2.5 w-2.5 rounded-full ${col.punto}`} />
                <span className="flex-1">{col.titulo}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs">{citas.length}</span>
              </h2>
              <div className="space-y-3">
                {citas.map((c) => <TarjetaCitaKanban key={c.id} cita={c} onConfirmar={confirmar} onCancelar={setCancelar} />)}
                {citas.length === 0 && <p className="px-1 py-4 text-center text-xs text-popim-muted">Sin citas</p>}
              </div>
            </section>
          );
        })}
      </div>

      {cancelar && (
        <ModalMotivo key={cancelar.id} titulo="Cancelar cita" etiqueta="Motivo de la cancelación" textoConfirmar="Cancelar cita"
          descripcion={`${cancelar.mascota.nombre} · ${cancelar.horaInicio} · ${cancelar.veterinario.nombreCompleto}. El bloque quedará libre.`}
          onCerrar={() => setCancelar(null)} onConfirmar={confirmarCancelacion} />
      )}
    </>
  );
}
