"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Buscador from "@/Componentes/ui/Buscador";
import Campo from "@/Componentes/ui/Campo";
import EncabezadoVista from "@/Componentes/ui/EncabezadoVista";
import { InsigniaEstado } from "@/Componentes/ui/Insignia";
import Selector from "@/Componentes/ui/Selector";
import Tarjeta from "@/Componentes/ui/Tarjeta";
import { coincide } from "@/lib/busqueda";
import { fechaCorta, fechaLarga, hoyISO, sumarDias } from "@/lib/formato";
import { useCarga } from "@/lib/useCarga";
import { listarVeterinarios, obtenerDisponibilidad } from "@/servicios/agenda";
import { citasReprogramables, reprogramarCita } from "@/servicios/citas";

function Formulario({ cita, vets, onListo }) {
  const [vetId, setVetId] = useState(cita.veterinario.id);
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 2));
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { datos } = useCarga(() => obtenerDisponibilidad(vetId, fecha), [vetId, fecha]);
  const bloques = datos?.bloques ?? [];

  async function guardar() {
    const err = { hora: hora ? "" : "Elige un bloque disponible.", motivo: motivo.trim().length >= 5 ? "" : "Escribe el motivo (mínimo 5 caracteres)." };
    setErrores(err);
    setErrorGeneral("");
    if (Object.values(err).some(Boolean)) return;
    setEnviando(true);
    const r = await reprogramarCita(cita.id, { veterinarioId: vetId, fecha, horaInicio: hora, motivo: motivo.trim() });
    setEnviando(false);
    if (!r.ok) { setHora(""); return setErrorGeneral(r.error); }
    onListo();
  }

  return (
    <Tarjeta>
      <div className="flex items-center gap-3 border-b border-popim-linea pb-4">
        <Avatar texto={cita.mascota.nombre[0]} />
        <div>
          <p className="text-lg font-bold text-popim-ink">{cita.mascota.nombre}</p>
          <p className="text-xs text-popim-muted">Actual: <s>{fechaCorta(cita.fecha)} · {cita.horaInicio}</s> · {cita.veterinario.nombreCompleto}</p>
        </div>
      </div>

      <h2 className="mt-5 text-lg font-bold text-popim-ink">Nuevo horario</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Selector id="vet" etiqueta="Veterinario" vacio="Elige un veterinario" opciones={vets.map((v) => ({ valor: v.id, texto: `${v.nombreCompleto} · ${v.especialidad}` }))}
          value={vetId} onChange={(e) => { setVetId(e.target.value); setHora(""); }} />
        <Campo id="fecha" etiqueta="Fecha" type="date" min={hoyISO()} value={fecha} onChange={(e) => { setFecha(e.target.value); setHora(""); }} />
      </div>

      <p className="mt-5 text-sm font-semibold text-popim-ink">Bloques disponibles · {fecha ? fechaLarga(fecha).toLowerCase() : ""}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {bloques.map((b) => (
          <button key={b.horaInicio} type="button" disabled={!b.disponible} aria-pressed={hora === b.horaInicio}
            onClick={() => { setHora(b.horaInicio); setErrores((e) => ({ ...e, hora: "" })); }}
            className={`h-10 min-w-20 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:line-through ${hora === b.horaInicio ? "border-popim-primary bg-popim-primary text-white" : "border-popim-linea bg-white text-popim-ink hover:border-popim-primary/60"}`}>
            {b.horaInicio}
          </button>
        ))}
        {datos && bloques.length === 0 && <p className="text-sm text-popim-muted">Este veterinario no atiende ese día.</p>}
      </div>
      {errores.hora && <p role="alert" className="mt-2 text-xs text-red-700">{errores.hora}</p>}

      <Campo id="motivoRep" etiqueta="Motivo de la reprogramación" obligatorio multilinea className="mt-5" maxLength={255}
        placeholder="Ej. La propietaria pidió cambiar el día por trabajo" value={motivo} onChange={(e) => setMotivo(e.target.value)} error={errores.motivo} />
      <p className="mt-1 text-xs text-popim-muted">Queda en el historial de la cita y se le avisa al propietario.</p>

      {errorGeneral && <div className="mt-4"><Aviso tipo="error">{errorGeneral}</Aviso></div>}
      <div className="mt-5 flex flex-col gap-3 rounded-xl bg-popim-info/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-popim-texto">{hora ? <>Nuevo: <b className="text-popim-ink">{fechaCorta(fecha)} · {hora}</b></> : "Elige un bloque"}</p>
        <Boton onClick={guardar} disabled={enviando}>{enviando ? "Guardando..." : "Guardar reprogramación"}</Boton>
      </div>
    </Tarjeta>
  );
}

function Contenido() {
  const params = useSearchParams();
  const { datos, error, recargar } = useCarga(citasReprogramables, []);
  const { datos: dv } = useCarga(listarVeterinarios, []);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(params.get("cita") || "");
  const [aviso, setAviso] = useState("");

  const todas = datos?.citas ?? [];
  const lista = todas.filter((c) => coincide(q, c.mascota.nombre, c.propietario.nombreCompleto, c.mascota.codigoUnico));
  const cita = todas.find((c) => c.id === sel) ?? lista[0];

  return (
    <>
      <EncabezadoVista titulo="Reprogramación de citas" descripcion="Elige una cita solicitada o confirmada y asígnale un nuevo horario. Las emergencias no se reprograman." />
      {aviso && <div className="mt-4"><Aviso tipo="ok">{aviso}</Aviso></div>}
      {error && <div className="mt-4"><Aviso tipo="error">{error}</Aviso></div>}

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[340px_1fr]">
        <Tarjeta className="space-y-3">
          <Buscador value={q} onChange={setQ} placeholder="Mascota, propietario o PET" />
          <ul className="space-y-2">
            {lista.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => { setSel(c.id); setAviso(""); }} aria-pressed={cita?.id === c.id}
                  className={`w-full rounded-xl border p-3 text-left transition ${cita?.id === c.id ? "border-popim-primary bg-popim-info/60" : "border-popim-linea hover:border-popim-primary/50"}`}>
                  <div className="flex items-center justify-between gap-2"><b className="text-popim-ink">{c.mascota.nombre}</b><InsigniaEstado codigo={c.estado} /></div>
                  <p className="mt-1 text-xs text-popim-texto">{fechaCorta(c.fecha)} · {c.horaInicio} · {c.veterinario.nombreCompleto}</p>
                  <p className="text-xs text-popim-muted">{c.propietario.nombreCompleto}</p>
                </button>
              </li>
            ))}
            {datos && lista.length === 0 && <li className="py-4 text-center text-sm text-popim-muted">No hay citas para reprogramar.</li>}
          </ul>
        </Tarjeta>

        {cita ? (
          <Formulario key={cita.id} cita={cita} vets={dv?.veterinarios ?? []}
            onListo={() => { setAviso(`La cita de ${cita.mascota.nombre} fue reprogramada.`); recargar(); }} />
        ) : (
          <Tarjeta punteada><p className="text-sm text-popim-muted">Elige una cita de la lista.</p></Tarjeta>
        )}
      </div>
    </>
  );
}

export default function ReprogramacionPage() {
  return <Suspense fallback={null}><Contenido /></Suspense>;
}
