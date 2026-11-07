"use client";

// CONSULTA (veterinario): arriba la tarjeta de la mascota con los botones de acción;
// abajo las pestañas, cada una guiada por su tabla de la base de datos:
//   Signos y hallazgos        → consultas (peso, temperatura, FC, observaciones) + hallazgos_consulta
//   Diagnóstico y tratamiento → diagnosticos (varios, del catálogo padecimientos) + tratamientos
//   Receta                    → recetas (observaciones = indicaciones) + receta_items (medicamentos)
//   Exámenes                  → resultados_examen (tipo de tipos_examen + ARCHIVO)
//   Vacunas                   → dosis_preventivas (aplicar con lote, o programar una nueva)
// Signos, Diagnóstico y Receta se guardan al cambiar de pestaña; Exámenes y Vacunas, al momento.
// Si la consulta ya está finalizada, todo se ve pero no se edita (solo se pueden subir exámenes).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/Componentes/ui/Avatar";
import Aviso from "@/Componentes/ui/Aviso";
import Boton from "@/Componentes/ui/Boton";
import Campo from "@/Componentes/ui/Campo";
import Modal from "@/Componentes/ui/Modal";
import Selector from "@/Componentes/ui/Selector";
import {
  IconArrowLeft, IconCalendarPlus, IconCheck, IconChevronRight, IconFilePdf, IconInfo, IconTrash, IconUpload, IconX,
} from "@/Componentes/Iconos";
import { descargarArchivo } from "@/lib/api";
import { textoAlerta } from "@/lib/atencion";
import { coincide } from "@/lib/busqueda";
import { hoyISO } from "@/lib/fechas";
import { fechaDia } from "@/lib/formato";
import {
  aplicarDosis, citaDesdeConsulta, finalizarConsulta, guardarConsulta, obtenerCatalogosConsulta,
  obtenerConsulta, obtenerDisponibilidad, programarDosis, subirExamen,
} from "@/servicios/veterinario";
import { obtenerVeterinarios } from "@/servicios/veterinarios";

const SEXO = { MACHO: "Macho", HEMBRA: "Hembra" };
const ENTRADA =
  "h-11 w-full rounded-xl border border-popim-linea bg-white px-3.5 text-sm text-popim-ink outline-none transition placeholder:text-popim-placeholder focus:border-popim-primary focus:ring-4 focus:ring-popim-primary/15 disabled:bg-slate-100";
const FILA_VACIA = { medicamentoId: "", dosis: "", frecuencia: "", duracionDias: "" };

// Lo que viene del servidor → lo que se escribe en el formulario (los números como texto)
function aFormulario(co) {
  return {
    pesoKg: co.signos?.pesoKg?.toString() ?? "",
    temperatura: co.signos?.temperatura?.toString() ?? "",
    frecuenciaCardiaca: co.signos?.frecuenciaCardiaca?.toString() ?? "",
    observaciones: co.observaciones ?? "",
    hallazgos: co.hallazgos ?? [],
    diagnosticos: co.diagnosticos ?? [],
    tratamiento: {
      descripcion: co.tratamiento?.descripcion ?? "",
      fechaInicio: co.tratamiento?.fechaInicio ?? hoyISO(),
      duracionDias: co.tratamiento?.duracionDias?.toString() ?? "",
    },
    receta: {
      observaciones: co.receta?.observaciones ?? "",
      items: (co.receta?.items ?? []).map((it) => ({
        medicamentoId: String(it.medicamentoId), dosis: it.dosis, frecuencia: it.frecuencia, duracionDias: String(it.duracionDias),
      })),
    },
  };
}

// Qué manda cada pestaña al guardar → { cambios } o { error }
function cambiosDe(pestana, f) {
  if (pestana === "SIGNOS") {
    const textos = [f.pesoKg, f.temperatura, f.frecuenciaCardiaca];
    const numeros = textos.map(Number);
    const completos = textos.every((v) => v !== "") && numeros.every((n) => n > 0);
    return {
      cambios: {
        // Los signos solo cuentan si están los tres
        signos: completos ? { pesoKg: numeros[0], temperatura: numeros[1], frecuenciaCardiaca: numeros[2] } : null,
        observaciones: f.observaciones.trim(),
        hallazgos: f.hallazgos,
      },
    };
  }
  if (pestana === "DIAGNOSTICO") {
    const t = f.tratamiento;
    if (t.duracionDias !== "" && !(Number(t.duracionDias) > 0)) return { error: "La duración del tratamiento debe ser 1 día o más." };
    return {
      cambios: {
        diagnosticos: f.diagnosticos.map((dx) => ({ padecimientoId: dx.padecimientoId, descripcion: dx.descripcion.trim() })),
        // tratamientos.descripcion es obligatoria: sin texto no se guarda tratamiento
        tratamiento: t.descripcion.trim()
          ? { descripcion: t.descripcion.trim(), fechaInicio: t.fechaInicio || hoyISO(), duracionDias: t.duracionDias ? Number(t.duracionDias) : null }
          : null,
      },
    };
  }
  if (pestana === "RECETA") {
    // Las filas totalmente vacías se ignoran; las demás deben estar completas
    const filas = f.receta.items.filter((it) => it.medicamentoId || it.dosis.trim() || it.frecuencia.trim() || it.duracionDias);
    const incompleta = filas.some((it) => !it.medicamentoId || !it.dosis.trim() || !it.frecuencia.trim() || !(Number(it.duracionDias) > 0));
    if (incompleta) return { error: "Completa el medicamento, la dosis, la frecuencia y los días de cada fila de la receta." };
    const ids = filas.map((it) => it.medicamentoId);
    if (new Set(ids).size !== ids.length) return { error: "Un medicamento está repetido en la receta." };
    return {
      cambios: {
        receta: {
          observaciones: f.receta.observaciones.trim(),
          items: filas.map((it) => ({
            medicamentoId: Number(it.medicamentoId), dosis: it.dosis.trim(), frecuencia: it.frecuencia.trim(), duracionDias: Number(it.duracionDias),
          })),
        },
      },
    };
  }
  return { cambios: null }; // Exámenes y Vacunas se guardan al momento con su propio botón
}

// 245760 → "240 KB" · 1258291 → "1.2 MB"
const tamano = (bytes) => (bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);

// ---------------------------------------------------------------------------
// Pestaña: Diagnóstico y tratamiento
// ---------------------------------------------------------------------------
function PestanaDiagnostico({ f, setF, marcar, editable, padecimientos }) {
  const [q, setQ] = useState("");
  const yaEstan = new Set(f.diagnosticos.map((dx) => dx.padecimientoId));
  const resultados =
    q.trim().length >= 2
      ? padecimientos.filter((p) => !yaEstan.has(p.id) && coincide(q, p.nombre, p.codigo, p.clasificacion)).slice(0, 8)
      : [];

  function agregar(p) {
    setF({ ...f, diagnosticos: [...f.diagnosticos, { padecimientoId: p.id, nombre: p.nombre, clasificacion: p.clasificacion, descripcion: "" }] });
    setQ("");
    marcar();
  }
  const cambiarDx = (i, descripcion) => {
    setF({ ...f, diagnosticos: f.diagnosticos.map((dx, j) => (j === i ? { ...dx, descripcion } : dx)) });
    marcar();
  };
  const quitarDx = (i) => { setF({ ...f, diagnosticos: f.diagnosticos.filter((_, j) => j !== i) }); marcar(); };
  const cambiarT = (campo) => (e) => { setF({ ...f, tratamiento: { ...f.tratamiento, [campo]: e.target.value } }); marcar(); };

  return (
    <div className="grid gap-4">
      {editable && (
        <div>
          <label htmlFor="buscar-padecimiento" className="mb-1.5 block text-[13px] font-semibold text-popim-ink">Buscar padecimiento</label>
          <input id="buscar-padecimiento" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escribe al menos 2 letras: derma, otitis, fractura…" className={ENTRADA} />
          {resultados.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {resultados.map((p) => (
                <button key={p.id} type="button" onClick={() => agregar(p)}
                  className="rounded-full border border-popim-linea bg-white px-3 py-1.5 text-[13px] text-popim-ink transition hover:border-popim-primary hover:bg-popim-info">
                  + {p.nombre} <span className="text-popim-muted">· {p.clasificacion}</span>
                </button>
              ))}
            </div>
          )}
          {q.trim().length >= 2 && resultados.length === 0 && <p className="mt-2 text-xs text-popim-muted">No hay padecimientos con ese nombre en el catálogo.</p>}
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[13px] font-semibold text-popim-ink">Diagnósticos de esta consulta</p>
        {f.diagnosticos.length === 0 && <p className="text-sm text-popim-muted">Todavía no hay diagnósticos. Búscalo arriba y tócalo para agregarlo.</p>}
        <div className="space-y-2.5">
          {f.diagnosticos.map((dx, i) => (
            <div key={dx.padecimientoId} className="rounded-xl border border-popim-primary/60 bg-popim-info/60 p-3.5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-bold text-popim-ink">{dx.nombre}</p>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-popim-primary">{dx.clasificacion}</span>
                  {editable && (
                    <button type="button" aria-label={`Quitar ${dx.nombre}`} onClick={() => quitarDx(i)} className="text-popim-etiqueta hover:text-red-700">
                      <IconX size={16} />
                    </button>
                  )}
                </span>
              </div>
              <input value={dx.descripcion} onChange={(e) => cambiarDx(i, e.target.value)} disabled={!editable}
                placeholder="Detalle del diagnóstico (opcional)" aria-label={`Detalle de ${dx.nombre}`} className={ENTRADA} />
            </div>
          ))}
        </div>
      </div>

      <hr className="border-popim-linea" />

      <Campo id="tratamiento" multilinea etiqueta="Tratamiento" placeholder="Ej.: Limpieza de herida 2 veces al día y collar isabelino."
        value={f.tratamiento.descripcion} onChange={cambiarT("descripcion")} disabled={!editable} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="trat-inicio" type="date" etiqueta="Inicia" value={f.tratamiento.fechaInicio} onChange={cambiarT("fechaInicio")} disabled={!editable} />
        <Campo id="trat-dias" type="number" min="1" etiqueta="Duración (días)" value={f.tratamiento.duracionDias} onChange={cambiarT("duracionDias")} disabled={!editable} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestaña: Receta (recetas + receta_items)
// ---------------------------------------------------------------------------
function PestanaReceta({ f, setF, marcar, editable, medicamentos }) {
  const items = f.receta.items;
  const cambiarFila = (i, campo, valor) => {
    setF({ ...f, receta: { ...f.receta, items: items.map((it, j) => (j === i ? { ...it, [campo]: valor } : it)) } });
    marcar();
  };
  const agregarFila = () => { setF({ ...f, receta: { ...f.receta, items: [...items, { ...FILA_VACIA }] } }); marcar(); };
  const quitarFila = (i) => { setF({ ...f, receta: { ...f.receta, items: items.filter((_, j) => j !== i) } }); marcar(); };

  return (
    <div className="grid gap-3">
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-wide text-popim-texto">
              <tr>
                <th className="pb-2 pr-2">Medicamento</th>
                <th className="pb-2 pr-2">Dosis</th>
                <th className="pb-2 pr-2">Frecuencia</th>
                <th className="w-24 pb-2 pr-2">Días</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2">
                    <select value={it.medicamentoId} onChange={(e) => cambiarFila(i, "medicamentoId", e.target.value)} disabled={!editable}
                      aria-label="Medicamento" className={ENTRADA}>
                      <option value="">Elige un medicamento…</option>
                      {medicamentos.map((m) => <option key={m.id} value={m.id}>{m.nombre} · {m.presentacion}</option>)}
                    </select>
                  </td>
                  <td className="py-1 pr-2"><input value={it.dosis} onChange={(e) => cambiarFila(i, "dosis", e.target.value)} disabled={!editable} maxLength={80} placeholder="0.3 ml" aria-label="Dosis" className={ENTRADA} /></td>
                  <td className="py-1 pr-2"><input value={it.frecuencia} onChange={(e) => cambiarFila(i, "frecuencia", e.target.value)} disabled={!editable} maxLength={80} placeholder="Cada 24 h" aria-label="Frecuencia" className={ENTRADA} /></td>
                  <td className="py-1 pr-2"><input type="number" min="1" value={it.duracionDias} onChange={(e) => cambiarFila(i, "duracionDias", e.target.value)} disabled={!editable} placeholder="5" aria-label="Días" className={ENTRADA} /></td>
                  <td className="py-1 text-center">
                    {editable && (
                      <button type="button" aria-label="Quitar medicamento" onClick={() => quitarFila(i)} className="text-red-700/70 hover:text-red-700">
                        <IconX size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {items.length === 0 && !editable && <p className="text-sm text-popim-muted">Esta consulta no tuvo receta.</p>}

      {editable && (
        <button type="button" onClick={agregarFila}
          className="w-fit rounded-xl border border-dashed border-popim-primary/60 px-4 py-2.5 text-sm font-semibold text-popim-primary transition hover:bg-popim-info">
          + Agregar medicamento
        </button>
      )}

      <Campo id="indicaciones-propietario" multilinea etiqueta="Indicaciones para el propietario" placeholder="Ej.: Dar el meloxicam con comida."
        value={f.receta.observaciones} onChange={(e) => { setF({ ...f, receta: { ...f.receta, observaciones: e.target.value } }); marcar(); }} disabled={!editable} />
      <p className="text-xs text-popim-muted">La receta la verá el propietario en su portal cuando finalices la consulta.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestaña: Exámenes (resultados_examen: tipo + archivo PDF/JPG/PNG de máximo 5 MB)
// ---------------------------------------------------------------------------
const TIPOS_ARCHIVO = ["application/pdf", "image/jpeg", "image/png"];
function PestanaExamenes({ consulta, tiposExamen, onSubido, onError }) {
  const [tipoId, setTipoId] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const archivoRef = useRef(null);

  async function subir(archivo) {
    if (!archivo) return;
    if (!tipoId) return onError("Primero elige el tipo de examen.");
    if (!TIPOS_ARCHIVO.includes(archivo.type)) return onError("Solo se aceptan archivos PDF, JPG o PNG.");
    if (archivo.size > 5 * 1024 * 1024) return onError("El archivo pesa más de 5 MB.");
    setSubiendo(true);
    const r = await subirExamen(consulta.id, tipoId, archivo);
    setSubiendo(false);
    if (archivoRef.current) archivoRef.current.value = ""; // permite volver a elegir el mismo archivo
    if (!r.ok) return onError(r.error);
    onSubido(r, "Resultado subido.");
  }

  // Ver: en el mock el archivo vive en el navegador (blob:); con el backend será una ruta protegida
  function ver(e) {
    if (e.archivoUrl) window.open(e.archivoUrl, "_blank", "noopener");
    else descargarArchivo(`/clinica/examenes/${e.id}/archivo`, e.nombreOriginal);
  }

  return (
    <div className="grid gap-3">
      <Selector id="tipo-examen" etiqueta="Tipo de examen" vacio="Elige el tipo de examen"
        opciones={tiposExamen.map((t) => ({ valor: t.id, texto: t.nombre }))} value={tipoId} onChange={(e) => setTipoId(e.target.value)} />

      <label
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files?.[0]); }}
        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-7 text-center transition ${
          arrastrando ? "border-popim-primary bg-popim-info" : "border-popim-aviso-borde bg-popim-page/70 hover:bg-popim-info/60"
        }`}
      >
        <IconUpload size={22} className="text-popim-primary" />
        <span className="text-sm text-popim-texto">
          {subiendo ? "Subiendo…" : <><strong className="text-popim-primary">Sube el resultado</strong> o arrástralo aquí</>}
        </span>
        <span className="text-xs text-popim-muted">PDF, JPG o PNG · máximo 5 MB</span>
        <input ref={archivoRef} type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only"
          disabled={subiendo} onChange={(e) => subir(e.target.files?.[0])} />
      </label>

      {consulta.examenes.length === 0 && <p className="text-sm text-popim-muted">Todavía no se han subido resultados.</p>}
      {consulta.examenes.map((e) => {
        const esPdf = e.mimeType === "application/pdf";
        const subido = e.fechaCarga.slice(0, 10) === hoyISO() ? e.fechaCarga.slice(11, 16) : fechaDia(e.fechaCarga.slice(0, 10));
        return (
          <div key={e.id} className="flex items-center gap-3 rounded-xl border border-popim-linea px-3.5 py-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${esPdf ? "bg-estado-cancelada text-estado-cancelada-texto" : "bg-popim-info text-popim-primary"}`}>
              {esPdf ? "PDF" : "IMG"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-popim-ink">{e.nombreOriginal}</p>
              <p className="text-xs text-popim-muted">{e.tipo} · {tamano(e.tamanoBytes)} · subido {subido}</p>
            </div>
            <button type="button" onClick={() => ver(e)} className="text-sm font-semibold text-popim-primary hover:underline">Ver</button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestaña: Vacunas (dosis_preventivas de la cartilla de la mascota)
// ---------------------------------------------------------------------------
function PestanaVacunas({ consulta, cartilla, productos, editable, onListo, onError }) {
  const [lotes, setLotes] = useState({}); // { idDosis: "lote escrito" }
  const [aplicando, setAplicando] = useState(null);
  const [programando, setProgramando] = useState(false);
  const [nueva, setNueva] = useState({ productoId: "", fechaProgramada: hoyISO() });

  const pendientes = cartilla.filter((ds) => ds.estado !== "APLICADA");
  const aplicadas = cartilla.filter((ds) => ds.estado === "APLICADA");

  async function aplicar(ds) {
    setAplicando(ds.id);
    const r = await aplicarDosis(ds.id, consulta.id, lotes[ds.id] ?? "");
    setAplicando(null);
    if (!r.ok) return onError(r.error);
    onListo(r, `${ds.nombre} aplicada hoy.`);
  }
  async function programar() {
    if (!nueva.productoId) return onError("Elige la vacuna o el desparasitante.");
    const r = await programarDosis(consulta.id, nueva);
    if (!r.ok) return onError(r.error);
    setProgramando(false);
    setNueva({ productoId: "", fechaProgramada: hoyISO() });
    onListo(r, "Dosis agregada a la cartilla.");
  }

  return (
    <div className="grid gap-3">
      <p className="text-[13px] font-semibold text-popim-ink">Pendientes en su cartilla</p>
      {pendientes.length === 0 && <p className="text-sm text-popim-muted">No tiene dosis pendientes.</p>}
      {pendientes.map((ds) => {
        const vencida = ds.estado === "VENCIDA";
        return (
          <div key={ds.id} className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${vencida ? "border-estado-cancelada-borde/40 bg-estado-cancelada/60" : "border-amber-300 bg-popim-pendiente/70"}`}>
            <p className="min-w-48 flex-1 text-popim-ink">
              <strong>{ds.nombre}</strong>{" "}
              <span className={`text-sm ${vencida ? "text-estado-cancelada-texto" : "text-popim-pendiente-texto"}`}>
                · {vencida ? "vencida desde" : "programada"} {fechaDia(ds.fechaProgramada)}
              </span>
            </p>
            {editable ? (
              <>
                <input value={lotes[ds.id] ?? ""} onChange={(e) => setLotes({ ...lotes, [ds.id]: e.target.value })} maxLength={40}
                  placeholder="Lote" aria-label={`Lote de ${ds.nombre}`} className={ENTRADA.replace("w-full", "w-40")} />
                <Boton tamano="sm" disabled={aplicando === ds.id} onClick={() => aplicar(ds)}>
                  {aplicando === ds.id ? "Aplicando…" : "Aplicar hoy"}
                </Boton>
              </>
            ) : (
              <span className="text-xs font-semibold text-popim-texto">{vencida ? "Vencida" : "Pendiente"}</span>
            )}
          </div>
        );
      })}

      {aplicadas.map((ds) => (
        <div key={ds.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-popim-linea px-4 py-3">
          <p className="text-popim-ink">
            <strong>{ds.nombre}</strong>{" "}
            <span className="text-sm text-popim-texto">· aplicada {fechaDia(ds.fechaAplicada)}{ds.lote ? ` · lote ${ds.lote}` : ""}</span>
          </p>
          <span className="rounded-full bg-estado-finalizada px-2.5 py-0.5 text-[11px] font-semibold text-estado-finalizada-texto">Aplicada</span>
        </div>
      ))}

      {editable && !programando && (
        <button type="button" onClick={() => setProgramando(true)}
          className="w-fit rounded-xl border border-dashed border-popim-primary/60 px-4 py-2.5 text-sm font-semibold text-popim-primary transition hover:bg-popim-info">
          + Programar nueva dosis
        </button>
      )}
      {editable && programando && (
        <div className="grid gap-3 rounded-xl border border-popim-linea p-4 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
          <Selector id="producto" etiqueta="Vacuna o desparasitante" vacio="Elige…"
            opciones={productos.map((p) => ({ valor: p.id, texto: `${p.tipo === "VACUNA" ? "Vacuna" : "Desparasitante"} · ${p.nombre}` }))}
            value={nueva.productoId} onChange={(e) => setNueva({ ...nueva, productoId: e.target.value })} />
          <Campo id="fecha-dosis" type="date" etiqueta="Fecha programada" min={hoyISO()}
            value={nueva.fechaProgramada} onChange={(e) => setNueva({ ...nueva, fechaProgramada: e.target.value })} />
          <div className="flex gap-2">
            <Boton variante="neutro" onClick={() => setProgramando(false)}>Cancelar</Boton>
            <Boton onClick={programar}>Programar</Boton>
          </div>
          <p className="text-xs text-popim-muted sm:col-span-3">
            ¿La va a vacunar ahora y no estaba programada? Prográmala con la fecha de hoy y luego pulsa «Aplicar hoy».
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ventana: Programar control / Referir a un colega
// ---------------------------------------------------------------------------
function ModalCita({ tipo, consulta, onCerrar, onListo }) {
  const esControl = tipo === "CONTROL";
  const [colegas, setColegas] = useState([]);
  const [vetId, setVetId] = useState(esControl ? consulta.veterinario.personalId : "");
  const [fecha, setFecha] = useState("");
  const [horas, setHoras] = useState([]);
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Referir: colegas de la misma clínica (menos él mismo)
  useEffect(() => {
    if (esControl) return;
    obtenerVeterinarios().then((r) => {
      if (r.ok) setColegas(r.datos.filter((v) => v.personalId !== consulta.veterinario.personalId));
    });
  }, [esControl, consulta.veterinario.personalId]);

  // Cuando hay veterinario y fecha, se piden las horas libres
  useEffect(() => {
    if (!vetId || !fecha) return;
    let vigente = true;
    obtenerDisponibilidad(vetId, fecha).then((r) => {
      if (vigente && r.ok) setHoras(r.datos.bloques.filter((b) => b.disponible).map((b) => b.horaInicio));
    });
    return () => { vigente = false; };
  }, [vetId, fecha]);

  async function enviar() {
    if (!vetId || !fecha || !hora) return setError("Elige el veterinario, la fecha y la hora.");
    setError("");
    setEnviando(true);
    const r = await citaDesdeConsulta(consulta.id, { tipo, veterinarioId: vetId, fecha, horaInicio: hora, motivo });
    setEnviando(false);
    if (!r.ok) return setError(r.error);
    onListo(esControl ? "Control programado." : "Cita con tu colega creada.");
  }

  return (
    <Modal
      titulo={esControl ? "Programar control" : "Referir a un colega"}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="neutro" onClick={onCerrar}>Cancelar</Boton>
          <Boton onClick={enviar} disabled={enviando}>{enviando ? "Guardando…" : esControl ? "Programar" : "Referir"}</Boton>
        </>
      }
    >
      <div className="grid gap-4">
        {!esControl && (
          <Selector
            id="colega" etiqueta="Colega de esta clínica" obligatorio vacio="Elige un veterinario"
            opciones={colegas.map((v) => ({ valor: v.personalId, texto: `${v.nombre} · ${v.especialidad}` }))}
            value={vetId} onChange={(e) => { setVetId(e.target.value); setHora(""); setHoras([]); }}
          />
        )}
        <Campo
          id="fecha-cita" type="date" etiqueta="Fecha" obligatorio min={hoyISO()}
          value={fecha} onChange={(e) => { setFecha(e.target.value); setHora(""); setHoras([]); }}
        />
        <Selector
          id="hora-cita" etiqueta="Hora" obligatorio
          vacio={!fecha || !vetId ? "Primero elige la fecha" : horas.length ? "Elige una hora" : "No hay horas libres ese día"}
          opciones={horas.map((h) => ({ valor: h, texto: h }))}
          value={hora} onChange={(e) => setHora(e.target.value)} disabled={horas.length === 0}
        />
        <Campo
          id="motivo-cita" etiqueta="Motivo (opcional)" maxLength={255}
          placeholder={esControl ? `Control: ${consulta.motivo}` : `Referida: ${consulta.motivo}`}
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
        />
        {error && <Aviso tipo="error">{error}</Aviso>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
export default function ConsultaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [datos, setDatos] = useState(null);
  const [cat, setCat] = useState({ padecimientos: [], medicamentos: [], tiposExamen: [], productosPreventivos: [] });
  const [errorCarga, setErrorCarga] = useState("");
  const [f, setF] = useState(null); // formulario
  const [sucio, setSucio] = useState(false); // ¿hay cambios sin guardar?
  const [pestana, setPestana] = useState("SIGNOS");
  const [aviso, setAviso] = useState(null); // { tipo, texto }
  const [ocupado, setOcupado] = useState(false);
  const [modal, setModal] = useState(null); // "CONTROL" | "REFERIR" | null
  const [nuevoHallazgo, setNuevoHallazgo] = useState("");

  // Cargar la consulta y los catálogos (una sola vez)
  useEffect(() => {
    let vigente = true;
    obtenerConsulta(id).then((r) => {
      if (!vigente) return;
      if (r.ok) { setDatos(r.datos); setF(aFormulario(r.datos.consulta)); }
      else setErrorCarga(r.error);
    });
    obtenerCatalogosConsulta().then((r) => { if (vigente && r.ok) setCat(r.datos); });
    return () => { vigente = false; };
  }, [id]);

  if (errorCarga) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/atencion" className="text-sm font-semibold text-popim-primary hover:underline">← Volver a atención de hoy</Link>
        <Aviso tipo="error">{errorCarga}</Aviso>
      </div>
    );
  }
  if (!datos || !f) return <div role="status" aria-label="Cargando" className="h-96 animate-pulse rounded-2xl border border-popim-linea bg-white" />;

  const { consulta, mascota, propietario } = datos;
  const editable = consulta.abierta;
  const marcar = () => setSucio(true);
  const cambiar = (campo) => (e) => { setF({ ...f, [campo]: e.target.value }); marcar(); };

  // Respuesta del servidor con la consulta actualizada → pantalla y formulario al día
  function aplicarRespuesta(r, textoOk) {
    setDatos(r.datos);
    setF(aFormulario(r.datos.consulta));
    setSucio(false);
    if (textoOk) setAviso({ tipo: "ok", texto: textoOk });
  }
  const mostrarError = (texto) => setAviso({ tipo: "error", texto });

  // Guarda la pestaña actual (si hubo cambios). Devuelve true si todo salió bien.
  async function guardar() {
    if (!editable || !sucio) return true;
    const { cambios, error } = cambiosDe(pestana, f);
    if (error) { mostrarError(error); return false; }
    if (!cambios) return true;
    const r = await guardarConsulta(consulta.id, cambios);
    if (!r.ok) { mostrarError(r.error); return false; }
    aplicarRespuesta(r, "Cambios guardados.");
    return true;
  }
  async function irA(destino) {
    if (destino === pestana) return;
    if (await guardar()) { setPestana(destino); }
  }
  async function salir(ruta) {
    if (await guardar()) router.push(ruta);
  }
  async function finalizar() {
    setOcupado(true);
    setAviso(null);
    if (await guardar()) {
      const r = await finalizarConsulta(consulta.id);
      if (r.ok) aplicarRespuesta(r, "Consulta finalizada. Ya no se puede editar.");
      else mostrarError(r.error);
    }
    setOcupado(false);
  }
  async function recargar(textoOk) {
    const r = await obtenerConsulta(consulta.id);
    if (r.ok) aplicarRespuesta(r, textoOk);
  }

  // Datos para la tarjeta de arriba
  const pesoHoy = Number(f.pesoKg) || consulta.signos?.pesoKg;
  const diferencia = pesoHoy && datos.pesoAnterior ? +(pesoHoy - datos.pesoAnterior).toFixed(1) : null;
  const pestanas = [
    { valor: "SIGNOS", texto: "Signos y hallazgos", listo: Boolean(consulta.signos) },
    { valor: "DIAGNOSTICO", texto: "Diagnóstico y tratamiento", listo: consulta.diagnosticos.length > 0 },
    { valor: "RECETA", texto: "Receta", listo: consulta.receta.items.length > 0 },
    { valor: "EXAMENES", texto: "Exámenes", cuenta: consulta.examenes.length },
    { valor: "VACUNAS", texto: "Vacunas" },
  ];
  const celda = (titulo, valor) => (
    <div className="px-4 py-3">
      <p className="text-xs text-popim-muted">{titulo}</p>
      <div className="text-sm font-bold text-popim-ink">{valor}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={() => salir("/atencion")} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-popim-primary hover:underline">
        <IconArrowLeft size={14} /> Volver a atención de hoy
      </button>

      {/* TARJETA DE LA MASCOTA Y LA CITA */}
      <section className="overflow-hidden rounded-2xl border border-popim-linea bg-white">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <Avatar texto={mascota.nombre[0]} tamano="lg" tono={consulta.esEmergencia ? "emergencia" : "claro"} />
          <div className="min-w-48 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-2xl font-bold text-popim-ink">
              {mascota.nombre}
              <span className="rounded-md bg-popim-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">{mascota.codigoUnico}</span>
              {editable ? (
                <span className="rounded-full bg-estado-curso px-2.5 py-0.5 text-[11px] font-semibold text-estado-curso-texto">
                  En curso · desde {consulta.iniciadaA}
                </span>
              ) : (
                <span className="rounded-full bg-estado-finalizada px-2.5 py-0.5 text-[11px] font-semibold text-estado-finalizada-texto">Finalizada</span>
              )}
              {consulta.esEmergencia && (
                <span className="rounded-md bg-estado-emergencia px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Emergencia</span>
              )}
            </p>
            <p className="text-xs text-popim-muted">
              Cita de las {consulta.horaCita.slice(0, 5)} · {consulta.veterinario.nombreCompleto}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {editable && (
              <>
                <Boton variante="neutro" tamano="sm" onClick={() => setModal("CONTROL")}>
                  <IconCalendarPlus size={14} /> Programar control
                </Boton>
                <Boton variante="neutro" tamano="sm" onClick={() => setModal("REFERIR")}>
                  <IconChevronRight size={14} /> Referir
                </Boton>
              </>
            )}
            <Boton
              variante="neutro" tamano="sm" disabled={consulta.receta.items.length === 0}
              title={consulta.receta.items.length === 0 ? "Agrega medicamentos en la pestaña Receta" : undefined}
              onClick={() => descargarArchivo(`/clinica/consultas/${consulta.id}/receta.pdf`, `receta-${mascota.nombre}.pdf`)}
            >
              <IconFilePdf size={14} /> Receta PDF
            </Boton>
            {editable && (
              <button
                type="button" disabled={ocupado} onClick={finalizar}
                className="inline-flex h-9 items-center rounded-xl bg-estado-finalizada-borde px-3.5 text-[13px] font-semibold text-white transition hover:brightness-90 disabled:opacity-60"
              >
                {ocupado ? "Finalizando…" : "Finalizar consulta"}
              </button>
            )}
          </div>
        </div>

        <div className="grid border-t border-popim-linea bg-popim-page/70 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-popim-linea">
          {celda("Especie y raza", [mascota.especie, mascota.raza].filter(Boolean).join(" · "))}
          {celda("Sexo y edad", [SEXO[mascota.sexo], mascota.edad].filter(Boolean).join(" · "))}
          {celda(
            "Peso hoy",
            <>
              {pesoHoy ? `${pesoHoy} kg` : "—"}{" "}
              {diferencia !== null && diferencia !== 0 && (
                <span className="text-xs font-semibold text-estado-finalizada-borde">{diferencia > 0 ? `+${diferencia}` : diferencia}</span>
              )}
            </>,
          )}
          {celda("Propietario", <>{propietario.nombreCompleto} · <span className="text-popim-primary">{propietario.telefono}</span></>)}
        </div>

        <div className="border-t border-popim-linea px-4 py-3">
          <p className="text-xs text-popim-muted">Motivo</p>
          <p className="text-sm font-bold text-popim-ink">{consulta.motivo}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-popim-linea px-4 py-2.5">
          {datos.alertas.map((a, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full bg-popim-pendiente px-2.5 py-1 text-xs font-semibold text-popim-pendiente-texto">
              <IconInfo size={12} /> {textoAlerta(a).texto}
            </span>
          ))}
          {consulta.control && (
            <span className="text-xs text-popim-texto">Control: {fechaDia(consulta.control.fecha)}, {consulta.control.hora}</span>
          )}
          {consulta.referidoA && <span className="text-xs text-popim-texto">Referida a {consulta.referidoA}</span>}
          <span className="ml-auto text-xs text-popim-muted">
            {editable ? (sucio ? "Hay cambios sin guardar · se guardan al cambiar de pestaña" : "Se guarda solo al cambiar de pestaña") : "Solo lectura"}
          </span>
          <button type="button" onClick={() => salir(`/pacientes?mascota=${mascota.id}`)} className="text-xs font-semibold text-popim-primary hover:underline">
            Ver expediente →
          </button>
        </div>
      </section>

      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      {/* PESTAÑAS */}
      <section className="rounded-2xl border border-popim-linea bg-white">
        <div role="tablist" className="flex flex-wrap gap-x-5 border-b border-popim-linea px-4">
          {pestanas.map((p) => (
            <button
              key={p.valor} type="button" role="tab" aria-selected={pestana === p.valor} onClick={() => irA(p.valor)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 py-3 text-sm font-semibold transition ${
                pestana === p.valor ? "border-popim-primary text-popim-ink" : "border-transparent text-popim-texto hover:text-popim-ink"
              }`}
            >
              {p.texto}
              {p.listo && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-estado-finalizada text-estado-finalizada-borde"><IconCheck size={11} /></span>}
              {p.cuenta > 0 && <span className="rounded-full bg-popim-info px-1.5 text-[11px] text-popim-primary">{p.cuenta}</span>}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* --- Signos y hallazgos --- */}
          {pestana === "SIGNOS" && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo id="peso" type="number" step="0.1" min="0" etiqueta="Peso (kg)" value={f.pesoKg} onChange={cambiar("pesoKg")} disabled={!editable} />
                <Campo id="temperatura" type="number" step="0.1" min="0" etiqueta="Temperatura (°C)" value={f.temperatura} onChange={cambiar("temperatura")} disabled={!editable} />
                <Campo id="frecuencia" type="number" min="0" etiqueta="Frecuencia cardiaca (lpm)" value={f.frecuenciaCardiaca} onChange={cambiar("frecuenciaCardiaca")} disabled={!editable} />
              </div>
              <Campo id="observaciones" multilinea etiqueta="Observaciones generales" value={f.observaciones} onChange={cambiar("observaciones")} disabled={!editable} />
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-popim-ink">Hallazgos</p>
                <ul className="space-y-2">
                  {f.hallazgos.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-xl border border-popim-linea px-3.5 py-2.5 text-sm text-popim-texto">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-popim-primary" />
                      <span className="flex-1">{h}</span>
                      {editable && (
                        <button type="button" aria-label="Quitar hallazgo" className="text-popim-etiqueta hover:text-red-700"
                          onClick={() => { setF({ ...f, hallazgos: f.hallazgos.filter((_, j) => j !== i) }); marcar(); }}>
                          <IconTrash size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                  {f.hallazgos.length === 0 && !editable && <li className="text-sm text-popim-muted">Sin hallazgos.</li>}
                </ul>
                {editable && (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!nuevoHallazgo.trim()) return;
                      setF({ ...f, hallazgos: [...f.hallazgos, nuevoHallazgo.trim()] });
                      setNuevoHallazgo("");
                      marcar();
                    }}
                  >
                    <input value={nuevoHallazgo} onChange={(e) => setNuevoHallazgo(e.target.value)} placeholder="Escribe un hallazgo…" aria-label="Nuevo hallazgo" className={ENTRADA} />
                    <Boton type="submit" variante="secundario">Agregar</Boton>
                  </form>
                )}
              </div>
            </div>
          )}

          {pestana === "DIAGNOSTICO" && (
            <PestanaDiagnostico f={f} setF={setF} marcar={marcar} editable={editable} padecimientos={cat.padecimientos} />
          )}
          {pestana === "RECETA" && (
            <PestanaReceta f={f} setF={setF} marcar={marcar} editable={editable} medicamentos={cat.medicamentos} />
          )}
          {pestana === "EXAMENES" && (
            <PestanaExamenes consulta={consulta} tiposExamen={cat.tiposExamen} onSubido={aplicarRespuesta} onError={mostrarError} />
          )}
          {pestana === "VACUNAS" && (
            <PestanaVacunas consulta={consulta} cartilla={datos.cartilla} productos={cat.productosPreventivos}
              editable={editable} onListo={aplicarRespuesta} onError={mostrarError} />
          )}
        </div>
      </section>

      {modal && (
        <ModalCita
          tipo={modal} consulta={consulta} onCerrar={() => setModal(null)}
          onListo={(texto) => { setModal(null); recargar(texto); }}
        />
      )}
    </div>
  );
}